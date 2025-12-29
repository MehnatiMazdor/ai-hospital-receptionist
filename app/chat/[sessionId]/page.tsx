"use client"

import { useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { useChat } from "@/provider/ChatContext"
import ChatPage from "../page"

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { selectSession, currentSessionId } = useChat()
  const hasLoaded = useRef(false)
  const isSelecting = useRef(false)

  useEffect(() => {
    // Reset the ref when sessionId changes
    if (sessionId !== currentSessionId) {
      hasLoaded.current = false
    }

    // Only select session if it's different and hasn't been loaded yet
    if (sessionId && !hasLoaded.current && !isSelecting.current) {
      hasLoaded.current = true
      isSelecting.current = true
      selectSession(sessionId).finally(() => {
        isSelecting.current = false
      })
    }
  }, [sessionId, selectSession])

  // Render the same ChatPage component
  return <ChatPage />
}

// "use client"

// import { useEffect } from "react"
// import { useParams } from "next/navigation"
// import { useChat } from "@/provider/ChatContext"
// import ChatPage from "../page"

// export default function SessionPage() {
//   const params = useParams()
//   const sessionId = params.sessionId as string
//   const { selectSession, currentSessionId } = useChat()

//   useEffect(() => {
//     // Only select session if it's different from current
//     if (sessionId && sessionId !== currentSessionId) {
//       selectSession(sessionId)
//     }
//   }, [sessionId, currentSessionId, selectSession])

//   // Render the same ChatPage component
//   return <ChatPage />
// }