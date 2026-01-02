// File: /components/chat/ChatHeader.tsx
// ===================================
"use client";

import { Bot, RefreshCw, X, Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onNewChat: () => void;
  onMenuClick: () => void;
}

export default function ChatHeader({ onNewChat, onMenuClick }: ChatHeaderProps) {
  return (
    <header className="bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="menu-button rounded-full lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center lg:hidden">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">
              CityCare AI
            </h1>
            <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-slate-400"
          onClick={onNewChat}
          title="New chat"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Link href="/" className="hidden lg:block">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-400"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
