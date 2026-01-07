import { getHospitalNamespace } from "@/lib/pineconeClient";
import { generateHospitalAnswer } from "@/lib/googleProvider";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { answerWithHospitalContext } from "@/lib/answerWithHospitalContext";
import { AnswerWithContextResult } from "@/types";
import { createSSEResponse } from "@/lib/sse";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  console.log("[CHAT_API] Incoming request");

  const { stream, sendEvent, close } = createSSEResponse();

  (async () => {
    try {
      /* ───────────── STEP 1: REQUEST ───────────── */
      console.log("[CHAT_API] Parsing request body");

      sendEvent("progress", {
        step: 1,
        message: "Receiving your message...",
        status: "processing",
      });

      const { content, chatSessionId, isFirstMessage } = await req.json();

      console.log("[CHAT_API] Payload:", {
        chatSessionId,
        isFirstMessage,
        contentLength: content?.length,
      });

      if (!content?.trim()) {
        console.warn("[CHAT_API] Empty content received");
        sendEvent("error", { message: "Empty message" });
        close();
        return;
      }

      if (!chatSessionId) {
        console.warn("[CHAT_API] Missing chatSessionId");
        sendEvent("error", { message: "Missing session ID" });
        close();
        return;
      }

      /* ───────────── AUTH ───────────── */
      console.log("[CHAT_API] Initializing Supabase client");

      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.warn("[CHAT_API] Unauthorized request");
        sendEvent("error", { message: "Unauthorized" });
        close();
        return;
      }

      console.log("[CHAT_API] Authenticated user:", user.id);

      /* ───────────── STEP 2: SAVE USER MESSAGE ───────────── */
      let userMessage = null;

      if (!isFirstMessage) {
        console.log("[CHAT_API] Saving user message");

        sendEvent("progress", {
          step: 2,
          message: "Saving your message...",
          status: "processing",
        });

        const { data: userMsg, error: userError } = await supabase
          .from("chat_messages")
          .insert({
            chat_session_id: chatSessionId,
            role: "user",
            content_text: content.trim(),
            content_json: [],
          })
          .select()
          .single();

        if (userError || !userMsg) {
          console.error("[CHAT_API] User message insert failed", userError);
          sendEvent("error", { message: "Failed to save message" });
          close();
          return;
        }

        userMessage = userMsg;

        console.log("[CHAT_API] User message saved:", userMsg.id);

        sendEvent("progress", {
          step: 2,
          message: "Message saved",
          status: "completed",
        });
      }

      /* ───────────── STEP 3: RAG ───────────── */
      console.log("[CHAT_API] Starting RAG pipeline");
      console.time("[CHAT_API] RAG_TIME");

      sendEvent("progress", {
        step: 3,
        message: "Searching knowledge base...",
        status: "processing",
      });

      const namespace = getHospitalNamespace();
      console.log("[CHAT_API] Pinecone namespace:", namespace);

      let assistantContent: any;
      let contextUsed: any[] = [];

      try {
        const result: AnswerWithContextResult =
          await answerWithHospitalContext({
            content: content.trim(),
            namespace,
            generateAnswer: generateHospitalAnswer,
          });

        assistantContent = result.assistantContent;
        contextUsed = result.contextUsed || [];

        console.timeEnd("[CHAT_API] RAG_TIME");
        console.log("[CHAT_API] RAG success", {
          suggestionsCount: assistantContent?.suggestions?.length,
          contextCount: contextUsed.length,
        });

        sendEvent("progress", {
          step: 3,
          message: "Answer generated",
          status: "completed",
        });
      } catch (ragError) {
        console.error("[CHAT_API] RAG failed", ragError);

        assistantContent = {
          answer:
            "I'm having trouble accessing the knowledge base right now. Please try again in a moment.",
          suggestions: [],
        };

        contextUsed = [];

        sendEvent("progress", {
          step: 3,
          message: "Using fallback response",
          status: "warning",
        });
      }

      /* ───────────── STEP 4: STREAM RESPONSE ───────────── */
      console.log("[CHAT_API] Streaming assistant response");

      sendEvent("assistant_response", {
        content_text: assistantContent.answer || assistantContent,
        content_json: assistantContent.suggestions || [],
        context_used: contextUsed,
      });

      /* ───────────── STEP 5: SAVE ASSISTANT MESSAGE ───────────── */
      console.log("[CHAT_API] Saving assistant message");

      sendEvent("progress", {
        step: 4,
        message: "Saving response...",
        status: "processing",
      });

      try {
        const { data: assistantMessage, error: assistantError } =
          await supabase
            .from("chat_messages")
            .insert({
              chat_session_id: chatSessionId,
              role: "assistant",
              content_text:
                typeof assistantContent === "string"
                  ? assistantContent
                  : assistantContent.answer || "",
              content_json:
                typeof assistantContent === "object" &&
                assistantContent.suggestions
                  ? assistantContent.suggestions
                  : [],
              context_used: contextUsed,
            })
            .select()
            .single();

        if (assistantError || !assistantMessage) {
          console.error(
            "[CHAT_API] Assistant message insert failed",
            assistantError
          );

          sendEvent("progress", {
            step: 4,
            message: "Response saved with warnings",
            status: "warning",
          });
        } else {
          console.log(
            "[CHAT_API] Assistant message saved:",
            assistantMessage.id
          );

          sendEvent("progress", {
            step: 4,
            message: "Response saved successfully",
            status: "completed",
          });

          await supabase.rpc("increment_message_count", {
            session_id: chatSessionId,
          });
        }
      } catch (dbError) {
        console.error("[CHAT_API] DB exception", dbError);

        sendEvent("progress", {
          step: 4,
          message: "Response delivered (save failed)",
          status: "warning",
        });
      }

      /* ───────────── COMPLETE ───────────── */
      console.log("[CHAT_API] Request completed successfully");

      sendEvent("complete", {
        message: "Chat response complete",
        success: true,
      });

      close();
    } catch (error: unknown) {
      console.error("[CHAT_API] Fatal error", error);

      sendEvent("error", {
        message: (error as Error).message || "Internal Server Error",
      });

      close();
    }
  })();

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}



