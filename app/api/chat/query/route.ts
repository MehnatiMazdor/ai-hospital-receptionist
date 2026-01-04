import { getHospitalNamespace } from "@/lib/pineconeClient";
import { generateHospitalAnswer } from "@/lib/googleProvider";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User is authenticated!");

    const { chatSessionId, content } = await request.json();

    if (!content || typeof content !== "string" || content.length > 500) {
      console.log("content is:", content);
      console.log("type of content is:", typeof content);
      console.log(content.length)
      return NextResponse.json(
        { error: "Invalid message content" },
        { status: 400 }
      );
    }

    let sessionId = chatSessionId;

    if (!sessionId) {
      const title =
        content.slice(0, 40) + (content.length > 40 ? "..." : "");

      const { data: session, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title,
        })
        .select("id")
        .single();

      if (error || !session) {
        throw new Error("Failed to create chat session");
      }

      console.log("Chat Session created successfully", session)

      sessionId = session.id;
    }

    const { data: userMessage, error: userMsgError } = await supabase
      .from("chat_messages")
      .insert({
        chat_session_id: sessionId,
        role: "user",
        content,
        context_used: [],
      })
      .select()
      .single();

    if (userMsgError || !userMessage) {
      throw new Error("Failed to store user message");
    }

    console.log("User messages inserted successfully:", userMessage)

    let assistantContent =
      "Sorry, I couldn’t generate a response at the moment.";
    let contextUsed: any[] = [];

    try {
      const namespace = getHospitalNamespace();

      const searchResult = await namespace.searchRecords({
        query: {
          topK: 2,
          inputs: { text: content },
        },
        fields: ["text"],
      });

      const hits = searchResult?.result?.hits ?? [];

      console.log("hits from pinecone db is:", hits)

      if (hits.length > 0) {
        const context = hits
          .map(
            (hit, i) =>
              `Source ${i + 1}:\n${(hit.fields as any).text}`
          )
          .join("\n\n");

        assistantContent = await generateHospitalAnswer(content, context);

        console.log("assistantContent fromgemini is:", assistantContent);

        contextUsed = hits.map((hit) => ({
          id: hit._id,
          score: hit._score,
          page: (hit.fields as any).page ?? null,
        }));
      } else {
        assistantContent =
          "I couldn’t find relevant information for your question.";
      }
    } catch {
      assistantContent =
        "I’m having trouble accessing knowledge sources right now.";
      contextUsed = [];
    }

    const { data: assistantMessage, error: assistantError } = await supabase
      .from("chat_messages")
      .insert({
        chat_session_id: sessionId,
        role: "assistant",
        content: assistantContent,
        context_used: contextUsed,
      })
      .select()
      .single();

    console.log("assistantMessage is created successfully:", assistantMessage)

    if (assistantError || !assistantMessage) {
      throw new Error("Failed to store assistant message");
    }

    await supabase.rpc("increment_message_count", {
      session_id: sessionId,
      increment_by: 2,
    });

    return NextResponse.json({
      chatSessionId: sessionId,
      messages: [userMessage, assistantMessage],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
