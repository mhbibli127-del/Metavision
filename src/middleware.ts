import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminPhone } from "@/lib/admin";
import {
  COOKIE_ADMIN_SESSION,
  COOKIE_SESSION,
  readAdminSessionToken,
  readSessionToken,
} from "@/lib/auth-tokens";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
    if (!adminSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/login" && session) {
    if (isAdminPhone(session.phone)) {
      return NextResponse.redirect(new URL("/select-panel", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard/orders", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/select-panel", "/admin/:path*"],
};
