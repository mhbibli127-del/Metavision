import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminPhone } from "@/lib/admin";
import {
  COOKIE_ADMIN_SESSION,
  COOKIE_SESSION,
  readAdminSessionToken,
  readSessionToken,
} from "@/lib/auth-tokens";
import { rateLimit } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

const RATE_LIMIT_SKIP = [
  "/api/subscription/webhook",
  "/api/meta-ads/callback",
  "/api/auth/sso/",
  "/api/health",
];

function shouldRateLimitApi(pathname: string): boolean {
  if (!pathname.startsWith("/api/")) return false;
  return !RATE_LIMIT_SKIP.some((p) => pathname.startsWith(p));
}

function withCors(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight for all API routes
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  // Health check — bypass auth and rate limiting
  if (pathname === "/api/health") {
    return withCors(NextResponse.next());
  }

  if (shouldRateLimitApi(pathname)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const limited = rateLimit(`api:${ip}`, 120, 60_000);
    if (!limited.ok) {
      return withCors(
        NextResponse.json(
          { error: `Rate limit exceeded. Retry in ${limited.retryAfter}s` },
          { status: 429 },
        ),
      );
    }
  }

  const session = await readSessionToken(request.cookies.get(COOKIE_SESSION)?.value);
  const adminSession = await readAdminSessionToken(request.cookies.get(COOKIE_ADMIN_SESSION)?.value);

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/select-panel") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!isAdminPhone(session.phone)) {
      return NextResponse.redirect(new URL("/dashboard/orders", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    if (adminSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const isPlatformAdmin =
      adminSession || (session && (session.role === "super_admin" || isAdminPhone(session.phone)));
    if (!isPlatformAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/notifications")) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/market")) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/api/meta-ads/callback") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/meta-ads")) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/trends") || pathname.startsWith("/api/x-trends") || pathname.startsWith("/api/social-signals")) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/integrations")) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/intelligence")) {
    if (pathname === "/api/intelligence/ops-snapshot") {
      return NextResponse.next();
    }
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    const isPlatformAdmin =
      adminSession || (session && (session.role === "super_admin" || isAdminPhone(session.phone)));
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/engines/hyperdimension")) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/features/hyperdimension")) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/operations")) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/audit") || pathname.startsWith("/api/command-center")) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/finance") || pathname.startsWith("/api/shifts") || pathname.startsWith("/api/organization")) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/stats") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/reservations")
  ) {
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/orders") || pathname.startsWith("/api/subscription")) {
    if (pathname === "/api/subscription/webhook") {
      return NextResponse.next();
    }
    if (!session && !adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth/sso")) {
    return NextResponse.next();
  }

  if (pathname === "/login" && session) {
    if (session.role === "super_admin" || isAdminPhone(session.phone)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard/command-center", request.url));
  }

  return withCors(NextResponse.next());
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/login",
    "/select-panel",
    "/admin/:path*",
    "/api/notifications",
    "/api/notifications/:path*",
    "/api/market/:path*",
    "/api/meta-ads",
    "/api/meta-ads/:path*",
    "/api/intelligence/:path*",
    "/api/admin",
    "/api/admin/:path*",
    "/api/engines/hyperdimension/:path*",
    "/api/features/hyperdimension/:path*",
    "/api/operations/:path*",
    "/api/audit",
    "/api/audit/:path*",
    "/api/command-center",
    "/api/finance",
    "/api/finance/:path*",
    "/api/shifts",
    "/api/organization",
    "/api/orders",
    "/api/stats",
    "/api/settings",
    "/api/reservations",
    "/api/subscription",
    "/api/subscription/:path*",
    "/api/integrations",
    "/api/integrations/:path*",
    "/api/auth/sso/:path*",
  ],
};
