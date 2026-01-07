"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase/client";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";

// Updated Message interface matching new schema
export interface Message {
  id: string;
  chat_session_id: string;
  role: "user" | "assistant";
  content_text: string;
  content_json: string[]; // Array of suggestions (assistant only)
  created_at: string;
  context_used?: any[];
  user_feedback?: number | null;
  feedback_text?: string | null;
}

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: (input: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAssistantTyping: boolean;
  setIsAssistantTyping: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  loadingMessages: boolean;
  currentSessionId: string | undefined;
  getChatMessagesById: (sessionId?: string) => Promise<void>;
  handleSend: (query: string, sessionId: string | undefined) => Promise<void>;
  handleNewChat: () => void;
  handleSelectSession: (id: string, sessionId?: string) => void;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    undefined
  );

  const loadedSessionRef = useRef<string | undefined>(undefined);

  /**
   * Load all messages for a chat session
   * No parsing needed - new schema stores data correctly
   */
  const getChatMessagesById = useCallback(async (sessionId?: string) => {
    if (loadedSessionRef.current === sessionId) return;

    console.log("Loading messages for session:", sessionId);

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
        console.log(`✅ Loaded ${data.length} messages for session ${sessionId}`);
        
        // No parsing needed! New schema already has:
        // - content_text: string (plain text)
        // - content_json: string[] (suggestions array)
        setMessages(data as Message[]);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  /**
   * Send a message - NOT USED ANYMORE
   * This is kept for backward compatibility but the actual
   * sending is now handled by SSE streaming in the chat page
   */
  const handleSend = useCallback(
    async (userQuery: string, sessionId: string | undefined) => {
      if (!userQuery.trim() || isAssistantTyping || !user) return;

      console.warn(
        "⚠️ handleSend called but SSE streaming should be used instead"
      );

      const content = userQuery.trim();

      // Create optimistic user message
      const optimisticUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        chat_session_id: sessionId || "temp",
        role: "user",
        content_text: content,
        content_json: [], // Always empty for user messages
        created_at: new Date().toISOString(),
        context_used: [],
      };

      setMessages((prev) => [...prev, optimisticUserMessage]);
      setInput("");
      setIsAssistantTyping(true);
      setError(null);

      try {
        const res = await fetch("/api/chat/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            chatSessionId: sessionId,
            isFirstMessage: false,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to send message");
        }

        // With SSE, we don't need to handle response here
        // The chat page handles the streaming
        console.log("Message sent, streaming response...");
      } catch (err) {
        console.error("Error sending message:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");

        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticUserMessage.id)
        );
      } finally {
        setIsAssistantTyping(false);
      }
    },
    [isAssistantTyping, user]
  );

  /**
   * Start a new chat - clears all state and navigates to empty chat
   */
  const handleNewChat = useCallback(() => {
    if (isAssistantTyping) return;

    console.log("Starting new chat...");

    // Clean up all state
    setMessages([]);
    setInput("");
    setError(null);
    setIsAssistantTyping(false);
    setLoadingMessages(false);
    setCurrentSessionId(undefined);
    loadedSessionRef.current = undefined;

    // Navigate to empty chat page
    router.replace("/chat");
  }, [isAssistantTyping, router]);

  /**
   * Select an existing chat session from sidebar
   */
  const handleSelectSession = useCallback(
    (id: string, sessionId?: string) => {
      if (id === sessionId) {
        console.log("Already on this session, skipping navigation");
        return;
      }

      console.log(`Switching to session: ${id}`);

      // Clear error and input, but let the new page load messages
      setError(null);
      setInput("");
      setIsAssistantTyping(false);

      // Navigate to selected chat
      router.replace(`/chat/${id}`);
    },
    [router]
  );

  const value: ChatContextType = {
    messages,
    setMessages,
    input,
    setInput,
    sidebarOpen,
    setSidebarOpen,
    isAssistantTyping,
    setIsAssistantTyping,
    error,
    setError,
    loadingMessages,
    currentSessionId,
    getChatMessagesById,
    handleSend,
    handleNewChat,
    handleSelectSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// "use client";

// import {
//   createContext,
//   useContext,
//   useState,
//   useRef,
//   useCallback,
// } from "react";
// import { supabase } from "../lib/supabase/client";
// import { AssistantContent } from "@/types";
// import { useAuth } from "./AuthContext";
// import { useRouter } from "next/navigation";

// export type MessageContent = string | AssistantContent;

// export interface Message {
//   id: string;
//   chat_session_id: string;
//   role: "user" | "assistant";
//   content_text: string;
//   content_json: [];
//   created_at: string;
//   context_used?: [];
//   user_feedback?: number | null;
//   feedback_text?: string | null;
// }

// interface ChatContextType {
//   messages: Message[];
//   setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
//   input: string;
//   setInput: (input: string) => void;
//   sidebarOpen: boolean;
//   setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
//   isAssistantTyping: boolean;
//   setIsAssistantTyping: React.Dispatch<React.SetStateAction<boolean>>;
//   error: string | null;
//   setError: React.Dispatch<React.SetStateAction<string | null>>;
//   loadingMessages: boolean;
//   currentSessionId: string | undefined;
//   getChatMessagesById: (sessionId?: string) => Promise<void>;
//   handleSend: (
//     query: string,
//     sessionId: string | undefined,
//     router: unknown
//   ) => Promise<void>;
//   handleNewChat: (currentSessionId?: string) => void;
//   handleSelectSession: (id: string, sessionId?: string) => void;
// }

// const ChatContext = createContext<ChatContextType>({} as ChatContextType);
// export const useChat = () => useContext(ChatContext);

// export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  
//   const {user} = useAuth();
 
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [isAssistantTyping, setIsAssistantTyping] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
//     undefined
//   );

//   const router = useRouter();

//   const loadedSessionRef = useRef<string | undefined>(undefined);

//   // const getChatMessagesById = useCallback(async (sessionId?: string) => {
//   //   if (loadedSessionRef.current === sessionId) return;

//   //   console.log("loadedSessionRef.current === sessionId", loadedSessionRef.current === sessionId)
    

//   //   loadedSessionRef.current = sessionId;
//   //   setCurrentSessionId(sessionId);
//   //   setMessages([]);
//   //   setLoadingMessages(true);
//   //   setError(null);

//   //   try {
//   //     const { data, error } = await supabase
//   //       .from("chat_messages")
//   //       .select("*")
//   //       .eq("chat_session_id", sessionId)
//   //       .order("created_at", { ascending: true });

//   //     if (error) {
//   //       console.error("Failed to load messages:", error);
//   //       setError("Failed to load messages");
//   //     } else if (data) {
//   //       console.log(`Got all messages for chatId ${sessionId}`, data);
//   //       setMessages(data);
//   //     }
//   //   } catch (err) {
//   //     console.error("Failed to load messages:", err);
//   //     setError("Failed to load messages");
//   //   } finally {
//   //     setLoadingMessages(false);
//   //   }
//   // }, []);
//   const getChatMessagesById = useCallback(async (sessionId?: string) => {
//   if (loadedSessionRef.current === sessionId) return;

//   console.log("loadedSessionRef.current === sessionId", loadedSessionRef.current === sessionId)

//   loadedSessionRef.current = sessionId;
//   setCurrentSessionId(sessionId);
//   setMessages([]);
//   setLoadingMessages(true);
//   setError(null);

//   try {
//     const { data, error } = await supabase
//       .from("chat_messages")
//       .select("*")
//       .eq("chat_session_id", sessionId)
//       .order("created_at", { ascending: true });

//     if (error) {
//       console.error("Failed to load messages:", error);
//       setError("Failed to load messages");
//     } else if (data) {
//       console.log(`Got all messages for chatId ${sessionId}`, data);
      
//       // Parse assistant messages before setting state
//       const parsedMessages = data.map((msg) => {
//         if (msg.role === "assistant" && typeof msg.content === "string") {
//           try {
//             return {
//               ...msg,
//               content: JSON.parse(msg.content)
//             };
//           } catch (e) {
//             console.error("Failed to parse assistant message content:", e);
//             // If parsing fails, keep as is (will be handled by parseMessageContent)
//             return msg;
//           }
//         }
//         return msg;
//       });
      
//       setMessages(parsedMessages);
//     }
//   } catch (err) {
//     console.error("Failed to load messages:", err);
//     setError("Failed to load messages");
//   } finally {
//     setLoadingMessages(false);
//   }
// }, []);

//   const handleSend = useCallback(
//     async (userQuery: string, sessionId: string | undefined) => {
//       if (!userQuery.trim() || isAssistantTyping || !user) return;

//       const content = userQuery.trim();

//       // Create optimistic user message
//       const optimisticUserMessage: Message = {
//         id: `temp-user-${Date.now()}`,
//         chat_session_id: sessionId || "temp",
//         role: "user",
//         content_text: content,
//         content_json: [],
//         created_at: new Date().toISOString(),
//         context_used: [],
//       };

//       setMessages((prev) => [...prev, optimisticUserMessage]);
//       setInput("");
//       setIsAssistantTyping(true);
//       setError(null);

//       try {
//         const res = await fetch("/api/chat/query", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ content, chatSessionId: sessionId }),
//         });

//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Failed to send message");

//         console.log("Response from server:", data);

//         // Replace optimistic message with real messages from server
//         setMessages((prev) => {
//           // Remove the optimistic message
//           const filtered = prev.filter(m => m.id !== optimisticUserMessage.id);
//           // Add both user and assistant messages from server
//           return [...filtered, ...(data.messages || [])];
//         });
//       } catch (err) {
//         console.error("Error sending message:", err);
//         setError(err instanceof Error ? err.message : "Failed to send message");
        
//         // Remove optimistic message on error
//         setMessages((prev) => prev.filter(m => m.id !== optimisticUserMessage.id));
//       } finally {
//         setIsAssistantTyping(false);
//       }
//     },
//     [isAssistantTyping, user]
//   );

//   const handleNewChat = useCallback(
//     () => {
//       if (isAssistantTyping) return;

//       // Clean up all state
//       setMessages([]);
//       setInput("");
//       setError(null);
//       setIsAssistantTyping(false);
//       setLoadingMessages(false);
//       setCurrentSessionId(undefined);
//       loadedSessionRef.current = undefined;

//       router.replace("/chat")
      
//     },
//     [isAssistantTyping]
//   );

//   const handleSelectSession = useCallback(
//     (id: string, sessionId?: string) => {
//       if (id !== sessionId) {
//         setError(null);
//         setInput("");
//         setIsAssistantTyping(false);
//         // setSidebarOpen(false);
//         router.replace(`/chat/${id}`);
//       }
//     },
//     []
//   );



  

//   const value: ChatContextType = {
//     messages,
//     setMessages,
//     input,
//     setInput,
//     sidebarOpen,
//     setSidebarOpen,
//     isAssistantTyping,
//     setIsAssistantTyping,
//     error,
//     setError,
//     loadingMessages,
//     currentSessionId,
//     getChatMessagesById,
//     handleSend,
//     handleNewChat,
//     handleSelectSession,
//   };

//   return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
// };
