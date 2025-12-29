// import { createClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { embedAndUpsert } from "@/lib/embedAndUpsert";
import { loadPDF } from "@/lib/pdfLoader";
import { DEFAULT_NAMESPACE } from "@/lib/pineconeClient";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_SUPABASE_PUBLISHABLE_KEY! // Use Service Role for server-side uploads
// );

export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null;

    
  const supabase = await createClient(); // safe

  try {
    const formData = await request.formData();
    const file = formData.get("pdfFile") as File | null;
    console.log("Received file:", file);
    console.log("Content-Type Header:", request.headers.get("content-type"));

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDFs allowed" }, { status: 400 });
    }

    // 1. Get the original name and remove problematic characters
    const safeFileName = file.name
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/[^\w.-]/g, ""); // Remove any non-alphanumeric chars except . and -

    // 2. Build the path using the sanitized name
    uploadedFilePath = `${DEFAULT_NAMESPACE}/${Date.now()}-${safeFileName}`;

    console.log("Sanitized Path:", uploadedFilePath);

    // 1. Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from("ai-hospital-receptionist-bucket")
      .upload(uploadedFilePath, file, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // 2. Parse PDF
    const arrayBuffer = await file.arrayBuffer();
    const documents = await loadPDF(arrayBuffer);

    console.log(`Parsed ${documents.length} documents from PDF.`);
    console.log("Documents preview:", documents);

    if (!documents || documents.length === 0) {
      throw new Error("PDF parsing produced no content");
    }

    // 3. Vector Embeddings
    await embedAndUpsert(documents, DEFAULT_NAMESPACE);

    return NextResponse.json({
      success: true,
      message: "PDF processed successfully",
    });
  } catch (error: unknown) {
    console.error("Error in API:", error);

    // Rollback storage if file was uploaded
    if (uploadedFilePath) {
      await supabase.storage
        .from("ai-hospital-receptionist-bucket")
        .remove([uploadedFilePath]);
    }

    return NextResponse.json(
      { error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
