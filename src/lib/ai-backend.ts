// AI Backend Integration for Metavision
// Communicates with ai-for-metavision NestJS service (port 3001, prefix /api)

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const AI_API_KEY = process.env.AI_API_KEY || "";

export interface AIRequest {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  params?: Record<string, string>;
  tenant?: { restaurantId?: string; organizationId?: string; branchId?: string };
}

export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function callAI<T = unknown>(request: AIRequest): Promise<AIResponse<T>> {
  try {
    const path = request.endpoint.startsWith("/api") ? request.endpoint : `/api${request.endpoint}`;
    const url = new URL(`${AI_BACKEND_URL}${path}`);

    if (request.params) {
      Object.entries(request.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (AI_API_KEY) {
      headers.Authorization = `Bearer ${AI_API_KEY}`;
    }

    if (request.tenant?.restaurantId) {
      (headers as Record<string, string>)["x-restaurant-id"] = request.tenant.restaurantId;
    }
    if (request.tenant?.organizationId) {
      (headers as Record<string, string>)["x-organization-id"] = request.tenant.organizationId;
    }
    if (request.tenant?.branchId) {
      (headers as Record<string, string>)["x-branch-id"] = request.tenant.branchId;
    }

    const response = await fetch(url.toString(), {
      method: request.method || "GET",
      headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`AI backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("AI backend call failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAIHealth() {
  return callAI({ endpoint: "/health", method: "GET" });
}

export async function getTasteMindPrediction(restaurantId: string) {
  return callAI({
    endpoint: "/ai/forecast",
    method: "POST",
    body: { restaurantId, type: "demand" },
  });
}

export async function getMenuRecommendations(restaurantId: string) {
  return callAI({
    endpoint: "/ai/recommend",
    method: "POST",
    body: { restaurantId, type: "menu" },
  });
}

export async function getDemandForecast(restaurantId: string, days: number = 7) {
  return callAI({
    endpoint: "/ai/forecast",
    method: "POST",
    body: { restaurantId, days },
  });
}

export async function runSimulation(scenario: unknown) {
  return callAI({
    endpoint: "/ai/chat",
    method: "POST",
    body: { message: JSON.stringify(scenario), context: "simulation" },
  });
}

export async function getGlobalTrends(city?: string) {
  return callAI({
    endpoint: "/ai/insight",
    method: "POST",
    body: { type: "trends", city },
  });
}

export async function getMarketInsights(restaurantId: string) {
  return callAI({
    endpoint: "/ai/insight",
    method: "POST",
    body: { restaurantId, type: "market" },
  });
}

export async function getAIActions(restaurantId: string) {
  return callAI({
    endpoint: `/ai/actions/${restaurantId}`,
    method: "GET",
  });
}
