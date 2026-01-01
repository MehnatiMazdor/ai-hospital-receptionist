"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  HardDrive,
  FileType,
  Layers,
  Database,
  CheckCircle2,
  ExternalLink,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PDFDocument = {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  pages: number;
  chunks: number;
  isEmbedded: boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export default function PDFDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const router = useRouter();
  const [pdf, setPdf] = useState<PDFDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPDFDetails();
  }, [resolvedParams.id]);

  const fetchPDFDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/pdfs/${resolvedParams.id}`);
      const result = await response.json();

      if (result.success) {
        setPdf(result.data);
      } else {
        setError(result.error || "Failed to load PDF details");
      }
    } catch (err) {
      console.error("Error fetching PDF details:", err);
      setError("Failed to load PDF details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pdf) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `/api/knowledge/documents/${resolvedParams.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        router.push("/dashboard/pdfs");
      } else {
        setError(result.error || "Failed to delete PDF");
      }
    } catch (err) {
      console.error("Error deleting PDF:", err);
      setError("Failed to delete PDF");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDownload = () => {
    if (pdf?.url) {
      window.open(pdf.url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/pdfs">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">PDF Not Found</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "The requested PDF document could not be found."}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/dashboard/pdfs">Back to PDFs</Link>
        </Button>
      </div>
    );
  }

  // Calculate derived metrics on frontend
  const pagesPerChunk =
    pdf.chunks > 0 ? (pdf.pages / pdf.chunks).toFixed(2) : "0";
  const chunksPerPage =
    pdf.pages > 0 ? (pdf.chunks / pdf.pages).toFixed(2) : "0";
  const avgChunkSize = pdf.chunks > 0 ? Math.round(pdf.size / pdf.chunks) : 0;

  const stats = [
    {
      label: "File Size",
      value: formatFileSize(pdf.size),
      icon: HardDrive,
      color: "text-primary",
    },
    {
      label: "Total Pages",
      value: pdf.pages.toString(),
      icon: FileType,
      color: "text-accent",
    },
    {
      label: "Chunks Created",
      value: pdf.chunks.toString(),
      icon: Layers,
      color: "text-chart-2",
    },
    {
      label: "Embeddings",
      value: pdf.chunks.toString(),
      icon: Database,
      color: "text-chart-3",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b pb-4 -mx-6 px-6 -mt-6 pt-6 mb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/dashboard/pdfs">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-balance truncate">
                {pdf.name}
              </h1>
              {pdf.isEmbedded ? (
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-500/20 w-fit shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Embedded
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-fit shrink-0">
                  Pending
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* File Information */}
        <Card>
          <CardHeader>
            <CardTitle>File Information</CardTitle>
            <CardDescription>Basic details about this document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">File Name</span>
                <span className="text-sm font-medium text-right max-w-[60%] wrap-break-word">
                  {pdf.name}
                </span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">File Size</span>
                <span className="text-sm font-medium">
                  {formatFileSize(pdf.size)}
                </span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">MIME Type</span>
                <span className="text-sm font-medium">{pdf.mimeType}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Pages
                </span>
                <span className="text-sm font-medium">{pdf.pages} pages</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Chunks
                </span>
                <span className="text-sm font-medium">{pdf.chunks} chunks</span>
              </div>
            </div>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <a href={pdf.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Original File
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Processing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Details</CardTitle>
            <CardDescription>
              Information about document processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Embedding Status
                </span>
                <span className="text-sm font-medium">
                  {pdf.isEmbedded ? "Completed" : "Pending"}
                </span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Embeddings
                </span>
                <span className="text-sm font-medium">
                  {pdf.chunks} vectors
                </span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg. Chunk Size
                </span>
                <span className="text-sm font-medium">
                  {formatFileSize(avgChunkSize)}
                </span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Storage Backend
                </span>
                <span className="text-sm font-medium">Supabase Storage</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Vector Database
                </span>
                <span className="text-sm font-medium">Pinecone</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chunking Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Chunking & Embedding Statistics</CardTitle>
          <CardDescription>
            Detailed breakdown of document processing metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileType className="h-4 w-4" />
                Pages per Chunk
              </div>
              <p className="text-2xl font-bold">{pagesPerChunk}</p>
              <p className="text-xs text-muted-foreground">
                Average pages in each chunk
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                Chunks per Page
              </div>
              <p className="text-2xl font-bold">{chunksPerPage}</p>
              <p className="text-xs text-muted-foreground">
                Average chunks per page
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                Total Vectors
              </div>
              <p className="text-2xl font-bold">{pdf.chunks}</p>
              <p className="text-xs text-muted-foreground">
                Stored in vector database
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage this document</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive bg-transparent"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Document
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Note: Deleting this document will remove all associated chunks and
            embeddings from the vector database.
          </p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PDF Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{pdf.name}" and all associated
              embeddings from your knowledge base. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// "use client"

// import { useEffect, useState } from "react"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import {
//   ArrowLeft,
//   HardDrive,
//   FileType,
//   Layers,
//   Database,
//   CheckCircle2,
//   ExternalLink,
//   Download,
//   Trash2,
//   Loader2,
//   AlertCircle,
// } from "lucide-react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Separator } from "@/components/ui/separator"
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog"
// import { Alert, AlertDescription } from "@/components/ui/alert"

// type PDFDocument = {
//   id: string
//   name: string
//   url: string
//   size: number
//   mimeType: string
//   pages: number
//   chunks: number
//   isEmbedded: boolean
// }

// function formatFileSize(bytes: number): string {
//   if (bytes === 0) return "0 Bytes"
//   const k = 1024
//   const sizes = ["Bytes", "KB", "MB"]
//   const i = Math.floor(Math.log(bytes) / Math.log(k))
//   return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
// }

// export default function PDFDetailPage({ params }: { params: { id: string } }) {
//   const router = useRouter()
//   const [pdf, setPdf] = useState<PDFDocument | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
//   const [deleting, setDeleting] = useState(false)

//   useEffect(() => {
//     fetchPDFDetails()
//   }, [params.id])

//   const fetchPDFDetails = async () => {
//     try {
//       setLoading(true)
//       setError(null)

//       const response = await fetch(`/api/dashboard/pdfs/${params.id}`)
//       const result = await response.json()

//       if (result.success) {
//         setPdf(result.data)
//       } else {
//         setError(result.error || "Failed to load PDF details")
//       }
//     } catch (err) {
//       console.error("Error fetching PDF details:", err)
//       setError("Failed to load PDF details")
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleDelete = async () => {
//     if (!pdf) return

//     try {
//       setDeleting(true)
//       const response = await fetch(`/api/knowledge/documents/${params.id}`, {
//         method: "DELETE",
//       })

//       const result = await response.json()

//       if (result.success) {
//         router.push("/dashboard/pdfs")
//       } else {
//         setError(result.error || "Failed to delete PDF")
//       }
//     } catch (err) {
//       console.error("Error deleting PDF:", err)
//       setError("Failed to delete PDF")
//     } finally {
//       setDeleting(false)
//       setDeleteDialogOpen(false)
//     }
//   }

//   const handleDownload = () => {
//     if (pdf?.url) {
//       window.open(pdf.url, "_blank")
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//       </div>
//     )
//   }

//   if (error || !pdf) {
//     return (
//       <div className="space-y-6">
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" size="icon" asChild>
//             <Link href="/dashboard/pdfs">
//               <ArrowLeft className="h-5 w-5" />
//             </Link>
//           </Button>
//           <h1 className="text-3xl font-bold tracking-tight">PDF Not Found</h1>
//         </div>
//         <Alert variant="destructive">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>
//             {error || "The requested PDF document could not be found."}
//           </AlertDescription>
//         </Alert>
//         <Button asChild>
//           <Link href="/dashboard/pdfs">Back to PDFs</Link>
//         </Button>
//       </div>
//     )
//   }

//   // Calculate derived metrics on frontend
//   const pagesPerChunk = pdf.chunks > 0 ? (pdf.pages / pdf.chunks).toFixed(2) : "0"
//   const chunksPerPage = pdf.pages > 0 ? (pdf.chunks / pdf.pages).toFixed(2) : "0"
//   const avgChunkSize = pdf.chunks > 0 ? Math.round(pdf.size / pdf.chunks) : 0

//   const stats = [
//     {
//       label: "File Size",
//       value: formatFileSize(pdf.size),
//       icon: HardDrive,
//       color: "text-primary",
//     },
//     {
//       label: "Total Pages",
//       value: pdf.pages.toString(),
//       icon: FileType,
//       color: "text-accent",
//     },
//     {
//       label: "Chunks Created",
//       value: pdf.chunks.toString(),
//       icon: Layers,
//       color: "text-chart-2",
//     },
//     {
//       label: "Embeddings",
//       value: pdf.chunks.toString(), // Embeddings = chunks
//       icon: Database,
//       color: "text-chart-3",
//     },
//   ]

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center gap-4">
//         <Button variant="ghost" size="icon" asChild>
//           <Link href="/dashboard/pdfs">
//             <ArrowLeft className="h-5 w-5" />
//           </Link>
//         </Button>
//         <div className="flex-1">
//           <div className="flex items-center gap-3 mb-2">
//             <h1 className="text-3xl font-bold tracking-tight text-balance">{pdf.name}</h1>
//             {pdf.isEmbedded ? (
//               <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-500/20">
//                 <CheckCircle2 className="h-3 w-3 mr-1" />
//                 Embedded
//               </Badge>
//             ) : (
//               <Badge variant="secondary">Pending</Badge>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//         {stats.map((stat) => (
//           <Card key={stat.label}>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
//               <stat.icon className={`h-4 w-4 ${stat.color}`} />
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold">{stat.value}</div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Main Content Grid */}
//       <div className="grid gap-6 lg:grid-cols-2">
//         {/* File Information */}
//         <Card>
//           <CardHeader>
//             <CardTitle>File Information</CardTitle>
//             <CardDescription>Basic details about this document</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="space-y-3">
//               <div className="flex items-start justify-between">
//                 <span className="text-sm text-muted-foreground">File Name</span>
//                 <span className="text-sm font-medium text-right max-w-[60%] wrap-break-word">{pdf.name}</span>
//               </div>
//               <Separator />
//               <div className="flex items-start justify-between">
//                 <span className="text-sm text-muted-foreground">File Size</span>
//                 <span className="text-sm font-medium">{formatFileSize(pdf.size)}</span>
//               </div>
//               <Separator />
//               <div className="flex items-start justify-between">
//                 <span className="text-sm text-muted-foreground">MIME Type</span>
//                 <span className="text-sm font-medium">{pdf.mimeType}</span>
//               </div>
//               <Separator />
//               <div className="flex items-start justify-between">
//                 <span className="text-sm text-muted-foreground">Total Pages</span>
//                 <span className="text-sm font-medium">{pdf.pages} pages</span>
//               </div>
//               <Separator />
//               <div className="flex items-start justify-between">
//                 <span className="text-sm text-muted-foreground">Total Chunks</span>
//                 <span className="text-sm font-medium">{pdf.chunks} chunks</span>
//               </div>
//             </div>
//             <Button variant="outline" className="w-full bg-transparent" asChild>
//               <a href={pdf.url} target="_blank" rel="noopener noreferrer">
//                 <ExternalLink className="mr-2 h-4 w-4" />
//                 Open Original File
//               </a>
//             </Button>
//           </CardContent>
//         </Card>

//         {/* Processing Information */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Processing Details</CardTitle>
//             <CardDescription>Information about document processing</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="space-y-3">
//               <div className="flex items-start justify-between">
//                 <span className="text-sm text-muted-foreground">Embedding Status</span>
//                 <span className="text-sm font-medium">{pdf.isEmbedded ? "Completed" : "Pending"}</span>
//               </div>
//               <Separator />
//               <div className="flex items-start justify-between">
//                 <span className="text-sm text-muted-foreground">Total Embeddings</span>
//                 <span className="text-sm font-medium">{pdf.chunks} vectors</span>
//               </div>
//               <Separator />
//               <div className="flex items-start justify-between">
//                 <span className="text-sm text-muted-foreground">Avg. Chunk Size</span>
//                 <span className="text-sm font-medium">{formatFileSize(avgChunkSize)}</span>
//               </div>
//               <Separator />
//               <div className="flex items-start justify-between">
//                 <span className="text-sm text-muted-foreground">Storage Backend</span>
//                 <span className="text-sm font-medium">Supabase Storage</span>
//               </div>
//               <Separator />
//               <div className="flex items-start justify-between">
//                 <span className="text-sm text-muted-foreground">Vector Database</span>
//                 <span className="text-sm font-medium">Pinecone</span>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Chunking Statistics */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Chunking & Embedding Statistics</CardTitle>
//           <CardDescription>Detailed breakdown of document processing metrics</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="grid gap-6 md:grid-cols-3">
//             <div className="space-y-2">
//               <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                 <FileType className="h-4 w-4" />
//                 Pages per Chunk
//               </div>
//               <p className="text-2xl font-bold">{pagesPerChunk}</p>
//               <p className="text-xs text-muted-foreground">Average pages in each chunk</p>
//             </div>
//             <div className="space-y-2">
//               <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                 <Layers className="h-4 w-4" />
//                 Chunks per Page
//               </div>
//               <p className="text-2xl font-bold">{chunksPerPage}</p>
//               <p className="text-xs text-muted-foreground">Average chunks per page</p>
//             </div>
//             <div className="space-y-2">
//               <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                 <Database className="h-4 w-4" />
//                 Total Vectors
//               </div>
//               <p className="text-2xl font-bold">{pdf.chunks}</p>
//               <p className="text-xs text-muted-foreground">Stored in vector database</p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Actions */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Actions</CardTitle>
//           <CardDescription>Manage this document</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="flex flex-wrap gap-3">
//             <Button variant="outline" onClick={handleDownload}>
//               <Download className="mr-2 h-4 w-4" />
//               Download PDF
//             </Button>
//             <Button
//               variant="outline"
//               className="text-destructive hover:text-destructive bg-transparent"
//               onClick={() => setDeleteDialogOpen(true)}
//             >
//               <Trash2 className="mr-2 h-4 w-4" />
//               Delete Document
//             </Button>
//           </div>
//           <p className="text-xs text-muted-foreground mt-4">
//             Note: Deleting this document will remove all associated chunks and embeddings from the vector database.
//           </p>
//         </CardContent>
//       </Card>

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete PDF Document?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This will permanently delete "{pdf.name}" and all associated embeddings from your
//               knowledge base. This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDelete}
//               disabled={deleting}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//             >
//               {deleting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Deleting...
//                 </>
//               ) : (
//                 "Delete"
//               )}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   )
// }
