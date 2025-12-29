import { createBrowserClient } from "@supabase/ssr";
// import { Database } from "./types";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
