"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSession } from "@/lib/auth";

export default function DashboardAuthGate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const user = await fetchSession();
      if (!user) {
        router.replace("/login");
        return;
      }
      setReady(true);
    }

    checkSession();
  }, [router]);

  if (!ready) return null;

  return <>{children}</>;
}
