import type { Metadata } from "next";
import LandingBackground from "@/components/LandingBackground";
import OtpVerifyForm from "@/components/OtpVerifyForm";

export const metadata: Metadata = {
  title: "SMS Təsdiqi — Metavision",
  description: "Telefon nömrənizi təsdiqləyin.",
};

export default function VerifyPage() {
  return (
    <div className="page-shell">
      <section className="login-frame landing-frame" aria-label="SMS verification">
        <LandingBackground />
        <div className="login-panel">
          <OtpVerifyForm />
        </div>
      </section>
    </div>
  );
}
