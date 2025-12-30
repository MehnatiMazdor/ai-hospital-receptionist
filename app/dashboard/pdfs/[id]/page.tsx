import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  HardDrive,
  FileType,
  Layers,
  Database,
  Clock,
  CheckCircle2,
  ExternalLink,
  Download,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// TODO: Replace with actual API call
async function getPDFById(id: string) {
  // Simulate API call
  const mockData: Record<
    string,
    {
      id: string
      name: string
      url: string
      size: number
      uploadedAt: string
      isEmbedded: boolean
      pages: number
      chunks: number
      processingTime: number
      embeddings: number
      avgChunkSize: number
      metadata: {
        mimeType: string
        createdAt: string
        lastModified: string
      }
    }
  > = {
    "1": {
      id: "1",
      name: "Patient_Care_Guidelines.pdf",
      url: "https://storage.example.com/pdfs/patient-care-guidelines.pdf",
      size: 2.4 * 1024 * 1024,
      uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isEmbedded: true,
      pages: 45,
      chunks: 156,
      processingTime: 143,
      embeddings: 156,
      avgChunkSize: 512,
      metadata: {
        mimeType: "application/pdf",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    "2": {
      id: "2",
      name: "Medical_Procedures_2024.pdf",
      url: "https://storage.example.com/pdfs/medical-procedures-2024.pdf",
      size: 5.8 * 1024 * 1024,
      uploadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      isEmbedded: true,
      pages: 89,
      chunks: 312,
      processingTime: 287,
      embeddings: 312,
      avgChunkSize: 524,
      metadata: {
        mimeType: "application/pdf",
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    "3": {
      id: "3",
      name: "Hospital_Policies.pdf",
      url: "https://storage.example.com/pdfs/hospital-policies.pdf",
      size: 1.2 * 1024 * 1024,
      uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isEmbedded: true,
      pages: 23,
      chunks: 78,
      processingTime: 82,
      embeddings: 78,
      avgChunkSize: 498,
      metadata: {
        mimeType: "application/pdf",
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    "4": {
      id: "4",
      name: "Emergency_Protocols.pdf",
      url: "https://storage.example.com/pdfs/emergency-protocols.pdf",
      size: 3.7 * 1024 * 1024,
      uploadedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      isEmbedded: true,
      pages: 67,
      chunks: 234,
      processingTime: 196,
      embeddings: 234,
      avgChunkSize: 518,
      metadata: {
        mimeType: "application/pdf",
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    "5": {
      id: "5",
      name: "Medication_Guide.pdf",
      url: "https://storage.example.com/pdfs/medication-guide.pdf",
      size: 8.9 * 1024 * 1024,
      uploadedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      isEmbedded: false,
      pages: 145,
      chunks: 0,
      processingTime: 0,
      embeddings: 0,
      avgChunkSize: 0,
      metadata: {
        mimeType: "application/pdf",
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date(Date.now() - 73 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    "6": {
      id: "6",
      name: "Surgery_Standards.pdf",
      url: "https://storage.example.com/pdfs/surgery-standards.pdf",
      size: 4.3 * 1024 * 1024,
      uploadedAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
      isEmbedded: true,
      pages: 78,
      chunks: 267,
      processingTime: 221,
      embeddings: 267,
      avgChunkSize: 532,
      metadata: {
        mimeType: "application/pdf",
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    "7": {
      id: "7",
      name: "Infection_Control.pdf",
      url: "https://storage.example.com/pdfs/infection-control.pdf",
      size: 1.8 * 1024 * 1024,
      uploadedAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
      isEmbedded: true,
      pages: 34,
      chunks: 112,
      processingTime: 98,
      embeddings: 112,
      avgChunkSize: 505,
      metadata: {
        mimeType: "application/pdf",
        createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date(Date.now() - 125 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    "8": {
      id: "8",
      name: "Patient_Rights.pdf",
      url: "https://storage.example.com/pdfs/patient-rights.pdf",
      size: 0.9 * 1024 * 1024,
      uploadedAt: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
      isEmbedded: true,
      pages: 15,
      chunks: 48,
      processingTime: 52,
      embeddings: 48,
      avgChunkSize: 485,
      metadata: {
        mimeType: "application/pdf",
        createdAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  }

  return mockData[id] || null
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

export default async function PDFDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pdf = await getPDFById(id)

  if (!pdf) {
    notFound()
  }

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
      value: pdf.embeddings.toString(),
      icon: Database,
      color: "text-chart-3",
    },
  ]

  const handleSyncToBackend = async () => {
    "use server"
    console.log("[v0] Syncing PDF to backend:", id)
    // Future integration point
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/pdfs">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-balance">{pdf.name}</h1>
            {pdf.isEmbedded ? (
              <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Embedded
              </Badge>
            ) : (
              <Badge variant="secondary">Pending</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Uploaded {formatDate(pdf.uploadedAt)}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
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
                <span className="text-sm font-medium text-right max-w-[60%] wrap-break-word">{pdf.name}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">File Size</span>
                <span className="text-sm font-medium">{formatFileSize(pdf.size)}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">MIME Type</span>
                <span className="text-sm font-medium">{pdf.metadata.mimeType}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">{formatDate(pdf.metadata.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Last Modified</span>
                <span className="text-sm font-medium">{formatDate(pdf.metadata.lastModified)}</span>
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
            <CardDescription>Information about document processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Upload Date</span>
                <span className="text-sm font-medium">{formatDate(pdf.uploadedAt)}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Processing Time</span>
                <span className="text-sm font-medium">{formatDuration(pdf.processingTime)}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Embedding Status</span>
                <span className="text-sm font-medium">{pdf.isEmbedded ? "Completed" : "Pending"}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Total Embeddings</span>
                <span className="text-sm font-medium">{pdf.embeddings} vectors</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Avg. Chunk Size</span>
                <span className="text-sm font-medium">{pdf.avgChunkSize} tokens</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chunking Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Chunking & Embedding Statistics</CardTitle>
          <CardDescription>Detailed breakdown of document processing metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileType className="h-4 w-4" />
                Pages per Chunk
              </div>
              <p className="text-2xl font-bold">{(pdf.pages / pdf.chunks).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Average pages in each chunk</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                Chunks per Page
              </div>
              <p className="text-2xl font-bold">{(pdf.chunks / pdf.pages).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Average chunks per page</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Processing Speed
              </div>
              <p className="text-2xl font-bold">{(pdf.pages / (pdf.processingTime / 60)).toFixed(1)}/min</p>
              <p className="text-xs text-muted-foreground">Pages processed per minute</p>
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
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <form action={handleSyncToBackend}>
              <Button variant="outline" type="submit">
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-process Document
              </Button>
            </form>
            <Button variant="outline" className="text-destructive hover:text-destructive bg-transparent">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Document
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Note: Deleting this document will remove all associated chunks and embeddings from the vector database.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
