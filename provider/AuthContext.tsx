'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";
import { User } from "@supabase/supabase-js";


interface AuthContextType {
  user: User | null;
  initialLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Auth Initialization
    useEffect(() => {
      console.log("[3] Auth useEffect Hook firing (Mount)");
      const initUser = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          console.log("[4] User found, setting state");
          setUser(user);
        } else {
          console.log("[4] No user, signing in anonymously");
          const {
            data: { user: anonUser },
          } = await supabase.auth.signInAnonymously();
          if (anonUser) {
            setUser(anonUser);
          }
        }
        setInitialLoading(false);
  
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            console.log(`[Auth State Change] Event: ${_event}`);
            setUser(session?.user || null);
          }
        );
  
        return () => {
          authListener.subscription.unsubscribe();
        };
      };
      initUser();
    }, []);

  

  return (
    <AuthContext.Provider value={{ user, initialLoading }}>
      {children}
    </AuthContext.Provider>
  );
};