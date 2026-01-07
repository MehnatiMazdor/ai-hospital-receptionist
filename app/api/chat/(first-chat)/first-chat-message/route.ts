// /api/chat/(first-chat)/first-chat-message/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        {
          error: "Empty message",
        },
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

    // 1. Create chat session
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        title: content.slice(0, 50),
        message_count: 1,
      })
      .select("id")
      .single();

    if (sessionError) {
      console.log("Chat creation failed");
      return NextResponse.json(
        { error: "Chat creation failed" },
        { status: 500 }
      );
    }

    // 2. Insert user message
    const { error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        chat_session_id: session?.id,
        role: "user",
        content,
        context_used: [],
      });

    if (messageError) {
      console.log("Inserting user message failed");
      throw messageError;
    }

    return NextResponse.json({
      chatSessionId: session?.id,
    });
  } catch (error: unknown) {
    console.error("/api/chat/first-chat-message error", error);
    return NextResponse.json(
      { error: "Failed to start chat" },
      { status: 500 }
    );
  }
}
