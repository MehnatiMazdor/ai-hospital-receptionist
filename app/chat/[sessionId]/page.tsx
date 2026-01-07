// /chat/[sessionId]
"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChat } from "@/provider/ChatContext";
import {
  Bot,
  Send,
  Menu,
  RefreshCw,
  X,
  User,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message } from "@/provider/ChatContext";

export default function ChatDetailPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();

  console.log("[CHAT_UI] Render ChatDetailPage", { sessionId });

  const {
    getChatMessagesById,
    messages,
    isAssistantTyping,
    input,
    handleNewChat,
    setSidebarOpen,
    error,
    setInput,
    loadingMessages,
    setMessages,
    setIsAssistantTyping,
    setError,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [streamProgress, setStreamProgress] = useState("");

  /* ───────────── SESSION BOOTSTRAP ───────────── */
  useEffect(() => {
    if (!sessionId) return;

    console.log("[CHAT_UI] Session effect triggered", sessionId);

    const rawData = sessionStorage.getItem(`pending_msg_${sessionId}`);

    if (rawData) {
      console.log("[CHAT_UI] First message detected → SSE start");

      const pendingMsg = JSON.parse(rawData);

      setMessages([pendingMsg]);
      setIsAssistantTyping(true);
      setStreamProgress("Connecting...");

      console.time("[CHAT_UI] FIRST_MESSAGE_STREAM");
      handleStreamingQuery(pendingMsg.content, sessionId, true);

      sessionStorage.removeItem(`pending_msg_${sessionId}`);
    } else {
      console.log("[CHAT_UI] Existing session → loading messages");
      getChatMessagesById(sessionId);
    }
  }, [sessionId]);

  /* ───────────── AUTO SCROLL ───────────── */
  useEffect(() => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: messages.length <= 1 ? "auto" : "smooth",
    });
  }, [messages, isAssistantTyping]);

  /* ───────────── SSE STREAM HANDLER ───────────── */
  const handleStreamingQuery = async (
    content: string,
    chatSessionId: string,
    isFirstMessage: boolean = false
  ) => {
    console.log("[CHAT_UI] Starting streaming query", {
      chatSessionId,
      isFirstMessage,
      contentLength: content.length,
    });

    try {
      console.time("[CHAT_UI] SSE_CONNECTION");

      const response = await fetch("/api/chat/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          chatSessionId,
          isFirstMessage,
        }),
      });

      if (!response.ok) {
        console.error("[CHAT_UI] SSE HTTP error", response.status);
        throw new Error(`HTTP ${response.status}`);
      }

      console.timeEnd("[CHAT_UI] SSE_CONNECTION");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.error("[CHAT_UI] No readable stream");
        throw new Error("No response body");
      }

      let assistantMessageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[CHAT_UI] SSE stream closed");
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("event:")) continue;

          const eventType = line.replace("event:", "").trim();
          const nextLine = lines[lines.indexOf(line) + 1];

          if (!nextLine?.startsWith("data:")) continue;

          const data = JSON.parse(nextLine.replace("data:", "").trim());

          console.log("[CHAT_UI] SSE event:", eventType, data);

          switch (eventType) {
            case "progress":
              setStreamProgress(data.message);
              break;

            case "assistant_response":
              if (!assistantMessageAdded) {
                console.log("[CHAT_UI] Assistant message received");

                const assistantMsg: Message = {
                  id: `temp-assistant-${Date.now()}`,
                  chat_session_id: chatSessionId,
                  role: "assistant",
                  content_text: data.content_text,
                  content_json: data.content_json || [],
                  context_used: data.context_used || [],
                  created_at: new Date().toISOString(),
                };

                setMessages((prev) => [...prev, assistantMsg]);
                assistantMessageAdded = true;
                setIsAssistantTyping(false);
                setStreamProgress("");
              }
              break;

            case "complete":
              console.log("[CHAT_UI] SSE completed");
              console.timeEnd("[CHAT_UI] FIRST_MESSAGE_STREAM");
              setIsAssistantTyping(false);
              setStreamProgress("");
              break;

            case "error":
              console.error("[CHAT_UI] SSE error event", data);
              setError(data.message);
              setIsAssistantTyping(false);
              setStreamProgress("");
              break;
          }
        }
      }
    } catch (err) {
      console.error("[CHAT_UI] Streaming failure", err);
      setError("Failed to connect to chat service");
      setIsAssistantTyping(false);
      setStreamProgress("");
    }
  };

  /* ───────────── SEND MESSAGE ───────────── */
  const handleSendInExistingChat = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isAssistantTyping) {
      console.warn("[CHAT_UI] Send blocked", {
        empty: !input.trim(),
        isAssistantTyping,
      });
      return;
    }

    const userContent = input.trim();

    console.log("[CHAT_UI] Sending message", userContent);

    const optimisticUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      chat_session_id: sessionId,
      role: "user",
      content_text: userContent,
      content_json: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInput("");
    setIsAssistantTyping(true);
    setError(null);

    await handleStreamingQuery(userContent, sessionId, false);
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
            onClick={() => setSidebarOpen(true)}
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
            onClick={() => handleNewChat()}
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
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {loadingMessages && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading messages...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg: Message, index) => {
                const timestamp = new Date(msg.created_at);
                const isUser = msg.role === "user";
                const isAssistant = msg.role === "assistant";

                // User Message
                if (isUser) {
                  return (
                    <div
                      key={msg.id || index}
                      className="flex items-end gap-2 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-slate-200">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-blue-600 text-white rounded-br-none">
                        <p>{msg.content_text}</p>
                        <div className="text-[10px] mt-1 opacity-50 text-right">
                          {timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Assistant Message
                if (isAssistant) {
                  const suggestions = Array.isArray(msg.content_json)
                    ? msg.content_json
                    : [];

                  return (
                    <div
                      key={msg.id || index}
                      className="flex items-start gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm bg-blue-600">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col gap-2 max-w-[85%]">
                        <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
                          <p>{msg.content_text}</p>

                          {suggestions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[11px] text-slate-500 mb-1">
                                Suggested questions:
                              </p>
                              <ol className="list-decimal list-inside space-y-1">
                                {suggestions.map((q: string, i: number) => (
                                  <li key={i}>
                                    <button
                                      type="button"
                                      onClick={() => setInput(q)}
                                      className="text-blue-600 text-xs hover:underline text-left"
                                    >
                                      {q}
                                    </button>
                                  </li>
                                ))}
                              </ol>
                              <p className="mt-1 text-[10px] text-slate-400">
                                AI-generated suggestions may not guarantee exact
                                RAG coverage.
                              </p>
                            </div>
                          )}

                          <div className="text-[10px] mt-1 opacity-50 text-left">
                            {timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        {/* Source References */}
                        {msg.context_used && msg.context_used.length > 0 && (
                          <div className="px-2.5 py-1.5 rounded-lg bg-blue-50/50 border border-blue-100 text-xs">
                            <div className="flex items-center gap-1.5 text-blue-700 font-medium mb-1">
                              <FileText className="w-3 h-3" />
                              <span>Sources ({msg.context_used.length})</span>
                            </div>
                            <div className="space-y-1">
                              {msg.context_used.map(
                                (source: any, idx: number) => {
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
                                          style={{
                                            width: `${scorePercent}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              {/* Typing indicator with progress */}
              {isAssistantTyping && (
                <div className="flex items-end gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-blue-600">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 py-1">
                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      {streamProgress && (
                        <span className="text-xs text-slate-500">
                          {streamProgress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-red-100">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-red-50 text-red-800 border border-red-200">
                    {error}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t sticky bottom-0">
        <div className="max-w-2xl mx-auto space-y-4">
          <form
            onSubmit={handleSendInExistingChat}
            className="relative flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendInExistingChat();
                }
              }}
              placeholder="Type your message..."
              disabled={isAssistantTyping || loadingMessages}
              className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-xl h-11 w-11 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
              disabled={!input.trim() || isAssistantTyping || loadingMessages}
            >
              <Send className="w-5 h-5" />
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
