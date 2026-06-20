import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu — Metavision",
};

export default function MenuPage() {
  return (
    <div className="dash-page">
      <header className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Menu</h1>
          <p className="dash-page-subtitle">Coming soon — static preview</p>
        </div>
      </header>
      <div className="dash-placeholder">Menu bölməsi tezliklə əlavə olunacaq.</div>
    </div>
  );
}
