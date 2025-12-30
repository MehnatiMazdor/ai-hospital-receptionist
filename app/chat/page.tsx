// /chat/page.tsx
"use client";

import type React from "react";
import { useRef, useEffect } from "react";
import {
  User,
  Bot,
  RefreshCw,
  X,
  Menu,
  FileText,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useChat, INITIAL_MESSAGE } from "@/provider/ChatContext";
import Sidebar from "../../components/Sidebar";
import InputArea from "../../components/InputArea";
import { useAuth } from "@/provider/AuthContext";

export default function ChatPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();

  const { initialLoading } = useAuth();
  const context = useChat();

  const displayMessages = sessionId && context.messages.length > 0 ? context.messages : [INITIAL_MESSAGE];

  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle Session change (Route Change)
  useEffect(() => {
    context.loadSessionData(sessionId);
  }, [sessionId, context.loadSessionData]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: context.messages.length <= 1 ? "auto" : "smooth",
      });
    }
  }, [context.messages, context.isTyping, context.loadingMessages]);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        context.sidebarOpen &&
        !target.closest(".sidebar") &&
        !target.closest(".menu-button")
      ) {
        context.setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [context.sidebarOpen, context.setSidebarOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await context.handleSend(context.input, sessionId, router);
  };

  const handleNewChat = () => {
    context.handleNewChat(router, sessionId);
  };

  const handleSelectSession = (id: string) => {
    context.handleSelectSession(id, router, sessionId);
  };

  // Only show full page loader on initial auth load
  if (initialLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Bot className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh bg-slate-50 font-sans relative">
      <Sidebar sessionId={sessionId} handleNewChat={handleNewChat} handleSelectSession={handleSelectSession} />

      {/* Overlay for mobile */}
      {context.sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => context.setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="menu-button rounded-full lg:hidden"
              onClick={() => context.setSidebarOpen(true)}
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
              onClick={handleNewChat}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Link href="/" className="hidden lg:block">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Messages Area */}
        <div
          ref={scrollRef}
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
              <>
                {displayMessages.map((msg, index) => {
                  const isInitial = "isInitial" in msg && msg.isInitial;
                  const timestamp = new Date(msg.created_at);

                  return (
                    <div key={isInitial ? "initial" : msg.id || index} className="space-y-2.5">
                      {/* User message */}
                      {!isInitial && (
                        <div className="flex items-end gap-2 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-slate-200">
                            <User className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-blue-600 text-white rounded-br-none">
                            {msg.query}
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
                      {(isInitial || msg.response) && (
                        <div className="flex items-start gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm bg-blue-600">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex flex-col gap-2 max-w-[85%]">
                            <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
                              {isInitial ? msg.query : msg.response}
                              <div className="text-[10px] mt-1 opacity-50 text-left">
                                {timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>

                            {/* Source References */}
                            {!isInitial &&
                              msg.context_used &&
                              Array.isArray(msg.context_used) &&
                              msg.context_used.length > 0 && (
                                <div className="px-2.5 py-1.5 rounded-lg bg-blue-50/50 border border-blue-100 text-xs">
                                  <div className="flex items-center gap-1.5 text-blue-700 font-medium mb-1">
                                    <FileText className="w-3 h-3" />
                                    <span>
                                      Sources ({msg.context_used.length})
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    {msg.context_used.map(
                                      (source: any, idx: number) => (
                                        <div
                                          key={source.id || idx}
                                          className="flex items-center gap-2 text-slate-600"
                                        >
                                          <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium shrink-0 text-blue-700">
                                            {idx + 1}
                                          </span>
                                          <span className="truncate">
                                            Score:{" "}
                                            {(source.score * 100).toFixed(1)}%
                                            {source.page &&
                                              ` • Page ${source.page}`}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {context.isTyping && (
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
              </>
            )}
          </div>
        </div>

        <InputArea handleSend={handleSend} displayMessages={displayMessages} />
      </div>
    </div>
  );
}
