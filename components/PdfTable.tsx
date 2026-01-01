"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, CheckCircle2, XCircle, Search, ArrowUpDown, ArrowUp, ArrowDown, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { truncateName } from "@/lib/utils"


export type PDFData = {
  id: string
  name: string
  size: number
  uploadedAt: string
  isEmbedded: boolean
  pages: number
  chunks: number
}

type SortField = "name" | "size" | "uploadedAt"
type SortDirection = "asc" | "desc" | null

interface PDFTableProps {
  pdfs: PDFData[]
}

export function PDFTable({ pdfs: initialPdfs }: PDFTableProps) {
  const [pdfs, setPdfs] = useState(initialPdfs)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "embedded" | "pending">("all")
  const [sizeFilter, setSizeFilter] = useState<"all" | "small" | "medium" | "large">("all")
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc")
      else if (sortDirection === "desc") {
        setSortDirection(null)
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary" />
    )
  }

  const filteredAndSortedPdfs = pdfs
    .filter((pdf) => {
      if (searchQuery && !pdf.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (statusFilter === "embedded" && !pdf.isEmbedded) return false
      if (statusFilter === "pending" && pdf.isEmbedded) return false
      if (sizeFilter !== "all") {
        const sizeMB = pdf.size / (1024 * 1024)
        if (sizeFilter === "small" && sizeMB >= 2) return false
        if (sizeFilter === "medium" && (sizeMB < 2 || sizeMB >= 5)) return false
        if (sizeFilter === "large" && sizeMB < 5) return false
      }
      return true
    })
    .sort((a, b) => {
      if (!sortField || !sortDirection) return 0
      let cmp = 0
      if (sortField === "name") cmp = a.name.localeCompare(b.name)
      else if (sortField === "size") cmp = a.size - b.size
      else if (sortField === "uploadedAt") cmp = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      return sortDirection === "asc" ? cmp : -cmp
    })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search PDFs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: typeof statusFilter) => setStatusFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="embedded">Embedded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sizeFilter} onValueChange={(v: typeof sizeFilter) => setSizeFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="small">Small (&lt;2MB)</SelectItem>
                <SelectItem value="medium">Medium (2-5MB)</SelectItem>
                <SelectItem value="large">Large (&gt;5MB)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="block lg:hidden space-y-3">
        {filteredAndSortedPdfs.length > 0 ? (
          filteredAndSortedPdfs.map((pdf) => (
            <Card key={pdf.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-medium wrap-break-word">{pdf.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pdf.pages} pages • {pdf.chunks} chunks
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatFileSize(pdf.size)}</span> • <span>{formatDate(pdf.uploadedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      {pdf.isEmbedded ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Embedded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          <XCircle className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/pdfs/${pdf.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">No PDFs found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto w-full">
        <table className="w-full min-w-175">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4">
                <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="h-8 -ml-3">
                  PDF Name <SortIcon field="name" />
                </Button>
              </th>
              <th className="text-left p-4">
                <Button variant="ghost" size="sm" onClick={() => handleSort("size")} className="h-8 -ml-3">
                  Size <SortIcon field="size" />
                </Button>
              </th>
              <th className="text-left p-4">
                <Button variant="ghost" size="sm" onClick={() => handleSort("uploadedAt")} className="h-8 -ml-3">
                  Uploaded <SortIcon field="uploadedAt" />
                </Button>
              </th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPdfs.map((pdf) => (
              <tr key={pdf.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{truncateName(pdf.name, 13)}</p>
                      <p className="text-xs text-muted-foreground">
                        {pdf.pages} pages • {pdf.chunks} chunks
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">{formatFileSize(pdf.size)}</td>
                <td className="p-4">{formatDate(pdf.uploadedAt)}</td>
                <td className="p-4">
                  {pdf.isEmbedded ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      Embedded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <XCircle className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/pdfs/${pdf.id}`}>View Details</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {filteredAndSortedPdfs.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground">No PDFs found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
