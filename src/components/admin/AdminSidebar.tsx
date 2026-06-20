"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Clients", href: "/admin/clients" },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    router.push("/select-panel");
  }

  return (
    <aside className="admin-sidebar">
      <div>
        <div className="admin-brand-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-logo.png" alt="" className="admin-brand-icon" width={36} height={36} />
          <div>
            <div className="admin-brand">METAVISION</div>
            <div className="admin-brand-sub">&ldquo;AI THAT WORKS FOR YOUR BUSINESS&rdquo;</div>
          </div>
        </div>

        <p className="admin-nav-heading">Main</p>
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
        <div className="admin-plan-card">
          <div className="admin-plan-row">
            <span className="admin-plan-avatar" aria-hidden="true">
              A
            </span>
            <div>
              <span className="admin-plan-title">Admin Panel</span>
              <span className="admin-plan-sub">Gold Plan is Active</span>
            </div>
          </div>
        </div>
        <button type="button" className="admin-signout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
