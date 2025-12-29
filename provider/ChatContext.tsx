'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface Session {
  id: string;
  title: string;
  message_count: number;
  is_closed: boolean;
}

interface Message {
  id: string;
  query: string;
  response: string | null;
  created_at: string;
  context_used?: any;
  user_feedback?: number;
  feedback_text?: string;
}

interface ChatContextType {
  user: User | null;
  loading: boolean;
  recentSessions: Session[];
  currentSessionId: string | null;
  messages: Message[];
  startNewSession: (title?: string) => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  sendMessage: (query: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const router = useRouter();

  // 1️⃣ Initialize user: anonymous sign-in if no user
  useEffect(() => {
    const initUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
      } else {
        const {
          data: { user: anonUser },
          error,
        } = await supabase.auth.signInAnonymously();
        
        if (error) {
          console.error("Anonymous sign-in error:", error);
        } else {
          console.log("Signed in anonymously:", anonUser);
          setUser(anonUser);
        }
      }
      setLoading(false);
    };
    initUser();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2️⃣ Fetch recent sessions when user is ready
  const fetchRecentSessions = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, message_count, is_closed")
      .eq("user_id", user.id)
      .eq("is_closed", false)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentSessions(data || []);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRecentSessions();
    }
  }, [user, fetchRecentSessions]);

  // 3️⃣ Start a new chat session (clears UI state only)
  const startNewSession = useCallback(async (title?: string) => {
    if (!user) return;

    // Clear current state to show fresh chat
    setCurrentSessionId(null);
    setMessages([]);
    
    // Navigate to /chat (no session ID yet - will be created on first message)
    router.push('/chat');
  }, [user, router]);

  // 4️⃣ Select an existing session
  const selectSession = useCallback(
    async (id: string) => {
      if (!user) return;

      setCurrentSessionId(id);

      // Fetch messages for this session
      const { data: sessionMessages } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_session_id", id)
        .order("created_at", { ascending: true });

      setMessages(sessionMessages || []);
      
      // Navigate to the session URL
      router.push(`/chat/${id}`);
    },
    [user, router]
  );

  // 5️⃣ Send message - ALL DB operations happen in /api/chat/query
  const sendMessage = useCallback(
    async (query: string) => {
      if (!user) return;

      // Validate query length (2-3 lines max, ~500 chars)
      const trimmedQuery = query.trim();
      if (!trimmedQuery || trimmedQuery.length > 500) {
        throw new Error("Query must be 2-3 lines maximum (500 characters)");
      }

      try {
        // Call RAG API - handles ALL database operations:
        // - Gets userId from auth (server-side)
        // - Creates session (if first message)
        // - Inserts message record with "Processing..." placeholder
        // - Performs Pinecone search
        // - Generates LLM response
        // - Updates message with actual response
        // - Increments message count via RPC
        const ragResponse = await fetch("/api/chat/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: trimmedQuery,
            sessionId: currentSessionId,
          }),
        });

        if (!ragResponse.ok) {
          const errorData = await ragResponse.json();
          throw new Error(errorData.error || "Failed to get response from RAG");
        }

        const { answer, sources, sessionId: newSessionId, messageId } = await ragResponse.json();

        // If this was the first message, update sessionId and navigate to new URL
        if (!currentSessionId && newSessionId) {
          setCurrentSessionId(newSessionId);
          router.push(`/chat/${newSessionId}`);
        }

        // Fetch the updated message from database to get complete record
        const { data: newMessage } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("id", messageId)
          .single();

        if (newMessage) {
          // Add the complete message to UI
          setMessages((prev) => [...prev, newMessage]);
        }

        // Refresh recent sessions list to show new/updated session
        await fetchRecentSessions();

      } catch (error) {
        console.error("Error sending message:", error);
        
        // Re-throw error so UI can handle it (show error message to user)
        throw error;
      }
    },
    [user, currentSessionId, fetchRecentSessions, router]
  );

  return (
    <ChatContext.Provider
      value={{
        user,
        loading,
        recentSessions,
        currentSessionId,
        messages,
        startNewSession,
        selectSession,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};



// 'use client';

// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useState,
// } from "react";
// import { supabase } from "../lib/supabase/client";
// import { User } from "@supabase/supabase-js";
// // import { Database } from "@/lib/supabase/types";

// interface Session {
//   id: string;
//   title: string;
//   message_count: number;
//   is_closed: boolean;
// }

// interface Message {
//   id: string;
//   query: string;
//   response: string | null;
//   created_at: string;
//   context_used?: any;
//   user_feedback?: number;
//   feedback_text?: string;
// }

// interface ChatContextType {
//   user: User | null; // any
//   loading: boolean;
//   recentSessions: Session[];
//   currentSessionId: string | null;
//   messages: Message[];
//   startNewSession: (title?: string) => Promise<void>;
//   selectSession: (id: string) => Promise<void>;
//   sendMessage: (query: string) => Promise<void>;
// }

// const ChatContext = createContext<ChatContextType>({} as ChatContextType);

// export const useChat = () => useContext(ChatContext);

// export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [recentSessions, setRecentSessions] = useState<Session[]>([]);
//   const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);

//   // 1️⃣
//   // Initialize user: anonymous sign-in if no user &
//   // Listen to auth state changes
//   useEffect(() => {
//     // Try to get current user or sign in anonymously
//     const initUser = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       if (user) setUser(user);
//       else {
//         const {
//           data: { user: anonUser }, error
//         } = await supabase.auth.signInAnonymously();
//         console.log("Signed in anonymously:", anonUser);
//         if (error) console.error("Anonymous sign-in error:", error);
//         setUser(anonUser);
//       }
//       setLoading(false);
//     };
//     initUser();

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((event, session) => {
//       if (session?.user) {
//         setUser(session.user);
//       } else {
//         setUser(null);
//       }
//     });

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   // 2️⃣ Fetch recent sessions when user is ready
//   useEffect(() => {
//     if (!user) return;

//     const fetchSessions = async () => {
//       const { data } = await supabase
//         .from("chat_sessions")
//         .select("id, title, message_count, is_closed")
//         .eq("user_id", user.id)
//         .eq("is_closed", false)
//         .order("created_at", { ascending: false })
//         .limit(5);
//       setRecentSessions(data || []);

//       // If no session selected, optionally start a new session
//       if (!currentSessionId && (!data || data.length === 0)) {
//         await startNewSession();
//       }
//     };
//     fetchSessions();
//   }, [user]);

//   // Start a new chat session
//   const startNewSession = useCallback(
//     async (title?: string) => {
//       if (!user) return;

//       const { data } = await supabase
//         .from("chat_sessions")
//         .insert({ user_id: user.id, title: title || "New Chat" })
//         .select()
//         .single();

//       if (!data) return;

//       setCurrentSessionId(data.id);
//       setMessages([]);
//       setRecentSessions((prev) => [data, ...prev].slice(0, 5));
//     },
//     [user]
//   );

//   const selectSession = useCallback(
//     async (id: string) => {
//       if (!user) return;

//       setCurrentSessionId(id);

//       const { data: messages } = await supabase
//         .from("chat_messages")
//         .select("*")
//         .eq("chat_session_id", id)
//         .order("created_at", { ascending: true });

//       setMessages(messages || []);
//     },
//     [user]
//   );

//   const sendMessage = useCallback(async (query: string) => {
//     if (!user || !currentSessionId) return;
//     const { data } = await supabase
//       .from("chat_messages")
//       .insert({
//         chat_session_id: currentSessionId,
//         query,
//         response: `Response to "${query}"`,
//       })
//       .select()
//       .single();
//     if (data) setMessages((prev) => [...prev, data]);

//   }, [user, currentSessionId]);

//   return (
//     <ChatContext.Provider
//       value={{
//         user,
//         loading,
//         recentSessions,
//         currentSessionId,
//         messages,
//         startNewSession,
//         selectSession,
//         sendMessage,
//       }}
//     >
//       {children}
//     </ChatContext.Provider>
//   );
// };
