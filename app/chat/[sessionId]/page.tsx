// /chat/[sessionId]/page.tsx
"use client"

import ChatPage from "../page"

// This page simply renders the same ChatPage component
// The sessionId is extracted from the URL pathname in ChatPage itself
export default function SessionPage() {
  return <ChatPage />
}
