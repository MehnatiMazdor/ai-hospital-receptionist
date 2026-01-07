"use client";

import { useEffect, useState } from "react";
import { Bot, Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/provider/ChatContext";
import { supabase } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/provider/AuthContext";


export interface Session {
  id: string;
  title: string;
  message_count: number;
  is_closed: boolean;
}

export default function Sidebar() {

  const [recentChats, setRecentChats] = useState<Session[]>([]);
  // const { sidebarOpen, setSidebarOpen} = useChat();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const {user} = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetchRecentChats()
  },[user])

  const fetchRecentChats = async () => {
    if (!user) return;

    try {
     const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, message_count, is_closed")
      .eq("user_id", user.id)
      .eq("is_closed", false)
      .order("created_at", { ascending: false })
      .limit(5);

      console.log("recentChats fetched inside sidebar:", data)
    setRecentChats(data || []); 
    } catch (error: unknown) {
      console.error("Failed to fetch chats:", error)
    }

  };


  // Refresh chats when a new chat is created
  useEffect(() => {
    console.log("Chat refreshed in sidebar mounted")
    const handleChatRefresh = () => fetchRecentChats();
    window.addEventListener('chatCreated', handleChatRefresh);
    return () => window.removeEventListener('chatCreated', handleChatRefresh);
  },[user])


  // Close sidebar on mobile when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          sidebarOpen &&
          !target.closest(".sidebar") &&
          !target.closest(".menu-button")
        ) {
          setSidebarOpen(false);
        }
      };
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [sidebarOpen, setSidebarOpen]);

    const handleNewChat = () => {
      router.push('/chat')
    }
  
  
    const handleSelectSession = (id: string) => {
      router.push(`/chat/${id}`)
    };
  

  return (
      <aside
        className={cn(
          "sidebar fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-14 border-b px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900">
              CityCare AI
            </span>
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
            {recentChats.map((chat: Session) => {
              const isActive = pathname === `/chat/${chat.id}`
              return (
              <button
                key={chat.id}
                className={cn(
                  "w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors group",
                  isActive && "bg-blue-50 hover:bg-blue-50"
                )}
                onClick={() => handleSelectSession(chat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {chat.title || `Chat ${chat.id.slice(-4)}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {chat.message_count} messages
                    </div>
                  </div>
                </div>
              </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t">
          <Link href="/">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      </aside>
  );
}
