// Run with: npx tsx scripts/test-phase12.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

async function main() {
  console.log("\n========================================");
  console.log("   Phase 12 — Pet Care Advisor Test Suite");
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
    "app/api/ai/advisor/route.ts",
    "app/dashboard/advisor/page.tsx",
  ];
  for (const f of files) {
    if (fs.existsSync(path.join(process.cwd(), f))) pass(f);
    else fail(f, "FILE MISSING");
  }

  // ── 2. Advisor route shape ─────────────────────────────────────────────────
  section("Advisor API Route Shape");

  const routeSrc = fs.readFileSync(
    path.join(process.cwd(), "app/api/ai/advisor/route.ts"),
    "utf-8"
  );

  const routeChecks: [string, string][] = [
    ["exports POST handler",                  "export async function POST"],
    ["checks auth session",                   "await auth()"],
    ["accepts petId (optional)",              "petId?"],
    ["accepts message",                       "message"],
    ["accepts conversationHistory",           "conversationHistory"],
    ["validates message required",            "Message is required"],
    ["fetches pet if petId given",            "db.pet.findFirst"],
    ["builds species-aware context",          "petContext"],
    ["uses advisor prompt",                   "prompt_advisor"],
    ["passes history to callAI",              "recentHistory"],
    ["extracts product links from response",  "linkRegex"],
    ["returns response and links",            "{ response, links }"],
  ];

  for (const [label, needle] of routeChecks) {
    if (routeSrc.includes(needle)) pass(label);
    else fail(label, `missing: ${needle}`);
  }

  // ── 3. Advisor page shape ──────────────────────────────────────────────────
  section("Advisor Page (UI) Shape");

  const pageSrc = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/advisor/page.tsx"),
    "utf-8"
  );

  const pageChecks: [string, string][] = [
    ["pet selector dropdown",              "<select"],
    ["DOG starter questions",              "DOG:"],
    ["CAT starter questions",              "CAT:"],
    ["starter questions rendered",         "starters.map"],
    ["chat message thread",                "messages.map"],
    ["user messages on right",             "justify-end"],
    ["AI messages on left",               "justify-start"],
    ["typing indicator (bouncing dots)",   "animate-bounce"],
    ["product links clickable",            'target="_blank"'],
    ["New Conversation button",            "New Conversation"],
    ["send on Enter key",                  "Enter"],
    ["send button",                        'type="submit"'],
    ["auto-scrolls to bottom",            "scrollIntoView"],
    ["conversation history maintained",    "conversationHistory: messages"],
  ];

  for (const [label, needle] of pageChecks) {
    if (pageSrc.includes(needle)) pass(label);
    else fail(label, `missing: ${needle}`);
  }

  // ── 4. DashboardNav includes Advisor ──────────────────────────────────────
  section("DashboardNav");

  const navSrc = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/DashboardNav.tsx"),
    "utf-8"
  );

  if (navSrc.includes("/dashboard/advisor")) pass("Advisor link in DashboardNav");
  else                                        fail("Advisor link NOT in DashboardNav");

  // ── 5. lib/prompts.ts has advisor prompt ──────────────────────────────────
  section("Prompts");

  const promptsSrc = fs.readFileSync(
    path.join(process.cwd(), "lib/prompts.ts"),
    "utf-8"
  );

  if (promptsSrc.includes("PROMPT_ADVISOR"))      pass("PROMPT_ADVISOR constant defined");
  else                                             fail("PROMPT_ADVISOR missing from lib/prompts.ts");
  if (promptsSrc.includes("prompt_advisor"))       pass("prompt_advisor key registered");
  else                                             fail("prompt_advisor key missing from PROMPT_KEYS");

  // ── 6. Database readiness ──────────────────────────────────────────────────
  section("Database Readiness");

  const llmConfigs = await db.llmConfig.findMany({ where: { isActive: true } });
  if (llmConfigs.length > 0)
    pass("Active LLM config", `${llmConfigs.length} provider(s)`);
  else
    fail("No active LLM config — advisor AI call will fail");

  const pets = await db.pet.findMany({
    select: { id: true, name: true, species: true, owner: { select: { email: true } } },
    take:   5,
  });

  if (pets.length > 0) {
    pass("Pets in database for testing", `${pets.length} pet(s)`);
    console.log("\n  Pets for Advisor testing:");
    for (const p of pets) {
      console.log(`    • ${p.name} (${p.species}) — ${p.owner.email}  id: ${p.id}`);
    }
  } else {
    fail("No pets found");
  }

  // ── 7. HTTP — unauthenticated request blocked ──────────────────────────────
  section("HTTP Endpoint (unauthenticated)");

  try {
    const res = await fetch("http://localhost:3333/api/ai/advisor", {
      method:   "POST",
      headers:  { "Content-Type": "application/json" },
      body:     JSON.stringify({ message: "hello", conversationHistory: [] }),
      redirect: "manual",
    });

    if ([401, 307, 302].includes(res.status)) {
      pass("Unauthenticated POST blocked", `HTTP ${res.status}`);
    } else if (res.status === 200) {
      const body = await res.text();
      if (body.includes("login") || body.includes("DOCTYPE"))
        pass("Unauthenticated POST redirected to login", "HTTP 200 (login HTML)");
      else
        fail("Unexpected 200 body", body.substring(0, 80));
    } else {
      fail("Unexpected status", `HTTP ${res.status}`);
    }
  } catch {
    fail("Could not reach dev server — is it running on port 3333?");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  if (failed === 0) {
    console.log("\n  🎉 All Phase 12 terminal tests passed!");
    console.log("  Browser tests remaining:");
    console.log("  1. Select a Dog → see dog-specific starter questions");
    console.log("  2. Select a Cat → see cat-specific starter questions");
    console.log("  3. Click a starter question or type a message → AI responds");
    console.log("  4. Send more messages → conversation history maintained");
    console.log("  5. If AI response has links → they appear as clickable links");
    console.log("  6. Click 'New Conversation' → thread clears\n");
  } else {
    console.log("\n  Fix the failures above before proceeding.\n");
  }
}

main().catch(console.error).finally(() => db.$disconnect());
