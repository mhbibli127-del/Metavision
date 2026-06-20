"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AdminUser = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
};

export function useAdminSession() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/auth/admin/session", { cache: "no-store" });
      if (!response.ok) {
        router.replace("/admin/login");
        return;
      }
      const data = (await response.json()) as { admin: AdminUser };
      setAdmin(data.admin);
      setReady(true);
    }

    load();
  }, [router]);

  return { admin, ready };
}

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { ready } = useAdminSession();
  if (!ready) {
    return <div className="admin-loading" aria-busy="true" />;
  }
  return children;
}
