import { ChatProvider } from "@/provider/ChatContext";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatProvider>{children}</ChatProvider>;
}
