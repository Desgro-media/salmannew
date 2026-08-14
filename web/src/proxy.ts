import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = new Set([
  "/admin/login",
  "/api/admin/login",
  "/delivery/login",
  "/api/delivery/login",
]);

// Two disjoint staff areas share one session cookie/role system, but a
// DELIVERY session must never reach admin-only routes (product/review
// management, other staff accounts) and vice versa. Everything below decides
// which area a path belongs to and which roles may use it.
function isAdminArea(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isDeliveryArea(pathname: string) {
  return pathname.startsWith("/delivery") || pathname.startsWith("/api/delivery");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const loginPath = isDeliveryArea(pathname) ? "/delivery/login" : "/admin/login";

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const wrongArea =
    (isAdminArea(pathname) && session.role === "DELIVERY") ||
    (isDeliveryArea(pathname) && session.role !== "DELIVERY");

  if (wrongArea) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Redirect to the area this session's own role belongs to, not the area
    // it just tried to reach — otherwise a DELIVERY session hitting /admin
    // would be sent right back to /admin and loop.
    const ownHome = session.role === "DELIVERY" ? "/delivery" : "/admin";
    return NextResponse.redirect(new URL(ownHome, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/delivery/:path*", "/api/delivery/:path*"],
};
