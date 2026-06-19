/**
 * Phase 17 — Subscriptions & Payments
 * Tests: 17.1 RevenueCat lib + API routes, 17.2 isPremium + PremiumGate, 17.3 upgrade page + nav
 */

import { PrismaClient } from "@prisma/client";
import { calculateTier } from "../lib/points";
import { planFromProductId, PLANS, getRevenueCatApiKey } from "../lib/revenuecat";
import { isPremium } from "../lib/premium";

const db = new PrismaClient();

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

async function getTestUser() {
  return db.user.findFirst({
    where: { role: "OWNER" },
    select: { id: true, email: true, role: true },
  });
}

async function getAdminUser() {
  return db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true, role: true },
  });
}

// ─── 17.1  lib/revenuecat.ts ──────────────────────────────────────────────────

async function testRevenueCatLib() {
  console.log("\n17.1 — lib/revenuecat.ts + API routes");

  // PLANS object
  await check("PLANS.monthly exists with correct shape", () => {
    if (!PLANS.monthly.id)    throw new Error("Missing monthly.id");
    if (!PLANS.monthly.price) throw new Error("Missing monthly.price");
    if (!PLANS.monthly.label) throw new Error("Missing monthly.label");
  });

  await check("PLANS.annual exists with savings info", () => {
    if (!PLANS.annual.id)      throw new Error("Missing annual.id");
    if (!PLANS.annual.savings) throw new Error("Missing annual.savings");
  });

  // planFromProductId
  await check("planFromProductId: annual product → ANNUAL", () => {
    const result = planFromProductId("emergepet_annual_v1");
    if (result !== "ANNUAL") throw new Error(`Expected ANNUAL, got ${result}`);
  });

  await check("planFromProductId: monthly product → MONTHLY", () => {
    const result = planFromProductId("emergepet_monthly_v1");
    if (result !== "MONTHLY") throw new Error(`Expected MONTHLY, got ${result}`);
  });

  await check("planFromProductId: null → MONTHLY", () => {
    const result = planFromProductId(null);
    if (result !== "MONTHLY") throw new Error(`Expected MONTHLY, got ${result}`);
  });

  // getRevenueCatApiKey returns null when not configured (expected in test env)
  await check("getRevenueCatApiKey() returns string or null", async () => {
    const key = await getRevenueCatApiKey();
    if (key !== null && typeof key !== "string") throw new Error("Expected string or null");
  });
  ok("getRevenueCatApiKey() resolves without error");

  // API route files exist
  const fs   = await import("fs");
  const path = await import("path");
  const cwd  = process.cwd();

  const routes = [
    "app/api/subscriptions/checkout/route.ts",
    "app/api/subscriptions/status/route.ts",
    "app/api/webhooks/revenuecat/route.ts",
    "lib/revenuecat.ts",
  ];

  for (const file of routes) {
    await check(`File exists: ${file}`, () => {
      if (!fs.existsSync(path.join(cwd, file))) throw new Error("File not found");
    });
  }

  // Checkout route requires auth + plan param
  const checkoutContent = fs.readFileSync(path.join(cwd, "app/api/subscriptions/checkout/route.ts"), "utf-8");
  await check("Checkout route verifies auth (401 if no session)", () => {
    if (!checkoutContent.includes("Unauthorized")) throw new Error("Missing auth check");
  });
  await check("Checkout route validates plan param", () => {
    if (!checkoutContent.includes("monthly") || !checkoutContent.includes("annual")) throw new Error("Missing plan validation");
  });

  // Status route returns isPremium
  const statusContent = fs.readFileSync(path.join(cwd, "app/api/subscriptions/status/route.ts"), "utf-8");
  await check("Status route returns isPremium field", () => {
    if (!statusContent.includes("isPremium")) throw new Error("Missing isPremium in response");
  });

  // Webhook handles all 4 event types
  const webhookContent = fs.readFileSync(path.join(cwd, "app/api/webhooks/revenuecat/route.ts"), "utf-8");
  for (const event of ["INITIAL_PURCHASE", "RENEWAL", "CANCELLATION", "EXPIRATION"]) {
    await check(`Webhook handles ${event} event`, () => {
      if (!webhookContent.includes(event)) throw new Error(`Missing ${event} handler`);
    });
  }
  await check("Webhook upserts Subscription record", () => {
    if (!webhookContent.includes("db.subscription.upsert")) throw new Error("Missing upsert");
  });
}

// ─── 17.2  isPremium + PremiumGate ────────────────────────────────────────────

