import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export default async function POST(req: NextRequest) {
  const supabase = await createClient(); // safe
  try {
    const { sessionId } = await req.json();
    if (!sessionId)
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    if (sessionError) throw sessionError;

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_session_id", sessionId)
      .order("created_at", { ascending: true });
    if (messagesError) throw messagesError;

    return NextResponse.json(
      { session, messages: messages || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
