// File: /components/chat/ErrorMessage.tsx
// ===================================
"use client";

import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  error: string;
}

export default function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-red-100">
        <AlertCircle className="w-4 h-4 text-red-600" />
      </div>
      <div className="flex-1 px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-red-50 text-red-800 border border-red-200">
        {error}
      </div>
    </div>
  );
}