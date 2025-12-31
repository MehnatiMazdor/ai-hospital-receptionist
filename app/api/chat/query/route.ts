import { getHospitalNamespace } from "@/lib/pineconeClient";
import { generateHospitalAnswer } from "@/lib/googleProvider";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ChunkFields {
  text: string;
  category: string;
  page?: number;
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient(); // safe

  try {
    // 1️⃣ Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 2️⃣ Parse request
    const { query, sessionId } = await request.json();

    // 3️⃣ Validate query
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: "Query too long (max 5–6 lines)" },
        { status: 400 }
      );
    }

    let currentSessionId = sessionId;

    // 4️⃣ Create session if this is the first message (no sessionId provided)
    if (!currentSessionId) {
      const sessionTitle =
        query.slice(0, 30) + (query.length > 30 ? "..." : "");

      const { data: newSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: userId,
          title: sessionTitle,
        })
        .select("id")
        .single();

      if (sessionError || !newSession) {
        console.error("Error creating session:", sessionError);
        return NextResponse.json(
          { error: "Failed to create session" },
          { status: 500 }
        );
      }

      currentSessionId = newSession.id;
      console.log("Created new session with ID:", currentSessionId);
    }

    // 5️⃣ Create message record FIRST (before RAG processing)
    const { data: newMessage, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        chat_session_id: currentSessionId,
        query,
        response: "Processing...", // placeholder
      })
      .select()
      .single();

    if (messageError || !newMessage) {
      console.error("Error creating message:", messageError);
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      );
    }

    console.log("Created new message with ID:", newMessage.id);

    // 6️⃣ Pinecone semantic search
    const hospitalNamespace = getHospitalNamespace();

    const response = await hospitalNamespace.searchRecords({
      query: {
        topK: 2,
        inputs: { text: query },
      },
      fields: ["text" /*, 'category', 'page' */],
    });

    console.log("Pinecone search response:", response);

    const hits = response.result.hits;

    console.log("Pinecone hits:", hits);
    console.log("Number of hits:", hits.length);

    let answer: string;
    let sources: any[] = [];

    if (!hits.length) {
      answer = "Information not available";
    } else {
      // 7️⃣ Build compact context
      const context = hits
        .map(
          (hit, i) => `Source ${i + 1}:\n${(hit.fields as ChunkFields).text}`
        )
        .join("\n\n");

      console.log("Retrieved context:", context);

      // 8️⃣ Ask Google LLM via utility
      answer = await generateHospitalAnswer(query, context);
      console.log("Generated answer:", answer);

      sources = hits.map((hit) => ({
        id: hit._id,
        score: hit._score,
        page: (hit.fields as ChunkFields).page ?? null,
      }));
    }

    // 9️⃣ Update message with actual response
    const { data: updatedMessage, error: updateError } = await supabase
      .from("chat_messages")
      .update({
        response: answer,
        context_used: sources.length > 0 ? sources : null,
      })
      .eq("id", newMessage.id)
      .select()
      .single();

    if (updateError || !updatedMessage) {
      console.error("Error updating message:", updateError);
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 }
      );
    }

    // 🔟 Incrment message count in session using RPC
    const { error: countError } = await supabase.rpc(
      "increment_message_count",
      {
        session_id: currentSessionId,
      }
    );

    if (countError) {
      console.error("Error incrementing message count:", countError);
      // Dont fail the whole request for this
    }

    // 1️⃣1️⃣ Return complete response with all data
    return NextResponse.json({
      answer,
      sources,
      sessionId: currentSessionId,
      messageId: updatedMessage.id,
    });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to query knowledge base" },
      { status: 500 }
    );
  }
}
