import type { Metadata } from "next";
import { Suspense } from "react";
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
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
