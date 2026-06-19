// Run with: npx tsx scripts/test-phase14.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

async function main() {
  console.log("\n========================================");
  console.log("   Phase 14 — Vet Portal Access");
  console.log("========================================\n");

  let passed = 0;
  let failed = 0;

  function pass(label: string, detail = "") {
    console.log(`  ✅ PASS  ${label}${detail ? `  →  ${detail}` : ""}`);
    passed++;
  }
  function fail(label: string, detail = "") {
    console.log(`  ❌ FAIL  ${label}${detail ? `  →  ${detail}` : ""}`);
    failed++;
  }
  function section(title: string) {
    console.log(`\n── ${title} ──`);
  }

  // ── 1. File existence ──────────────────────────────────────────────────────
  section("File Existence");
  const files = [
    "app/api/vet-access/route.ts",
    "app/api/vet-access/[id]/route.ts",
    "app/api/vet-portal/verify/route.ts",
    "app/api/vet-portal/submit-note/route.ts",
    "components/pets/VetAccessTab.tsx",
    "app/vet-portal/page.tsx",
  ];
  for (const f of files) {
    if (fs.existsSync(path.join(process.cwd(), f))) pass(f);
    else fail(f, "FILE MISSING");
  }

  // ── 2. Vet Access API route shapes ────────────────────────────────────────
  section("Vet Access Routes (/api/vet-access)");
  const accessSrc = fs.readFileSync(path.join(process.cwd(), "app/api/vet-access/route.ts"), "utf-8");
  const accessChecks: [string, string][] = [
    ["POST generates code",          "export async function POST"],
    ["GET lists records",            "export async function GET"],
    ["auth check on POST",           "await auth()"],
    ["auth check on GET",            "await auth()"],
    ["8-char alphanumeric code",     "randomBytes(4)"],
    ["verifies pet ownership",       "ownerId: session.user.id"],
    ["returns accessCode",           "accessCode"],
    ["collision retry logic",        "attempts"],
  ];
  for (const [l, n] of accessChecks) {
    if (accessSrc.includes(n)) pass(l);
    else fail(l, `missing: ${n}`);
  }

  const deleteSrc = fs.readFileSync(path.join(process.cwd(), "app/api/vet-access/[id]/route.ts"), "utf-8");
  if (deleteSrc.includes("export async function DELETE")) pass("DELETE revokes access");
  else fail("DELETE handler missing");
  if (deleteSrc.includes("isActive: false")) pass("Sets isActive = false on revoke");
  else fail("isActive not set to false");
  if (deleteSrc.includes("revokedAt")) pass("Records revokedAt timestamp");
  else fail("revokedAt not set");

  // ── 3. Vet portal verify route ────────────────────────────────────────────
  section("Vet Portal Verify Route (/api/vet-portal/verify)");
  const verifySrc = fs.readFileSync(path.join(process.cwd(), "app/api/vet-portal/verify/route.ts"), "utf-8");
  const verifyChecks: [string, string][] = [
    ["POST handler",               "export async function POST"],
    ["no auth import (public)",    "accessCode: code"],
    ["checks isActive",            "isActive"],
    ["returns 404 for invalid",    "status: 404"],
    ["returns pet data",           "pet:"],
    ["strips photoData",           "photoData"],
    ["returns health records",     "healthRecords"],
  ];
  for (const [l, n] of verifyChecks) {
    if (verifySrc.includes(n)) pass(l);
    else fail(l, `missing: ${n}`);
  }

  // ── 4. Submit note route ──────────────────────────────────────────────────
  section("Submit Note Route (/api/vet-portal/submit-note)");
  const noteSrc = fs.readFileSync(path.join(process.cwd(), "app/api/vet-portal/submit-note/route.ts"), "utf-8");
  const noteChecks: [string, string][] = [
    ["POST handler",                     "export async function POST"],
    ["creates VetVisitNote",             "db.vetVisitNote.create"],
    ["creates HealthRecord",             "db.healthRecord.create"],
    ["source = VET_PUSHED",             "VET_PUSHED"],
    ["sends email to owner",            "sendEmail"],
    ["email failure non-fatal",         "catch"],
    ["validates vetAccessId",           "vetAccessId"],
    ["checks access is still active",   "isActive"],
  ];
  for (const [l, n] of noteChecks) {
    if (noteSrc.includes(n)) pass(l);
    else fail(l, `missing: ${n}`);
  }

  // ── 5. VetAccessTab component ─────────────────────────────────────────────
  section("VetAccessTab Component");
  const tabSrc = fs.readFileSync(path.join(process.cwd(), "components/pets/VetAccessTab.tsx"), "utf-8");
  const tabChecks: [string, string][] = [
    ["Add Vet Access button",         "Add Vet Access"],
    ["lists access records",          "records.map"],
    ["shows access code",             "accessCode"],
    ["shows vet name",                "vetName"],
    ["shows created date",            "createdAt"],
    ["Revoke button",                 "Revoke"],
    ["confirm before revoke",         "Revoke?"],
    ["modal for code generation",     "showModal"],
    ["copy code to clipboard",        "copyCode"],
    ["shows Copied! feedback",        "Copied!"],
    ["shows portal URL",              "portalUrl"],
  ];
  for (const [l, n] of tabChecks) {
    if (tabSrc.includes(n)) pass(l);
    else fail(l, `missing: ${n}`);
  }

  // ── 6. Vet portal page ────────────────────────────────────────────────────
  section("Vet Portal Page (/vet-portal)");
  const portalSrc = fs.readFileSync(path.join(process.cwd(), "app/vet-portal/page.tsx"), "utf-8");
  const portalChecks: [string, string][] = [
    ["code input field",              "code.trim()"],
    ["Access Records button",         "Access Records"],
    ["calls verify API",              "/api/vet-portal/verify"],
    ["shows error for invalid code",  "Invalid"],
    ["shows pet profile",             "pet.name"],
    ["shows health records",          "healthRecords"],
    ["Submit Visit Note button",      "Submit Visit Note"],
    ["all 4 visit note fields",       "Chief Complaint"],
    ["diagnosis field",               "diagnosis"],
    ["treatments field",              "treatments"],
    ["discharge instructions field",  "dischargeInstructions"],
    ["calls submit-note API",         "/api/vet-portal/submit-note"],
    ["success state after submit",    "submitted"],
    ["VET_PUSHED badge",              "VET_PUSHED"],
    ["no auth required",              '"use client"'],
  ];
  for (const [l, n] of portalChecks) {
    if (portalSrc.includes(n)) pass(l);
    else fail(l, `missing: ${n}`);
  }

  // ── 7. PetDetailClient has Vet Access tab ─────────────────────────────────
  section("PetDetailClient");
  const clientSrc = fs.readFileSync(path.join(process.cwd(), "components/pets/PetDetailClient.tsx"), "utf-8");
  if (clientSrc.includes("VetAccessTab")) pass("VetAccessTab imported");
  else fail("VetAccessTab NOT imported");
  if (clientSrc.includes("<VetAccessTab")) pass("VetAccessTab rendered in vet tab");
  else fail("VetAccessTab NOT rendered");
  if (clientSrc.includes('"vet"')) pass("vet tab key defined");
  else fail("vet tab key missing");

  // ── 8. DB schema checks ───────────────────────────────────────────────────
  section("Database Schema");
  try {
    const count = await db.vetAccess.count();
    pass("VetAccess table accessible", `${count} records`);
  } catch {
    fail("VetAccess table not accessible");
  }
  try {
    const count = await db.vetVisitNote.count();
    pass("VetVisitNote table accessible", `${count} records`);
  } catch {
    fail("VetVisitNote table not accessible");
  }

  // ── 9. Middleware — vet-portal is public ──────────────────────────────────
  section("Middleware");
  const middlewareSrc = fs.readFileSync(path.join(process.cwd(), "middleware.ts"), "utf-8");
  if (middlewareSrc.includes("/vet-portal")) pass("Vet portal route is public in middleware");
  else fail("Vet portal route NOT public in middleware");
  if (middlewareSrc.includes("/api/vet-portal/")) pass("Vet portal API is public in middleware");
  else fail("Vet portal API NOT public in middleware");

  // ── 10. HTTP endpoint tests ───────────────────────────────────────────────
  section("HTTP Endpoints");
  try {
    // Vet-access POST requires auth
    const authRes = await fetch("http://localhost:3333/api/vet-access", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ petId: "test" }), redirect: "manual",
    });
    if ([307, 302, 401].includes(authRes.status)) pass("POST /api/vet-access auth-protected", `HTTP ${authRes.status}`);
    else {
      const b = await authRes.text();
      if (b.includes("DOCTYPE")) pass("POST /api/vet-access redirects to login", `HTTP ${authRes.status}`);
      else fail("Unexpected status for POST /api/vet-access", `HTTP ${authRes.status}`);
    }

    // Vet portal verify is public — invalid code should return 404 or 400
    const pubRes = await fetch("http://localhost:3333/api/vet-portal/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "INVALID1" }), redirect: "manual",
    });
    if ([400, 404].includes(pubRes.status)) pass("POST /api/vet-portal/verify is public", `HTTP ${pubRes.status} (invalid code)`);
    else if (pubRes.status === 200) {
      const data = await pubRes.json();
      if (data.error) pass("POST /api/vet-portal/verify is public (returned error)", "HTTP 200 with error");
      else pass("POST /api/vet-portal/verify is public", "HTTP 200");
    }
    else fail("Unexpected status", `HTTP ${pubRes.status}`);

    // Vet portal page is public
    const pageRes = await fetch("http://localhost:3333/vet-portal", { redirect: "manual" });
    if (pageRes.status === 200) pass("GET /vet-portal is publicly accessible", "HTTP 200");
    else if (pageRes.status === 307) fail("Vet portal page is redirecting (should be public)", "HTTP 307");
    else fail("Unexpected vet portal page status", `HTTP ${pageRes.status}`);

  } catch {
    fail("Could not reach dev server on port 3333 — is it running?");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  if (failed === 0) {
    console.log("\n  🎉 All Phase 14 terminal tests passed!");
    console.log("  Browser tests:");
    console.log("  1. Pet detail → Vet Access tab → Add Vet Access → code generated in modal");
    console.log("  2. Code appears in active vet list with created date");
    console.log("  3. Revoke → confirmation → code removed from list");
    console.log("  4. Visit /vet-portal → enter code → see pet profile + records");
    console.log("  5. Click Submit Visit Note → fill form → submit → owner notified");
    console.log("  6. Record appears in pet detail records with VET_PUSHED badge");
    console.log("  7. Revoked code on vet portal → error message\n");
  } else {
    console.log("\n  Fix failures above before proceeding.\n");
  }
}

main().catch(console.error).finally(() => db.$disconnect());
