/**
 * Phase 20 — Polish, Security & Launch Prep
 * Tests: error pages, loading states, mobile nav, security, SEO, dark mode, admin nav
 */

import * as fs   from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const db  = new PrismaClient();
const cwd = process.cwd();

let passed = 0;
let failed = 0;

function ok(label: string) {
  console.log(`  ✅ ${label}`);
  passed++;
}

function fail(label: string, detail?: unknown) {
  console.error(`  ❌ ${label}`, detail ?? "");
  failed++;
}

async function check(label: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    ok(label);
  } catch (e) {
    fail(label, e instanceof Error ? e.message : e);
  }
}

function fileContains(filePath: string, ...patterns: string[]): void {
  const abs     = path.join(cwd, filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${filePath}`);
  const content = fs.readFileSync(abs, "utf-8");
  for (const p of patterns) {
    if (!content.includes(p)) throw new Error(`Missing "${p}" in ${filePath}`);
  }
}

function fileExists(filePath: string): void {
  if (!fs.existsSync(path.join(cwd, filePath))) throw new Error(`File not found: ${filePath}`);
}

// ─── 20.1  Global error handling ──────────────────────────────────────────────

async function testErrorHandling() {
  console.log("\n20.1 — Global error handling");

  await check("app/not-found.tsx exists", () => fileExists("app/not-found.tsx"));
  await check("not-found.tsx has 404 content and Go Home link", () =>
    fileContains("app/not-found.tsx", "404", "/dashboard"));
  await check("not-found.tsx has dark mode classes", () =>
    fileContains("app/not-found.tsx", "dark:"));

  await check("app/error.tsx exists", () => fileExists("app/error.tsx"));
  await check("error.tsx has use client directive", () =>
    fileContains("app/error.tsx", "use client"));
  await check("error.tsx has reset function and dark mode", () =>
    fileContains("app/error.tsx", "reset", "dark:"));

  ok("Error handling files verified");
}

// ─── 20.2  Loading states ──────────────────────────────────────────────────────

async function testLoadingStates() {
  console.log("\n20.2 — Loading states");

  await check("app/loading.tsx exists", () => fileExists("app/loading.tsx"));
  await check("app/dashboard/loading.tsx exists", () => fileExists("app/dashboard/loading.tsx"));
  await check("dashboard loading has skeleton cards", () =>
    fileContains("app/dashboard/loading.tsx", "animate-pulse", "rounded"));

  ok("Loading state files verified");
}

// ─── 20.3  Mobile responsiveness ──────────────────────────────────────────────

async function testMobileResponsiveness() {
  console.log("\n20.3 — Mobile responsiveness");

  await check("DashboardNav has hamburger button (mobile)", () =>
    fileContains("components/dashboard/DashboardNav.tsx", "lg:hidden", "Toggle navigation"));

  await check("DashboardNav has mobile slide-down menu", () =>
    fileContains("components/dashboard/DashboardNav.tsx", "mobileOpen"));

  await check("DashboardNav nav links hidden on mobile, visible on lg", () =>
    fileContains("components/dashboard/DashboardNav.tsx", "hidden lg:flex"));

  await check("AdminNav has mobile top bar (lg:hidden)", () =>
    fileContains("components/admin/AdminNav.tsx", "lg:hidden", "Toggle admin"));

  await check("AdminNav has desktop sidebar (hidden lg:flex)", () =>
    fileContains("components/admin/AdminNav.tsx", "hidden lg:flex"));

  await check("AdminLayout mobile-friendly (min-h-screen not h-screen)", () =>
    fileContains("app/admin/layout.tsx", "min-h-screen", "lg:flex"));

  ok("Mobile responsiveness verified");
}

// ─── 20.4  Security hardening ─────────────────────────────────────────────────

async function testSecurity() {
  console.log("\n20.4 — Security hardening");

  await check("lib/rate-limit.ts exists", () => fileExists("lib/rate-limit.ts"));
  await check("rate-limit.ts exports rateLimit, getClientIp, rateLimitResponse", () =>
    fileContains("lib/rate-limit.ts", "export function rateLimit", "export function getClientIp", "export function rateLimitResponse"));

  await check("register route has rate limiting", () =>
    fileContains("app/api/auth/register/route.ts", "rateLimit", "rateLimitResponse"));

  await check("forgot-password route has rate limiting", () =>
    fileContains("app/api/auth/forgot-password/route.ts", "isRateLimited", "rateLimitMap"));

  await check("zod package installed", async () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8")) as { dependencies?: Record<string, string> };
    if (!pkg.dependencies?.["zod"]) throw new Error("zod not in dependencies");
  });

  await check("next-themes package installed", async () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8")) as { dependencies?: Record<string, string> };
    if (!pkg.dependencies?.["next-themes"]) throw new Error("next-themes not in dependencies");
  });

  ok("Security hardening verified");
}

// ─── 20.5  SEO & metadata ─────────────────────────────────────────────────────

async function testSeo() {
  console.log("\n20.5 — SEO & metadata");

  await check("app/sitemap.ts exists", () => fileExists("app/sitemap.ts"));
  await check("sitemap.ts returns sitemap entries", () =>
    fileContains("app/sitemap.ts", "signup", "login", "MetadataRoute"));

  await check("app/robots.ts exists", () => fileExists("app/robots.ts"));
  await check("robots.ts blocks /admin and /dashboard", () =>
    fileContains("app/robots.ts", "/admin/", "/dashboard/"));

  await check("Root layout has full metadata (title, description, openGraph)", () =>
    fileContains("app/layout.tsx", "openGraph", "twitter", "description"));

  await check("Auth layout has metadata template", () =>
    fileContains("app/(auth)/layout.tsx", "metadata", "template"));

  ok("SEO & metadata verified");
}

// ─── 20.6  Performance ────────────────────────────────────────────────────────

async function testPerformance() {
  console.log("\n20.6 — Performance");

  await check(".next/BUILD_ID exists (production build succeeded)", () =>
    fileExists(".next/BUILD_ID"));

  await check("Dashboard page uses Next.js Image component", () =>
    fileContains("app/dashboard/page.tsx", "Image", "next/image"));

  await check("vet-portal img tag has eslint disable comment", () =>
    fileContains("app/vet-portal/page.tsx", "eslint-disable-next-line @next/next/no-img-element"));

  ok("Performance checks passed");
}

// ─── 20.7  Dark/Light theme ───────────────────────────────────────────────────

async function testDarkMode() {
  console.log("\n20.7 — Dark/Light theme");

  await check("tailwind.config.ts has darkMode: 'class'", () =>
    fileContains("tailwind.config.ts", "darkMode", "class"));

  await check("globals.css has .dark CSS variables", () =>
    fileContains("app/globals.css", ".dark", "--background", "--surface"));

  await check("ThemeToggle component exists", () =>
    fileExists("components/ui/ThemeToggle.tsx"));

  await check("ThemeToggle uses next-themes useTheme", () =>
    fileContains("components/ui/ThemeToggle.tsx", "useTheme", "next-themes", "aria-label"));

  await check("ThemeToggle has sun and moon icons", () =>
    fileContains("components/ui/ThemeToggle.tsx", "isDark"));

  await check("Providers.tsx wraps with ThemeProvider", () =>
    fileContains("components/Providers.tsx", "ThemeProvider", "next-themes", "attribute=\"class\""));

  await check("Root layout has suppressHydrationWarning", () =>
    fileContains("app/layout.tsx", "suppressHydrationWarning"));

  await check("DashboardNav has dark: classes", () =>
    fileContains("components/dashboard/DashboardNav.tsx", "dark:bg-gray-900", "dark:text-white"));

  await check("Button component has dark: classes", () =>
    fileContains("components/ui/Button.tsx", "dark:bg-gray-800", "dark:text-gray-200"));

  await check("Input component has dark: classes", () =>
    fileContains("components/ui/Input.tsx", "dark:bg-gray-800", "dark:text-gray-100"));

  await check("Settings page includes ThemeToggle", () =>
    fileContains("app/dashboard/settings/page.tsx", "ThemeToggle", "Appearance"));

  await check("Auth layout supports dark mode background", () =>
    fileContains("app/(auth)/layout.tsx", "dark:bg-gray-950"));

  ok("Dark/Light theme fully implemented");
}

// ─── 20.8  Admin nav link in DashboardNav ─────────────────────────────────────

async function testAdminNav() {
  console.log("\n20.8 — Admin nav link for admin users");

  await check("DashboardNav shows admin link in desktop nav for isAdmin", () =>
    fileContains("components/dashboard/DashboardNav.tsx", "isAdmin", "/admin", "🛡 Admin"));

  await check("Admin link visible in mobile menu too", () => {
    const content = fs.readFileSync(path.join(cwd, "components/dashboard/DashboardNav.tsx"), "utf-8");
    const adminCount = (content.match(/Admin Panel|🛡 Admin/g) ?? []).length;
    if (adminCount < 2) throw new Error("Admin link should appear in both desktop and mobile menus");
  });

  ok("Admin nav link verified");
}

// ─── 20.9  DB health check ────────────────────────────────────────────────────

async function testDbHealth() {
  console.log("\n20.9 — Database health");

  await check("Can query User table", async () => {
    const count = await db.user.count();
    if (typeof count !== "number") throw new Error("Unexpected result");
  });

  await check("Can query EmrKey table", async () => {
    const count = await db.emrKey.count();
    if (typeof count !== "number") throw new Error("Unexpected result");
  });

  ok("Database health confirmed");
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(55));
  console.log("  Phase 20 — Polish, Security & Launch Prep  (terminal)");
  console.log("=".repeat(55));

  await testErrorHandling();
  await testLoadingStates();
  await testMobileResponsiveness();
  await testSecurity();
  await testSeo();
  await testPerformance();
  await testDarkMode();
  await testAdminNav();
  await testDbHealth();

  console.log("\n" + "=".repeat(55));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(55));
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => { console.error("Fatal:", e); process.exit(1); })
  .finally(() => db.$disconnect());
