"use client";

import { useEffect, useState } from "react";
import type { SubscriptionPlan, SubscriptionPricing } from "@/data/subscription";

import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function SubscriptionView() {
  const { t } = useI18n();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subscriptionPricings, setSubscriptionPricings] = useState<SubscriptionPricing[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.plans)) setSubscriptionPricings(d.plans);
        if (d.current?.plan) setCurrentPlan(d.current.plan);
      })
      .catch(() => {});
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const getPrice = (pricing: { monthlyPrice: number; yearlyPrice: number }) => {
    return billingCycle === "monthly" ? pricing.monthlyPrice : pricing.yearlyPrice;
  };

  return (
    <div className="dash-page">
      <DashPageHeader
        titleKey="subscriptionTitle"
        subtitle={
          currentPlan
            ? `${t("subscriptionCurrentPlan")}: ${currentPlan.toUpperCase()}`
            : t("subscriptionSubtitle")
        }
      />

      <div className="dash-subscription-billing-toggle">
        <button
          type="button"
          className={`dash-billing-btn${billingCycle === "monthly" ? " is-active" : ""}`}
          onClick={() => setBillingCycle("monthly")}
        >
          {t("monthly")}
        </button>
        <button
          type="button"
          className={`dash-billing-btn${billingCycle === "yearly" ? " is-active" : ""}`}
          onClick={() => setBillingCycle("yearly")}
        >
          {t("yearly")} <span className="dash-billing-badge">{t("savePercent")}</span>
        </button>
      </div>

      <div className="dash-subscription-plans">
        {subscriptionPricings.map((pricing) => (
          <article
            key={pricing.plan}
            className={`dash-subscription-card${pricing.popular ? " dash-subscription-card--popular" : ""}`}
          >
            {pricing.popular && <div className="dash-subscription-popular">Most Popular</div>}
            <h3 className="dash-subscription-plan-name">{pricing.name}</h3>
            <div className="dash-subscription-price">
              <span className="dash-subscription-amount">${getPrice(pricing)}</span>
              <span className="dash-subscription-period">/{billingCycle === "monthly" ? "month" : "year"}</span>
            </div>
            <ul className="dash-subscription-features">
              {pricing.features.map((feature, index) => (
                <li key={index} className={`dash-subscription-feature${!feature.included ? " dash-subscription-feature--excluded" : ""}`}>
                  <span className="dash-subscription-feature-icon">
                    {feature.included ? "✓" : "✕"}
                  </span>
                  <span>{feature.name}</span>
                  {feature.limit && <span className="dash-subscription-feature-limit">({feature.limit})</span>}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`dash-subscription-btn${pricing.popular ? " dash-subscription-btn--primary" : ""}`}
              onClick={() => handleSelectPlan(pricing.plan)}
            >
              {pricing.plan === "trial" ? "Start Free Trial" : "Upgrade to " + pricing.name}
            </button>
          </article>
        ))}
      </div>

      {isModalOpen && selectedPlan && (
        <SubscriptionModal
          plan={selectedPlan}
          billingCycle={billingCycle}
          plans={subscriptionPricings}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function SubscriptionModal({
  plan,
  billingCycle,
  plans,
  onClose,
}: {
  plan: SubscriptionPlan;
  billingCycle: "monthly" | "yearly";
  plans: SubscriptionPricing[];
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const pricing = plans.find((p) => p.plan === plan);
  const price = billingCycle === "monthly" ? pricing?.monthlyPrice : pricing?.yearlyPrice;

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingCycle }),
      });
      const data = await res.json();
      if (res.status === 503 && data.useDirect) {
        const direct = await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, billingCycle }),
        });
        const directData = await direct.json();
        if (!direct.ok) throw new Error(directData.error ?? "Failed");
        setMessage("Subscription updated successfully!");
        setTimeout(() => {
          onClose();
          setMessage("");
          window.location.reload();
        }, 1500);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL");
    } catch (error) {
      setMessage("Failed to update subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal-header">
          <h2 className="dash-modal-title">{t("confirmSubscription")}</h2>
          <button type="button" className="dash-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="dash-subscription-summary">
          <div className="dash-subscription-summary-item">
            <span className="dash-subscription-summary-label">Plan</span>
            <span className="dash-subscription-summary-value">{pricing?.name}</span>
          </div>
          <div className="dash-subscription-summary-item">
            <span className="dash-subscription-summary-label">Billing Cycle</span>
            <span className="dash-subscription-summary-value">{billingCycle}</span>
          </div>
          <div className="dash-subscription-summary-item">
            <span className="dash-subscription-summary-label">Total</span>
            <span className="dash-subscription-summary-value dash-subscription-summary-value--price">
              ${price}/{billingCycle === "monthly" ? "month" : "year"}
            </span>
          </div>
        </div>

        {message && (
          <div className={`dash-profile-message ${message.includes("Failed") ? "dash-profile-message--error" : "dash-profile-message--success"}`}>
            {message}
          </div>
        )}

        <div className="dash-profile-form-actions">
          <button type="button" className="dash-profile-btn-secondary" onClick={onClose}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="dash-profile-btn-primary"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? t("loading") : t("confirmSubscription")}
          </button>
        </div>
      </div>
    </div>
  );
}
