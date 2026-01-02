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

export interface Session {
  id: string;
  title: string;
  message_count: number;
  is_closed: boolean;
}

export interface Message {
  id: string;
  query: string;
  response: string | null;
  created_at: string;
  context_used?: any;
  isInitial?: boolean;
}

export const INITIAL_MESSAGE: Message = {
  id: "initial",
  query: "Hi there! I'm your CityCare AI assistant. How can I help you today?",
  response: null,
  created_at: new Date().toISOString(),
  isInitial: true,
  context_used: null,
};

interface ChatContextType {
  user: User | null;
  initialLoading: boolean;
  recentSessions: Session[];
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  isTyping: boolean;
  error: string | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  loadingMessages: boolean;
  currentSessionId: string | undefined;
  fetchRecentSessions: () => Promise<void>;
  loadSessionData: (sessionId?: string) => Promise<void>;
  handleSend: (
    query: string,
    sessionId: string | undefined,
    router: any
  ) => Promise<void>;
  handleNewChat: (router: any, sessionId?: string) => void;
  handleSelectSession: (id: string, router: any, sessionId: string) => void;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        const { data: { user: anonUser } } = await supabase.auth.signInAnonymously();
        if (anonUser) setUser(anonUser);
      }
      setInitialLoading(false);

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => authListener.subscription.unsubscribe();
    };

    initAuth();
  }, []);

  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);

  const isFirstLoad = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadedSessionRef = useRef<string | undefined>(undefined);

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
    if (user && isFirstLoad.current) {
      fetchRecentSessions();
      isFirstLoad.current = false;
    }
  }, [user, fetchRecentSessions]);

  // const loadSessionData = useCallback(async (sessionId?: string) => {
  //   // Abort any in-flight request
  //   if (abortControllerRef.current) {
  //     abortControllerRef.current.abort();
  //   }

  //   // Handle new chat (no sessionId)
  //   if (!sessionId) {
  //     loadedSessionRef.current = undefined;
  //     setCurrentSessionId(undefined);
  //     setMessages([]);
  //     setLoadingMessages(false);
  //     setError(null);
  //     return;
  //   }

  //   // Skip if already loaded this session
  //   if (loadedSessionRef.current === sessionId) {
  //     return;
  //   }

  //   // Mark as loading this session
  //   loadedSessionRef.current = sessionId;

  //   // Create new abort controller for this request
  //   const abortController = new AbortController();
  //   abortControllerRef.current = abortController;

  //   // Immediately update state to prevent flash of old content
  //   setCurrentSessionId(sessionId);
  //   setMessages([]);
  //   setLoadingMessages(true);
  //   setError(null);

  //   try {
  //     const { data, error } = await supabase
  //       .from("chat_messages")
  //       .select("*")
  //       .eq("chat_session_id", sessionId)
  //       .order("created_at", { ascending: true })
  //       .abortSignal(abortController.signal);

  //     // Only update if not aborted
  //     if (!abortController.signal.aborted) {
  //       if (!error && data) {
  //         setMessages(data);
  //       } else if (error) {
  //         console.error("Failed to load messages:", error);
  //         setError("Failed to load messages");
  //       }
  //     }
  //   } catch (err: any) {
  //     if (err.name !== 'AbortError' && !abortController.signal.aborted) {
  //       console.error("Failed to load messages:", err);
  //       setError("Failed to load messages");
  //     }
  //   } finally {
  //     if (!abortController.signal.aborted) {
  //       setLoadingMessages(false);
  //     }
  //     if (abortControllerRef.current === abortController) {
  //       abortControllerRef.current = null;
  //     }
  //   }
  // }, []);


  const loadSessionData = useCallback(async (sessionId?: string) => {
  if (!sessionId) {
    loadedSessionRef.current = undefined;
    setCurrentSessionId(undefined);
    setMessages([]);
    setLoadingMessages(false);
    setError(null);
    return;
  }

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
    async (userQuery: string, sessionId: string | undefined, router: any) => {
      if (!userQuery.trim() || isTyping || !user) return;

      const query = userQuery.trim();
      const isNewChat = !sessionId;

      const optimisticMessage: Message = {
        id: crypto.randomUUID(),
        query,
        response: null,
        created_at: new Date().toISOString(),
      };

      let messageIndex = 0;
      setMessages(prev => {
        messageIndex = prev.length;
        return [...prev, optimisticMessage];
      });

      setInput("");
      setIsTyping(true);
      setError(null);

      try {
        const res = await fetch("/api/chat/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, sessionId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send message");

        setMessages(prev => {
          const updated = [...prev];
          if (updated[messageIndex]) {
            updated[messageIndex] = {
              ...updated[messageIndex],
              id: data.messageId,
              response: data.answer,
            };
          }
          return updated;
        });

        if (isNewChat && data.sessionId) {
          setCurrentSessionId(data.sessionId);
          await fetchRecentSessions();
          router.replace(`/chat/${data.sessionId}`);
        }
      } catch (err) {
        console.error("Error sending message:", err);
        setMessages(prev => prev.filter((_, i) => i !== messageIndex));
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, user, fetchRecentSessions]
  );

  const handleNewChat = useCallback(
    (router: any, sessionId?: string) => {
      if (isTyping) return;
      
      // Only navigate if not already on new chat
      if (sessionId !== undefined) {
        setCurrentSessionId(undefined);
        setMessages([]);
        setError(null);
        setSidebarOpen(false);
        router.replace("/chat");
      }
    },
    [isTyping]
  );

  const handleSelectSession = useCallback(
    (id: string, router: any, sessionId: string) => {
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
    recentSessions,
    messages,
    input,
    setInput,
    isTyping,
    error,
    sidebarOpen,
    setSidebarOpen,
    loadingMessages,
    currentSessionId,
    fetchRecentSessions,
    loadSessionData,
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
//   useEffect,
//   useRef,
//   useCallback,
// } from "react";
// import { supabase } from "../lib/supabase/client";
// import { User } from "@supabase/supabase-js";

// export interface Session {
//   id: string;
//   title: string;
//   message_count: number;
//   is_closed: boolean;
// }

// export interface Message {
//   id: string;
//   query: string;
//   response: string | null;
//   created_at: string;
//   context_used?: any;
//   isInitial?: boolean;
// }

// export const INITIAL_MESSAGE: Message = {
//   id: "initial",
//   query: "Hi there! I'm your CityCare AI assistant. How can I help you today?",
//   response: null,
//   created_at: new Date().toISOString(),
//   isInitial: true,
//   context_used: null,
// };

// interface ChatContextType {
//   user: User | null;
//   initialLoading: boolean;
//   recentSessions: Session[];
//   messages: Message[];
//   input: string;
//   setInput: (input: string) => void;
//   isTyping: boolean;
//   error: string | null;
//   sidebarOpen: boolean;
//   setSidebarOpen: (open: boolean) => void;
//   loadingMessages: boolean;
//   currentSessionId: string | undefined;
//   fetchRecentSessions: () => Promise<void>;
//   loadSessionData: (sessionId?: string) => Promise<void>;
//   handleSend: (
//     query: string,
//     sessionId: string | undefined,
//     router: any
//   ) => Promise<void>;
//   handleNewChat: (router: any, sessionId?: string) => void;
//   handleSelectSession: (id: string, router: any, sessionId: string) => void;
// }

// const ChatContext = createContext<ChatContextType>({} as ChatContextType);
// export const useChat = () => useContext(ChatContext);

// export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [initialLoading, setInitialLoading] = useState(true);

//   useEffect(() => {
//     const initAuth = async () => {
//       const { data: { user: currentUser } } = await supabase.auth.getUser();
//       if (currentUser) {
//         setUser(currentUser);
//       } else {
//         const { data: { user: anonUser } } = await supabase.auth.signInAnonymously();
//         if (anonUser) setUser(anonUser);
//       }
//       setInitialLoading(false);

//       const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
//         setUser(session?.user || null);
//       });

//       return () => authListener.subscription.unsubscribe();
//     };

//     initAuth();
//   }, []);

//   const [recentSessions, setRecentSessions] = useState<Session[]>([]);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);

//   const isFirstLoad = useRef(true);
//   const abortControllerRef = useRef<AbortController | null>(null);

//   const fetchRecentSessions = useCallback(async () => {
//     if (!user) return;
//     const { data } = await supabase
//       .from("chat_sessions")
//       .select("id, title, message_count, is_closed")
//       .eq("user_id", user.id)
//       .eq("is_closed", false)
//       .order("created_at", { ascending: false })
//       .limit(5);
//     setRecentSessions(data || []);
//   }, [user]);

//   useEffect(() => {
//     if (user && isFirstLoad.current) {
//       fetchRecentSessions();
//       isFirstLoad.current = false;
//     }
//   }, [user, fetchRecentSessions]);

//   const loadSessionData = useCallback(async (sessionId?: string) => {
//     // Abort any in-flight request
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//     }

//     // Handle new chat (no sessionId)
//     if (!sessionId) {
//       setCurrentSessionId(undefined);
//       setMessages([]);
//       setLoadingMessages(false);
//       setError(null);
//       return;
//     }

//     // Skip if already loaded
//     if (currentSessionId === sessionId) {
//       return;
//     }

//     // Create new abort controller for this request
//     const abortController = new AbortController();
//     abortControllerRef.current = abortController;

//     // Immediately update state to prevent flash of old content
//     setCurrentSessionId(sessionId);
//     setMessages([]);
//     setLoadingMessages(true);
//     setError(null);

//     try {
//       const { data, error } = await supabase
//         .from("chat_messages")
//         .select("*")
//         .eq("chat_session_id", sessionId)
//         .order("created_at", { ascending: true })
//         .abortSignal(abortController.signal);

//       // Only update if not aborted and still the current session
//       if (!abortController.signal.aborted && currentSessionId === sessionId) {
//         if (!error && data) {
//           setMessages(data);
//         } else if (error) {
//           console.error("Failed to load messages:", error);
//           setError("Failed to load messages");
//         }
//       }
//     } catch (err: any) {
//       if (err.name !== 'AbortError' && !abortController.signal.aborted) {
//         console.error("Failed to load messages:", err);
//         setError("Failed to load messages");
//       }
//     } finally {
//       if (!abortController.signal.aborted) {
//         setLoadingMessages(false);
//       }
//       if (abortControllerRef.current === abortController) {
//         abortControllerRef.current = null;
//       }
//     }
//   }, [currentSessionId]);

//   const handleSend = useCallback(
//     async (userQuery: string, sessionId: string | undefined, router: any) => {
//       if (!userQuery.trim() || isTyping || !user) return;

//       const query = userQuery.trim();
//       const isNewChat = !sessionId;

//       const optimisticMessage: Message = {
//         id: crypto.randomUUID(),
//         query,
//         response: null,
//         created_at: new Date().toISOString(),
//       };

//       let messageIndex = 0;
//       setMessages(prev => {
//         messageIndex = prev.length;
//         return [...prev, optimisticMessage];
//       });

//       setInput("");
//       setIsTyping(true);
//       setError(null);

//       try {
//         const res = await fetch("/api/chat/query", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ query, sessionId }),
//         });

//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Failed to send message");

//         setMessages(prev => {
//           const updated = [...prev];
//           if (updated[messageIndex]) {
//             updated[messageIndex] = {
//               ...updated[messageIndex],
//               id: data.messageId,
//               response: data.answer,
//             };
//           }
//           return updated;
//         });

//         if (isNewChat && data.sessionId) {
//           setCurrentSessionId(data.sessionId);
//           await fetchRecentSessions();
//           router.replace(`/chat/${data.sessionId}`);
//         }
//       } catch (err) {
//         console.error("Error sending message:", err);
//         setMessages(prev => prev.filter((_, i) => i !== messageIndex));
//         setError(err instanceof Error ? err.message : "Failed to send message");
//       } finally {
//         setIsTyping(false);
//       }
//     },
//     [isTyping, user, fetchRecentSessions]
//   );

//   const handleNewChat = useCallback(
//     (router: any, sessionId?: string) => {
//       if (isTyping) return;
      
//       // Only navigate if not already on new chat
//       if (sessionId !== undefined) {
//         setCurrentSessionId(undefined);
//         setMessages([]);
//         setError(null);
//         setSidebarOpen(false);
//         router.replace("/chat");
//       }
//     },
//     [isTyping]
//   );

//   const handleSelectSession = useCallback(
//     (id: string, router: any, sessionId: string) => {
//       if (id !== sessionId) {
//         setError(null);
//         setSidebarOpen(false);
//         router.replace(`/chat/${id}`);
//       }
//     },
//     []
//   );

//   const value: ChatContextType = {
//     user,
//     initialLoading,
//     recentSessions,
//     messages,
//     input,
//     setInput,
//     isTyping,
//     error,
//     sidebarOpen,
//     setSidebarOpen,
//     loadingMessages,
//     currentSessionId,
//     fetchRecentSessions,
//     loadSessionData,
//     handleSend,
//     handleNewChat,
//     handleSelectSession,
//   };

//   return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
// };


// "use client";

// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
// } from "react";
// import { supabase } from "../lib/supabase/client";
// import { User } from "@supabase/supabase-js";

// export interface Session {
//   id: string;
//   title: string;
//   message_count: number;
//   is_closed: boolean;
// }

// export interface Message {
//   id: string;
//   query: string;
//   response: string | null;
//   created_at: string;
//   context_used?: any;
//   isInitial?: boolean;
// }

// export const INITIAL_MESSAGE: Message = {
//   id: "initial",
//   query: "Hi there! I'm your CityCare AI assistant. How can I help you today?",
//   response: null,
//   created_at: new Date().toISOString(),
//   isInitial: true,
//   context_used: null,
// };

// interface ChatContextType {
//   user: User | null;
//   initialLoading: boolean;
//   recentSessions: Session[];
//   messages: Message[];
//   input: string;
//   setInput: (input: string) => void;
//   isTyping: boolean;
//   error: string | null;
//   sidebarOpen: boolean;
//   setSidebarOpen: (open: boolean) => void;
//   loadingMessages: boolean;
//   fetchRecentSessions: () => Promise<void>;
//   loadSessionData: (sessionId?: string) => Promise<void>;
//   handleSend: (
//     query: string,
//     sessionId: string | undefined,
//     router: any
//   ) => Promise<void>;
//   handleNewChat: (router: any, sessionId?: string) => void;
//   handleSelectSession: (id: string, router: any, sessionId: string) => void;
// }

// const ChatContext = createContext<ChatContextType>({} as ChatContextType);
// export const useChat = () => useContext(ChatContext);

// export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [initialLoading, setInitialLoading] = useState(true);

//   useEffect(() => {
//     const initAuth = async () => {
//       const { data: { user: currentUser } } = await supabase.auth.getUser();
//       if (currentUser) {
//         setUser(currentUser);
//       } else {
//         const { data: { user: anonUser } } = await supabase.auth.signInAnonymously();
//         if (anonUser) setUser(anonUser);
//       }
//       setInitialLoading(false);

//       const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
//         setUser(session?.user || null);
//       });

//       return () => authListener.subscription.unsubscribe();
//     };

//     initAuth();
//   }, []);

//   const [recentSessions, setRecentSessions] = useState<Session[]>([]);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [loadingMessages, setLoadingMessages] = useState(false);

//   const currentLoadingIdRef = useRef<string | null>(null);
//   const isFirstLoad = useRef(true);

//   const fetchRecentSessions = useCallback(async () => {
//     if (!user) return;
//     const { data } = await supabase
//       .from("chat_sessions")
//       .select("id, title, message_count, is_closed")
//       .eq("user_id", user.id)
//       .eq("is_closed", false)
//       .order("created_at", { ascending: false })
//       .limit(5);
//     setRecentSessions(data || []);
//   }, [user]);

//   useEffect(() => {
//     if (user && isFirstLoad.current) {
//       fetchRecentSessions();
//       isFirstLoad.current = false;
//     }
//   }, [user, fetchRecentSessions]);

//   const loadSessionData = useCallback(async (sessionId?: string) => {
//     if (!sessionId) {
//       setMessages([]);
//       setLoadingMessages(false);
//       currentLoadingIdRef.current = null;
//       return;
//     }

//     if (currentLoadingIdRef.current === sessionId) return;

//     setLoadingMessages(true);
//     currentLoadingIdRef.current = sessionId;

//     try {
//       const { data, error } = await supabase
//         .from("chat_messages")
//         .select("*")
//         .eq("chat_session_id", sessionId)
//         .order("created_at", { ascending: true });

//       if (!error && data) setMessages(data);
//     } catch (err) {
//       console.error("Failed to load messages:", err);
//     } finally {
//       setLoadingMessages(false);
//     }
//   }, []);

//   const handleSend = useCallback(
//     async (userQuery: string, sessionId: string | undefined, router: any) => {
//       if (!userQuery.trim() || isTyping || !user) return;

//       const query = userQuery.trim();
//       const isNewChat = !sessionId;

//       const optimisticMessage: Message = {
//         id: crypto.randomUUID(),
//         query,
//         response: null,
//         created_at: new Date().toISOString(),
//       };

//       let messageIndex = 0;
//       setMessages(prev => {
//         messageIndex = prev.length;
//         return [...prev, optimisticMessage];
//       });

//       setInput("");
//       setIsTyping(true);
//       setError(null);

//       try {
//         const res = await fetch("/api/chat/query", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ query, sessionId }),
//         });

//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Failed to send message");

//         setMessages(prev => {
//           const updated = [...prev];
//           if (updated[messageIndex]) {
//             updated[messageIndex] = {
//               ...updated[messageIndex],
//               id: data.messageId,
//               response: data.answer,
//             };
//           }
//           return updated;
//         });

//         if (isNewChat && data.sessionId) {
//           await fetchRecentSessions();
//           router.replace(`/chat/${data.sessionId}`);
//         }
//       } catch (err) {
//         console.error("Error sending message:", err);
//         setMessages(prev => prev.filter((_, i) => i !== messageIndex));
//         setError(err instanceof Error ? err.message : "Failed to send message");
//       } finally {
//         setIsTyping(false);
//       }
//     },
//     [isTyping, user, fetchRecentSessions]
//   );

//   const handleNewChat = useCallback(
//     (router: any, sessionId?: string) => {
//       if (isTyping) return;
//       setSidebarOpen(false);
//       router.replace("/chat");
//     },
//     [isTyping]
//   );

//   const handleSelectSession = useCallback(
//     (id: string, router: any, sessionId: string) => {
//       if (id !== sessionId) {
//         setError(null);
//         router.replace(`/chat/${id}`);
//         setSidebarOpen(false);
//       }
//     },
//     []
//   );

//   const value: ChatContextType = {
//     user,
//     initialLoading,
//     recentSessions,
//     messages,
//     input,
//     setInput,
//     isTyping,
//     error,
//     sidebarOpen,
//     setSidebarOpen,
//     loadingMessages,
//     fetchRecentSessions,
//     loadSessionData,
//     handleSend,
//     handleNewChat,
//     handleSelectSession,
//   };

//   return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
// };








// "use client";

// import {
//   createContext,
//   useContext,
//   useState,
//   useRef,
//   useEffect,
//   useCallback,
// } from "react";
// import { useAuth } from "./AuthContext";
// import { supabase } from "../lib/supabase/client";

// export interface Session {
//   id: string;
//   title: string;
//   message_count: number;
//   is_closed: boolean;
// }

// export interface Message {
//   id: string;
//   query: string;
//   response: string | null;
//   created_at: string;
//   context_used?: any;
//   isInitial?: boolean;
// }

// const INITIAL_MESSAGE = {
//   id: "initial",
//   query: "Hi there! I'm your CityCare AI assistant. How can I help you today?",
//   response: null,
//   created_at: new Date().toISOString(),
//   isInitial: true,
//   context_used: null,
// };

// export { INITIAL_MESSAGE };

// interface ChatContextType {
//   recentSessions: Session[];
//   messages: Message[];
//   input: string;
//   setInput: (input: string) => void;
//   isTyping: boolean;
//   error: string | null;
//   sidebarOpen: boolean;
//   setSidebarOpen: (open: boolean) => void;
//   loadingMessages: boolean;
//   fetchRecentSessions: () => Promise<void>;
//   loadSessionData: (sessionId: string | undefined) => Promise<void>;
//   handleSend: (
//     query: string,
//     sessionId: string | undefined,
//     router: any
//   ) => Promise<void>;
//   handleNewChat: (router: any, sessionId?: string) => void;
//   handleSelectSession: (id: string, router: any, sessionId: string) => void;
// }

// const ChatContext = createContext<ChatContextType>({} as ChatContextType);

// export const useChat = () => useContext(ChatContext);

// export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
//   const { user } = useAuth();

//   const [recentSessions, setRecentSessions] = useState<Session[]>([]);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [loadingMessages, setLoadingMessages] = useState(false);

//   const currentLoadingIdRef = useRef<string | null>(null);
//   const isFirstLoad = useRef(true);

//   useEffect(() => {
//     console.log("ChatContext is mounted")

//     return () => {
//       console.log("ChatContext is unmounted")
//     }
//   },[])

//   const fetchRecentSessions = useCallback(async () => {
//     if (!user) return;

//     const { data } = await supabase
//       .from("chat_sessions")
//       .select("id, title, message_count, is_closed")
//       .eq("user_id", user.id)
//       .eq("is_closed", false)
//       .order("created_at", { ascending: false })
//       .limit(5);

//     setRecentSessions(data || []);
//   }, [user]);

//   const loadSessionData = useCallback(async (sessionId: string | undefined) => {
//     if (!sessionId) {
//       console.log("On new chat")
//       setMessages([]);
//       setLoadingMessages(false);
//       currentLoadingIdRef.current = null;
//       return;
//     }

//     if (currentLoadingIdRef.current === sessionId) {
//       return;
//     }

//     setLoadingMessages(true);
//     currentLoadingIdRef.current = sessionId;

//     try {
//       const { data, error } = await supabase
//         .from("chat_messages")
//         .select("*")
//         .eq("chat_session_id", sessionId)
//         .order("created_at", { ascending: true });

//       if (!error && data) {
//         setMessages(data);
//       }
//     } catch (error: unknown) {
//       console.error("Failed to load messages for session:", error);
//     } finally {
//       setLoadingMessages(false);
//     }
//   }, []);

//   const handleSend = useCallback(
//     async (userQuery: string, sessionId: string | undefined, router: any) => {
//       if (!userQuery.trim() || isTyping || !user) return;

//       const query = userQuery.trim();
//       const isNewChat = !sessionId;

//       const optimisticMessage = {
//         id: crypto.randomUUID(),
//         query,
//         response: null,
//         created_at: new Date().toISOString(),
//       };

//       let messageIndex: number = 0;
//       setMessages((prev) => {
//         messageIndex = prev.length;
//         return [...prev, optimisticMessage];
//       });

//       setInput("");
//       setIsTyping(true);
//       setError(null);

//       try {
//         const res = await fetch("/api/chat/query", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ query, sessionId }),
//         });

//         const data = await res.json();

//         if (!res.ok) {
//           throw new Error(data.error || "Failed to send message");
//         }

//         setMessages((prev) => {
//           const updated = [...prev];
//           if (updated[messageIndex]) {
//             updated[messageIndex] = {
//               ...updated[messageIndex],
//               id: data.messageId,
//               response: data.answer,
//             };
//           }
//           return updated;
//         });

//         if (isNewChat && data.sessionId) {
//           await fetchRecentSessions();
//           router.replace(`/chat/${data.sessionId}`);
//         }
//       } catch (error) {
//         console.error("Error sending message:", error);
//         setMessages((prev) => prev.filter((_, i) => i !== messageIndex));
//         setError(
//           error instanceof Error ? error.message : "Failed to send message"
//         );
//       } finally {
//         setIsTyping(false);
//       }
//     },
//     [isTyping, user, fetchRecentSessions]
//   );

//   // Only drawback is that changing routes destroy that routes states like messages so clearing manually causes extra renders
//   // const handleNewChat = useCallback(
//   //   (router: any, sessionId?: string) => {
//   //     // 🛑 Guard 1: AI typing
//   //     if (isTyping) return;

//   //     // 🛑 Guard 2: already on /chat (new chat)
//   //     if (sessionId === undefined) {
//   //       console.log("[ChatContext] Already in new chat, skip");
//   //       return;
//   //     }

//   //     console.log("[ChatContext] Switching to new chat");

//   //     setMessages([]);
//   //     setError(null);
//   //     currentLoadingIdRef.current = null;
//   //     setSidebarOpen(false);

//   //     router.replace("/chat");
//   //   },
//   //   [isTyping]
//   // );

//   const handleNewChat = useCallback(
//     (router: any, sessionId?: string) => {
//       if (isTyping) return;

//       if (sessionId === undefined) {
//         return;
//       }

//       setSidebarOpen(false);
//       router.replace("/chat");
//     },
//     [isTyping]
//   );

//   const handleSelectSession = useCallback(
//     (id: string, router: any, sessionId: string) => {
//       if (id !== sessionId) {
//         setError(null);
//         router.replace(`/chat/${id}`);
//         setSidebarOpen(false);
//       }
//     },
//     []
//   );

//   useEffect(() => {
//     if (user && isFirstLoad.current) {
//       fetchRecentSessions();
//       isFirstLoad.current = false;
//     }
//   }, [fetchRecentSessions]);

//   const value = {
//     recentSessions,
//     messages,
//     input,
//     setInput,
//     isTyping,
//     error,
//     sidebarOpen,
//     setSidebarOpen,
//     loadingMessages,
//     fetchRecentSessions,
//     loadSessionData,
//     handleSend,
//     handleNewChat,
//     handleSelectSession,
//   };

//   return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
// };
