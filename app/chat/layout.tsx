// /chat/layout.tsx
import Sidebar from "@/components/Sidebar";
import { ChatProvider } from "@/provider/ChatContext";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <div className="flex h-dvh bg-slate-50 font-sans relative">
      <Sidebar />
      {children}
      </div>
    </ChatProvider>
  );
}
