// // /chat/layout.tsx

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatProvider, useChat } from "@/provider/ChatContext";
import Sidebar from "@/components/Sidebar";

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const context = useChat();

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

  const handleNewChat = () => {
    context.handleNewChat(router, sessionId);
  };

  const handleSelectSession = (id: string) => {
    context.handleSelectSession(id, router, sessionId);
  };

  return (
    <div className="flex h-dvh bg-slate-50 font-sans relative">
      <Sidebar
        sessionId={sessionId}
        handleNewChat={handleNewChat}
        handleSelectSession={handleSelectSession}
      />

      {/* Overlay for mobile */}
      {context.sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => context.setSidebarOpen(false)}
        />
      )}

      {children}
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <ChatLayoutContent>{children}</ChatLayoutContent>
    </ChatProvider>
  );
}

// "use client";

// import { useEffect } from "react";
// import { useParams } from "next/navigation";
// import { ChatProvider, useChat } from "@/provider/ChatContext";
// import Sidebar from "@/components/Sidebar";
// import { useRouter } from "next/navigation";

// function ChatLayoutContent({ children }: { children: React.ReactNode }) {
//   const router = useRouter();
//   const { sessionId } = useParams<{ sessionId: string }>();
//   const context = useChat();

//   useEffect(() => {
//     console.log("Chat layout with sidebar mounted");
//     return () => {
//       console.log("Chat layout with sidebar unmounted");
//     };
//   }, []);

//   // Close sidebar on mobile when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       if (
//         context.sidebarOpen &&
//         !target.closest(".sidebar") &&
//         !target.closest(".menu-button")
//       ) {
//         context.setSidebarOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [context.sidebarOpen, context.setSidebarOpen]);

//   const handleNewChat = () => {
//     context.handleNewChat(router, sessionId);
//   };

//   const handleSelectSession = (id: string) => {
//     context.handleSelectSession(id, router, sessionId);
//   };

//   return (
//     <div className="flex h-dvh bg-slate-50 font-sans relative">
//       <Sidebar
//         sessionId={sessionId}
//         handleNewChat={handleNewChat}
//         handleSelectSession={handleSelectSession}
//       />

//       {/* Overlay for mobile */}
//       {context.sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-30 lg:hidden"
//           onClick={() => context.setSidebarOpen(false)}
//         />
//       )}

//       {children}
//     </div>
//   );
// }

// export default function ChatLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (

//       <ChatProvider>
//         <ChatLayoutContent>{children}</ChatLayoutContent>
//       </ChatProvider>
//   );
// }




// import { ChatProvider } from "@/provider/ChatContext";
// import { AuthProvider } from "@/provider/AuthContext";

// export default function ChatLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <AuthProvider>
//       <ChatProvider>{children}</ChatProvider>
//     </AuthProvider>
//   );
// }
