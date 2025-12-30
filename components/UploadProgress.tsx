"use client"

import { CheckCircle2, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProcessStep {
  label: string
  status: "pending" | "processing" | "completed" | "error"
}

interface UploadProgressProps {
  steps: ProcessStep[]
  uploadProgress: number
}

export function UploadProgress({ steps, uploadProgress }: UploadProgressProps) {
  return (
    <div className="space-y-6">
      {/* Upload Progress Bar */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Uploading...</span>
            <span className="text-muted-foreground">{uploadProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {step.status === "completed" && <CheckCircle2 className="h-5 w-5 text-success" />}
              {step.status === "processing" && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
              {step.status === "error" && <Circle className="h-5 w-5 text-destructive" />}
              {step.status === "pending" && <Circle className="h-5 w-5 text-muted-foreground/30" />}
            </div>
            <div className="flex-1 space-y-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.status === "completed" && "text-success",
                  step.status === "processing" && "text-primary",
                  step.status === "error" && "text-destructive",
                  step.status === "pending" && "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              {step.status === "processing" && <p className="text-xs text-muted-foreground">In progress...</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
