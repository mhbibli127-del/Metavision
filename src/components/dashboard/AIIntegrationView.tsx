"use client";

import { useState } from "react";
import { callAI, getTasteMindPrediction, getMenuRecommendations, type AIResponse } from "@/lib/ai-backend";

import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function AIIntegrationView() {
  const { t } = useI18n();
  const [isConnected, setIsConnected] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    const response = await callAI({ endpoint: "/health", method: "GET" });
    setIsConnected(response.success);
    setLastResponse(response);
    setLoading(false);
  };

  const testPrediction = async () => {
    setLoading(true);
    const response = await getTasteMindPrediction("demo-restaurant");
    setLastResponse(response);
    setLoading(false);
  };

  const testRecommendations = async () => {
    setLoading(true);
    const response = await getMenuRecommendations("demo-restaurant");
    setLastResponse(response);
    setLoading(false);
  };

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="aiIntegrationTitle" subtitleKey="aiIntegrationSubtitle">
        <button
          type="button"
          className={`dash-add-btn ${isConnected ? "dash-add-btn--success" : ""}`}
          onClick={testConnection}
          disabled={loading}
        >
          {loading ? t("loading") : t("refresh")}
        </button>
      </DashPageHeader>

      <div className="dash-ai-status">
        <div className={`dash-ai-status-card ${isConnected ? "is-connected" : "is-disconnected"}`}>
          <div className="dash-ai-status-icon">
            {isConnected ? "✓" : "✕"}
          </div>
          <div className="dash-ai-status-info">
            <h3 className="dash-ai-status-title">
              {isConnected ? "Connected" : "Disconnected"}
            </h3>
            <p className="dash-ai-status-desc">
              {isConnected
                ? "AI backend is responding correctly"
                : "Cannot connect to AI backend"}
            </p>
          </div>
        </div>
      </div>

      <div className="dash-ai-actions">
        <button
          type="button"
          className="dash-ai-action-btn"
          onClick={testPrediction}
          disabled={!isConnected || loading}
        >
          Test Prediction API
        </button>
        <button
          type="button"
          className="dash-ai-action-btn"
          onClick={testRecommendations}
          disabled={!isConnected || loading}
        >
          Test Recommendations API
        </button>
      </div>

      {lastResponse && (
        <div className="dash-ai-response">
          <h3 className="dash-ai-response-title">Last Response</h3>
          <pre className="dash-ai-response-code">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}

      <div className="dash-ai-config">
        <h3 className="dash-ai-config-title">Configuration</h3>
        <div className="dash-ai-config-item">
          <span className="dash-ai-config-label">Backend URL</span>
          <span className="dash-ai-config-value">
            {process.env.AI_BACKEND_URL || "http://localhost:3001"}
          </span>
        </div>
        <div className="dash-ai-config-item">
          <span className="dash-ai-config-label">API Key</span>
          <span className="dash-ai-config-value">
            {process.env.AI_API_KEY ? "••••••••" : "Not configured"}
          </span>
        </div>
        <div className="dash-ai-note">
          <p>
            Configure AI_BACKEND_URL and AI_API_KEY in your .env.local file to enable AI features.
          </p>
        </div>
      </div>
    </div>
  );
}
