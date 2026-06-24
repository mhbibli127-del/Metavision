"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutSession } from "@/lib/auth";
import { useDashboardSession } from "@/lib/dashboard-session-context";
import { useDashboardShell } from "@/lib/dashboard-shell-context";
import { useEffect } from "react";
import UserProfileEdit from "@/components/dashboard/UserProfileEdit";
import { useI18n } from "@/lib/i18n-context";

const intelligenceNavItems = [
  { labelKey: "navCommandCenter", href: "/dashboard/command-center", icon: "signal" },
  { labelKey: "navDashboard", href: "/dashboard/tastemind", icon: "grid" },
  { labelKey: "navTasteDna", href: "/dashboard/taste-dna", icon: "dna" },
  { labelKey: "navPredictions", href: "/dashboard/predictions", icon: "pulse" },
  { labelKey: "navGlobalTrends", href: "/dashboard/global-trends", icon: "globe" },
  { labelKey: "navMarketIntel", href: "/dashboard/market-intelligence", icon: "signal" },
  { labelKey: "navMenuAi", href: "/dashboard/menu-optimization", icon: "pulse" },
  { labelKey: "navPricingEngine", href: "/dashboard/pricing-engine", icon: "pulse" },
  { labelKey: "navIntegrations", href: "/dashboard/integrations", icon: "api" },
  { labelKey: "navPayments", href: "/dashboard/payments", icon: "grid" },
  { labelKey: "navSimulator", href: "/dashboard/simulator", icon: "flask" },
  { labelKey: "navSocialSignals", href: "/dashboard/social-signals", icon: "ads" },
  { labelKey: "navApiAccess", href: "/dashboard/api-access", icon: "api" },
  { labelKey: "navSettings", href: "/dashboard/settings", icon: "settings" },
] as const;

const operationsNavItems = [
  { labelKey: "finance", href: "/dashboard/finance" },
  { labelKey: "branches", href: "/dashboard/branches" },
  { labelKey: "schedule", href: "/dashboard/schedule" },
  { labelKey: "orders", href: "/dashboard/orders" },
  { labelKey: "navKds", href: "/dashboard/kds" },
  { labelKey: "menu", href: "/dashboard/menu" },
  { labelKey: "reservations", href: "/dashboard/reservations" },
  { labelKey: "navWaitlist", href: "/dashboard/waitlist" },
  { labelKey: "tables", href: "/dashboard/tables" },
  { labelKey: "navFloorPlan", href: "/dashboard/floor-plan" },
  { labelKey: "restaurantInfo", href: "/dashboard/restaurant" },
  { labelKey: "subscription", href: "/dashboard/subscription" },
  { labelKey: "notifications", href: "/dashboard/notifications" },
  { labelKey: "staff", href: "/dashboard/staff" },
  { labelKey: "customers", href: "/dashboard/customers" },
  { labelKey: "inventory", href: "/dashboard/inventory" },
  { labelKey: "reports", href: "/dashboard/reports" },
  { labelKey: "auditLogs", href: "/dashboard/audit-logs" },
  { labelKey: "aiIntegration", href: "/dashboard/ai-integration" },
] as const;

function NavIcon({ type }: { type: string }) {
  if (type === "dna") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M7 3c0 6 10 6 10 12" />
        <path d="M17 3c0 6-10 6-10 12" />
        <path d="M8 8h8M8 16h8" />
      </svg>
    );
  }

  if (type === "pulse") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 12h-4l-3 7-4-14-3 7H2" />
      </svg>
    );
  }

  if (type === "globe") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
      </svg>
    );
  }

  if (type === "flask") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10 2v6l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V2" />
        <path d="M8 13h8" />
      </svg>
    );
  }

  if (type === "signal") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 18h4v-6H3v6zm7 0h4V8h-4v10zm7 0h4V4h-4v14z" />
      </svg>
    );
  }

  if (type === "ads") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 17V7M12 17v-4M17 17v-8" />
      </svg>
    );
  }

  if (type === "api") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M8 9l-5 3 5 3M16 9l5 3-5 3M10 19l4-14" />
      </svg>
    );
  }

  if (type === "settings") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

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
  const { sidebarOpen, closeSidebar } = useDashboardShell();
  const { t, locale, setLocale } = useI18n();
  const { displayName, email, initials, user } = useDashboardSession();
  const phone = user.phone;

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  async function handleSignOut() {
    await logoutSession();
    router.push("/login");
  }

  return (
    <>
      {sidebarOpen ? (
        <div
          className="dash-sidebar-backdrop is-visible"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      ) : null}
      <aside className={`dash-sidebar${sidebarOpen ? " is-open" : ""}`}>
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
            <div className="dash-profile-body">
              <div className="dash-avatar" aria-hidden="true">
                {initials}
              </div>
              <div className="dash-profile-info">
                <p className="dash-profile-name">{displayName}</p>
                <p className="dash-profile-meta">{email}</p>
                {phone ? <p className="dash-profile-meta">{phone}</p> : null}
              </div>
            </div>
            <UserProfileEdit />
          </div>

          <nav className="dash-nav" aria-label="Dashboard">
            <p className="dash-nav-group-title">{t("tasteMindAi")}</p>
            {intelligenceNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`dash-nav-link${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="dash-nav-icon" aria-hidden="true">
                    <NavIcon type={item.icon} />
                  </span>
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}

            <p className="dash-nav-group-title">{t("operations")}</p>
            {operationsNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`dash-nav-link${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="dash-nav-icon" aria-hidden="true">
                    <NavIcon type="grid" />
                  </span>
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="dash-locale-switch">
            <span className="dash-locale-label">{t("language")}</span>
            <button type="button" className={locale === "az" ? "is-active" : ""} onClick={() => setLocale("az")}>AZ</button>
            <button type="button" className={locale === "en" ? "is-active" : ""} onClick={() => setLocale("en")}>EN</button>
          </div>
        </div>

        <button type="button" className="dash-signout" onClick={handleSignOut}>
          <SignOutIcon />
          {t("signOut")}
        </button>
      </aside>
    </>
  );
}
