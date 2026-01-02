// File: /components/chat/ChatInterface.tsx
"use client";

import type React from "react";
import { useRef, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChat, INITIAL_MESSAGE } from "@/provider/ChatContext";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import InputArea from "@/components/InputArea";
import { Bot } from "lucide-react";

export default function ChatInterface() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId?: string }>();
  const context = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize display messages to prevent unnecessary recalculations
  const displayMessages = useMemo(() => {
    if (sessionId && context.messages.length > 0) {
      return context.messages;
    }
    return [INITIAL_MESSAGE];
  }, [sessionId, context.messages]);

  // Handle session change (route change)
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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await context.handleSend(context.input, sessionId, router);
  };

  const handleNewChat = () => {
    context.handleNewChat(router, sessionId);
  };

  // Show full page loader only on initial auth load
  if (context.initialLoading) {
    return <ChatLoadingScreen />;
  }

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <ChatHeader 
        onNewChat={handleNewChat}
        onMenuClick={() => context.setSidebarOpen(true)}
      />

      <MessageList
        ref={scrollRef}
        messages={displayMessages}
        isLoading={context.loadingMessages}
        isTyping={context.isTyping}
        error={context.error}
      />

      <InputArea 
        handleSend={handleSend} 
        displayMessages={displayMessages} 
      />
    </div>
  );
}

function ChatLoadingScreen() {
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
