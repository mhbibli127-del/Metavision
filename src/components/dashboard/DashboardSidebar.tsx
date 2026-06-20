"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchSession, getDemoEmail, getInitials, logoutSession } from "@/lib/auth";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Orders", href: "/dashboard/orders" },
  { label: "Menu", href: "/dashboard/menu" },
  { label: "Reservations", href: "/dashboard/reservations" },
  { label: "Tables", href: "/dashboard/tables" },
  { label: "Restaurant info", href: "/dashboard/restaurant" },
] as const;

function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [displayName, setDisplayName] = useState("User");
  const [email, setEmail] = useState("user@gmail.com");
  const [phone, setPhone] = useState("");
  const [initials, setInitials] = useState("MV");

  useEffect(() => {
    async function loadUser() {
      const user = await fetchSession();
      if (!user) {
        router.replace("/login");
        return;
      }
      setDisplayName(`${user.firstName} ${user.lastName}`.trim() || "User");
      setEmail(getDemoEmail(user.firstName, user.lastName));
      setPhone(user.phone);
      setInitials(getInitials(user.firstName, user.lastName));
      setReady(true);
    }

    loadUser();
  }, [router]);

  async function handleSignOut() {
    await logoutSession();
    router.push("/login");
  }

  if (!ready) return null;

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-top">
        <Link href="/" className="dash-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-logo.png" alt="" className="dash-brand-icon" width={40} height={40} />
          <div className="dash-brand-copy">
            <span className="dash-brand-name">METAVISION</span>
            <span className="dash-brand-tagline">&ldquo;AI THAT WORKS FOR YOUR BUSINESS&rdquo;</span>
          </div>
        </Link>

        <div className="dash-profile">
          <div className="dash-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="dash-profile-info">
            <p className="dash-profile-name">{displayName}</p>
            <p className="dash-profile-meta">{email}</p>
            <p className="dash-profile-meta">{phone}</p>
          </div>
          <button type="button" className="dash-edit-btn">
            Edit profile
          </button>
        </div>

        <nav className="dash-nav" aria-label="Dashboard">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-nav-link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button type="button" className="dash-signout" onClick={handleSignOut}>
        <SignOutIcon />
        Sign Out
      </button>
    </aside>
  );
}
