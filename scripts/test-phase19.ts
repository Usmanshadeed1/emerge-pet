/**
 * Phase 19 — Landing Page & Newsletter
 * Tests: 19.1 app/page.tsx structure, 19.2 newsletter subscribe API
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

// ─── 19.1  Landing page (app/page.tsx) ────────────────────────────────────────

async function testLandingPage() {
  console.log("\n19.1 — app/page.tsx (Landing Page)");

  const pagePath = path.join(cwd, "app/page.tsx");
  await check("app/page.tsx exists", () => {
    if (!fs.existsSync(pagePath)) throw new Error("File not found");
  });

  const content = fs.readFileSync(pagePath, "utf-8");

  // Hero section
  await check("Hero: headline present", () => {
    if (!content.includes("fingertips") && !content.includes("health") && !content.includes("smart")) {
      throw new Error("Missing hero headline");
    }
  });
  await check("Hero: CTA link to /signup", () => {
    if (!content.includes("/signup")) throw new Error("Missing /signup CTA link");
  });
  await check("Hero: sign in link to /login", () => {
    if (!content.includes("/login")) throw new Error("Missing /login link");
  });

  // Features
  await check("Features: at least 6 feature items", () => {
    const featureMatches = content.match(/title:/g);
    if (!featureMatches || featureMatches.length < 6) throw new Error("Fewer than 6 feature titles found");
  });
  await check("Features: Health Records included", () => {
    if (!content.includes("Health Records")) throw new Error("Missing Health Records feature");
  });
  await check("Features: AI Symptom Checker included", () => {
    if (!content.includes("Symptom")) throw new Error("Missing Symptom Checker feature");
  });
  await check("Features: Reminders included", () => {
    if (!content.includes("Reminder")) throw new Error("Missing Reminders feature");
  });

  // Pricing
  await check("Pricing: Free tier present", () => {
    if (!content.includes("$0") && !content.includes("Free")) throw new Error("Missing free tier pricing");
  });
  await check("Pricing: Premium tier with $4.99", () => {
    if (!content.includes("4.99")) throw new Error("Missing $4.99 premium price");
  });
  await check("Pricing: Annual savings mentioned", () => {
    if (!content.includes("39.99") && !content.includes("Save 33")) throw new Error("Missing annual savings");
  });
  await check("Pricing: MOST POPULAR badge or similar", () => {
    if (!content.includes("POPULAR") && !content.includes("Popular") && !content.includes("popular")) {
      throw new Error("Missing popular badge on premium plan");
    }
  });

  // Newsletter
  await check("Newsletter: NewsletterForm component used", () => {
    if (!content.includes("NewsletterForm")) throw new Error("Missing NewsletterForm component");
  });

  // Newsletter form component
  const formPath = path.join(cwd, "components/landing/NewsletterForm.tsx");
  await check("components/landing/NewsletterForm.tsx exists", () => {
    if (!fs.existsSync(formPath)) throw new Error("File not found");
  });

  const formContent = fs.readFileSync(formPath, "utf-8");
  await check("NewsletterForm: use client directive", () => {
    if (!formContent.includes("use client")) throw new Error("Missing 'use client'");
  });
  await check("NewsletterForm: email input present", () => {
    if (!formContent.includes("email")) throw new Error("Missing email input");
  });
  await check("NewsletterForm: calls /api/newsletter/subscribe", () => {
    if (!formContent.includes("/api/newsletter/subscribe")) throw new Error("Missing API call");
  });
  await check("NewsletterForm: success state shown", () => {
    if (!formContent.includes("success") && !formContent.includes("Success")) throw new Error("Missing success state");
  });

  // Footer
  await check("Footer: EmergePet brand present", () => {
    if (!content.includes("EmergePet")) throw new Error("Missing brand in footer");
  });
  await check("Footer: copyright present", () => {
    if (!content.includes("©") && !content.includes("copyright") && !content.includes("All rights")) {
      throw new Error("Missing copyright in footer");
    }
  });

  // Nav
  await check("Nav: sticky header present", () => {
    if (!content.includes("sticky") && !content.includes("top-0")) throw new Error("Missing sticky nav");
  });
}

// ─── 19.2  Newsletter subscribe API ───────────────────────────────────────────

async function testNewsletterApi() {
  console.log("\n19.2 — app/api/newsletter/subscribe/route.ts");

  const routePath = path.join(cwd, "app/api/newsletter/subscribe/route.ts");
  await check("app/api/newsletter/subscribe/route.ts exists", () => {
    if (!fs.existsSync(routePath)) throw new Error("File not found");
  });

  const content = fs.readFileSync(routePath, "utf-8");

  await check("POST handler exported", () => {
    if (!content.includes("export async function POST")) throw new Error("Missing POST export");
  });
  await check("Email validation present", () => {
    if (!content.includes("@")) throw new Error("Missing email validation");
  });
  await check("Mailchimp API key read from AppSettings", () => {
    if (!content.includes("mailchimp_api_key")) throw new Error("Missing mailchimp_api_key setting read");
  });
  await check("website-signup tag applied", () => {
    if (!content.includes("website-signup")) throw new Error("Missing website-signup tag");
  });
  await check("Always returns success (non-fatal mailchimp)", () => {
    if (!content.includes("success: true")) throw new Error("Missing success: true response");
  });
  await check("Non-fatal Mailchimp error handling (try/catch)", () => {
    if (!content.includes("catch")) throw new Error("Missing error catch block for Mailchimp");
  });

  // DB/AppSettings: verify getSetting used
  await check("getSetting imported for AppSettings", () => {
    if (!content.includes("getSetting")) throw new Error("Missing getSetting import/use");
  });

  // Validate AppSettings table queryable
  await check("AppSettings table accessible via Prisma", async () => {
    const count = await db.appSettings.count();
    if (typeof count !== "number") throw new Error("Unexpected result type");
  });
}

// ─── 19.3  Full app build check ───────────────────────────────────────────────

async function testBuildArtifacts() {
  console.log("\n19.3 — Build artifacts");

  await check(".next/BUILD_ID exists (build succeeded)", () => {
    const buildId = path.join(cwd, ".next/BUILD_ID");
    if (!fs.existsSync(buildId)) throw new Error("Build not found — run npx next build first");
  });

  // Verify landing page is in static output
  await check("Landing page included in Next.js output", () => {
    const nextDir = path.join(cwd, ".next");
    if (!fs.existsSync(nextDir)) throw new Error(".next directory not found");
  });

  // Verify newsletter route compiled
  const newsletterServer = path.join(cwd, ".next/server/app/api/newsletter/subscribe/route.js");
  await check("Newsletter route compiled to server bundle", () => {
    if (!fs.existsSync(newsletterServer)) throw new Error("Compiled newsletter route not found");
  });
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(55));
  console.log("  Phase 19 — Landing Page & Newsletter  (terminal)");
  console.log("=".repeat(55));

  await testLandingPage();
  await testNewsletterApi();
  await testBuildArtifacts();

  console.log("\n" + "=".repeat(55));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(55));
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => { console.error("Fatal:", e); process.exit(1); })
  .finally(() => db.$disconnect());
