import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = typeof body?.content === "string"
      ? body.content.trim()
      : "";

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessionId = crypto.randomUUID();

    const { error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        id: sessionId,
        user_id: user.id,
        title: content.slice(0, 50),
      });

    if (sessionError) {
      console.error("Chat session insert failed:", sessionError);
      return NextResponse.json(
        { error: "Failed to create chat session" },
        { status: 500 }
      );
    }

    const { error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        chat_session_id: sessionId,
        role: "user",
        content_text: content,
      });

    if (messageError) {
      console.error("Chat message insert failed:", messageError);
      return NextResponse.json(
        { error: "Failed to create chat message" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { sessionId },
      { status: 201 }
    );

  } catch (err) {
    console.error("POST /api/chat/start error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
