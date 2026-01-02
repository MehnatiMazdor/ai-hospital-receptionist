// File: /components/chat/MessageBubble.tsx
// ===================================
"use client";

import { User, Bot } from "lucide-react";
import { Message } from "@/provider/ChatContext";
import SourceReferences from "./SourceReferences";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isInitial = "isInitial" in message && message.isInitial;
  const timestamp = new Date(message.created_at);

  return (
    <div className="space-y-2.5">
      {/* User message */}
      {!isInitial && (
        <div className="flex items-end gap-2 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-slate-200">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-blue-600 text-white rounded-br-none">
            {message.query}
            <div className="text-[10px] mt-1 opacity-50 text-right">
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      )}

      {/* Assistant message */}
      {(isInitial || message.response) && (
        <div className="flex items-start gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm bg-blue-600">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col gap-2 max-w-[85%]">
            <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
              {isInitial ? message.query : message.response}
              <div className="text-[10px] mt-1 opacity-50 text-left">
                {timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {/* Source References */}
            {!isInitial && message.context_used && (
              <SourceReferences sources={message.context_used} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}