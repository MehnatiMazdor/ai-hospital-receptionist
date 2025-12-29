"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useChat } from "@/provider/ChatContext"
import ChatPage from "../page"

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { selectSession, currentSessionId } = useChat()

  useEffect(() => {
    // Only select session if it's different from current
    if (sessionId && sessionId !== currentSessionId) {
      selectSession(sessionId)
    }
  }, [sessionId, currentSessionId, selectSession])

  // Render the same ChatPage component
  return <ChatPage />
}