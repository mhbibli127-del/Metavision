"use client";

import { useEffect, useState } from "react";

type Settings = {
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    language: string;
    emailNotifications: boolean;
    whatsappNotifications: boolean;
  };
  restaurant: { name: string; city: string; currency: string } | null;
  subscription: { plan: string; status: string } | null;
  integrations: {
    metaAds: { connected: boolean; status?: string };
    aiBackend: boolean;
  };
  intelligence: {
    predictionSensitivity: number;
    alertCadenceMinutes: number;
    advisorMode: string;
    modules: string[];
  };
};

import { useI18n } from "@/lib/i18n-context";

export default function SettingsView() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  async function toggle(field: "emailNotifications" | "whatsappNotifications") {
    if (!settings) return;
    setSaving(true);
    const next = { ...settings.profile, [field]: !settings.profile[field] };
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailNotifications: next.emailNotifications,
        whatsappNotifications: next.whatsappNotifications,
        language: next.language,
      }),
    });
    const data = await res.json();
    if (data.settings) {
      setSettings(data.settings);
      setMessage("Yadda saxlanıldı");
    }
    setSaving(false);
  }

  if (!settings) {
    return <div className="dash-page"><p className="tm-subtitle">{t("loading")}</p></div>;
  }

  const { profile, restaurant, subscription, integrations, intelligence } = settings;

  return (
    <div className="dash-page tm-page">
      <section className="tm-card">
        <p className="tm-overline">TasteMind AI</p>
        <h1 className="tm-title">{t("settingsTitle")}</h1>
        <p className="tm-subtitle">{t("settingsSubtitle")}</p>
        {message && <p className="dash-profile-message dash-profile-message--success">{message}</p>}
      </section>

      <div className="tm-settings-grid">
        <article className="tm-card">
          <h3>Profil</h3>
          <p>{profile.firstName} {profile.lastName}</p>
          <p>{profile.phone}</p>
          <p>{profile.email ?? "—"}</p>
          {restaurant && <p>{restaurant.name} · {restaurant.city} · {restaurant.currency}</p>}
        </article>

        <article className="tm-card">
          <h3>Bildirişlər</h3>
          <label className="dash-restaurant-field">
            <input
              type="checkbox"
              checked={profile.emailNotifications}
              disabled={saving}
              onChange={() => toggle("emailNotifications")}
            />
            <span> Email bildirişləri</span>
          </label>
          <label className="dash-restaurant-field">
            <input
              type="checkbox"
              checked={profile.whatsappNotifications}
              disabled={saving}
              onChange={() => toggle("whatsappNotifications")}
            />
            <span> WhatsApp bildirişləri</span>
          </label>
        </article>

        <article className="tm-card">
          <h3>Abunəlik</h3>
          <p>{subscription ? `${subscription.plan.toUpperCase()} — ${subscription.status}` : "Plan təyin edilməyib"}</p>
        </article>

        <article className="tm-card">
          <h3>İnteqrasiyalar</h3>
          <p>Meta Ads: {integrations.metaAds.connected ? `✓ ${integrations.metaAds.status}` : "Qoşulmayıb"}</p>
          <p>AI Backend: {integrations.aiBackend ? "✓ Aktiv" : "Offline"}</p>
        </article>

        <article className="tm-card">
          <h3>Prediction Sensitivity</h3>
          <p>Confidence floor: {intelligence.predictionSensitivity}% (DB + market signals)</p>
        </article>

        <article className="tm-card">
          <h3>Modullar</h3>
          <ul className="tm-list">
            {intelligence.modules.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
