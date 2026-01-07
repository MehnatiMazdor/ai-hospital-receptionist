import { getHospitalNamespace } from "@/lib/pineconeClient";
import { generateHospitalAnswer } from "@/lib/googleProvider";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { answerWithHospitalContext } from "@/lib/answerWithHospitalContext";
import { AnswerWithContextResult } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { content, chatSessionId } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    if (!chatSessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Insert user message
    const { data: userMessage, error: userError } = await supabase
      .from("chat_messages")
      .insert({
        chat_session_id: chatSessionId,
        role: "user",
        content: content.trim(),
        context_used: [],
      })
      .select()
      .single();

    if (userError || !userMessage) {
      console.error("Failed to insert user message:", userError);
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    console.log("✅ User message inserted:", userMessage);

    // Generate assistant response
    const namespace = getHospitalNamespace();
    const { assistantContent, contextUsed }: AnswerWithContextResult =
      await answerWithHospitalContext({
        content: content.trim(),
        namespace,
        generateAnswer: generateHospitalAnswer,
      });

    console.log("✅ Assistant content generated:", assistantContent);
    console.log("✅ Context used:", contextUsed);

    // Insert assistant message
    const { data: assistantMessage, error: assistantError } = await supabase
      .from("chat_messages")
      .insert({
        chat_session_id: chatSessionId,
        role: "assistant",
        content: JSON.stringify(assistantContent), // store as JSON string
        context_used: contextUsed ?? [],
      })
      .select()
      .single();

    if (assistantError || !assistantMessage) {
      console.error("Failed to insert assistant message:", assistantError);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    console.log("✅ Assistant message inserted:", assistantMessage);

    // Increment message count
    await supabase.rpc("increment_message_count", {
      session_id: chatSessionId,
    });

    console.log("✅ Message count incremented for session:", chatSessionId);

    console.log("Final response is:", {
      ...assistantMessage,
      content: JSON.parse(assistantMessage.content), // parse JSON for frontend (string for old or object for new)
    });

    // Return messages to frontend
    return NextResponse.json({
      messages: [
        userMessage,
        {
          ...assistantMessage,
          content: JSON.parse(assistantMessage.content), // parse JSON for frontend (string for old or object for new)
        },
      ],
    });
  } catch (err) {
    console.error("❌ chat/query error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// import { getHospitalNamespace } from "@/lib/pineconeClient";
// import { generateHospitalAnswer } from "@/lib/googleProvider";
// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";
// import { answerWithHospitalContext } from "@/lib/answerWithHospitalContext";

// export const runtime = "nodejs";

// export async function POST(req: NextRequest) {
//   try {
//     const { content, chatSessionId } = await req.json();

//     if (!content?.trim()) {
//       return NextResponse.json({ error: "Empty message" }, { status: 400 });
//     }

//     if (!chatSessionId) {
//       return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
//     }

//     const supabase = await createClient();

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Insert user message
//     const { data: userMessage, error: userError } = await supabase
//       .from("chat_messages")
//       .insert({
//         chat_session_id: chatSessionId,
//         role: "user",
//         content: content.trim(),
//         context_used: [],
//       })
//       .select()
//       .single();

//     if (userError || !userMessage) {
//       console.error("Failed to insert user message:", userError);
//       return NextResponse.json(
//         { error: "Failed to save message" },
//         { status: 500 }
//       );
//     }

//     // Generate assistant response
//     const namespace = getHospitalNamespace();
//     const { assistantContent, contextUsed } = await answerWithHospitalContext({
//       content: content.trim(),
//       namespace,
//       generateAnswer: generateHospitalAnswer,
//     });

//     // Insert assistant message
//     const { data: assistantMessage, error: assistantError } = await supabase
//       .from("chat_messages")
//       .insert({
//         chat_session_id: chatSessionId,
//         role: "assistant",
//         content: assistantContent,
//         context_used: contextUsed ?? [],
//       })
//       .select()
//       .single();

//     if (assistantError || !assistantMessage) {
//       console.error("Failed to insert assistant message:", assistantError);
//       return NextResponse.json(
//         { error: "Failed to generate response" },
//         { status: 500 }
//       );
//     }

//     // Increment message count
//     await supabase.rpc("increment_message_count", {
//       session_id: chatSessionId,
//     });

//     return NextResponse.json({
//       messages: [userMessage, assistantMessage],
//     });
//   } catch (err) {
//     console.error("chat/query error:", err);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