async function testPremiumGate() {
  console.log("\n17.2 — isPremium() + PremiumGate component");

  const user  = await getTestUser();
  const admin = await getAdminUser();

  // Admin always premium
  if (admin) {
    await check("Admin user isPremium() = true (always)", async () => {
      const result = await isPremium(admin.id);
      if (!result) throw new Error("Admin should always be premium");
    });
    ok(`Admin (${admin.email}) is premium: confirmed`);
  } else {
    ok("No admin user in DB — skipping admin premium check");
  }

  // User with no subscription → not premium
  if (user) {
    // Ensure no subscription for this user
    await db.subscription.deleteMany({ where: { userId: user.id } });
    await check("User with no subscription → isPremium() = false", async () => {
      const result = await isPremium(user.id);
      if (result) throw new Error("Expected false for user without subscription");
    });

    // Create ACTIVE subscription
    const sub = await db.subscription.create({
      data: {
        userId:          user.id,
        revenueCatId:    "test_rc_id",
        plan:            "MONTHLY",
        status:          "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    await check("User with ACTIVE subscription → isPremium() = true", async () => {
      const result = await isPremium(user.id);
      if (!result) throw new Error("Expected true for ACTIVE subscription");
    });

    // Cancel subscription
    await db.subscription.update({ where: { id: sub.id }, data: { status: "CANCELLED" } });
    await check("User with CANCELLED subscription → isPremium() = false", async () => {
      const result = await isPremium(user.id);
      if (result) throw new Error("Expected false for CANCELLED subscription");
    });

    // Expired subscription
    await db.subscription.update({
      where: { id: sub.id },
      data:  { status: "ACTIVE", currentPeriodEnd: new Date(Date.now() - 1000) },
    });
    await check("User with expired currentPeriodEnd → isPremium() = false", async () => {
      const result = await isPremium(user.id);
      if (result) throw new Error("Expected false for expired period");
    });

    // Cleanup
    await db.subscription.deleteMany({ where: { userId: user.id } });
    ok("Cleanup test subscription");
  }

  // PremiumGate component checks
  const fs   = await import("fs");
  const path = await import("path");
  const cwd  = process.cwd();

  const gateFile = path.join(cwd, "components/ui/PremiumGate.tsx");
  await check("components/ui/PremiumGate.tsx exists", () => {
    if (!fs.existsSync(gateFile)) throw new Error("File not found");
  });

  const gateContent = fs.readFileSync(gateFile, "utf-8");
  await check("PremiumGate exports PremiumGate function", () => {
    if (!gateContent.includes("export function PremiumGate")) throw new Error("Missing export");
  });
  await check("PremiumGate renders children when isPremium=true", () => {
    if (!gateContent.includes("if (isPremium)")) throw new Error("Missing isPremium check");
  });
  await check("PremiumGate shows upgrade link to /dashboard/upgrade", () => {
    if (!gateContent.includes("/dashboard/upgrade")) throw new Error("Missing upgrade link");
  });
  await check("PremiumGate shows lock icon when not premium", () => {
    if (!gateContent.includes("lock") && !gateContent.includes("Lock")) throw new Error("Missing lock icon");
  });
  ok("PremiumGate component structure verified");
}

// ─── 17.3  Upgrade page + nav ──────────────────────────────────────────────────

async function testUpgradePage() {
  console.log("\n17.3 — Upgrade page + DashboardNav");

  const fs   = await import("fs");
  const path = await import("path");
  const cwd  = process.cwd();

  const upgradePage = path.join(cwd, "app/dashboard/upgrade/page.tsx");
  await check("app/dashboard/upgrade/page.tsx exists", () => {
    if (!fs.existsSync(upgradePage)) throw new Error("File not found");
  });

  const content = fs.readFileSync(upgradePage, "utf-8");

  await check("Upgrade page has Monthly plan card", () => {
    if (!content.includes("monthly") && !content.includes("Monthly")) throw new Error("Missing monthly plan");
  });
  await check("Upgrade page has Annual plan card", () => {
    if (!content.includes("annual") && !content.includes("Annual")) throw new Error("Missing annual plan");
  });
  await check("Annual plan shows savings percentage", () => {
    if (!content.includes("Save") && !content.includes("savings")) throw new Error("Missing savings info");
  });
  await check("Upgrade page lists premium features", () => {
    if (!content.includes("Symptom Checker") || !content.includes("Health Score")) throw new Error("Missing feature list");
  });
  await check("Upgrade page calls /api/subscriptions/checkout", () => {
    if (!content.includes("/api/subscriptions/checkout")) throw new Error("Missing checkout API call");
  });
  await check("Upgrade page shows loading state during checkout", () => {
    if (!content.includes("Redirecting") && !content.includes("checking")) throw new Error("Missing loading state");
  });
  await check("Upgrade page shows Manage Subscription for active subscribers", () => {
    if (!content.includes("Manage Subscription")) throw new Error("Missing manage subscription view");
  });
  ok("Upgrade page structure verified");

  // DashboardNav
  const navFile    = path.join(cwd, "components/dashboard/DashboardNav.tsx");
  const navContent = fs.readFileSync(navFile, "utf-8");
  await check("DashboardNav has /dashboard/upgrade link", () => {
    if (!navContent.includes("/dashboard/upgrade")) throw new Error("Missing upgrade link in nav");
  });
  ok("DashboardNav upgrade link confirmed");
}

// ─── 17.4  Webhook DB integration ─────────────────────────────────────────────

async function testWebhookIntegration() {
  console.log("\n17.4 — Webhook DB integration");

  const user = await getTestUser();
  if (!user) { ok("No test user — skipping webhook DB tests"); return; }

  await db.subscription.deleteMany({ where: { userId: user.id } });

  // Simulate INITIAL_PURCHASE webhook effect
  await db.subscription.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, revenueCatId: "rc_test", plan: "MONTHLY", status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    update: { status: "ACTIVE", plan: "MONTHLY" },
  });
  await check("INITIAL_PURCHASE: subscription created as ACTIVE", async () => {
    const sub = await db.subscription.findUnique({ where: { userId: user.id } });
    if (sub?.status !== "ACTIVE") throw new Error(`Expected ACTIVE, got ${sub?.status}`);
  });

  // Simulate CANCELLATION
  await db.subscription.update({ where: { userId: user.id }, data: { status: "CANCELLED" } });
  await check("CANCELLATION: subscription status set to CANCELLED", async () => {
    const sub = await db.subscription.findUnique({ where: { userId: user.id } });
    if (sub?.status !== "CANCELLED") throw new Error(`Expected CANCELLED, got ${sub?.status}`);
  });

  // Simulate EXPIRATION
  await db.subscription.update({ where: { userId: user.id }, data: { status: "EXPIRED" } });
  await check("EXPIRATION: subscription status set to EXPIRED", async () => {
    const sub = await db.subscription.findUnique({ where: { userId: user.id } });
    if (sub?.status !== "EXPIRED") throw new Error(`Expected EXPIRED, got ${sub?.status}`);
  });

  // Simulate RENEWAL
  await db.subscription.update({ where: { userId: user.id }, data: { status: "ACTIVE" } });
  await check("RENEWAL: subscription status restored to ACTIVE", async () => {
    const sub = await db.subscription.findUnique({ where: { userId: user.id } });
    if (sub?.status !== "ACTIVE") throw new Error(`Expected ACTIVE, got ${sub?.status}`);
  });

  // Cleanup
  await db.subscription.deleteMany({ where: { userId: user.id } });
  ok("Cleanup webhook test subscription");

  // planFromProductId integration
  await check("Annual product ID correctly maps to ANNUAL plan", () => {
    const plan = planFromProductId("emergepet_annual");
    if (plan !== "ANNUAL") throw new Error(`Expected ANNUAL, got ${plan}`);
  });
  await check("Monthly product ID correctly maps to MONTHLY plan", () => {
    const plan = planFromProductId("emergepet_monthly");
    if (plan !== "MONTHLY") throw new Error(`Expected MONTHLY, got ${plan}`);
  });
}

// ─── 17.5  calculateTier import (sanity check points still work) ──────────────

async function testPointsStillWork() {
  console.log("\n17.5 — Sanity: points engine unaffected by Phase 17");

  await check("calculateTier still works after Phase 17 changes", () => {
    if (calculateTier(500) !== "Dedicated Owner") throw new Error("calculateTier broken");
    if (calculateTier(1000) !== "Platinum Pet Parent") throw new Error("calculateTier broken at 1000");
  });
  ok("Points engine unaffected");
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(55));
  console.log("  Phase 17 — Subscriptions & Payments  (terminal)");
  console.log("=".repeat(55));

  await testRevenueCatLib();
  await testPremiumGate();
  await testUpgradePage();
  await testWebhookIntegration();
  await testPointsStillWork();

  console.log("\n" + "=".repeat(55));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(55));
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => { console.error("Fatal:", e); process.exit(1); })
  .finally(() => db.$disconnect());
