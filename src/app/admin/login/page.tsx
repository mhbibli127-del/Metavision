import type { Metadata } from "next";
import LandingBackground from "@/components/LandingBackground";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login — Metavision",
};

export default function AdminLoginPage() {
  return (
    <div className="page-shell">
      <section className="login-frame landing-frame" aria-label="Admin login">
        <LandingBackground />
        <div className="login-panel">
          <AdminLoginForm />
        </div>
      </section>
    </div>
  );
}