// import { getHospitalNamespace } from "@/lib/pineconeClient";
// import { generateHospitalAnswer } from "@/lib/googleProvider";
// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";
// import { answerWithHospitalContext } from "@/lib/answerWithHospitalContext";
// import { AnswerWithContextResult } from "@/types";
// import { createSSEResponse } from "@/lib/sse";

// export const runtime = "nodejs";

// export async function POST(req: NextRequest) {
//   const { stream, sendEvent, close } = createSSEResponse();

//   // Process asynchronously
//   (async () => {
//     try {
//       // Step 1: Parse request
//       sendEvent("progress", {
//         step: 1,
//         message: "Receiving your message...",
//         status: "processing",
//       });

//       const { content, chatSessionId, isFirstMessage } = await req.json();

//       if (!content?.trim()) {
//         sendEvent("error", { message: "Empty message" });
//         close();
//         return;
//       }

//       if (!chatSessionId) {
//         sendEvent("error", { message: "Missing session ID" });
//         close();
//         return;
//       }

//       const supabase = await createClient();

//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) {
//         sendEvent("error", { message: "Unauthorized" });
//         close();
//         return;
//       }

//       // Step 2: Insert user message (only if not first message)
//       let userMessage = null;
//       if (!isFirstMessage) {
//         sendEvent("progress", {
//           step: 2,
//           message: "Saving your message...",
//           status: "processing",
//         });

//         const { data: userMsg, error: userError } = await supabase
//           .from("chat_messages")
//           .insert({
//             chat_session_id: chatSessionId,
//             role: "user",
//             content_text: content.trim(),
//             content_json: [],
//           })
//           .select()
//           .single();

//         if (userError || !userMsg) {
//           console.error("Failed to insert user message:", userError);
//           sendEvent("error", { message: "Failed to save message" });
//           close();
//           return;
//         }

//         userMessage = userMsg;

//         sendEvent("progress", {
//           step: 2,
//           message: "Message saved",
//           status: "completed",
//         });
//       }

//       // Step 3: Generate RAG response
//       sendEvent("progress", {
//         step: 3,
//         message: "Searching knowledge base...",
//         status: "processing",
//       });

//       const namespace = getHospitalNamespace();
//       let assistantContent: any;
//       let contextUsed: any[] = [];

//       try {
//         const result: AnswerWithContextResult = await answerWithHospitalContext(
//           {
//             content: content.trim(),
//             namespace,
//             generateAnswer: generateHospitalAnswer,
//           }
//         );

//         assistantContent = result.assistantContent;
//         contextUsed = result.contextUsed || [];

//         sendEvent("progress", {
//           step: 3,
//           message: "Answer generated",
//           status: "completed",
//         });
//       } catch (ragError) {
//         console.error("RAG generation failed:", ragError);
        
//         // Fallback response
//         assistantContent = {
//           answer: "I'm having trouble accessing the knowledge base right now. Please try again in a moment.",
//           suggestions: [],
//         };
//         contextUsed = [];

//         sendEvent("progress", {
//           step: 3,
//           message: "Using fallback response",
//           status: "warning",
//         });
//       }

//       // Step 4: Send assistant response immediately
//       sendEvent("assistant_response", {
//         content_text: assistantContent.answer || assistantContent,
//         content_json: assistantContent.suggestions || [],
//         context_used: contextUsed,
//       });

//       // Step 5: Save assistant message to DB (non-blocking)
//       sendEvent("progress", {
//         step: 4,
//         message: "Saving response...",
//         status: "processing",
//       });

//       try {
//         const { data: assistantMessage, error: assistantError } =
//           await supabase
//             .from("chat_messages")
//             .insert({
//               chat_session_id: chatSessionId,
//               role: "assistant",
//               content_text:
//                 typeof assistantContent === "string"
//                   ? assistantContent
//                   : assistantContent.answer || "",
//               content_json:
//                 typeof assistantContent === "object" &&
//                 assistantContent.suggestions
//                   ? assistantContent.suggestions
//                   : [],
//               context_used: contextUsed,
//             })
//             .select()
//             .single();

//         if (assistantError || !assistantMessage) {
//           console.error("Failed to insert assistant message:", assistantError);
//           // Don't throw - user already has the response
//           sendEvent("progress", {
//             step: 4,
//             message: "Response saved with warnings",
//             status: "warning",
//           });
//         } else {
//           sendEvent("progress", {
//             step: 4,
//             message: "Response saved successfully",
//             status: "completed",
//           });

//           // Step 6: Increment message count
//           await supabase.rpc("increment_message_count", {
//             session_id: chatSessionId,
//           });
//         }
//       } catch (dbError) {
//         console.error("Database operation failed:", dbError);
//         // User already has the response, so just log
//         sendEvent("progress", {
//           step: 4,
//           message: "Response delivered (save failed)",
//           status: "warning",
//         });
//       }

//       // Final success
//       sendEvent("complete", {
//         message: "Chat response complete",
//         success: true,
//       });

//       close();
//     } catch (error: unknown) {
//       console.error("Error in chat query API:", error);

//       sendEvent("error", {
//         message: (error as Error).message || "Internal Server Error",
//       });

//       close();
//     }
//   })();

//   return new NextResponse(stream, {
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     },
//   });
// }

