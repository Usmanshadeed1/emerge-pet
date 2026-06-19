import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/vet-portal"];

const PUBLIC_PREFIXES = [
  "/reset-password/",
  "/emergency/",
  "/records/upload/",
  "/sitter/",
  "/invite/",
  "/api/auth/",
  "/api/newsletter/",
  "/api/vet-portal/",
  "/api/sitter/",
  "/api/emr/",
  "/api/admin/setup",
  "/api/user/invite/validate",
  "/_next/",
];

// Routes that require login but are accessible to non-admins and bypass onboarding gate
const AUTH_ONLY_ROUTES = ["/setup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic =
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const isAuthOnly = AUTH_ONLY_ROUTES.includes(pathname);

  const isAuthenticated = !!session?.user;

  // Authenticated on auth pages → dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unauthenticated on protected route → login
  if (!isAuthenticated && !isPublic && !isAuthOnly) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Unauthenticated on auth-only route (e.g. /setup) → login
  if (!isAuthenticated && isAuthOnly) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Deactivated user → force logout
  if (isAuthenticated && session.user?.isActive === false) {
    return NextResponse.redirect(new URL("/login?error=deactivated", req.url));
  }

  // Non-admin accessing /admin → redirect to dashboard
  if (
    isAuthenticated &&
    pathname.startsWith("/admin") &&
    session.user?.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Onboarding gate — skip for auth-only routes like /setup
  if (
    isAuthenticated &&
    !isAuthOnly &&
    !session.user?.onboardingCompleted &&
    pathname !== "/onboarding" &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
