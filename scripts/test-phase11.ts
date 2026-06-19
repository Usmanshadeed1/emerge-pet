// Run with: npx tsx scripts/test-phase11.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

async function main() {
  console.log("\n========================================");
  console.log("   Phase 11 — Pet Health Score Test Suite");
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
    "app/api/ai/health-score/[petId]/route.ts",
    "components/pets/HealthScoreTab.tsx",
    "components/pets/AIToolsTab.tsx",
  ];
  for (const f of files) {
    if (fs.existsSync(path.join(process.cwd(), f))) pass(f);
    else fail(f, "FILE MISSING");
  }

  // ── 2. AIToolsTab wired into PetDetailClient ───────────────────────────────
  section("AIToolsTab wired into PetDetailClient");

  const clientSrc = fs.readFileSync(
    path.join(process.cwd(), "components/pets/PetDetailClient.tsx"),
    "utf-8"
  );

  if (clientSrc.includes("AIToolsTab"))         pass("AIToolsTab imported");
  else                                           fail("AIToolsTab NOT imported");
  if (clientSrc.includes("<AIToolsTab"))         pass("AIToolsTab rendered in AI tab");
  else                                           fail("AIToolsTab NOT rendered");
  if (clientSrc.includes("isPremium"))           pass("isPremium prop passed to AIToolsTab");
  else                                           fail("isPremium prop missing");

  // ── 3. Pet detail page passes isPremium ───────────────────────────────────
  section("Pet Detail Page");

  const pageSrc = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/pets/[id]/page.tsx"),
    "utf-8"
  );

  if (pageSrc.includes("isPremium"))             pass("isPremium fetched in pet detail page");
  else                                           fail("isPremium NOT fetched in pet detail page");
  if (pageSrc.includes("from \"@/lib/premium\"")) pass("isPremium imported from lib/premium");
  else                                            fail("isPremium import missing");

  // ── 4. Health Score route shape ────────────────────────────────────────────
  section("Health Score Route Shape");

  const routeSrc = fs.readFileSync(
    path.join(process.cwd(), "app/api/ai/health-score/[petId]/route.ts"),
    "utf-8"
  );

  const checks: [string, string][] = [
    ["exports GET handler",              "export async function GET"],
    ["checks auth session",              "await auth()"],
    ["checks premium",                   "isPremium("],
    ["returns 403 for non-premium",      "status: 403"],
    ["verifies pet ownership",           "ownerId: session.user.id"],
    ["fetches health records",           "db.healthRecord.findMany"],
    ["fetches reminders",                "db.reminder.findMany"],
    ["fetches completed reminders",      "isCompleted: true"],
    ["calls AI with health_score prompt","prompt_health_score"],
    ["validates 6 categories",           "categories.length !== 6"],
    ["validates overallScore",           "overallScore"],
    ["validates grade",                  "grade"],
    ["validates recommendations",        "recommendations"],
  ];

  for (const [label, needle] of checks) {
    if (routeSrc.includes(needle)) pass(label);
    else fail(label, `missing: ${needle}`);
  }

  // ── 5. HealthScoreTab UI shape ─────────────────────────────────────────────
  section("HealthScoreTab UI Shape");

  const tabSrc = fs.readFileSync(
    path.join(process.cwd(), "components/pets/HealthScoreTab.tsx"),
    "utf-8"
  );

  const uiChecks: [string, string][] = [
    ["SVG ring renderer",           "<svg"],
    ["stroke-dasharray for ring",   "strokeDasharray"],
    ["green for score >= 80",       "#22c55e"],
    ["orange for score 60-79",      "#f97316"],
    ["red for score < 60",          "#ef4444"],
    ["letter grade displayed",      "grade"],
    ["6 category progress bars",    "categories.map"],
    ["bar width uses score%",       "score}%"],
    ["URGENT badge",                "URGENT"],
    ["SOON badge",                  "SOON"],
    ["TIP badge",                   "TIP"],
    ["locked state for non-premium","!isPremium"],
    ["Generate button",             "Generate Health Score"],
    ["Regenerate button",           "Regenerate"],
  ];

  for (const [label, needle] of uiChecks) {
    if (tabSrc.includes(needle)) pass(label);
    else fail(label, `missing: ${needle}`);
  }

  // ── 6. AIToolsTab sub-tab switcher ─────────────────────────────────────────
  section("AIToolsTab Sub-Tab Switcher");

  const aiTabSrc = fs.readFileSync(
    path.join(process.cwd(), "components/pets/AIToolsTab.tsx"),
    "utf-8"
  );

  if (aiTabSrc.includes("VisitPrepTab"))    pass("VisitPrepTab included");
  else                                       fail("VisitPrepTab missing from AIToolsTab");
  if (aiTabSrc.includes("HealthScoreTab"))  pass("HealthScoreTab included");
  else                                       fail("HealthScoreTab missing from AIToolsTab");
  if (aiTabSrc.includes("visit-prep"))      pass("visit-prep sub-tab key present");
  else                                       fail("visit-prep sub-tab missing");
  if (aiTabSrc.includes("health-score"))    pass("health-score sub-tab key present");
  else                                       fail("health-score sub-tab missing");

  // ── 7. Database readiness ──────────────────────────────────────────────────
  section("Database Readiness");

  const llmConfigs = await db.llmConfig.findMany({ where: { isActive: true } });
  if (llmConfigs.length > 0)
    pass("Active LLM config found", `${llmConfigs.length} provider(s): ${llmConfigs.map(l => l.label).join(", ")}`);
  else
    fail("No active LLM config — health score AI call will fail");

  const pets = await db.pet.findMany({
    select: {
      id: true, name: true, species: true,
      owner: { select: { email: true, role: true } },
      _count: { select: { healthRecords: true, reminders: true } },
    },
    take: 5,
  });

  if (pets.length > 0) {
    pass("Pets found in database", `${pets.length} pet(s)`);
    console.log("\n  Pets for Health Score testing:");
    for (const p of pets) {
      const premium = p.owner.role === "ADMIN" ? " [ADMIN=premium]" : "";
      console.log(`    • ${p.name} (${p.species}) — ${p.owner.email}${premium} — ${p._count.healthRecords} records  id: ${p.id}`);
    }
  } else {
    fail("No pets found — add a pet first");
  }

  // ── 8. HTTP — premium check (unauthenticated → redirect) ──────────────────
  section("HTTP Endpoint (unauthenticated)");

  try {
    const testId = pets[0]?.id ?? "test-id";
    const res    = await fetch(`http://localhost:3333/api/ai/health-score/${testId}`, {
      method: "GET", redirect: "manual",
    });
    if ([401, 307, 302].includes(res.status)) {
      pass("Unauthenticated request blocked", `HTTP ${res.status}`);
    } else if (res.status === 200) {
      const body = await res.text();
      if (body.includes("login") || body.includes("DOCTYPE"))
        pass("Unauthenticated request redirected to login", "HTTP 200 (login HTML)");
      else
        fail("Unexpected 200 body", body.substring(0, 80));
    } else {
      fail("Unexpected status", `HTTP ${res.status}`);
    }
  } catch {
    fail("Could not reach dev server at http://localhost:3333 — is it running?");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  if (failed === 0) {
    console.log("\n  🎉 All Phase 11 terminal tests passed!");
    console.log("  Browser tests remaining:");
    console.log("  1. Non-premium user → AI Tools → Health Score → sees locked state");
    console.log("  2. Premium/admin user → Generate Health Score → ring, grade, 6 bars, recommendations");
    console.log("  3. Score colour: green (80+), orange (60-79), red (<60)");
    console.log("  4. All 6 categories show a score and status note");
    console.log("  5. Recommendations show correct URGENT/SOON/TIP badge");
    console.log("  6. Regenerate button fetches a fresh score\n");
  } else {
    console.log("\n  Fix the failures above before proceeding.\n");
  }
}

main().catch(console.error).finally(() => db.$disconnect());
