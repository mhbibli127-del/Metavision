"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveDevOtpHint } from "@/lib/auth";

const fields = [
  { id: "firstName", label: "Ad", type: "text", autoComplete: "given-name" },
  { id: "lastName", label: "Soyad", type: "text", autoComplete: "family-name" },
  { id: "phone", label: "Nömrə", type: "tel", autoComplete: "tel" },
  { id: "password", label: "Parol", type: "password", autoComplete: "current-password" },
] as const;

type LoginMode = "password" | "otp";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>("password");
  const [ssoGoogle, setSsoGoogle] = useState(false);
  const [ssoSaml, setSsoSaml] = useState(false);

  useEffect(() => {
    const ssoErr = searchParams.get("error");
    if (ssoErr === "sso_denied") setError("Google girişi ləğv edildi.");
    else if (ssoErr === "sso_failed") setError("SSO girişi uğursuz oldu.");
    else if (ssoErr === "sso_not_configured") setError("SSO konfiqurasiya edilməyib.");
    else if (ssoErr === "sso_saml_scaffold") setError("SAML SSO hazırlanır — parol və ya WhatsApp OTP istifadə edin.");
    fetch("/api/auth/sso/status")
      .then((r) => r.json())
      .then((d) => {
        setSsoGoogle(Boolean(d.google));
        setSsoSaml(Boolean(d.saml));
      })
      .catch(() => {});
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };

    try {
      if (mode === "otp") {
        const response = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as { error?: string; demo?: boolean; devOtp?: string };
        if (!response.ok) {
          setError(data.error ?? "OTP göndərilmədi.");
          return;
        }
        if (data.demo && data.devOtp) saveDevOtpHint(data.devOtp);
        router.push("/login/verify");
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string; redirect?: string };

      if (!response.ok) {
        setError(data.error ?? "Giriş alınmadı.");
        return;
      }

      router.push(data.redirect ?? "/dashboard/orders");
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <div className="login-card-header">
        <h1 className="login-card-title">Login</h1>
        <p className="login-card-subtitle">Hesabınıza daxil olun</p>
      </div>

      <div className="login-mode-tabs">
        <button type="button" className={mode === "password" ? "is-active" : ""} onClick={() => setMode("password")}>
          Parol
        </button>
        <button type="button" className={mode === "otp" ? "is-active" : ""} onClick={() => setMode("otp")}>
          WhatsApp OTP
        </button>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-form-grid">
          {fields.map((field) => (
            <label key={field.id} className="login-field" htmlFor={field.id}>
              <span className="login-field-label">{field.label}</span>
              <input
                id={field.id}
                name={field.id}
                type={field.type}
                className="login-field-input"
                autoComplete={field.autoComplete}
                required
                disabled={loading}
              />
            </label>
          ))}
        </div>

        {error ? <p className="login-otp-error">{error}</p> : null}

        <div className="login-form-actions">
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Gözləyin..." : mode === "otp" ? "WhatsApp kodu göndər" : "Daxil ol"}
          </button>
          {ssoGoogle ? (
            <a href="/api/auth/sso/google" className="login-submit-btn login-submit-btn--secondary">
              Google ilə daxil ol
            </a>
          ) : null}
          {ssoSaml ? (
            <a href="/api/auth/sso/saml" className="login-submit-btn login-submit-btn--secondary">
              Enterprise SAML SSO
            </a>
          ) : null}
        </div>
      </form>

      <Link href="/" className="login-back-link">
        Ana səhifəyə qayıt
      </Link>
    </div>
  );
}
