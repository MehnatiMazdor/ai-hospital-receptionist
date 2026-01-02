// File: /components/chat/SourceReferences.tsx
// ===================================
"use client";

import { FileText } from "lucide-react";

interface Source {
  id?: string;
  score: number;
  page?: number;
}

interface SourceReferencesProps {
  sources: Source[];
}

export default function SourceReferences({ sources }: SourceReferencesProps) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  return (
    <div className="px-2.5 py-1.5 rounded-lg bg-blue-50/50 border border-blue-100 text-xs">
      <div className="flex items-center gap-1.5 text-blue-700 font-medium mb-1">
        <FileText className="w-3 h-3" />
        <span>Sources ({sources.length})</span>
      </div>
      <div className="space-y-1">
        {sources.map((source, idx) => {
          const scorePercent = source.score * 100;
          const barColor =
            scorePercent >= 60
              ? "bg-green-500"
              : scorePercent >= 40
              ? "bg-yellow-500"
              : "bg-red-500";

          return (
            <div
              key={source.id || idx}
              className="flex items-center gap-3 text-slate-600"
            >
              <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium shrink-0 text-blue-700">
                {idx + 1}
              </span>
              <span className="text-xs whitespace-nowrap">
                {scorePercent.toFixed(1)}%
                {source.page && ` • Page ${source.page}`}
              </span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-300`}
                  style={{ width: `${scorePercent}%` }}
                  title={`Match confidence: ${scorePercent.toFixed(1)}%`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}