"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, Menu, RefreshCw, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/provider/ChatContext";
import { Message } from "@/provider/ChatContext";

const SUGGESTIONS = [
  "What are your working hours?",
  "Where is the hospital located?",
  "How do I book an appointment?",
  "Tell me about your emergency services.",
];

export default function EmptyChatPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setMessages, setIsAssistantTyping } = useChat();

  const handleSendFirstChatMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const content = input.trim();

    // Create optimistic user message
    const optimisticUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      chat_session_id: "temp",
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    // Add user message immediately to UI
    setMessages([optimisticUserMessage]);
    setInput("");
    setIsLoading(true);
    setIsAssistantTyping(true);
    setError(null);

    try {
      // Create chat session and insert user message
      const res = await fetch("/api/chat/first-chat-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok || !data.chatSessionId) {
        throw new Error(data.error || "Failed to start chat");
      }

      // Store the session ID to indicate this is a pending first response
      sessionStorage.setItem("pendingChatSessionId", data.chatSessionId);
      sessionStorage.setItem("pendingMessageContent", content)

      // Dispatch event to refresh sidebar
      window.dispatchEvent(new Event("chatCreated"));

      // Navigate to the chat page immediately
      router.replace(`/chat/${data.chatSessionId}`);

      // The assistant response will be handled by the ChatDetailPage
      // through the pendingFirstMessage mechanism
    } catch (err) {
      console.error("Error starting chat:", err);
      setError("Network error. Please try again.");
      setMessages([]);
      setIsAssistantTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setIsAssistantTyping(false);
    router.replace("/chat");
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 h-dvh">
      {/* Header */}
      <header className="bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="menu-button rounded-full lg:hidden"
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
            title="New chat"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <a href="/" className="hidden lg:block">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-slate-400"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </a>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <p className="text-lg font-semibold text-slate-900">
            Hi! How can I help you with CityCare AI Assistant?
          </p>
          <p className="text-sm text-slate-500">
            You can ask anything about our hospital, services, or appointments.
          </p>

          {error && (
            <div className="flex items-center gap-2 justify-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t sticky bottom-0">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
            {SUGGESTIONS.map((text) => (
              <button
                key={text}
                onClick={() => setInput(text)}
                className="whitespace-nowrap px-4 py-2 rounded-full border bg-white text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors shrink-0"
              >
                {text}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSendFirstChatMessage}
            className="relative flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendFirstChatMessage();
                }
              }}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-xl h-11 w-11 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Bot className="w-5 h-5 animate-spin text-white" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>

          <p className="text-[10px] text-center text-slate-400">
            CityCare AI may provide general info. For emergencies, call 911.
          </p>
        </div>
      </div>
    </div>
  );
}