'use client';

import { User, Bot, AlertCircle } from "lucide-react";
import { useChat, INITIAL_MESSAGE } from "@/provider/ChatContext";
import { useParams } from "next/navigation";

export default function MessagesArea() {
  const context = useChat();
  const { sessionId } = useParams<{ sessionId: string }>();

  const displayMessages = sessionId && context.messages.length > 0 ? context.messages : [INITIAL_MESSAGE];

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Show inline loader when loading messages */}
        {context.loadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading messages...</p>
            </div>
          </div>
        ) : (
          displayMessages.map((message) => (
            <div key={message.id} className="space-y-4">
              {/* User Message */}
              {message.query && (
                <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-600">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-blue-600 text-white">
                    {message.query}
                  </div>
                </div>
              )}

              {/* AI Response */}
              {message.response && (
                <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-100">
                    <Bot className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-slate-100 text-slate-800">
                    {message.response}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Error message */}
        {context.error && (
          <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-red-100">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1 px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-red-50 text-red-800 border border-red-200">
              {context.error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}