"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadProgress } from "@/components/UploadProgress";
import { cn } from "@/lib/utils";

type ProcessStep = {
  label: string;
  status: "pending" | "processing" | "completed" | "error";
};

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [steps, setSteps] = useState<ProcessStep[]>([
    { label: "Upload PDF to server", status: "pending" },
    { label: "Extract pages from document", status: "pending" },
    { label: "Chunk document content", status: "pending" },
    { label: "Generate embeddings", status: "pending" },
    { label: "Store vectors in Pinecone", status: "pending" },
    { label: "Store PDF metadata in database", status: "pending" },
  ]);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.type !== "application/pdf") {
      return { valid: false, error: "Only PDF files are allowed" };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: "File size must be less than 10MB" };
    }

    return { valid: true };
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Invalid file");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");
    setUploadStatus("idle");
    setSteps(steps.map((step) => ({ ...step, status: "pending" })));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const updateStepStatus = (
    stepIndex: number,
    status: ProcessStep["status"]
  ) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === stepIndex ? { ...step, status } : step))
    );
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus("idle");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("pdfFile", selectedFile);

      // Use fetch with streaming response
      const response = await fetch("/api/dashboard/pdfs", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            const eventMatch = line.match(/event: (\w+)/);
            const dataMatch = line.match(/data: (.+)/);

            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1];
              const data = JSON.parse(dataMatch[1]);

              if (eventType === "progress") {
                const { step, status, message, metadata } = data;

                // Update specific step status
                if (status === "processing") {
                  updateStepStatus(step - 1, "processing");
                } else if (status === "completed") {
                  updateStepStatus(step - 1, "completed");
                }

                // Update progress bar (simulate based on step)
                const progressPercentage = (step / 6) * 100;
                setUploadProgress(Math.min(progressPercentage, 100));

                console.log(`Step ${step}: ${message}`, metadata);
              } else if (eventType === "complete") {
                setUploadStatus("success");
                setUploadProgress(100);
                setIsUploading(false);

                console.log("Upload complete:", data);

                // Redirect after success
                setTimeout(() => {
                  router.push("/dashboard/pdfs");
                }, 2000);
              } else if (eventType === "error") {
                throw new Error(data.message);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload and process PDF. Please try again."
      );
      setIsUploading(false);
      setSteps((prev) =>
        prev.map((step) =>
          step.status === "processing" ? { ...step, status: "error" } : step
        )
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b pb-4 -mx-6 px-6 -mt-6 pt-6 mb-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Upload PDF
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Upload medical documents to be processed and embedded into your
            knowledge base
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Select PDF File</CardTitle>
          <CardDescription>
            Maximum file size: 10MB. Only PDF format is supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer",
              isDragging && "border-primary bg-primary/5",
              !isDragging &&
                "border-border hover:border-primary/50 hover:bg-muted/50",
              isUploading && "pointer-events-none opacity-60"
            )}
          >
            <Upload
              className={cn(
                "h-12 w-12 mb-4",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
            <p className="text-sm font-medium mb-1">
              {isDragging
                ? "Drop your PDF here"
                : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF files only, up to 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setUploadStatus("idle");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {errorMessage && uploadStatus !== "success" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {uploadStatus === "success" && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                PDF successfully uploaded and embedded! Redirecting to PDF
                list...
              </AlertDescription>
            </Alert>
          )}

          {isUploading && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <UploadProgress steps={steps} uploadProgress={uploadProgress} />
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
              size="lg"
            >
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
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              disabled={isUploading}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-base">Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When you upload a PDF, it goes through a secure multi-step process:
            the file is uploaded to cloud storage, pages are extracted, content
            is chunked into meaningful segments, embeddings are generated using
            AI, vectors are stored in Pinecone, and finally metadata is saved to
            the database. If any step fails, all previous changes are
            automatically rolled back to maintain data consistency.
          </p>
        </CardContent>
      </Card>
    </div>
  );
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
  );
}
