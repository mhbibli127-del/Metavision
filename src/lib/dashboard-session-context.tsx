"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { fetchSession, getDemoEmail, getInitials } from "@/lib/auth";
import type { UserSession } from "@/lib/auth-types";

type DashboardSessionContextValue = {
  user: UserSession;
  displayName: string;
  email: string;
  initials: string;
};

const DashboardSessionContext = createContext<DashboardSessionContextValue | null>(null);

export function DashboardSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const session = await fetchSession();
      if (cancelled) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const value = useMemo(() => {
    if (!user) return null;
    const displayName = `${user.firstName} ${user.lastName}`.trim() || "User";
    return {
      user,
      displayName,
      email: getDemoEmail(user.firstName, user.lastName),
      initials: getInitials(user.firstName, user.lastName),
    };
  }, [user]);

  if (user === undefined) {
    return (
      <div className="dash-page" style={{ padding: 24 }}>
        <p className="tm-subtitle">Yüklənir…</p>
      </div>
    );
  }

  if (!value) return null;

  return (
    <DashboardSessionContext.Provider value={value}>{children}</DashboardSessionContext.Provider>
  );
}

export function useDashboardSession() {
  const ctx = useContext(DashboardSessionContext);
  if (!ctx) {
    throw new Error("useDashboardSession must be used within DashboardSessionProvider");
  }
  return ctx;
}
