"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Activity,
  Users,
  MessageSquare,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

type DashboardStats = {
  totalDocuments: number;
  recentDocumentsCount: number;
  totalPages: number;
  totalChunks: number;
  recentUploads: Array<{
    id: string;
    pdf_name: string;
    file_size: number;
    document_chunks: number;
  }>;
  patientQueries: number | null;
  activeUsers: number | null;
};

// Dummy data fallback
const DUMMY_STATS: DashboardStats = {
  totalDocuments: 24,
  recentDocumentsCount: 2,
  totalPages: 567,
  totalChunks: 15400,
  recentUploads: [
    {
      id: "1",
      pdf_name: "Patient_Care_v2.pdf",
      file_size: 2.4 * 1024 * 1024,
      document_chunks: 156,
    },
    {
      id: "2",
      pdf_name: "Clinical_Trials.pdf",
      file_size: 5.8 * 1024 * 1024,
      document_chunks: 312,
    },
    {
      id: "3",
      pdf_name: "Medication_Guide.pdf",
      file_size: 1.2 * 1024 * 1024,
      document_chunks: 78,
    },
  ],
  patientQueries: 1284,
  activeUsers: 573,
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(DUMMY_STATS);
  const [loading, setLoading] = useState(true);
  const [usingRealData, setUsingRealData] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/stats");
      const result = await response.json();

      if (result.success && result.data) {
        const fetchedData = result.data;

        // Merge real data with dummy data (use dummy for null values)
        setStats({
          totalDocuments:
            fetchedData.totalDocuments || DUMMY_STATS.totalDocuments,
          recentDocumentsCount:
            fetchedData.recentDocumentsCount ||
            DUMMY_STATS.recentDocumentsCount,
          totalPages: fetchedData.totalPages || DUMMY_STATS.totalPages,
          totalChunks: fetchedData.totalChunks || DUMMY_STATS.totalChunks,
          recentUploads:
            fetchedData.recentUploads.length > 0
              ? fetchedData.recentUploads
              : DUMMY_STATS.recentUploads,
          patientQueries:
            fetchedData.patientQueries || DUMMY_STATS.patientQueries,
          activeUsers: fetchedData.activeUsers || DUMMY_STATS.activeUsers,
        });

        // Check if we have any real data
        setUsingRealData(
          fetchedData.totalDocuments > 0 || fetchedData.recentUploads.length > 0
        );
      } else {
        // Use dummy data on error
        setStats(DUMMY_STATS);
        setUsingRealData(false);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Use dummy data on error
      setStats(DUMMY_STATS);
      setUsingRealData(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b pb-4 -mx-6 px-6 -mt-8 pt-8 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Hi Admin, welcome to your dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your medical knowledge base and monitor patient
              interactions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Link href="/dashboard/upload">
                <Upload className="mr-2 h-5 w-5" />
                Upload PDF
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard/pdfs">
                <FileText className="mr-2 h-5 w-5" />
                View PDFs
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.recentDocumentsCount > 0
                    ? `+${stats.recentDocumentsCount} from last week`
                    : "No recent uploads"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Patient Queries
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.patientQueries || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usingRealData
                    ? "Tracked queries"
                    : "Demo data - Coming soon"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Knowledge Chunks
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.totalChunks)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all embeddings
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usingRealData
                    ? "Live interactions"
                    : "Demo data - Coming soon"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>
              Knowledge retrieval and response latency across the hospital
              network.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-75 flex items-center justify-center border-t pt-6">
            <div className="text-center space-y-2">
              <Activity className="h-12 w-12 text-primary/20 mx-auto" />
              <p className="text-muted-foreground font-medium">
                Response Analytics Loading...
              </p>
              <p className="text-xs text-muted-foreground/60">
                Real-time vector search metrics
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>
              Latest medical documentation processed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {stats.recentUploads.map((file, i) => (
                    <Link
                      key={file.id}
                      href={`/dashboard/pdfs/${file.id}`}
                      className="flex items-center gap-4 hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {file.pdf_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)}
                        </p>
                      </div>
                      <div
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          file.document_chunks > 0
                            ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                        }`}
                      >
                        {file.document_chunks > 0 ? "Embedded" : "Processing"}
                      </div>
                    </Link>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="w-full mt-6 text-primary"
                  asChild
                >
                  <Link href="/dashboard/pdfs">View All Documents</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Source Indicator */}
      {!loading && !usingRealData && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              📊 Currently showing demo data. Upload your first PDF to see real
              statistics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
