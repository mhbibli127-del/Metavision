"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/admin" },
  { label: "Restaurants", href: "/admin/restaurants" },
  { label: "Clients", href: "/admin/clients" },
  { label: "AI Monitoring", href: "/admin/ai-monitoring" },
  { label: "Billing", href: "/admin/billing" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "System", href: "/admin/system" },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="admin-sidebar">
      <div>
        <div className="admin-brand-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-logo.png" alt="" className="admin-brand-icon" width={36} height={36} />
          <div>
            <div className="admin-brand">METAVISION</div>
            <div className="admin-brand-sub">Control Tower</div>
          </div>
        </div>

        <p className="admin-nav-heading">Platform</p>
        <nav className="admin-nav" aria-label="Admin">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        <button type="button" className="admin-signout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
