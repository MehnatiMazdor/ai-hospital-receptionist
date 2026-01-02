// File: /components/chat/TypingIndicator.tsx
// ===================================
"use client";

import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-blue-600">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
        <div className="flex gap-1 py-1">
          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}