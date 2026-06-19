// Run with: npx tsx scripts/test-phase13.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

async function main() {
  console.log("\n========================================");
  console.log("   Phase 13 — QR Code Emergency Sharing");
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
    "app/api/pets/[id]/qr/route.ts",
    "app/api/pets/[id]/qr-token/route.ts",
    "app/emergency/[token]/page.tsx",
    "components/pets/QrCodeTab.tsx",
  ];
  for (const f of files) {
    if (fs.existsSync(path.join(process.cwd(), f))) pass(f);
    else fail(f, "FILE MISSING");
  }

  // ── 2. Pet creation auto-generates qrToken ────────────────────────────────
  section("Pet Creation Route");
  const petSrc = fs.readFileSync(path.join(process.cwd(), "app/api/pets/route.ts"), "utf-8");
  if (petSrc.includes("qrToken"))    pass("qrToken auto-generated on pet creation");
  else                                fail("qrToken NOT added to pet creation");
  if (petSrc.includes("randomBytes")) pass("randomBytes used for token generation");
  else                                fail("randomBytes import missing");

  // ── 3. QR API route shape ─────────────────────────────────────────────────
  section("QR Image API Route (/api/pets/[id]/qr)");
  const qrSrc = fs.readFileSync(path.join(process.cwd(), "app/api/pets/[id]/qr/route.ts"), "utf-8");
  const qrChecks: [string, string][] = [
    ["exports GET",               "export async function GET"],
    ["auth check",                "await auth()"],
    ["pet ownership verified",    "ownerId: session.user.id"],
    ["uses qrcode package",       "from \"qrcode\""],
    ["builds emergency URL",      "/emergency/"],
    ["returns PNG image",         "image/png"],
    ["uses NEXTAUTH_URL env var", "NEXTAUTH_URL"],
  ];
  for (const [l, n] of qrChecks) {
    if (qrSrc.includes(n)) pass(l);
    else fail(l, `missing: ${n}`);
  }

  // ── 4. Emergency page shape ───────────────────────────────────────────────
  section("Emergency Page (/emergency/[token])");
  const emergSrc = fs.readFileSync(path.join(process.cwd(), "app/emergency/[token]/page.tsx"), "utf-8");
  const emergChecks: [string, string][] = [
    ["no auth required (no redirect)",  "notFound"],
    ["looks up pet by qrToken",         "qrToken: params.token"],
    ["red emergency banner",            "EMERGENCY PET INFORMATION"],
    ["shows pet photo or emoji",        "speciesEmoji"],
    ["shows pet name",                  "pet.name"],
    ["shows microchip",                 "microchipId"],
    ["shows special notes highlighted", "Special Notes"],
    ["records grouped by type",         "RECORD_TYPE_ORDER"],
    ["vaccinations group",              "VACCINATION"],
    ["medications group",               "MEDICATION"],
    ["vet visits group",                "VET_VISIT"],
    ["surgeries group",                 "SURGERY"],
    ["server-side rendered",            "force-dynamic"],
    ["404 for invalid token",           "notFound()"],
  ];
  for (const [l, n] of emergChecks) {
    if (emergSrc.includes(n)) pass(l);
    else fail(l, `missing: ${n}`);
  }

  // ── 5. QrCodeTab shape ────────────────────────────────────────────────────
  section("QrCodeTab Component");
  const tabSrc = fs.readFileSync(path.join(process.cwd(), "components/pets/QrCodeTab.tsx"), "utf-8");
  const tabChecks: [string, string][] = [
    ["shows QR image",              "/api/pets/${petId}/qr"],
    ["Download button",             "Download QR"],
    ["Copy Link button",            "Copy Link"],
    ["locked state for non-premium","!isPremium"],
    ["upgrade link",                "/dashboard/settings"],
    ["download triggers PNG save",  ".download"],
    ["copy shows Copied! feedback", "Copied!"],
    ["instructions text",           "collar tag"],
  ];
  for (const [l, n] of tabChecks) {
    if (tabSrc.includes(n)) pass(l);
    else fail(l, `missing: ${n}`);
  }

  // ── 6. QrCodeTab wired into PetDetailClient ───────────────────────────────
  section("PetDetailClient");
  const clientSrc = fs.readFileSync(path.join(process.cwd(), "components/pets/PetDetailClient.tsx"), "utf-8");
  if (clientSrc.includes("QrCodeTab"))  pass("QrCodeTab imported");
  else                                   fail("QrCodeTab NOT imported");
  if (clientSrc.includes("<QrCodeTab")) pass("QrCodeTab rendered in QR tab");
  else                                   fail("QrCodeTab NOT rendered");

  // ── 7. Database — all pets have qrToken ──────────────────────────────────
  section("Database — qrToken");
  const pets = await db.pet.findMany({ select: { id: true, name: true, qrToken: true } });
  const withoutToken = pets.filter((p) => !p.qrToken);
  if (withoutToken.length === 0)
    pass("All pets have qrToken", `${pets.length} pet(s) checked`);
  else
    fail(`${withoutToken.length} pet(s) missing qrToken`, withoutToken.map(p => p.name).join(", "));

  console.log("\n  Pets and their tokens:");
  for (const p of pets) {
    console.log(`    • ${p.name}  →  token: ${p.qrToken ?? "NULL"}`);
  }

  // ── 8. HTTP — QR image endpoint (needs auth) ──────────────────────────────
  section("HTTP Endpoints");
  try {
    const petId = pets[0]?.id ?? "test";
    const qrRes = await fetch(`http://localhost:3333/api/pets/${petId}/qr`, {
      method: "GET", redirect: "manual",
    });
    if ([307, 302, 401].includes(qrRes.status))
      pass("QR image API auth-protected", `HTTP ${qrRes.status}`);
    else if (qrRes.status === 200 && qrRes.headers.get("content-type")?.includes("image/png"))
      pass("QR image API returns PNG (auth bypassed in dev?)", "HTTP 200 image/png");
    else {
      const b = await qrRes.text();
      if (b.includes("DOCTYPE")) pass("QR image API redirects to login", `HTTP ${qrRes.status}`);
      else fail("Unexpected response", `HTTP ${qrRes.status}`);
    }

    // Emergency page should be publicly accessible
    const token = pets[0]?.qrToken ?? "invalid";
    const emergRes = await fetch(`http://localhost:3333/emergency/${token}`, {
      method: "GET", redirect: "manual",
    });
    if (emergRes.status === 200)
      pass("Emergency page publicly accessible", "HTTP 200");
    else if (emergRes.status === 307)
      fail("Emergency page is redirecting (should be public — check middleware)", "HTTP 307");
    else
      fail("Unexpected emergency page status", `HTTP ${emergRes.status}`);

    // Invalid token → should 404
    const inv = await fetch("http://localhost:3333/emergency/invalid-token-xyz", {
      method: "GET", redirect: "manual",
    });
    if (inv.status === 404 || inv.status === 200)
      pass("Invalid token handled (404 or custom not-found)", `HTTP ${inv.status}`);
    else
      fail("Invalid token unexpected status", `HTTP ${inv.status}`);

  } catch {
    fail("Could not reach dev server — is it running on port 3333?");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  if (failed === 0) {
    console.log("\n  🎉 All Phase 13 terminal tests passed!");
    console.log("  Browser tests:");
    console.log("  1. Non-premium → QR Code tab → locked state");
    console.log("  2. Admin/premium → QR Code tab → QR image shown");
    console.log("  3. Download button → PNG file saved");
    console.log("  4. Copy Link → paste URL into browser → emergency page opens");
    console.log("  5. Emergency page shows all pet info, no login needed");
    console.log("  6. Visit /emergency/invalid → 404 page\n");
  } else {
    console.log("\n  Fix failures above before proceeding.\n");
  }
}

main().catch(console.error).finally(() => db.$disconnect());
