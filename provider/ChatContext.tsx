"use client";

import { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface Session { id: string; title: string; message_count: number; is_closed: boolean; }
interface Message { id: string; query: string; response: string | null; created_at: string; context_used?: any; }

interface ChatContextType {
  user: User | null;
  loading: boolean;
  recentSessions: Session[];
  currentSessionId: string | null;
  messages: Message[];
  startNewSession: () => void;
  selectSession: (id: string) => Promise<void>;
  sendMessage: (query: string) => Promise<string | void>;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const currentSessionIdRef = useRef<string | null>(null);
  const messagesLengthRef = useRef<number>(0);
  
  const renderCount = useRef(0);
  renderCount.current++;

  console.log(`[1] ChatProvider Render #${renderCount.current} | Current ID: ${currentSessionId}`);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    messagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Fetching Sessions
  const fetchRecentSessions = useCallback(async (userId: string) => {
    console.log(`[2] fetchRecentSessions executing for user: ${userId}`);
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, message_count, is_closed")
      .eq("user_id", userId)
      .eq("is_closed", false)
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentSessions(data || []);
  }, []);

  // Auth Initialization
  useEffect(() => {
    console.log("[3] Auth useEffect Hook firing (Mount)");
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log("[4] User found, setting state");
        setUser(user);
        fetchRecentSessions(user.id);
      } else {
        console.log("[4] No user, signing in anonymously");
        const { data: { user: anonUser } } = await supabase.auth.signInAnonymously();
        if (anonUser) {
          setUser(anonUser);
          fetchRecentSessions(anonUser.id);
        }
      }
      setLoading(false);
    };
    initUser();
  }, [fetchRecentSessions]);

  const startNewSession = useCallback(() => {
    console.log("[5] startNewSession: Clearing local chat state");
    setCurrentSessionId(null);
    setMessages([]);
  }, []);

  const selectSession = useCallback(async (id: string) => {
    // Only fetch if it's a different session
    if (id === currentSessionIdRef.current && messagesLengthRef.current > 0) {
      console.log(`[6] selectSession: Session ${id} already active. Skipping fetch.`);
      return;
    }

    console.log(`[6] selectSession: Loading data for ${id}`);
    setCurrentSessionId(id);
    
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_session_id", id)
      .order("created_at", { ascending: true });

    if (!error) {
      setMessages(data || []);
      console.log(`[7] selectSession: Messages loaded for ${id}`);
    }
  }, []);

  const sendMessage = useCallback(async (query: string) => {
    console.log("[8] sendMessage: Sending to API...");
    if (!user) return;

    const res = await fetch("/api/chat/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, sessionId: currentSessionIdRef.current }),
    });

    const data = await res.json();
    
    // Fetch the single message record created by the API
    const { data: newMessage } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("id", data.messageId)
      .single();

    if (newMessage) {
      setMessages((prev) => [...prev, newMessage]);
    }

    fetchRecentSessions(user.id);
    console.log("[9] sendMessage: API call complete");
    return data.sessionId; // Return so the UI can navigate
  }, [user, fetchRecentSessions]);

  return (
    <ChatContext.Provider value={{
      user, loading, recentSessions, currentSessionId, messages,
      startNewSession, selectSession, sendMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};
