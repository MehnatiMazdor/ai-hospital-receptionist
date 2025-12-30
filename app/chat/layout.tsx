import { ChatProvider } from "@/provider/ChatContext";
import { AuthProvider } from "@/provider/AuthContext";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ChatProvider>{children}</ChatProvider>
    </AuthProvider>
  );
}
