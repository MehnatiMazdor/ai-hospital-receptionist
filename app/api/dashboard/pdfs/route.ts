import { createClient } from "@/lib/supabase/server";
import { embedAndUpsert } from "@/lib/embedAndUpsert";
import { loadPDF } from "@/lib/pdfLoader";
import { DEFAULT_NAMESPACE } from "@/lib/pineconeClient";
import { NextRequest, NextResponse } from "next/server";
import { createSSEResponse } from "@/lib/sse";
import { getSafeFileName } from "@/lib/utils";

export const runtime = "nodejs";

async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 8; // Fixed at 8 results per page
    const search = searchParams.get("search") || "";

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("pdf_documents")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.ilike("pdf_name", `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch PDFs" },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const pdfs =
      data?.map((doc) => ({
        id: doc.id,
        name: doc.pdf_name,
        size: doc.file_size,
        uploadedAt: doc.created_at,
        isEmbedded: doc.embedded_status === "embedded",
        pages: doc.document_pages || 0,
        chunks: doc.document_chunks || 0,
        url: doc.pdf_url,
      })) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: pdfs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("GET API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null;
  let pdfDocumentId: string | null = null;
  const supabase = await createClient();

  // Create SSE stream
  const { stream, sendEvent, close } = createSSEResponse();

  // Process upload asynchronously
  (async () => {
    try {
      // Step 0: Parse form data
      sendEvent("progress", {
        step: 0,
        message: "Receiving file...",
        status: "processing",
      });

      const formData = await request.formData();
      const file = formData.get("pdfFile") as File | null;

      if (!file) {
        sendEvent("error", { message: "Missing file" });
        close();
        return;
      }

      if (file.type !== "application/pdf") {
        sendEvent("error", { message: "Only PDFs allowed" });
        close();
        return;
      }

      // Step 1: Upload PDF to server
      sendEvent("progress", {
        step: 1,
        message: "Uploading PDF to server...",
        status: "processing",
      });

      // Check for existing PDF with the same name
      const { data: existingPDF } = await supabase
        .from("pdf_documents")
        .select("id")
        .eq("pdf_name", file.name) // exact filename match
        .maybeSingle(); // returns null if not found

      if (existingPDF) {
        sendEvent("error", {
          message: `A PDF with the name "${file.name}" already exists.`,
        });
        close();
        return; // stop further processing
      }

      const safeFileName = getSafeFileName(file.name);

      uploadedFilePath = `${DEFAULT_NAMESPACE}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("ai-hospital-receptionist-bucket")
        .upload(uploadedFilePath, file, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("ai-hospital-receptionist-bucket")
        .getPublicUrl(uploadedFilePath);

      sendEvent("progress", {
        step: 1,
        message: "PDF uploaded successfully",
        status: "completed",
      });

      // Step 2: Extract pages
      sendEvent("progress", {
        step: 2,
        message: "Extracting pages from document...",
        status: "processing",
      });

      const arrayBuffer = await file.arrayBuffer();
      const documents = await loadPDF(arrayBuffer);

      if (!documents || documents.length === 0) {
        throw new Error("PDF parsing produced no content");
      }

      const pageCount = documents.length;

      sendEvent("progress", {
        step: 2,
        message: `Extracted ${pageCount} pages successfully`,
        status: "completed",
        metadata: { pageCount },
      });

      // Step 3: Store metadata in database with pending status
      sendEvent("progress", {
        step: 3,
        message: "Storing PDF metadata in database...",
        status: "processing",
      });

      const { data: pdfDocument, error: dbError } = await supabase
        .from("pdf_documents")
        .insert({
          pdf_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          document_pages: pageCount,
          pdf_url: urlData.publicUrl,
          embedded_status: "pending",
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database insertion failed:", dbError);

        // Rollback storage
        await supabase.storage
          .from("ai-hospital-receptionist-bucket")
          .remove([uploadedFilePath]);

        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      pdfDocumentId = pdfDocument.id;

      sendEvent("progress", {
        step: 3,
        message: "Metadata stored successfully",
        status: "completed",
        metadata: { documentId: pdfDocumentId },
      });

      // Step 4-5: Embed and upsert to Pinecone (no rollback if this fails)
      sendEvent("progress", {
        step: 4,
        message: "Processing embeddings and storing in Pinecone...",
        status: "processing",
      });

      let chunkCount = 0;

      try {
        chunkCount = await embedAndUpsert(
          documents,
          DEFAULT_NAMESPACE,
          file.name
        );

        sendEvent("progress", {
          step: 5,
          message: "Vectors stored in Pinecone successfully",
          status: "completed",
        });

        // Step 6: Update embedded_status to "embedded"
        sendEvent("progress", {
          step: 6,
          message: "Updating embedding status...",
          status: "processing",
        });

        const { error: updateError } = await supabase
          .from("pdf_documents")
          .update({
            embedded_status: "embedded",
            document_chunks: chunkCount,
          })
          .eq("id", pdfDocumentId);

        if (updateError) {
          console.error("Failed to update embedded_status:", updateError);
          // Don't throw - document is already in DB, just log the error
        }

        sendEvent("progress", {
          step: 6,
          message: "Embedding status updated successfully",
          status: "completed",
        });
      } catch (pineconeError) {
        console.error("Pinecone operation failed:", pineconeError);

        // Don't rollback - just log the error and continue
        sendEvent("progress", {
          step: 5,
          message: "Pinecone operation failed, but PDF metadata saved",
          status: "warning",
        });
      }

      // Final success
      sendEvent("complete", {
        message: "PDF processed successfully",
        success: true,
        filePath: uploadedFilePath,
        documentId: pdfDocumentId,
        data: {
          id: pdfDocumentId,
          name: file.name,
          size: file.size,
          pages: pageCount,
          chunks: chunkCount,
          url: urlData.publicUrl,
          embedded_status: chunkCount > 0 ? "embedded" : "pending",
        },
      });

      close();
    } catch (error: unknown) {
      console.error("Error in API:", error);

      // Only rollback if the error occurred before Pinecone operation
      if (uploadedFilePath && !pdfDocumentId) {
        try {
          await supabase.storage
            .from("ai-hospital-receptionist-bucket")
            .remove([uploadedFilePath]);
          console.log("Storage cleanup successful");
        } catch (cleanupError) {
          console.error("Storage cleanup failed:", cleanupError);
        }
      }

      sendEvent("error", {
        message: (error as Error).message || "Internal Server Error",
      });

      close();
    }
  })();

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export { GET, POST };
