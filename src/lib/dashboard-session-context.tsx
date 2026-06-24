"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchSession, getDemoEmail, getInitials } from "@/lib/auth";
import type { UserSession } from "@/lib/auth-types";

type DashboardSessionContextValue = {
  user: UserSession;
  displayName: string;
  email: string;
  initials: string;
};

const DashboardSessionContext = createContext<DashboardSessionContextValue | null>(null);

export function DashboardSessionProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: UserSession;
}) {
  const [user, setUser] = useState<UserSession>(initialUser);

  useEffect(() => {
    void fetchSession().then((session) => {
      if (session) setUser(session);
    });
  }, []);

  const value = useMemo(() => {
    const displayName = `${user.firstName} ${user.lastName}`.trim() || "User";
    return {
      user,
      displayName,
      email: getDemoEmail(user.firstName, user.lastName),
      initials: getInitials(user.firstName, user.lastName),
    };
  }, [user]);

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
