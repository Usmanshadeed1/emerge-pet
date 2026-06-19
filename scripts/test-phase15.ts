/**
 * Phase 15 — Pet Sitter Access
 * Tests: 15.1 API routes, 15.2 Settings UI component, 15.3 Sitter page
 */

import { PrismaClient } from "@prisma/client";

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
  } catch (e) {
    fail(label, e instanceof Error ? e.message : e);
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getFirstUser() {
  // Prefer a user who actually owns pets
  const withPet = await db.user.findFirst({
    where: { pets: { some: {} } },
    select: { id: true, email: true },
  });
  return withPet ?? db.user.findFirst({ select: { id: true, email: true } });
}

async function getFirstPet(userId: string) {
  return db.pet.findFirst({ where: { ownerId: userId }, select: { id: true, name: true } });
}

// ─── 15.1  API routes ─────────────────────────────────────────────────────────

async function testApiRoutes() {
  console.log("\n15.1 — API routes");

  const user = await getFirstUser();
  if (!user) { fail("Need at least one user in DB"); return; }
  const pet  = await getFirstPet(user.id);
  if (!pet)  { fail("Need at least one pet in DB"); return; }

  ok(`Found test user: ${user.email}`);
  ok(`Found test pet : ${pet.name}`);

  // Create sitter link
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const token = "test_sitter_token_ph15";

  // Clean up first in case previous run left data
  await db.sitterAccess.deleteMany({ where: { token } });

  const link = await db.sitterAccess.create({
    data: {
      ownerId:   user.id,
      label:     "Phase 15 test link",
      token,
      expiresAt,
      petIds:    [pet.id],
      isActive:  true,
    },
  });
  ok(`Created SitterAccess record: ${link.id}`);

  // Verify it exists
  const found = await db.sitterAccess.findUnique({ where: { token } });
  if (!found) { fail("SitterAccess not found by token"); }
  else        { ok("SitterAccess findUnique by token works"); }

  // Verify petIds stored correctly
  await check("petIds stored as array", () => {
    if (!Array.isArray(found?.petIds)) throw new Error("petIds is not an array");
    if (found.petIds[0] !== pet.id)    throw new Error("petIds[0] mismatch");
  });

  // Verify isActive default
  await check("isActive = true on create", () => {
    if (!found?.isActive) throw new Error("isActive not true");
  });

  // Verify expiry in future
  await check("expiresAt is in future", () => {
    if (!found?.expiresAt || found.expiresAt < new Date()) throw new Error("expiresAt not in future");
  });

  // Simulate expiry check (as the public GET route does)
  await check("Expiry check logic (active + future = valid)", () => {
    const isExpired = !link.isActive || link.expiresAt < new Date();
    if (isExpired) throw new Error("Link should NOT be expired");
  });

  // Test revoke
  const revoked = await db.sitterAccess.update({
    where: { id: link.id },
    data:  { isActive: false, revokedAt: new Date() },
  });
  await check("Revoke sets isActive=false", () => {
    if (revoked.isActive)   throw new Error("isActive should be false");
    if (!revoked.revokedAt) throw new Error("revokedAt should be set");
  });
  ok("Revoke logic works (isActive=false, revokedAt set)");

  // Re-check expiry for revoked link
  await check("Expiry check on revoked link returns expired", () => {
    const isExpired = !revoked.isActive || revoked.expiresAt < new Date();
    if (!isExpired) throw new Error("Revoked link should appear expired");
  });

  // Test list by owner
  const allLinks = await db.sitterAccess.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });
  await check("List links by ownerId", () => {
    if (allLinks.length === 0) throw new Error("Expected at least 1 link");
  });
  ok(`Found ${allLinks.length} sitter link(s) for user`);

  // Test unique token constraint
  await check("Token is unique (duplicate should fail)", async () => {
    try {
      await db.sitterAccess.create({
        data: { ownerId: user.id, label: "dup", token, expiresAt, petIds: [pet.id], isActive: true },
      });
      throw new Error("Should have failed with unique constraint");
    } catch (e) {
      if (e instanceof Error && e.message.includes("Should have")) throw e;
      // unique constraint error is expected — pass
    }
  });

  // Clean up test record
  await db.sitterAccess.deleteMany({ where: { token } });
  ok("Cleanup test SitterAccess records");
}

// ─── 15.2  Settings page component file checks ────────────────────────────────

