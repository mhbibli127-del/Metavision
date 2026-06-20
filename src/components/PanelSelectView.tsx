"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LandingBackground from "@/components/LandingBackground";

type PanelChoice = "restaurant" | "admin";

export default function PanelSelectView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [choice, setChoice] = useState<PanelChoice>("restaurant");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/auth/admin/prefill", { cache: "no-store" });
      if (!response.ok) {
        router.replace("/login");
        return;
      }
      const data = (await response.json()) as {
        firstName: string;
        lastName: string;
        phone: string;
        isAdminPhone: boolean;
      };
      if (!data.isAdminPhone) {
        router.replace("/dashboard/orders");
        return;
      }
      setName(`${data.firstName} ${data.lastName}`.trim());
      setPhone(data.phone);
      setReady(true);
    }

    load();
  }, [router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (choice === "restaurant") {
      router.push("/dashboard/orders");
      return;
    }

    router.push("/admin/login");
  }

  if (!ready) return null;

  return (
    <div className="page-shell">
      <section className="login-frame landing-frame" aria-label="Panel seçimi">
        <LandingBackground />
        <div className="login-panel login-panel--wide">
          <div className="login-card panel-select-card">
            <div className="login-card-header">
              <h1 className="login-card-title">Panel seçimi</h1>
              <p className="login-card-subtitle">
                Salam, {name || "Admin"}. Hansı panelə daxil olmaq istəyirsiniz?
              </p>
              <p className="panel-select-phone">{phone}</p>
            </div>

            <form className="panel-select-form" onSubmit={handleSubmit}>
              <fieldset className="panel-select-fieldset">
                <legend className="panel-select-legend">Panel növü</legend>

                <label className={`panel-select-option${choice === "restaurant" ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="panel"
                    value="restaurant"
                    className="panel-select-radio"
                    checked={choice === "restaurant"}
                    onChange={() => setChoice("restaurant")}
                  />
                  <span className="panel-select-option-body">
                    <span className="panel-select-option-title">Restoran paneli</span>
                    <span className="panel-select-option-desc">
                      Sifarişlər, masa, menyu, rezervasiya
                    </span>
                  </span>
                </label>

                <label className={`panel-select-option panel-select-option--admin${choice === "admin" ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="panel"
                    value="admin"
                    className="panel-select-radio"
                    checked={choice === "admin"}
                    onChange={() => setChoice("admin")}
                  />
                  <span className="panel-select-option-body">
                    <span className="panel-select-option-title">Admin paneli</span>
                    <span className="panel-select-option-desc">
                      Bütün restoranlar, abunəlik, statistika
                    </span>
                  </span>
                </label>
              </fieldset>

              {error ? <p className="login-otp-error">{error}</p> : null}

              <div className="login-form-actions">
                <button type="submit" className="login-submit-btn">
                  Davam et
                </button>
              </div>
            </form>

            <button
              type="button"
              className="login-back-link"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              }}
            >
              Çıxış
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
