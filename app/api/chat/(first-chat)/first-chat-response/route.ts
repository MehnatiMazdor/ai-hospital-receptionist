// /api/chat/(first-chat)/first-chat-response/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHospitalNamespace } from "@/lib/pineconeClient";
import { generateHospitalAnswer } from "@/lib/googleProvider";
import { answerWithHospitalContext } from "@/lib/answerWithHospitalContext";

export async function POST(req: Request) {
  try {
    console.log("🟢 First-chat response API hit");

    const body = await req.json();
    console.log("📥 Request body received:", body);

    const { chatSessionId, content } = body;

    if (!chatSessionId || !content || typeof content !== "string") {
      console.warn("⚠️ Validation failed", {
        chatSessionId,
        contentType: typeof content,
      });

      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    console.log("✅ Validation passed. chatSessionId:", chatSessionId);

    const supabase = await createClient();
    console.log("🔌 Supabase client created");

    const userMessage = content;
    console.log("👤 User message content:", userMessage);

    // // 1️⃣ Get latest user message
    // const { data: userMessage } = await supabase
    //   .from("chat_messages")
    //   .select("content")
    //   .eq("chat_session_id", chatSessionId)
    //   .eq("role", "user")
    //   .order("created_at", { ascending: false })
    //   .limit(1)
    //   .single();

    // if (!userMessage) throw new Error("User message not found");

    const namespace = getHospitalNamespace();
    console.log("📚 Pinecone hospital namespace loaded");

    console.log("🤖 Generating assistant answer with hospital context...");
    const { assistantContent, contextUsed } = await answerWithHospitalContext({
      content: userMessage,
      namespace,
      generateAnswer: generateHospitalAnswer,
    });

    console.log("🧠 Assistant answer generated");
    console.log("📌 Context used:", contextUsed);

    // 4️⃣ Insert assistant message (ALWAYS)
    const insertPayload = {
      chat_session_id: chatSessionId,
      role: "assistant",
      content: assistantContent,
      context_used: JSON.stringify(contextUsed ?? []), // <-- serialize to JSON
    };

    console.log("📝 Insert payload:", insertPayload);

    console.log("💾 Inserting assistant message into DB...");
    const { data: assistantMessage, error } = await supabase
      .from("chat_messages")
      .insert(insertPayload)
      .select();

    if (error || !assistantMessage) {
      console.error("❌ Failed to insert assistant message", error);
      return NextResponse.json(
        { error: "Failed to insert assistant Message" },
        { status: 500 }
      );
    }

    console.log("✅ Assistant message inserted successfully");

    // 5️⃣ Increment message count
    console.log("➕ Incrementing message count for session:", chatSessionId);
    await supabase.rpc("increment_message_count", {
      session_id: chatSessionId,
    });

    console.log("🎉 First message response completed successfully");

    return NextResponse.json(
      {
        message: "Responded first message successfully",
        assistantMessage: assistantMessage[0],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 chat/respond error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
