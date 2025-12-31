// app/api/dashboard/stats/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch total documents
    const { count: totalDocuments, error: docsError } = await supabase
      .from("pdf_documents")
      .select("*", { count: "exact", head: true });

    if (docsError) {
      console.error("Error fetching documents count:", docsError);
    }

    // Fetch total pages and chunks
    const { data: documents, error: aggregateError } = await supabase
      .from("pdf_documents")
      .select("document_pages, document_chunks");

    if (aggregateError) {
      console.error("Error fetching aggregate data:", aggregateError);
    }

    const totalPages = documents?.reduce((sum, doc) => sum + doc.document_pages, 0) || 0;
    const totalChunks = documents?.reduce((sum, doc) => sum + doc.document_chunks, 0) || 0;

    // Fetch recent uploads (last 3)
    const { data: recentUploads, error: recentError } = await supabase
      .from("pdf_documents")
      .select("id, pdf_name, file_size, document_chunks")
      .order("id", { ascending: false })
      .limit(3);

    if (recentError) {
      console.error("Error fetching recent uploads:", recentError);
    }

    // Calculate documents uploaded in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { count: recentDocsCount, error: recentCountError } = await supabase
      .from("pdf_documents")
      .select("*", { count: "exact", head: true })
      .gte("id", oneWeekAgo.toISOString());

    if (recentCountError) {
      console.error("Error fetching recent documents count:", recentCountError);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalDocuments: totalDocuments || 0,
        recentDocumentsCount: recentDocsCount || 0,
        totalPages: totalPages,
        totalChunks: totalChunks,
        recentUploads: recentUploads || [],
        // These fields would require additional tables/tracking
        // For now, they're not available from the current schema
        patientQueries: null,
        activeUsers: null,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}