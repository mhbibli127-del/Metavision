"use client";

import { useDashboardShell } from "@/lib/dashboard-shell-context";
import { Button, ButtonLink } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { useI18n } from "@/lib/i18n-context";

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function DashboardTopBar() {
  const { toggle, theme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const { toggleSidebar } = useDashboardShell();

  function exportPdf() {
    window.open("/api/reports/daily?format=html", "_blank", "noopener,noreferrer");
  }

  return (
    <header className="dash-topbar">
      <div className="dash-topbar-left">
        <button
          type="button"
          className="dash-mobile-menu-btn"
          onClick={toggleSidebar}
          aria-label="Menyunu aç"
        >
          <MenuIcon />
        </button>
        <div>
          <span className="dash-topbar-eyebrow">{t("operationsConsole")}</span>
          <h2 className="dash-topbar-title">{t("dashboard")}</h2>
        </div>
      </div>
      <div className="dash-topbar-actions">
        <button type="button" className="dash-currency-btn" onClick={toggle} title={theme === "dark" ? t("lightMode") : t("darkMode")}>
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <button type="button" className="dash-currency-btn" onClick={() => setLocale(locale === "az" ? "en" : "az")}>
          {locale.toUpperCase()}
        </button>
        <Button variant="secondary" onClick={exportPdf}>
          {t("pdfReport")}
        </Button>
        <ButtonLink href="/waiter" variant="primary">
          {t("waiterPanel")}
        </ButtonLink>
      </div>
    </header>
  );
}
