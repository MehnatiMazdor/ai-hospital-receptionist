// // /chat/[sessionId]

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
import { Message } from "@/types/chat";
import { parseMessageContent } from "@/lib/parseMessageContent";

export default function ChatDetailPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const {
    getChatMessagesById,
    messages,
    isAssistantTyping,
    input,
    handleSend,
    initialLoading,
    handleNewChat,
    setSidebarOpen,
    error,
    setInput,
    loadingMessages,
    setMessages,
    setIsAssistantTyping,
  } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isLoadingFirstResponse, setIsLoadingFirstResponse] = useState(false);

  // Load session data when sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    const pendingSessionId = sessionStorage.getItem("pendingChatSessionId");
    const pendingFirstMessage = sessionStorage.getItem("pendingMessageContent");

    console.log("pendingSessionId is:", pendingSessionId);

    if (pendingSessionId === sessionId) {
      console.log("I am rendered in if block of useeffect pendingSessionId")
      // This is a new chat - show typing indicator and fetch first response
      setIsLoadingFirstResponse(true);
      setIsAssistantTyping(true);

      fetch("/api/chat/first-chat-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatSessionId: sessionId,
          content: pendingFirstMessage,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.assistantMessage) {
            console.log(
              "Received first assistantMessage response:",
              data.assistantMessage
            );
            // API already returns parsed content, so we can use it directly
            setMessages((prev) => [...prev, data.assistantMessage]);
          }
          // Clean up session storage
          sessionStorage.removeItem("pendingChatSessionId");
          sessionStorage.removeItem("pendingMessageContent");
        })
        .catch((err) => {
          console.error("Error fetching first response:", err);
        })
        .finally(() => {
          setIsLoadingFirstResponse(false);
          setIsAssistantTyping(false);
        });
    } else {
      // Existing chat - load all messages normally
      // getChatMessagesById handles parsing internally
      console.log("I am rendered in else block of useeffect getChatMessageById")
      getChatMessagesById(sessionId);
    }
  }, [sessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: messages.length <= 1 ? "auto" : "smooth",
      });
    }
  }, [messages, isAssistantTyping]);

  // Handle sending a message
  const handleSendInExistingChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    await handleSend(input, sessionId, router);
  };

  // Show full page loader only on initial auth load
  // if (initialLoading) {
  //   return (
  //     <div className="flex h-dvh items-center justify-center bg-slate-50">
  //       <div className="text-center">
  //         <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
  //           <Bot className="w-6 h-6 text-white animate-pulse" />
  //         </div>
  //         <p className="text-slate-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

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
            onClick={() => handleNewChat(router, sessionId)}
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
          {/* Loading spinner when fetching messages */}
          {(loadingMessages || isLoadingFirstResponse) &&
          messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading messages...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Display all messages from the conversation */}
              {messages.map((msg: Message, index) => {
                const timestamp = new Date(msg.created_at);
                const isUser = msg.role === "user";
                const isAssistant = msg.role === "assistant";

                // User Message - content is always a plain string
                if (isUser) {
                  // Ensure we're rendering a string
                  const userContent =
                    typeof msg.content === "string"
                      ? msg.content
                      : JSON.stringify(msg.content);
                  return (
                    <div
                      key={msg.id || index}
                      className="flex items-end gap-2 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-slate-200">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-blue-600 text-white rounded-br-none">
                        <p>{userContent}</p>
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

                // Assistant Message - content is now always an object {answer, suggestions}
                // after being parsed in getChatMessagesById or coming from API
                if (isAssistant) {
                  // Use parseMessageContent as a safety fallback, but it should always
                  // receive an object at this point
                  const parsed = parseMessageContent(msg.content);

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
                          {parsed.type === "text" ? (
                            <p>{parsed.text}</p>
                          ) : (
                            <div className="space-y-2">
                              {/* Answer */}
                              <p>{parsed.answer}</p>

                              {/* Suggestions */}
                              {parsed.suggestions &&
                                parsed.suggestions.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-[11px] text-slate-500 mb-1">
                                      Suggested questions:
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1">
                                      {parsed.suggestions.map(
                                        (q: string, i: number) => (
                                          <li key={i}>
                                            <button
                                              type="button"
                                              onClick={() => setInput(q)}
                                              className="text-blue-600 text-xs hover:underline text-left wrap-break-word"
                                            >
                                              {q}
                                            </button>
                                          </li>
                                        )
                                      )}
                                    </ol>
                                    <p className="mt-1 text-[10px] text-slate-400">
                                      These are AI-generated suggestions and may
                                      not guarantee exact RAG coverage.
                                    </p>
                                  </div>
                                )}
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
                              {(() => {
                                let contextArray: any[] = [];
                                try {
                                  if (Array.isArray(msg.context_used))
                                    contextArray = msg.context_used;
                                  else if (typeof msg.context_used === "string")
                                    contextArray = JSON.parse(msg.context_used);
                                } catch {
                                  contextArray = [];
                                }
                                return contextArray.map(
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
                                          {source.page &&
                                            ` • Page ${source.page}`}
                                        </span>
                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full ${barColor} rounded-full transition-all duration-300`}
                                            style={{
                                              width: `${scorePercent}%`,
                                            }}
                                            title={`Match confidence: ${scorePercent.toFixed(
                                              1
                                            )}%`}
                                          />
                                        </div>
                                      </div>
                                    );
                                  }
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              {/* Typing indicator when assistant is responding */}
              {isAssistantTyping && (
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

// "use client";

// import { useRef, useEffect, useState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { useChat } from "@/provider/ChatContext";
// import {
//   Bot,
//   Send,
//   Menu,
//   RefreshCw,
//   X,
//   User,
//   AlertCircle,
//   FileText,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { AssistantMessage } from "@/components/AssistantMessage";
// import { Message } from "@/types/chat";
// import { parseMessageContent } from "@/lib/parseMessageContent";

// export default function ChatDetailPage() {
//   const router = useRouter();
//   const { sessionId } = useParams<{ sessionId: string }>();
//   const {
//     getChatMessagesById,
//     messages,
//     isAssistantTyping,
//     input,
//     handleSend,
//     initialLoading,
//     handleNewChat,
//     setSidebarOpen,
//     error,
//     setInput,
//     loadingMessages,
//     setMessages,
//     setIsAssistantTyping,
//   } = useChat();
//   const scrollRef = useRef<HTMLDivElement>(null);
//   const [isLoadingFirstResponse, setIsLoadingFirstResponse] = useState(false);

//   // Load session data when sessionId changes
//   useEffect(() => {
//     if (!sessionId) return;

//     const pendingSessionId = sessionStorage.getItem("pendingChatSessionId");
//     const pendingFirstMessage = sessionStorage.getItem("pendingMessageContent");

//     console.log("pendingSessionId is:", pendingSessionId);

//     if (pendingSessionId === sessionId) {
//       // This is a new chat - show typing indicator and fetch first response
//       setIsLoadingFirstResponse(true);
//       setIsAssistantTyping(true);

//       fetch("/api/chat/first-chat-response", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           chatSessionId: sessionId,
//           content: pendingFirstMessage,
//         }),
//       })
//         .then((res) => res.json())
//         .then((data) => {
//           if (data.assistantMessage) {
//             console.log(
//               "Recived first assistantMessage response:",
//               data.assistantMessage
//             );
//             setMessages((prev) => [...prev, data.assistantMessage]);
//           }
//           // Clean up session storage
//           sessionStorage.removeItem("pendingChatSessionId");
//         })
//         .catch((err) => {
//           console.error("Error fetching first response:", err);
//         })
//         .finally(() => {
//           setIsLoadingFirstResponse(false);
//           setIsAssistantTyping(false);
//         });
//     } else {
//       // Existing chat - load all messages normally
//       getChatMessagesById(sessionId);
//     }
//   }, [sessionId, getChatMessagesById, setMessages, setIsAssistantTyping]);

//   // Auto-scroll to bottom when messages change
//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTo({
//         top: scrollRef.current.scrollHeight,
//         behavior: messages.length <= 1 ? "auto" : "smooth",
//       });
//     }
//   }, [messages, isAssistantTyping]);

//   // Handle sending a message
//   const handleSendInExistingChat = async (e?: React.FormEvent) => {
//     e?.preventDefault();
//     if (!input.trim()) return;

//     await handleSend(input, sessionId, router);
//   };

//   // Show full page loader only on initial auth load
//   if (initialLoading) {
//     return (
//       <div className="flex h-dvh items-center justify-center bg-slate-50">
//         <div className="text-center">
//           <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
//             <Bot className="w-6 h-6 text-white animate-pulse" />
//           </div>
//           <p className="text-slate-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col flex-1 min-w-0 h-dvh">
//       {/* Header */}
//       <header className="bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-10">
//         <div className="flex items-center gap-3">
//           <Button
//             variant="ghost"
//             size="icon"
//             className="menu-button rounded-full lg:hidden"
//             onClick={() => setSidebarOpen(true)}
//           >
//             <Menu className="w-5 h-5 text-slate-600" />
//           </Button>
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center lg:hidden">
//               <Bot className="w-5 h-5 text-white" />
//             </div>
//             <div>
//               <h1 className="text-sm font-bold text-slate-900 leading-none">
//                 CityCare AI
//               </h1>
//               <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
//                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
//                 Online
//               </span>
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center gap-1">
//           <Button
//             variant="ghost"
//             size="icon"
//             className="rounded-full text-slate-400"
//             onClick={() => handleNewChat(router, sessionId)}
//             title="New chat"
//           >
//             <RefreshCw className="w-4 h-4" />
//           </Button>
//           <a href="/" className="hidden lg:block">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="rounded-full text-slate-400"
//               title="Close chat"
//             >
//               <X className="w-5 h-5" />
//             </Button>
//           </a>
//         </div>
//       </header>

//       {/* Messages Area */}
//       <div
//         ref={scrollRef}
//         className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
//       >
//         <div className="max-w-2xl mx-auto space-y-4">
//           {/* Loading spinner when fetching messages */}
//           {(loadingMessages || isLoadingFirstResponse) &&
//           messages.length === 0 ? (
//             <div className="flex items-center justify-center py-8">
//               <div className="text-center">
//                 <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
//                 <p className="text-sm text-slate-500">Loading messages...</p>
//               </div>
//             </div>
//           ) : (
//             <>
//               {/* Display all messages from the conversation */}
//               {messages.map((msg: Message, index) => {
//                 const timestamp = new Date(msg.created_at);
//                 const isUser = msg.role === "user";
//                 const isAssistant = msg.role === "assistant";

//                 // Helper to parse content
//                 const parsed = parseMessageContent(msg.content); // { type: "text", text: ""} or { answer: "", suggestions: ["", ""...]}

//                 // User Message
//                 if (isUser) {
//                   console.log("Inside isUser the content is string:", msg.content)
//                   return (
//                     <div
//                       key={msg.id || index}
//                       className="flex items-end gap-2 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300"
//                     >
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-slate-200">
//                         <User className="w-4 h-4 text-slate-600" />
//                       </div>
//                       <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-blue-600 text-white rounded-br-none">
//                         <p>
//                           {parsed.type === "text" ? parsed.text : parsed.answer}
//                         </p>
//                         {parsed.type === "structured" &&
//                           parsed.suggestions.length > 0 && (
//                             <div className="mt-2">
//                               <p className="text-[11px] text-slate-200 mb-1">
//                                 Suggested questions:
//                               </p>
//                               <ol className="list-decimal list-inside space-y-1">
//                                 {parsed.suggestions.map((q, i) => (
//                                   <li key={i}>
//                                     <button
//                                       type="button"
//                                       onClick={() => setInput(q)}
//                                       className="text-blue-200 text-xs hover:underline text-left wrap-break-word"
//                                     >
//                                       {q}
//                                     </button>
//                                   </li>
//                                 ))}
//                               </ol>
//                             </div>
//                           )}
//                         <div className="text-[10px] mt-1 opacity-50 text-right">
//                           {timestamp.toLocaleTimeString([], {
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 }

//                 // Assistant Message
//                 if (isAssistant) {
//                   console.log("parse content inside isAssistant is:", parsed)
//                   return (
//                     <div
//                       key={msg.id || index}
//                       className="flex items-start gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300"
//                     >
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm bg-blue-600">
//                         <Bot className="w-4 h-4 text-white" />
//                       </div>
//                       <div className="flex flex-col gap-2 max-w-[85%]">
//                         <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
//                           {parsed.type === "text" ? (
//                             <p>{parsed.text}</p>
//                           ) : (
//                             <div className="space-y-2">
//                               {/* Answer */}
//                               <p>{parsed.answer}</p>

//                               {/* Suggestions */}
//                               {parsed.suggestions.length > 0 && (
//                                 <div className="mt-2">
//                                   <p className="text-[11px] text-slate-500 mb-1">
//                                     Suggested questions:
//                                   </p>
//                                   <ol className="list-decimal list-inside space-y-1">
//                                     {parsed.suggestions.map((q:any, i: any) => (
//                                       <li key={i}>
//                                         <button
//                                           type="button"
//                                           onClick={() => setInput(q)}
//                                           className="text-blue-600 text-xs hover:underline text-left wrap-break-word"
//                                         >
//                                           {q}
//                                         </button>
//                                       </li>
//                                     ))}
//                                   </ol>
//                                   <p className="mt-1 text-[10px] text-slate-400">
//                                     These are AI-generated suggestions and may
//                                     not guarantee exact RAG coverage.
//                                   </p>
//                                 </div>
//                               )}
//                             </div>
//                           )}

//                           <div className="text-[10px] mt-1 opacity-50 text-left">
//                             {timestamp.toLocaleTimeString([], {
//                               hour: "2-digit",
//                               minute: "2-digit",
//                             })}
//                           </div>
//                         </div>

//                         {/* Source References */}
//                         {msg.context_used && msg.context_used.length > 0 && (
//                           <div className="px-2.5 py-1.5 rounded-lg bg-blue-50/50 border border-blue-100 text-xs">
//                             <div className="flex items-center gap-1.5 text-blue-700 font-medium mb-1">
//                               <FileText className="w-3 h-3" />
//                               <span>Sources ({msg.context_used.length})</span>
//                             </div>
//                             <div className="space-y-1">
//                               {(() => {
//                                 let contextArray: any[] = [];
//                                 try {
//                                   if (Array.isArray(msg.context_used))
//                                     contextArray = msg.context_used;
//                                   else if (typeof msg.context_used === "string")
//                                     contextArray = JSON.parse(msg.context_used);
//                                 } catch {
//                                   contextArray = [];
//                                 }
//                                 return contextArray.map(
//                                   (source: any, idx: number) => {
//                                     const scorePercent = source.score * 100;
//                                     const barColor =
//                                       scorePercent >= 60
//                                         ? "bg-green-500"
//                                         : scorePercent >= 40
//                                         ? "bg-yellow-500"
//                                         : "bg-red-500";
//                                     return (
//                                       <div
//                                         key={source.id || idx}
//                                         className="flex items-center gap-3 text-slate-600"
//                                       >
//                                         <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium shrink-0 text-blue-700">
//                                           {idx + 1}
//                                         </span>
//                                         <span className="text-xs whitespace-nowrap">
//                                           {scorePercent.toFixed(1)}%
//                                           {source.page &&
//                                             ` • Page ${source.page}`}
//                                         </span>
//                                         <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
//                                           <div
//                                             className={`h-full ${barColor} rounded-full transition-all duration-300`}
//                                             style={{
//                                               width: `${scorePercent}%`,
//                                             }}
//                                             title={`Match confidence: ${scorePercent.toFixed(
//                                               1
//                                             )}%`}
//                                           />
//                                         </div>
//                                       </div>
//                                     );
//                                   }
//                                 );
//                               })()}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 }

//                 return null;
//               })}

//               {/* Typing indicator when assistant is responding */}
//               {isAssistantTyping && (
//                 <div className="flex items-end gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
//                   <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-blue-600">
//                     <Bot className="w-4 h-4 text-white" />
//                   </div>
//                   <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
//                     <div className="flex gap-1 py-1">
//                       <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
//                       <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
//                       <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Error message */}
//               {error && (
//                 <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
//                   <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-red-100">
//                     <AlertCircle className="w-4 h-4 text-red-600" />
//                   </div>
//                   <div className="flex-1 px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-red-50 text-red-800 border border-red-200">
//                     {error}
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>

//       {/* Input Area */}
//       <div className="p-4 bg-white border-t sticky bottom-0">
//         <div className="max-w-2xl mx-auto space-y-4">
//           <form
//             onSubmit={handleSendInExistingChat}
//             className="relative flex items-center gap-2"
//           >
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && !e.shiftKey) {
//                   e.preventDefault();
//                   handleSendInExistingChat();
//                 }
//               }}
//               placeholder="Type your message..."
//               disabled={isAssistantTyping || loadingMessages}
//               className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
//             />
//             <Button
//               type="submit"
//               size="icon"
//               className="rounded-xl h-11 w-11 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
//               disabled={!input.trim() || isAssistantTyping || loadingMessages}
//             >
//               <Send className="w-5 h-5" />
//             </Button>
//           </form>

//           <p className="text-[10px] text-center text-slate-400">
//             CityCare AI may provide general info. For emergencies, call 911.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
