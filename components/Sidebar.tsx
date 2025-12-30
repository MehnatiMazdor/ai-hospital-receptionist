'use client';

import { Bot, Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/provider/ChatContext";

interface SidebarProps {
  sessionId: string | undefined;
  handleNewChat: () => void;
  handleSelectSession: (id: string) => void;
}

export default function Sidebar({ sessionId, handleNewChat, handleSelectSession }: SidebarProps) {
  const context = useChat();

  return (
    <aside
      className={cn(
        "sidebar fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out flex flex-col",
        context.sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Sidebar Header */}
      <div className="h-14 border-b px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-slate-900">
            CityCare AI
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden rounded-full"
          onClick={() => context.setSidebarOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3 border-b">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Recent Chats */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
          Recent Chats
        </div>
        <div className="space-y-1">
          {context.recentSessions.map((session) => (
            <button
              key={session.id}
              className={cn(
                "w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors group",
                sessionId === session.id && "bg-blue-50 hover:bg-blue-50"
              )}
              onClick={() => handleSelectSession(session.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {session.title || `Chat ${session.id.slice(-4)}`}
                  </div>
                  <div className="text-xs text-slate-500">
                    {session.message_count} messages
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t">
        <Link href="/">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </aside>
  );
}