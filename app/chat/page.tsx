// export default ChatPage

"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, User, Bot, ArrowLeft, RefreshCw, X, Menu, MessageSquare, Plus, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useChat } from "@/provider/ChatContext"

const INITIAL_MESSAGE = {
  id: "initial",
  query: "Hi there! I'm your CityCare AI assistant. How can I help you today?",
  response: null,
  created_at: new Date().toISOString(),
  isInitial: true,
  context_used: null,
}

const SUGGESTIONS = [
  "What are your working hours?",
  "Where is the hospital located?",
  "How do I book an appointment?",
  "Tell me about your emergency services.",
]

export default function ChatPage() {
  const {
    loading,
    recentSessions,
    currentSessionId,
    messages: contextMessages,
    startNewSession,
    selectSession,
    sendMessage,
  } = useChat()

  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Convert context messages to display format
  const displayMessages = currentSessionId
    ? contextMessages.length === 0
      ? [INITIAL_MESSAGE]
      : contextMessages
    : [INITIAL_MESSAGE]

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayMessages, isTyping])

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (sidebarOpen && !target.closest('.sidebar') && !target.closest('.menu-button')) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarOpen])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isTyping || loading) return

    const userQuery = input
    setInput("")
    setIsTyping(true)
    setError(null)

    try {
      await sendMessage(userQuery)
    } catch (error) {
      console.error("Error sending message:", error)
      setError(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setIsTyping(false)
    }
  }

  const handleNewChat = async () => {
    try {
      await startNewSession()
      setSidebarOpen(false)
      setError(null)
    } catch (error) {
      console.error("Error starting new chat:", error)
    }
  }

  const handleSelectSession = async (sessionId: string) => {
    try {
      await selectSession(sessionId)
      setSidebarOpen(false)
      setError(null)
    } catch (error) {
      console.error("Error selecting session:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Bot className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh bg-slate-50 font-sans relative">
      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-14 border-b px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900">CityCare AI</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full"
            onClick={() => setSidebarOpen(false)}
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
            {recentSessions.map((session) => (
              <button
                key={session.id}
                className={cn(
                  "w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors group",
                  currentSessionId === session.id && "bg-blue-50 hover:bg-blue-50"
                )}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate mb-0.5">
                      {session.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {session.message_count} {session.message_count === 1 ? 'message' : 'messages'}
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
            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
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
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center lg:hidden">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">CityCare AI</h1>
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
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          <div className="max-w-2xl mx-auto space-y-4">
            {displayMessages.map((msg, index) => {
              const isInitial = 'isInitial' in msg && msg.isInitial
              const timestamp = new Date(msg.created_at)

              return (
                <div key={isInitial ? 'initial' : msg.id || index}>
                  {/* User message */}
                  {!isInitial && (
                    <div className="flex items-end gap-2 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-slate-200">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-blue-600 text-white rounded-br-none">
                        {msg.query}
                        <div className="text-[10px] mt-1 opacity-50 text-right">
                          {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>

                        {/* Source References */}
                        {!isInitial && msg.context_used && Array.isArray(msg.context_used) && msg.context_used.length > 0 && (
                          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600 font-medium mb-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Sources ({msg.context_used.length})</span>
                            </div>
                            <div className="space-y-1">
                              {msg.context_used.map((source: any, idx: number) => (
                                <div key={source.id || idx} className="flex items-center gap-2 text-slate-500">
                                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-medium shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="truncate">
                                    Score: {(source.score * 100).toFixed(1)}%
                                    {source.page && ` • Page ${source.page}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Typing indicator */}
            {isTyping && (
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
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t sticky bottom-0">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Suggestions */}
            {displayMessages.length === 1 && !isTyping && (
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
            )}

            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type your message..."
                disabled={isTyping || loading}
                className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="rounded-xl h-11 w-11 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                disabled={!input.trim() || isTyping || loading}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-[10px] text-center text-slate-400">
              CityCare AI may provide general info. For emergencies, call 911.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// "use client"

// import type React from "react"
// import { useState, useRef, useEffect } from "react"
// import { Send, User, Bot, ArrowLeft, RefreshCw, X, Menu, MessageSquare, Plus, FileText, AlertCircle } from "lucide-react"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { cn } from "@/lib/utils"
// import { useChat } from "@/provider/ChatContext"

// const INITIAL_MESSAGE = {
//   id: "initial",
//   query: "Hi there! I'm your CityCare AI assistant. How can I help you today?",
//   response: null,
//   created_at: new Date().toISOString(),
//   isInitial: true,
//   context_used: null,
// }

// const SUGGESTIONS = [
//   "What are your working hours?",
//   "Where is the hospital located?",
//   "How do I book an appointment?",
//   "Tell me about your emergency services.",
// ]

// export default function ChatPage() {
//   const {
//     loading,
//     recentSessions,
//     currentSessionId,
//     messages: contextMessages,
//     startNewSession,
//     selectSession,
//     sendMessage,
//   } = useChat()

//   const [input, setInput] = useState("")
//   const [isTyping, setIsTyping] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [sidebarOpen, setSidebarOpen] = useState(false)
//   const scrollRef = useRef<HTMLDivElement>(null)

//   // Convert context messages to display format
//   const displayMessages = currentSessionId
//     ? contextMessages.length === 0
//       ? [INITIAL_MESSAGE]
//       : contextMessages
//     : [INITIAL_MESSAGE]

//   // Auto-scroll to bottom
//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight
//     }
//   }, [displayMessages, isTyping])

//   // Close sidebar on mobile when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       const target = e.target as HTMLElement
//       if (sidebarOpen && !target.closest('.sidebar') && !target.closest('.menu-button')) {
//         setSidebarOpen(false)
//       }
//     }

//     document.addEventListener('mousedown', handleClickOutside)
//     return () => document.removeEventListener('mousedown', handleClickOutside)
//   }, [sidebarOpen])

//   const handleSend = async (e?: React.FormEvent) => {
//     e?.preventDefault()
//     if (!input.trim() || isTyping || loading) return

//     const userQuery = input
//     setInput("")
//     setIsTyping(true)
//     setError(null)

//     try {
//       await sendMessage(userQuery)
//     } catch (error) {
//       console.error("Error sending message:", error)
//       setError(error instanceof Error ? error.message : "Failed to send message")
//     } finally {
//       setIsTyping(false)
//     }
//   }

//   const handleNewChat = async () => {
//     try {
//       await startNewSession("New Chat")
//       setSidebarOpen(false)
//       setError(null)
//     } catch (error) {
//       console.error("Error starting new chat:", error)
//     }
//   }

//   const handleSelectSession = async (sessionId: string) => {
//     try {
//       await selectSession(sessionId)
//       setSidebarOpen(false)
//       setError(null)
//     } catch (error) {
//       console.error("Error selecting session:", error)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex h-dvh items-center justify-center bg-slate-50">
//         <div className="text-center">
//           <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
//             <Bot className="w-6 h-6 text-white animate-pulse" />
//           </div>
//           <p className="text-slate-600">Loading...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="flex h-dvh bg-slate-50 font-sans relative">
//       {/* Sidebar */}
//       <aside
//         className={cn(
//           "sidebar fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out flex flex-col",
//           sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
//         )}
//       >
//         {/* Sidebar Header */}
//         <div className="h-14 border-b px-4 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
//               <Bot className="w-4 h-4 text-white" />
//             </div>
//             <span className="font-bold text-sm text-slate-900">CityCare AI</span>
//           </div>
//           <Button
//             variant="ghost"
//             size="icon"
//             className="lg:hidden rounded-full"
//             onClick={() => setSidebarOpen(false)}
//           >
//             <X className="w-4 h-4" />
//           </Button>
//         </div>

//         {/* New Chat Button */}
//         <div className="p-3 border-b">
//           <Button
//             onClick={handleNewChat}
//             className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             <Plus className="w-4 h-4" />
//             New Chat
//           </Button>
//         </div>

//         {/* Recent Chats */}
//         <div className="flex-1 overflow-y-auto p-3">
//           <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
//             Recent Chats
//           </div>
//           <div className="space-y-1">
//             {recentSessions.map((session) => (
//               <button
//                 key={session.id}
//                 className={cn(
//                   "w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors group",
//                   currentSessionId === session.id && "bg-blue-50 hover:bg-blue-50"
//                 )}
//                 onClick={() => handleSelectSession(session.id)}
//               >
//                 <div className="flex items-start gap-2">
//                   <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
//                   <div className="flex-1 min-w-0">
//                     <div className="text-sm font-medium text-slate-900 truncate mb-0.5">
//                       {session.title}
//                     </div>
//                     <div className="text-xs text-slate-500 truncate">
//                       {session.message_count} {session.message_count === 1 ? 'message' : 'messages'}
//                     </div>
//                   </div>
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Sidebar Footer */}
//         <div className="p-3 border-t">
//           <Link href="/">
//             <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600">
//               <ArrowLeft className="w-4 h-4" />
//               Back to Home
//             </Button>
//           </Link>
//         </div>
//       </aside>

//       {/* Overlay for mobile */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-30 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Main Chat Area */}
//       <div className="flex flex-col flex-1 min-w-0">
//         {/* Header */}
//         <header className="bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-10">
//           <div className="flex items-center gap-3">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="menu-button rounded-full lg:hidden"
//               onClick={() => setSidebarOpen(true)}
//             >
//               <Menu className="w-5 h-5 text-slate-600" />
//             </Button>
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center lg:hidden">
//                 <Bot className="w-5 h-5 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-sm font-bold text-slate-900 leading-none">CityCare AI</h1>
//                 <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
//                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
//                   Online
//                 </span>
//               </div>
//             </div>
//           </div>
//           <div className="flex items-center gap-1">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="rounded-full text-slate-400"
//               onClick={handleNewChat}
//             >
//               <RefreshCw className="w-4 h-4" />
//             </Button>
//             <Link href="/" className="hidden lg:block">
//               <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
//                 <X className="w-5 h-5" />
//               </Button>
//             </Link>
//           </div>
//         </header>

//         {/* Messages Area */}
//         <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
//           <div className="max-w-2xl mx-auto space-y-4">
//             {displayMessages.map((msg, index) => {
//               const isInitial = 'isInitial' in msg && msg.isInitial
//               const timestamp = new Date(msg.created_at)

//               return (
//                 <div key={isInitial ? 'initial' : msg.id || index}>
//                   {/* User message */}
//                   {!isInitial && (
//                     <div className="flex items-end gap-2 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300">
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-slate-200">
//                         <User className="w-4 h-4 text-slate-600" />
//                       </div>
//                       <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-blue-600 text-white rounded-br-none">
//                         {msg.query}
//                         <div className="text-[10px] mt-1 opacity-50 text-right">
//                           {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Assistant message */}
//                   {(isInitial || msg.response) && (
//                     <div className="flex items-start gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm bg-blue-600">
//                         <Bot className="w-4 h-4 text-white" />
//                       </div>
//                       <div className="flex flex-col gap-2 max-w-[85%]">
//                         <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
//                           {isInitial ? msg.query : msg.response}
//                           <div className="text-[10px] mt-1 opacity-50 text-left">
//                             {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                           </div>
//                         </div>

//                         {/* Source References */}
//                         {!isInitial && msg.context_used && Array.isArray(msg.context_used) && msg.context_used.length > 0 && (
//                           <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
//                             <div className="flex items-center gap-1.5 text-slate-600 font-medium mb-1.5">
//                               <FileText className="w-3.5 h-3.5" />
//                               <span>Sources ({msg.context_used.length})</span>
//                             </div>
//                             <div className="space-y-1">
//                               {msg.context_used.map((source: any, idx: number) => (
//                                 <div key={source.id || idx} className="flex items-center gap-2 text-slate-500">
//                                   <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-medium shrink-0">
//                                     {idx + 1}
//                                   </span>
//                                   <span className="truncate">
//                                     Score: {(source.score * 100).toFixed(1)}%
//                                     {source.page && ` • Page ${source.page}`}
//                                   </span>
//                                 </div>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )
//             })}

//             {/* Typing indicator */}
//             {isTyping && (
//               <div className="flex items-end gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
//                 <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-blue-600">
//                   <Bot className="w-4 h-4 text-white" />
//                 </div>
//                 <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
//                   <div className="flex gap-1 py-1">
//                     <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
//                     <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
//                     <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Error message */}
//             {error && (
//               <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
//                 <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-red-100">
//                   <AlertCircle className="w-4 h-4 text-red-600" />
//                 </div>
//                 <div className="flex-1 px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-red-50 text-red-800 border border-red-200">
//                   {error}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Input Area */}
//         <div className="p-4 bg-white border-t sticky bottom-0">
//           <div className="max-w-2xl mx-auto space-y-4">
//             {/* Suggestions */}
//             {displayMessages.length === 1 && !isTyping && (
//               <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
//                 {SUGGESTIONS.map((text) => (
//                   <button
//                     key={text}
//                     onClick={() => setInput(text)}
//                     className="whitespace-nowrap px-4 py-2 rounded-full border bg-white text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors shrink-0"
//                   >
//                     {text}
//                   </button>
//                 ))}
//               </div>
//             )}

//             <div className="relative flex items-center gap-2">
//               <input
//                 type="text"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter' && !e.shiftKey) {
//                     e.preventDefault()
//                     handleSend()
//                   }
//                 }}
//                 placeholder="Type your message..."
//                 disabled={isTyping || loading}
//                 className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
//               />
//               <Button
//                 onClick={handleSend}
//                 size="icon"
//                 className="rounded-xl h-11 w-11 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
//                 disabled={!input.trim() || isTyping || loading}
//               >
//                 <Send className="w-5 h-5" />
//               </Button>
//             </div>
//             <p className="text-[10px] text-center text-slate-400">
//               CityCare AI may provide general info. For emergencies, call 911.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// "use client"

// import type React from "react"
// import { useState, useRef, useEffect } from "react"
// import { Send, User, Bot, ArrowLeft, RefreshCw, X, Menu, MessageSquare, Plus } from "lucide-react"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { cn } from "@/lib/utils"
// import { useChat } from "@/provider/ChatContext"

// const INITIAL_MESSAGE = {
//   id: "initial",
//   query: "Hi there! I'm your CityCare AI assistant. How can I help you today?",
//   response: null,
//   created_at: new Date().toISOString(),
//   isInitial: true,
// }

// const SUGGESTIONS = [
//   "What are your working hours?",
//   "Where is the hospital located?",
//   "How do I book an appointment?",
//   "Tell me about your emergency services.",
// ]

// export default function ChatPage() {
//   const {
//     loading,
//     recentSessions,
//     currentSessionId,
//     messages: contextMessages,
//     startNewSession,
//     selectSession,
//     sendMessage,
//   } = useChat()

//   const [input, setInput] = useState("")
//   const [isTyping, setIsTyping] = useState(false)
//   const [sidebarOpen, setSidebarOpen] = useState(false)
//   const scrollRef = useRef<HTMLDivElement>(null)

//   // Convert context messages to display format
//   const displayMessages = currentSessionId
//     ? contextMessages.length === 0
//       ? [INITIAL_MESSAGE]
//       : contextMessages
//     : [INITIAL_MESSAGE]

//   // Auto-scroll to bottom
//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight
//     }
//   }, [displayMessages, isTyping])

//   // Close sidebar on mobile when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       const target = e.target as HTMLElement
//       if (sidebarOpen && !target.closest('.sidebar') && !target.closest('.menu-button')) {
//         setSidebarOpen(false)
//       }
//     }

//     document.addEventListener('mousedown', handleClickOutside)
//     return () => document.removeEventListener('mousedown', handleClickOutside)
//   }, [sidebarOpen])

//   const handleSend = async (e?: React.FormEvent) => {
//     e?.preventDefault()
//     if (!input.trim() || isTyping || loading) return

//     const userQuery = input
//     setInput("")
//     setIsTyping(true)

//     try {
//       await sendMessage(userQuery)
//     } catch (error) {
//       console.error("Error sending message:", error)
//     } finally {
//       setIsTyping(false)
//     }
//   }

//   const handleNewChat = async () => {
//     try {
//       await startNewSession("New Chat")
//       setSidebarOpen(false)
//     } catch (error) {
//       console.error("Error starting new chat:", error)
//     }
//   }

//   const handleSelectSession = async (sessionId: string) => {
//     try {
//       await selectSession(sessionId)
//       setSidebarOpen(false)
//     } catch (error) {
//       console.error("Error selecting session:", error)
//     }
//   }

//   const formatTimestamp = (dateString: string) => {
//     const date = new Date(dateString)
//     const now = new Date()
//     const diff = now.getTime() - date.getTime()
//     const hours = Math.floor(diff / 3600000)
//     const days = Math.floor(diff / 86400000)

//     if (hours < 1) return "Just now"
//     if (hours < 24) return `${hours}h ago`
//     if (days === 1) return "Yesterday"
//     if (days < 7) return `${days}d ago`
//     return date.toLocaleDateString()
//   }

//   if (loading) {
//     return (
//       <div className="flex h-dvh items-center justify-center bg-slate-50">
//         <div className="text-center">
//           <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
//             <Bot className="w-6 h-6 text-white animate-pulse" />
//           </div>
//           <p className="text-slate-600">Loading...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="flex h-dvh bg-slate-50 font-sans relative">
//       {/* Sidebar */}
//       <aside
//         className={cn(
//           "sidebar fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out flex flex-col",
//           sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
//         )}
//       >
//         {/* Sidebar Header */}
//         <div className="h-14 border-b px-4 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
//               <Bot className="w-4 h-4 text-white" />
//             </div>
//             <span className="font-bold text-sm text-slate-900">CityCare AI</span>
//           </div>
//           <Button
//             variant="ghost"
//             size="icon"
//             className="lg:hidden rounded-full"
//             onClick={() => setSidebarOpen(false)}
//           >
//             <X className="w-4 h-4" />
//           </Button>
//         </div>

//         {/* New Chat Button */}
//         <div className="p-3 border-b">
//           <Button
//             onClick={handleNewChat}
//             className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             <Plus className="w-4 h-4" />
//             New Chat
//           </Button>
//         </div>

//         {/* Recent Chats */}
//         <div className="flex-1 overflow-y-auto p-3">
//           <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
//             Recent Chats
//           </div>
//           <div className="space-y-1">
//             {recentSessions.map((session) => (
//               <button
//                 key={session.id}
//                 className={cn(
//                   "w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors group",
//                   currentSessionId === session.id && "bg-blue-50 hover:bg-blue-50"
//                 )}
//                 onClick={() => handleSelectSession(session.id)}
//               >
//                 <div className="flex items-start gap-2">
//                   <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
//                   <div className="flex-1 min-w-0">
//                     <div className="text-sm font-medium text-slate-900 truncate mb-0.5">
//                       {session.title}
//                     </div>
//                     <div className="text-xs text-slate-500 truncate">
//                       {session.message_count} messages
//                     </div>
//                   </div>
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Sidebar Footer */}
//         <div className="p-3 border-t">
//           <Link href="/">
//             <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600">
//               <ArrowLeft className="w-4 h-4" />
//               Back to Home
//             </Button>
//           </Link>
//         </div>
//       </aside>

//       {/* Overlay for mobile */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-30 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Main Chat Area */}
//       <div className="flex flex-col flex-1 min-w-0">
//         {/* Header */}
//         <header className="bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-10">
//           <div className="flex items-center gap-3">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="menu-button rounded-full lg:hidden"
//               onClick={() => setSidebarOpen(true)}
//             >
//               <Menu className="w-5 h-5 text-slate-600" />
//             </Button>
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center lg:hidden">
//                 <Bot className="w-5 h-5 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-sm font-bold text-slate-900 leading-none">CityCare AI</h1>
//                 <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
//                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
//                   Online
//                 </span>
//               </div>
//             </div>
//           </div>
//           <div className="flex items-center gap-1">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="rounded-full text-slate-400"
//               onClick={handleNewChat}
//             >
//               <RefreshCw className="w-4 h-4" />
//             </Button>
//             <Link href="/" className="hidden lg:block">
//               <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
//                 <X className="w-5 h-5" />
//               </Button>
//             </Link>
//           </div>
//         </header>

//         {/* Messages Area */}
//         <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
//           <div className="max-w-2xl mx-auto space-y-4">
//             {displayMessages.map((msg, index) => {
//               const isInitial = 'isInitial' in msg && msg.isInitial
//               const isUser = !isInitial && !msg.response
//               const content = isInitial ? msg.query : isUser ? msg.query : msg.response
//               const timestamp = new Date(msg.created_at)

//               return (
//                 <div key={isInitial ? 'initial' : msg.id || index}>
//                   {/* User message */}
//                   {!isInitial && (
//                     <div className="flex items-end gap-2 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300">
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-slate-200">
//                         <User className="w-4 h-4 text-slate-600" />
//                       </div>
//                       <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-blue-600 text-white rounded-br-none">
//                         {msg.query}
//                         <div className="text-[10px] mt-1 opacity-50 text-right">
//                           {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Assistant message */}
//                   {(isInitial || msg.response) && (
//                     <div className="flex items-end gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-blue-600">
//                         <Bot className="w-4 h-4 text-white" />
//                       </div>
//                       <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
//                         {content}
//                         <div className="text-[10px] mt-1 opacity-50 text-left">
//                           {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )
//             })}

//             {isTyping && (
//               <div className="flex items-end gap-2 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
//                 <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm bg-blue-600">
//                   <Bot className="w-4 h-4 text-white" />
//                 </div>
//                 <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white text-slate-800 border shadow-sm rounded-bl-none">
//                   <div className="flex gap-1 py-1">
//                     <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
//                     <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
//                     <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Input Area */}
//         <div className="p-4 bg-white border-t sticky bottom-0">
//           <div className="max-w-2xl mx-auto space-y-4">
//             {/* Suggestions */}
//             {displayMessages.length === 1 && !isTyping && (
//               <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
//                 {SUGGESTIONS.map((text) => (
//                   <button
//                     key={text}
//                     onClick={() => setInput(text)}
//                     className="whitespace-nowrap px-4 py-2 rounded-full border bg-white text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors shrink-0"
//                   >
//                     {text}
//                   </button>
//                 ))}
//               </div>
//             )}

//             <div className="relative flex items-center gap-2">
//               <input
//                 type="text"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter' && !e.shiftKey) {
//                     e.preventDefault()
//                     handleSend()
//                   }
//                 }}
//                 placeholder="Type your message..."
//                 disabled={isTyping || loading}
//                 className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
//               />
//               <Button
//                 onClick={handleSend}
//                 size="icon"
//                 className="rounded-xl h-11 w-11 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
//                 disabled={!input.trim() || isTyping || loading}
//               >
//                 <Send className="w-5 h-5" />
//               </Button>
//             </div>
//             <p className="text-[10px] text-center text-slate-400">
//               CityCare AI may provide general info. For emergencies, call 911.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
