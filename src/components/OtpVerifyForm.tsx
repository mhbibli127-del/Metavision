"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readDevOtpHint, saveDevOtpHint } from "@/lib/auth";

export default function OtpVerifyForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    async function loadPending() {
      try {
        const response = await fetch("/api/auth/pending", { cache: "no-store" });
        if (!response.ok) {
          router.replace("/login");
          return;
        }
        const data = (await response.json()) as { phone: string; demo?: boolean };
        setPhone(data.phone);
        setDemoMode(Boolean(data.demo));
        setDevOtp(readDevOtpHint());
      } catch {
        router.replace("/login");
      }
    }

    loadPending();
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/resend-otp", { method: "POST" });
      const data = (await response.json()) as { error?: string; demo?: boolean; devOtp?: string };

      if (!response.ok) {
        setError(data.error ?? "Kod yenidən göndərilmədi.");
        return;
      }

      if (data.demo && data.devOtp) {
        saveDevOtpHint(data.devOtp);
        setDevOtp(data.devOtp);
        setDemoMode(true);
      }

      setResendCooldown(60);
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const otp = String(formData.get("otp") ?? "").trim();

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      const data = (await response.json()) as { error?: string; redirect?: string };

      if (!response.ok) {
        setError(data.error ?? "Kod yanlışdır.");
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
        <h1 className="login-card-title">Təsdiq</h1>
        <p className="login-card-subtitle">
          {phone
            ? demoMode
              ? `${phone} — WhatsApp API qoşulmayıb (demo rejim)`
              : `${phone} nömrəsinin WhatsApp-ına kod göndərildi`
            : "WhatsApp kodu göndərilir..."}
        </p>
      </div>

      {demoMode && devOtp ? (
        <p className="login-otp-hint" role="status">
          Test kodu: <strong>{devOtp}</strong>
          <br />
          Real WhatsApp üçün layihə kökündə <code>.env.local</code> faylına Twilio məlumatlarını əlavə edin.
        </p>
      ) : null}

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field" htmlFor="otp">
          <span className="login-field-label">WhatsApp kodu</span>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            className="login-field-input login-otp-input"
            placeholder="6 rəqəmli kod"
            autoComplete="one-time-code"
            required
            disabled={loading}
          />
        </label>

        {error ? <p className="login-otp-error">{error}</p> : null}

        <div className="login-form-actions">
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Yoxlanılır..." : "Təsdiqlə"}
          </button>
        </div>
      </form>

      <button
        type="button"
        className="login-resend-btn"
        onClick={handleResend}
        disabled={resendCooldown > 0 || loading}
      >
        {resendCooldown > 0 ? `Yenidən göndər (${resendCooldown}s)` : "Kodu yenidən göndər"}
      </button>

      <Link href="/login" className="login-back-link">
        Geri qayıt
      </Link>
    </div>
  );
}
