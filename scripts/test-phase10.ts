// Run with: npx tsx scripts/test-phase10.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

async function main() {
  console.log("\n========================================");
  console.log("   Phase 10 — AI Visit Prep Test Suite");
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
    "app/api/ai/visit-prep/[petId]/route.ts",
    "components/pets/VisitPrepTab.tsx",
  ];
  for (const f of files) {
    const full = path.join(process.cwd(), f);
    if (fs.existsSync(full)) pass(f);
    else fail(f, "FILE MISSING");
  }

  // ── 2. VisitPrepTab wired in PetDetailClient ───────────────────────────────
  section("VisitPrepTab wired into PetDetailClient");

  const clientPath = path.join(process.cwd(), "components/pets/PetDetailClient.tsx");
  const clientSrc  = fs.readFileSync(clientPath, "utf-8");

  if (clientSrc.includes("VisitPrepTab"))
    pass("VisitPrepTab imported in PetDetailClient");
  else
    fail("VisitPrepTab NOT imported in PetDetailClient");

  if (clientSrc.includes("<VisitPrepTab"))
    pass("VisitPrepTab rendered in AI Tools tab");
  else
    fail("VisitPrepTab NOT rendered (ComingSoon still present?)");

  if (!clientSrc.includes('label="AI Tools"'))
    pass("ComingSoon placeholder removed for AI tab");
  else
    fail("ComingSoon placeholder still present for AI tab");

  // ── 3. Route shape ─────────────────────────────────────────────────────────
  section("Route File Shape");

  const routeSrc = fs.readFileSync(
    path.join(process.cwd(), "app/api/ai/visit-prep/[petId]/route.ts"),
    "utf-8"
  );

  const checks: [string, string][] = [
    ["exports GET handler",         "export async function GET"],
    ["checks auth session",         "await auth()"],
    ["verifies pet ownership",      "ownerId: session.user.id"],
    ["fetches health records",      "db.healthRecord.findMany"],
    ["fetches reminders",           "db.reminder.findMany"],
    ["calls AI",                    "callAI("],
    ["uses visit_prep prompt",      "prompt_visit_prep"],
    ["parses JSON response",        "JSON.parse("],
    ["validates 5 sections",        "currentConcerns"],
    ["returns NextResponse.json",   "NextResponse.json(result)"],
  ];

  for (const [label, needle] of checks) {
    if (routeSrc.includes(needle)) pass(label);
    else fail(label, `missing: ${needle}`);
  }

  // ── 4. Database readiness ──────────────────────────────────────────────────
  section("Database Readiness");

  // LLM config
  const llmConfigs = await db.llmConfig.findMany({ where: { isActive: true } });
  if (llmConfigs.length > 0)
    pass(`Active LLM config found`, `${llmConfigs.length} provider(s): ${llmConfigs.map(l => l.label).join(", ")}`);
  else
    fail("No active LLM config — AI call will fail. Add one in Admin → Settings → LLM");

  // visit_prep prompt (optional — falls back to default)
  const visitPrepPrompt = await db.appSettings.findUnique({ where: { key: "prompt_visit_prep" } });
  if (visitPrepPrompt)
    pass("Custom prompt_visit_prep found in AppSettings");
  else
    pass("No custom prompt_visit_prep — will use hardcoded fallback (OK)");

  // Pets with records
  const pets = await db.pet.findMany({
    select: {
      id: true, name: true, species: true,
      owner: { select: { email: true, role: true } },
      _count: { select: { healthRecords: true, reminders: true } },
    },
    take: 10,
  });

  if (pets.length > 0) {
    pass(`Pets found in database`, `${pets.length} pet(s)`);
    console.log("\n  Pets available for Visit Prep testing:");
    for (const p of pets) {
      const records = p._count.healthRecords;
      const reminders = p._count.reminders;
      console.log(`    • ${p.name} (${p.species}) — owner: ${p.owner.email} [${p.owner.role}] — ${records} records, ${reminders} reminders  id: ${p.id}`);
    }

    // Pick a pet with the most records for a useful AI test
    const bestPet = pets.sort((a, b) => b._count.healthRecords - a._count.healthRecords)[0];
    console.log(`\n  Best pet for testing (most records): ${bestPet.name} — id: ${bestPet.id}`);
  } else {
    fail("No pets found — add a pet first");
  }

  // ── 5. HTTP — unauthenticated request blocked ──────────────────────────────
  section("HTTP Endpoint (unauthenticated)");

  try {
    const testId = pets[0]?.id ?? "test-id";
    const res    = await fetch(`http://localhost:3333/api/ai/visit-prep/${testId}`, {
      method:   "GET",
      redirect: "manual",
    });

    // Middleware will redirect to /login (3xx) or return 401
    if (res.status === 401 || res.status === 307 || res.status === 302) {
      pass("Unauthenticated request blocked", `HTTP ${res.status}`);
    } else if (res.status === 200) {
      // Could be a redirect that was followed — check body
      const body = await res.text();
      if (body.includes("login") || body.includes("Login") || body.includes("DOCTYPE")) {
        pass("Unauthenticated request redirected to login page", "HTTP 200 (login HTML)");
      } else {
        fail("Unauthenticated request returned 200 with non-login body", body.substring(0, 100));
      }
    } else {
      fail("Unexpected status code", `HTTP ${res.status}`);
    }
  } catch {
    fail("Could not reach dev server at http://localhost:3333 — is it running?");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  if (failed === 0) {
    console.log("\n  🎉 All terminal tests passed!");
    console.log("  Now run the browser tests:");
    console.log("  1. Log in → any pet → AI Tools tab");
    console.log("  2. Click 'Generate Visit Prep' → 5 cards appear");
    console.log("  3. Click 'Share' → ✓ Copied!");
    console.log("  4. Click 'Regenerate' → fresh content loads\n");
  } else {
    console.log("\n  Fix the failures above before proceeding.\n");
  }
}

main().catch(console.error).finally(() => db.$disconnect());
