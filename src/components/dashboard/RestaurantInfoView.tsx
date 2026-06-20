"use client";

import { FormEvent, useRef, useState, type ChangeEvent } from "react";
import type { PaymentMethod, RestaurantInfo } from "@/data/restaurant-info";
import { PAYMENT_OPTIONS, staticRestaurantInfo } from "@/data/restaurant-info";

function RefreshIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

export default function RestaurantInfoView() {
  const [info, setInfo] = useState<RestaurantInfo>(staticRestaurantInfo);
  const [savedMessage, setSavedMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateField<K extends keyof RestaurantInfo>(key: K, value: RestaurantInfo[K]) {
    setInfo((prev) => ({ ...prev, [key]: value }));
    setSavedMessage("");
  }

  function togglePayment(method: PaymentMethod) {
    setInfo((prev) => {
      const exists = prev.paymentMethods.includes(method);
      const paymentMethods = exists
        ? prev.paymentMethods.filter((item) => item !== method)
        : [...prev.paymentMethods, method];
      return { ...prev, paymentMethods };
    });
    setSavedMessage("");
  }

  function handleRefresh() {
    setInfo(staticRestaurantInfo);
    setSavedMessage("");
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    updateField("imageName", file.name);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedMessage("Dəyişikliklər yadda saxlanıldı.");
  }

  return (
    <div className="dash-page dash-restaurant-page">
      <header className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Restaurant Info</h1>
          <p className="dash-page-subtitle">Manage your public profile and business details</p>
        </div>
        <button type="button" className="dash-refresh-btn" aria-label="Refresh restaurant info" onClick={handleRefresh}>
          <RefreshIcon />
        </button>
      </header>

      <form className="dash-restaurant-layout" onSubmit={handleSubmit}>
        <section className="dash-restaurant-card">
          <h2 className="dash-restaurant-card-title">Address and Contact</h2>

          <label className="dash-restaurant-field">
            <span className="dash-restaurant-label">Address</span>
            <input
              className="dash-restaurant-input"
              value={info.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </label>

          <label className="dash-restaurant-field">
            <span className="dash-restaurant-label">Opening hours</span>
            <input
              className="dash-restaurant-input"
              value={info.openingHours}
              onChange={(e) => updateField("openingHours", e.target.value)}
            />
          </label>

          <label className="dash-restaurant-field">
            <span className="dash-restaurant-label">Phone number</span>
            <input
              type="tel"
              className="dash-restaurant-input"
              value={info.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </label>

          <label className="dash-restaurant-field">
            <span className="dash-restaurant-label">E-Mail</span>
            <input
              type="email"
              className="dash-restaurant-input"
              value={info.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </label>

          <label className="dash-restaurant-field">
            <span className="dash-restaurant-label">Website</span>
            <textarea
              className="dash-restaurant-textarea dash-restaurant-textarea--sm"
              value={info.website}
              onChange={(e) => updateField("website", e.target.value)}
              rows={2}
            />
          </label>
        </section>

        <section className="dash-restaurant-card">
          <h2 className="dash-restaurant-card-title">Address and Contact</h2>

          <label className="dash-restaurant-field">
            <span className="dash-restaurant-label">Parking</span>
            <textarea
              className="dash-restaurant-textarea"
              value={info.parking}
              onChange={(e) => updateField("parking", e.target.value)}
              rows={3}
            />
          </label>

          <label className="dash-restaurant-field">
            <span className="dash-restaurant-label">Amenities</span>
            <textarea
              className="dash-restaurant-textarea"
              value={info.amenities}
              onChange={(e) => updateField("amenities", e.target.value)}
              rows={3}
            />
          </label>

          <div className="dash-restaurant-field">
            <span className="dash-restaurant-label">Pay</span>
            <div className="dash-restaurant-chips">
              {PAYMENT_OPTIONS.map((method) => {
                const active = info.paymentMethods.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    className={`dash-restaurant-chip${active ? " is-active" : ""}`}
                    onClick={() => togglePayment(method)}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="dash-restaurant-card">
          <h2 className="dash-restaurant-card-title">Campaign</h2>

          <label className="dash-restaurant-field">
            <span className="dash-restaurant-label">Active campaigns</span>
            <textarea
              className="dash-restaurant-textarea dash-restaurant-textarea--tall"
              value={info.activeCampaigns}
              onChange={(e) => updateField("activeCampaigns", e.target.value)}
              rows={6}
            />
          </label>
        </section>

        <section className="dash-restaurant-card">
          <h2 className="dash-restaurant-card-title">Restaurant image</h2>

          <button
            type="button"
            className="dash-restaurant-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon />
            <span className="dash-restaurant-upload-title">Click to upload image</span>
            <span className="dash-restaurant-upload-sub">PNG, JPG, WEBP — max. 5 MB</span>
            {info.imageName ? <span className="dash-restaurant-upload-file">{info.imageName}</span> : null}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="dash-restaurant-file-input"
            onChange={handleImageChange}
          />
        </section>

        <div className="dash-restaurant-footer">
          {savedMessage ? <p className="dash-restaurant-saved">{savedMessage}</p> : <span />}
          <button type="submit" className="dash-restaurant-save-btn">
            Save the changes
          </button>
        </div>
      </form>
    </div>
  );
}
