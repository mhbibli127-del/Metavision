"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const fields = [
  { id: "firstName", label: "Ad", type: "text", autoComplete: "given-name" },
  { id: "lastName", label: "Soyad", type: "text", autoComplete: "family-name" },
  { id: "phone", label: "Nömrə", type: "tel", autoComplete: "tel" },
  { id: "password", label: "Password", type: "password", autoComplete: "current-password" },
] as const;

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
            {loading ? "Giriş..." : "Login"}
          </button>
        </div>
      </form>

      <Link href="/" className="login-back-link">
        Ana səhifəyə qayıt
      </Link>
    </div>
  );
}