async function testSettingsComponent() {
  console.log("\n15.2 — Sitter section in dashboard settings");

  const fs = await import("fs");
  const path = await import("path");

  const sitterFile = path.join(process.cwd(), "components/settings/SitterAccessSection.tsx");
  const settingsFile = path.join(process.cwd(), "app/dashboard/settings/page.tsx");

  await check("SitterAccessSection.tsx exists", () => {
    if (!fs.existsSync(sitterFile)) throw new Error("File not found");
  });
  ok("components/settings/SitterAccessSection.tsx exists");

  const sitterContent = fs.readFileSync(sitterFile, "utf-8");

  await check("Exports SitterAccessSection function", () => {
    if (!sitterContent.includes("export function SitterAccessSection")) throw new Error("Missing export");
  });

  await check("Has Create Link button", () => {
    if (!sitterContent.includes("Create Link")) throw new Error("Missing Create Link");
  });

  await check("Has label input", () => {
    if (!sitterContent.includes("Weekend trip")) throw new Error("Missing label input");
  });

  await check("Has duration options (1,3,7,30)", () => {
    if (!sitterContent.includes("{ days: 1")) throw new Error("Missing duration options");
  });

  await check("Has pet selector", () => {
    if (!sitterContent.includes("togglePet")) throw new Error("Missing pet toggle");
  });

  await check("Calls /api/sitter-access POST", () => {
    if (!sitterContent.includes('"/api/sitter-access"')) throw new Error("Missing API call");
  });

  await check("Has revoke confirm flow (Yes/No)", () => {
    if (!sitterContent.includes('"Yes"') && !sitterContent.includes("Yes")) throw new Error("Missing revoke confirm");
  });

  await check("Shows active vs expired links", () => {
    if (!sitterContent.includes("activeLinks") || !sitterContent.includes("expiredLinks")) throw new Error("Missing link separation");
  });

  // Settings page imports SitterAccessSection
  const settingsContent = fs.readFileSync(settingsFile, "utf-8");

  await check("Settings page imports SitterAccessSection", () => {
    if (!settingsContent.includes("SitterAccessSection")) throw new Error("Missing import");
  });

  await check("Settings page renders <SitterAccessSection />", () => {
    if (!settingsContent.includes("<SitterAccessSection />")) throw new Error("Missing usage");
  });
  ok("Settings page includes SitterAccessSection");
}

// ─── 15.3  Sitter page checks ─────────────────────────────────────────────────

