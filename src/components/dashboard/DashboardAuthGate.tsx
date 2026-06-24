"use client";

/** Session is validated once in DashboardSessionProvider. */
export default function DashboardAuthGate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
