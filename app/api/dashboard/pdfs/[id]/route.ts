// app/api/knowledge/documents/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Fetch PDF document from database
    const { data: pdf, error } = await supabase
      .from("pdf_documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !pdf) {
      return NextResponse.json(
        { success: false, error: "PDF document not found" },
        { status: 404 }
      );
    }

    // Return the document data
    // Frontend will calculate derived fields like pages per chunk, etc.
    return NextResponse.json({
      success: true,
      data: {
        id: pdf.id,
        name: pdf.pdf_name,
        url: pdf.pdf_url,
        size: pdf.file_size,
        mimeType: pdf.mime_type,
        pages: pdf.document_pages,
        chunks: pdf.document_chunks,
        // Note: We don't have these fields in the database yet
        // They can be calculated on frontend or added to DB in future
        isEmbedded: pdf.document_chunks > 0, // If chunks exist, it's embedded
      },
    });
  } catch (error) {
    console.error("Error fetching PDF document:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint for individual PDF
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get PDF details first
    const { data: pdf, error: fetchError } = await supabase
      .from("pdf_documents")
      .select("pdf_url")
      .eq("id", id)
      .single();

    if (fetchError || !pdf) {
      return NextResponse.json(
        { success: false, error: "PDF document not found" },
        { status: 404 }
      );
    }

    // Extract storage path from URL
    const urlParts = pdf.pdf_url.split("/storage/v1/object/public/");
    if (urlParts.length === 2) {
      const fullPath = urlParts[1];
      const pathParts = fullPath.split("/");
      const bucketName = pathParts[0];
      const filePath = pathParts.slice(1).join("/");

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("pdf_documents")
      .delete()
      .eq("id", id);

    if (dbError) {
      throw new Error(`Failed to delete PDF document: ${dbError.message}`);
    }

    // TODO: Delete vectors from Pinecone using document ID

    return NextResponse.json({
      success: true,
      message: "PDF document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting PDF document:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}