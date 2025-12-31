// import { createClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getHospitalNamespace } from "@/lib/pineconeClient";
import { NextRequest, NextResponse } from "next/server";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_SUPABASE_PUBLISHABLE_KEY!
// );

export async function POST(request: NextRequest) {
  try {

    const supabase = await createClient(); // safe


    const { filePath, namespace } = await request.json();

    if (!filePath || !namespace) {
      return NextResponse.json({ error: "Missing filePath or namespace" }, { status: 400 });
    }

    // 1️⃣ Delete from Supabase storage
    const { error: deleteError } = await supabase.storage
      .from("ai-hospital-receptionist-bucket")
      .remove([filePath]);

    if (deleteError) {
      throw new Error(`Failed to delete file from storage: ${deleteError.message}`);
    }

    const hospitalNamespace = getHospitalNamespace();
    
    // 2️⃣ Delete chunks from Pinecone
    await hospitalNamespace.deleteMany({
      filter: { category: { $eq: namespace } },
    });

    return NextResponse.json({
      success: true,
      message: "PDF and its chunks deleted successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deletion failed";
    console.error("Delete error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}