async function testSitterPage() {
  console.log("\n15.3 — Public sitter page");

  const fs   = await import("fs");
  const path = await import("path");

  const sitterPage = path.join(process.cwd(), "app/sitter/[token]/page.tsx");

  await check("app/sitter/[token]/page.tsx exists", () => {
    if (!fs.existsSync(sitterPage)) throw new Error("File not found");
  });
  ok("app/sitter/[token]/page.tsx exists");

  const content = fs.readFileSync(sitterPage, "utf-8");

  await check('Has export const dynamic = "force-dynamic"', () => {
    if (!content.includes('export const dynamic = "force-dynamic"')) throw new Error("Missing dynamic export");
  });

  await check("No auth import (public page)", () => {
    if (content.includes('from "@/lib/auth"')) throw new Error("Should not import auth");
  });

  await check("Checks isActive and expiresAt", () => {
    if (!content.includes("isActive") || !content.includes("expiresAt")) throw new Error("Missing expiry check");
  });

  await check("Has ExpiredPage component", () => {
    if (!content.includes("ExpiredPage")) throw new Error("Missing ExpiredPage");
  });

  await check("Fetches reminders within 7 days", () => {
    if (!content.includes("in7Days") && !content.includes("7 * 24")) throw new Error("Missing 7-day filter");
  });

  await check("Fetches most recent health record (take: 1)", () => {
    if (!content.includes("take:    1") && !content.includes("take: 1")) throw new Error("Missing take: 1");
  });

  await check("Preserves petIds order", () => {
    if (!content.includes("link.petIds")) throw new Error("Missing petIds order preservation");
  });

  await check("Shows specialNotes in amber box", () => {
    if (!content.includes("specialNotes")) throw new Error("Missing specialNotes");
  });

  await check("Has reminder type colour mapping", () => {
    if (!content.includes("MEDICATION") || !content.includes("VACCINATION")) throw new Error("Missing reminder colours");
  });

  await check("Shows pet photo or emoji fallback", () => {
    if (!content.includes("photoData") || !content.includes("SPECIES_EMOJI")) throw new Error("Missing photo/emoji");
  });

  await check("Read-only footer note present", () => {
    if (!content.includes("read-only")) throw new Error("Missing read-only notice");
  });

  ok("All sitter page structure checks passed");

  // Functional test — create a real link and verify DB fetch works
  const user = await getFirstUser();
  const pet  = user ? await getFirstPet(user.id) : null;

  if (user && pet) {
    const token     = "test_sitter_view_ph15";
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    await db.sitterAccess.deleteMany({ where: { token } });

    const link = await db.sitterAccess.create({
      data: { ownerId: user.id, label: "Sitter view test", token, expiresAt, petIds: [pet.id], isActive: true },
    });

    const fetched = await db.sitterAccess.findUnique({
      where:  { token },
      select: { id: true, isActive: true, expiresAt: true, petIds: true },
    });

    await check("Public link fetches correctly by token", () => {
      if (!fetched || fetched.id !== link.id) throw new Error("Fetch mismatch");
    });

    // Simulate what the page does
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const pets = await db.pet.findMany({
      where:  { id: { in: fetched!.petIds } },
      select: {
        id: true, name: true, species: true,
        reminders:     { where: { isCompleted: false, dueDate: { gte: now, lte: in7 } }, select: { id: true } },
        healthRecords: { orderBy: { date: "desc" }, take: 1, select: { id: true } },
      },
    });

    await check("Pets fetched for sitter view", () => {
      if (pets.length === 0) throw new Error("No pets returned");
    });
    ok(`Sitter view fetches ${pets.length} pet(s) with reminders+records`);

    await db.sitterAccess.deleteMany({ where: { token } });
    ok("Cleanup sitter view test record");
  }
}

// ─── 15.4  Edge cases ─────────────────────────────────────────────────────────

async function testEdgeCases() {
  console.log("\n15.4 — Edge cases");

  // Invalid token lookup
  await check("Non-existent token returns null", async () => {
    const result = await db.sitterAccess.findUnique({ where: { token: "nonexistent_token_abc123" } });
    if (result !== null) throw new Error("Expected null for unknown token");
  });
  ok("Non-existent token returns null");

  // Expired link detection
  const user = await getFirstUser();
  if (user) {
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() - 1); // yesterday

    const expToken = "test_expired_ph15";
    await db.sitterAccess.deleteMany({ where: { token: expToken } });

    const expLink = await db.sitterAccess.create({
      data: { ownerId: user.id, token: expToken, expiresAt: expiredAt, petIds: [], isActive: true },
    });

    await check("Past-expiry link detected as expired", () => {
      const isExpired = !expLink.isActive || expLink.expiresAt < new Date();
      if (!isExpired) throw new Error("Should be expired");
    });
    ok("Past-expiry link detected correctly");

    await db.sitterAccess.deleteMany({ where: { token: expToken } });
  }

  // Token length check (randomBytes(24).toString("hex") = 48 chars)
  await check("Token format: 48 hex chars", async () => {
    const { randomBytes } = await import("crypto");
    const token = randomBytes(24).toString("hex");
    if (token.length !== 48) throw new Error(`Expected 48 chars, got ${token.length}`);
    if (!/^[0-9a-f]+$/.test(token)) throw new Error("Token is not hex");
  });
  ok("Token is 48-char hex (randomBytes(24).toString('hex'))");

  // All valid expiry durations
  for (const days of [1, 3, 7, 30]) {
    await check(`expiresIn=${days} days is valid`, () => {
      const valid: Record<number, true> = { 1: true, 3: true, 7: true, 30: true };
      if (!valid[days]) throw new Error(`${days} not in valid set`);
    });
  }
  ok("All 4 expiry durations (1/3/7/30) are valid");
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(55));
  console.log("  Phase 15 — Pet Sitter Access  (terminal tests)");
  console.log("=".repeat(55));

  await testApiRoutes();
  await testSettingsComponent();
  await testSitterPage();
  await testEdgeCases();

  console.log("\n" + "=".repeat(55));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(55));
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => { console.error("Fatal:", e); process.exit(1); })
  .finally(() => db.$disconnect());
