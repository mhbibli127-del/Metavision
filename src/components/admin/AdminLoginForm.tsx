"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPrefill() {
      const response = await fetch("/api/auth/admin/prefill", { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { phone: string; isAdminPhone: boolean };
        if (data.isAdminPhone) {
          setPhone(data.phone);
        }
      }
    }

    loadPrefill();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, phone }),
      });

      const data = (await response.json()) as { error?: string; redirect?: string };

      if (!response.ok) {
        setError(data.error ?? "Admin girişi alınmadı.");
        return;
      }

      router.push(data.redirect ?? "/admin");
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <div className="login-card-header">
        <h1 className="login-card-title">Admin Login</h1>
        <p className="login-card-subtitle">Yalnız icazəli nömrələr · test rejimi</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field" htmlFor="admin-phone">
          <span className="login-field-label">Nömrə</span>
          <input
            id="admin-phone"
            type="tel"
            className="login-field-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
            disabled={loading}
          />
        </label>

        <label className="login-field" htmlFor="admin-password">
          <span className="login-field-label">Password</span>
          <input
            id="admin-password"
            type="password"
            className="login-field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={loading}
          />
        </label>

        {error ? <p className="login-otp-error">{error}</p> : null}

        <div className="login-form-actions">
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Giriş..." : "Admin girişi"}
          </button>
        </div>
      </form>

      <Link href="/select-panel" className="login-back-link">
        Panel seçiminə qayıt
      </Link>
    </div>
  );
}
