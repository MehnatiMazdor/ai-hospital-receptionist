// /chat/[sessionId]/page.tsx


"use client";

import ChatInterface from "@/components/chat/ChatInterface";

export default function SessionChatPage() {
  return <ChatInterface />;
}

// "use client"
// import { useEffect } from "react"

// import ChatPage from "../page"

// // This page simply renders the same ChatPage component
// // The sessionId is extracted from the URL pathname in ChatPage itself
// export default function SessionPage() {

//   useEffect(() => {
//     console.log("SessionPage mounted")
//     return () => {
//       console.log("SessionPage unmounted")
//     }
//   }, [])
//   return <ChatPage />
// }
