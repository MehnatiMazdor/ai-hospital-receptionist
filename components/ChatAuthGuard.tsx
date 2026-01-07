"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/provider/AuthContext";

export function ChatAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authLoading, ensureAnonymous } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const init = async () => {
      try {
        if (!user) {
          await ensureAnonymous();
        }
      } catch (err) {
        console.error(err);
        setError("Failed to initialize chat session.");
      }
    };

    init();
  }, [authLoading, user, ensureAnonymous]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-6 rounded shadow max-w-md text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-3">
            Chat unavailable
          </h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
