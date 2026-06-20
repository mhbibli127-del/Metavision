import type { Metadata } from "next";
import LandingBackground from "@/components/LandingBackground";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login — Metavision",
  description: "Metavision hesabınıza daxil olun.",
};

export default function LoginPage() {
  return (
    <div className="page-shell">
      <section className="login-frame landing-frame" aria-label="Login">
        <LandingBackground />
        <div className="login-panel">
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
