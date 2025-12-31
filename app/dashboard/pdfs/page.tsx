"use client"

import Link from "next/link"
import { Upload, Search, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PDFTable, type PDFData } from "@/components/PdfTable"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, useEffect } from "react"

// Mock data fallback
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

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export default function PDFsPage() {
  const [pdfs, setPdfs] = useState<PDFData[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isDummyData, setIsDummyData] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch PDFs
  useEffect(() => {
    const fetchPDFs = async () => {
      setLoading(true)
      setError(null)
      setIsDummyData(false)

      try {
        const url = new URL("/api/dashboard/pdfs", window.location.origin)
        url.searchParams.set("page", pagination.page.toString())
        if (debouncedSearch) {
          url.searchParams.set("search", debouncedSearch)
        }

        const response = await fetch(url.toString())
        
        if (!response.ok) {
          throw new Error("Failed to fetch PDFs")
        }

        const result = await response.json()

        if (result.success) {
          // Check if we have real data
          if (result.data.length === 0 && pagination.page === 1) {
            // No data available, use mock data
            setPdfs(mockPDFs)
            setIsDummyData(true)
            setPagination({
              page: 1,
              limit: 8,
              total: mockPDFs.length,
              totalPages: 1,
              hasMore: false,
            })
          } else {
            setPdfs(result.data)
            setPagination(result.pagination)
          }
        }
      } catch (err) {
        console.error("Error fetching PDFs:", err)
        setError("Failed to load PDFs from database")
        setPdfs(mockPDFs)
        setIsDummyData(true)
        setPagination({
          page: 1,
          limit: 8,
          total: mockPDFs.length,
          totalPages: 1,
          hasMore: false,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPDFs()
  }, [pagination.page, debouncedSearch])

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to page 1 on search
  }

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

      {/* Dummy Data Warning */}
      {isDummyData && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Warning:</strong> Displaying dummy data. No PDFs found in the database.
          </AlertDescription>
        </Alert>
      )}

      {/* Search/Filter UI */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search PDF name..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* PDF Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground font-medium">Loading documents...</p>
          </div>
        </div>
      ) : (
        <>
          <PDFTable pdfs={pdfs} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} results
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.page) <= 1
                      )
                    })
                    .map((page, idx, arr) => (
                      <div key={page} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={pagination.page === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="min-w-10"
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}