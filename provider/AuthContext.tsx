"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  isAnonymous: boolean;
  ensureAnonymous: () => Promise<void>;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);


   // useEffect(() => {
    //   const initAuth = async () => {
    //     const {
    //       data: { user: currentUser },
    //     } = await supabase.auth.getUser();
    //     if (currentUser) {
    //       setUser(currentUser);
    //     } else {
    //       const {
    //         data: { user: anonUser },
    //       } = await supabase.auth.signInAnonymously();
    //       if (anonUser) setUser(anonUser);
    //     }
    //     setInitialLoading(false);
  
    //     const { data: authListener } = supabase.auth.onAuthStateChange(
    //       (_event, session) => {
    //         setUser(session?.user || null);
    //       }
    //     );
  
    //     return () => authListener.subscription.unsubscribe();
    //   };
  
    //   initAuth();
    // }, []);
   

  /* Initial session check */
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        setIsAnonymous(!!user.is_anonymous);
      }

      setAuthLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        setIsAnonymous(!!u?.is_anonymous);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /* Create anon ONLY when needed */
  const ensureAnonymous = useCallback(async () => {
    if (user) return;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;

    setUser(data.user);
    setIsAnonymous(true);
  }, [user]);

  /* Convert anon → admin safely */
  const signInWithPassword = async (email: string, password: string) => {
    try {
      // IMPORTANT: destroy anon session first
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user);
      setIsAnonymous(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updatePassword = useCallback(
  async (newPassword: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Update password error:", error);
        return {
          success: false,
          error: error.message || "Failed to update password",
        };
      }

      return { success: true };
    } catch (err) {
      console.error("Update password exception:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update password",
      };
    }
  },
  []
);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAnonymous(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        isAnonymous,
        ensureAnonymous,
        signInWithPassword,
        logout,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
