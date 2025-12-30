import Link from "next/link"
import { Upload, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PDFTable, type PDFData } from "@/components/PdfTable"
import { Input } from "@/components/ui/input"
import { Suspense } from "react"

// TODO: Replace with actual API call to fetch PDFs
const mockPDFs: PDFData[] = [
  {
    id: "1",
    name: "Patient_Care_Guidelines.pdf",
    size: 2.4 * 1024 * 1024,
    uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isEmbedded: true,
    pages: 45,
    chunks: 156,
  },
  {
    id: "2",
    name: "Medical_Procedures_2024.pdf",
    size: 5.8 * 1024 * 1024,
    uploadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isEmbedded: true,
    pages: 89,
    chunks: 312,
  },
  {
    id: "3",
    name: "Hospital_Policies.pdf",
    size: 1.2 * 1024 * 1024,
    uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isEmbedded: true,
    pages: 23,
    chunks: 78,
  },
  {
    id: "4",
    name: "Emergency_Protocols.pdf",
    size: 3.7 * 1024 * 1024,
    uploadedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    isEmbedded: true,
    pages: 67,
    chunks: 234,
  },
  {
    id: "5",
    name: "Medication_Guide.pdf",
    size: 8.9 * 1024 * 1024,
    uploadedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    isEmbedded: false,
    pages: 145,
    chunks: 0,
  },
  {
    id: "6",
    name: "Surgery_Standards.pdf",
    size: 4.3 * 1024 * 1024,
    uploadedAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    isEmbedded: true,
    pages: 78,
    chunks: 267,
  },
  {
    id: "7",
    name: "Infection_Control.pdf",
    size: 1.8 * 1024 * 1024,
    uploadedAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    isEmbedded: true,
    pages: 34,
    chunks: 112,
  },
  {
    id: "8",
    name: "Patient_Rights.pdf",
    size: 0.9 * 1024 * 1024,
    uploadedAt: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
    isEmbedded: true,
    pages: 15,
    chunks: 48,
  },
]

export default async function PDFsPage() {
  // TODO: Fetch PDFs from backend
  // const pdfs = await fetch('/api/pdfs').then(res => res.json())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Embedded PDFs</h1>
          <p className="text-muted-foreground">View and manage all your processed documents</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload New PDF
          </Link>
        </Button>
      </div>

      {/* Search/Filter UI */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search PDF name..." className="pl-9" />
        </div>
        <Button variant="outline">Size Filter</Button>
        <Button variant="outline">Name Filter</Button>
      </div>

      {/* PDF Table */}
      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground font-medium">Loading documents...</p>
            </div>
          </div>
        }
      >
        <PDFTable pdfs={mockPDFs} />
      </Suspense>
    </div>
  )
}
