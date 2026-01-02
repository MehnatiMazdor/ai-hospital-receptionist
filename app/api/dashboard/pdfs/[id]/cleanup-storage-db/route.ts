// app/api/dashboard/pdfs/[id]/cleanup-storage/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"


export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("Starting cleanup for PDF document with ID:", id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get document
    const { data: document, error: fetchError } = await supabase
      .from("pdf_documents")
      .select("*")
      .eq("id", id)
      .single()

    console.log("Fetched document for cleanup:", document, fetchError);

    if (fetchError || !document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if embeddings are deleted
    if (document.embedded_status !== "deleted") {
      console.log("Embeddings not deleted for document ID:", id);
      return NextResponse.json(
        { success: false, error: "Document embeddings must be deleted first" },
        { status: 400 }
      )
    }

    // Check if storage file exists
    if (!document.upload_file_storage_path) {
      console.log("No storage file to delete for document ID:", id);
      return NextResponse.json(
        { success: false, error: "No storage file to delete" },
        { status: 400 }
      )
    }

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from("pdfs")
      .remove([document.uploaded_file_storage_path])

    if (storageError) {
      console.log("Storage deletion failed for document ID:", id, storageError);
      return NextResponse.json(
        { success: false, error: `Storage deletion failed: ${storageError.message}` },
        { status: 500 }
      )
    }

    console.log("Storage deleted for document ID:", id);

    // Delete from Database
    const { error: dbError } = await supabase
      .from("pdf_documents")
      .delete()
      .eq("id", id)

    if (dbError) {
      console.log("Database deletion failed for document ID:", id, dbError);
      // Update to mark storage as deleted
      await supabase
        .from("pdf_documents")
        .update({ uploaded_file_storage_path: null })
        .eq("id", id)

      return NextResponse.json(
        { success: false, error: `Database deletion failed: ${dbError.message}` },
        { status: 500 }
      )
    }

    console.log("Database record deleted for document ID:", id);

    return NextResponse.json({ 
      message: "PDF document cleanup completed successfully"
     }, { status: 200});

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}