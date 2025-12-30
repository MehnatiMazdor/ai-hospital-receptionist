"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UploadProgress } from "@/components/UploadProgress"
import { cn } from "@/lib/utils"

type ProcessStep = {
  label: string
  status: "pending" | "processing" | "completed" | "error"
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [steps, setSteps] = useState<ProcessStep[]>([
    { label: "Upload PDF to server", status: "pending" },
    { label: "Store PDF in database", status: "pending" },
    { label: "Extract pages from document", status: "pending" },
    { label: "Chunk document content", status: "pending" },
    { label: "Generate embeddings", status: "pending" },
    { label: "Store vectors in Pinecone", status: "pending" },
  ])

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (file.type !== "application/pdf") {
      return { valid: false, error: "Only PDF files are allowed" }
    }

    // Check file size (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { valid: false, error: "File size must be less than 10MB" }
    }

    return { valid: true }
  }

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      setErrorMessage(validation.error || "Invalid file")
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setErrorMessage("")
    setUploadStatus("idle")
    // Reset steps
    setSteps(steps.map((step) => ({ ...step, status: "pending" })))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [])

  const simulateUploadProcess = async () => {
    // Step 1: Upload PDF (0-20%)
    setSteps((prev) => prev.map((step, i) => (i === 0 ? { ...step, status: "processing" } : step)))

    for (let i = 0; i <= 100; i += 5) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      setUploadProgress(i)
    }

    setSteps((prev) => prev.map((step, i) => (i === 0 ? { ...step, status: "completed" } : step)))

    // Step 2: Store in database
    setSteps((prev) => prev.map((step, i) => (i === 1 ? { ...step, status: "processing" } : step)))
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSteps((prev) => prev.map((step, i) => (i === 1 ? { ...step, status: "completed" } : step)))

    // Step 3: Extract pages
    setSteps((prev) => prev.map((step, i) => (i === 2 ? { ...step, status: "processing" } : step)))
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setSteps((prev) => prev.map((step, i) => (i === 2 ? { ...step, status: "completed" } : step)))

    // Step 4: Chunk content
    setSteps((prev) => prev.map((step, i) => (i === 3 ? { ...step, status: "processing" } : step)))
    await new Promise((resolve) => setTimeout(resolve, 2500))
    setSteps((prev) => prev.map((step, i) => (i === 3 ? { ...step, status: "completed" } : step)))

    // Step 5: Generate embeddings
    setSteps((prev) => prev.map((step, i) => (i === 4 ? { ...step, status: "processing" } : step)))
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setSteps((prev) => prev.map((step, i) => (i === 4 ? { ...step, status: "completed" } : step)))

    // Step 6: Store in Pinecone
    setSteps((prev) => prev.map((step, i) => (i === 5 ? { ...step, status: "processing" } : step)))
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setSteps((prev) => prev.map((step, i) => (i === 5 ? { ...step, status: "completed" } : step)))
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadStatus("idle")
    setUploadProgress(0)

    try {
      // TODO: Replace with actual backend API call
      // const formData = new FormData()
      // formData.append('file', selectedFile)
      // const response = await fetch('/api/upload-pdf', {
      //   method: 'POST',
      //   body: formData,
      // })

      // Simulate the upload process
      await simulateUploadProcess()

      // TODO: Handle actual response
      // if (!response.ok) throw new Error('Upload failed')

      setUploadStatus("success")
      setIsUploading(false)

      // Redirect after success
      setTimeout(() => {
        router.push("/dashboard/pdfs")
      }, 2000)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setUploadStatus("error")
      setErrorMessage("Failed to upload and process PDF. Please try again.")
      setIsUploading(false)
      setSteps((prev) => prev.map((step) => (step.status === "processing" ? { ...step, status: "error" } : step)))
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload PDF</h1>
        <p className="text-muted-foreground">
          Upload medical documents to be processed and embedded into your knowledge base
        </p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select PDF File</CardTitle>
          <CardDescription>Maximum file size: 10MB. Only PDF format is supported.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer",
              isDragging && "border-primary bg-primary/5",
              !isDragging && "border-border hover:border-primary/50 hover:bg-muted/50",
              isUploading && "pointer-events-none opacity-60",
            )}
          >
            <Upload className={cn("h-12 w-12 mb-4", isDragging ? "text-primary" : "text-muted-foreground")} />
            <p className="text-sm font-medium mb-1">
              {isDragging ? "Drop your PDF here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground">PDF files only, up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    setUploadStatus("idle")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && uploadStatus !== "success" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {uploadStatus === "success" && (
            <Alert className="border-success/50 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                PDF successfully uploaded and embedded! Redirecting to PDF list...
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <UploadProgress steps={steps} uploadProgress={uploadProgress} />
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="flex-1" size="lg">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload and Process
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")} disabled={isUploading} size="lg">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-base">Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When you upload a PDF, it goes through a multi-step process: the file is uploaded to our servers, stored in
            the database, pages are extracted, content is chunked into meaningful segments, embeddings are generated
            using AI, and finally stored in Pinecone vector database for semantic search.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
