"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/provider/AuthContext";

export function DashboardAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, authLoading, isAnonymous } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || isAnonymous) {
      setRedirecting(true);
      router.replace("/login");
    }
    console.log("Dashboard user is present:", user)
  }, [user, authLoading, isAnonymous, router]);

  if (authLoading || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
