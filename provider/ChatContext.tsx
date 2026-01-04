"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export interface Message {
  id: string;
  chat_session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  context_used?: [];
  user_feedback?: number | null;
  feedback_text?: string | null;
}

export const INITIAL_MESSAGE: Message = {
  id: "initial",
  chat_session_id: "initial",
  role: "assistant",
  content:
    "Hi there! I'm your CityCare AI assistant. How can I help you today?",
  created_at: new Date().toISOString(),
  context_used: [],
};

interface ChatContextType {
  user: User | null;
  initialLoading: boolean;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: (input: string) => void;
  isTyping: boolean;
  error: string | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  loadingMessages: boolean;
  currentSessionId: string | undefined;
  getChatMessagesById: (sessionId?: string) => Promise<void>;
  handleSend: (
    query: string,
    sessionId: string | undefined,
    router: unknown
  ) => Promise<void>;
  handleNewChat: (router: AppRouterInstance, currentSessionId?: string) => void;
  handleSelectSession: (id: string, router: AppRouterInstance, sessionId?: string) => void;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        const {
          data: { user: anonUser },
        } = await supabase.auth.signInAnonymously();
        if (anonUser) setUser(anonUser);
      }
      setInitialLoading(false);

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
        }
      );

      return () => authListener.subscription.unsubscribe();
    };

    initAuth();
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    undefined
  );

  const loadedSessionRef = useRef<string | undefined>(undefined);

  const getChatMessagesById = useCallback(async (sessionId?: string) => {
    if (loadedSessionRef.current === sessionId) return;

    loadedSessionRef.current = sessionId;
    setCurrentSessionId(sessionId);
    setMessages([]);
    setLoadingMessages(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load messages:", error);
        setError("Failed to load messages");
      } else if (data) {
        console.log(`Get all messages for given chatId ${sessionId} successfully`, data)
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleSend = useCallback(
    async (userQuery: string, sessionId: string | undefined) => {
      if (!userQuery.trim() || isTyping || !user) return;

      const content = userQuery.trim();

      // Create optimistic user message
      const optimisticUserMessage: Message = {
        id: crypto.randomUUID(),
        chat_session_id: sessionId || "temp",
        role: "user",
        content: content,
        created_at: new Date().toISOString(),
        context_used: [],
      };

      setMessages((prev) => {
        return [...prev, optimisticUserMessage];
      });

      setInput("");
      setIsTyping(true);
      setError(null);

      try {
        const res = await fetch("/api/chat/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, chatSessionId: sessionId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send message");

        console.log("Data response from server is:", data);
        console.log("Data messages inside response is:", data?.messages[1])

        // Update messages with real data from server
        setMessages((prev) => [
          ...prev,
          ...(data.messages
            ? [data.messages[1]]
            : []),
        ]);
      } catch (err) {
        console.error("Error sending message:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, user]
  );

  const handleNewChat = useCallback(
    (router: AppRouterInstance, currentSessionId?: string) => {
      if (isTyping) return;

      // Only navigate if not already on empty chat page
      if (currentSessionId) {
        router.replace("/chat");
      }
    },
    [isTyping]
  );

  const handleSelectSession = useCallback(
    (id: string, router: AppRouterInstance, sessionId?: string) => {
      if (id !== sessionId) {
        setError(null);
        setSidebarOpen(false);
        router.replace(`/chat/${id}`);
      }
    },
    []
  );

  const value: ChatContextType = {
    user,
    initialLoading,
    messages,
    setMessages,
    input,
    setInput,
    isTyping,
    error,
    sidebarOpen,
    setSidebarOpen,
    loadingMessages,
    currentSessionId,
    getChatMessagesById,
    handleSend,
    handleNewChat,
    handleSelectSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
