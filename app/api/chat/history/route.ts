// pages/api/chat/history.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export default async function POST(req: NextRequest) {
  const supabase = await createClient(); // safe
  try {
    const { userId } = await req.json();
    if (!userId)
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title")
      .eq("user_id", userId)
      .eq("is_closed", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}
