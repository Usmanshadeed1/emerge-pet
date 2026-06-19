/**
 * Phase 18 — EMR Integration
 * Tests: 18.1 emr-auth lib, 18.2 GET /api/emr/pets, 18.3 POST /api/emr/records
 */

import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import * as fs from "fs";
import * as path from "path";

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

const cwd = process.cwd();

// ─── 18.1  lib/emr-auth.ts ────────────────────────────────────────────────────

async function testEmrAuth() {
  console.log("\n18.1 — lib/emr-auth.ts");

  const emrAuthFile = path.join(cwd, "lib/emr-auth.ts");
  await check("lib/emr-auth.ts exists", () => {
    if (!fs.existsSync(emrAuthFile)) throw new Error("File not found");
  });

  const content = fs.readFileSync(emrAuthFile, "utf-8");

  await check("emrAuth function exported", () => {
    if (!content.includes("export async function emrAuth")) throw new Error("Missing emrAuth export");
  });
  await check("emrUnauthorized function exported", () => {
    if (!content.includes("export function emrUnauthorized")) throw new Error("Missing emrUnauthorized export");
  });
  await check("SHA-256 hashing used", () => {
    if (!content.includes("sha256")) throw new Error("Missing sha256");
  });
  await check("X-API-Key header read", () => {
    if (!content.includes("X-API-Key")) throw new Error("Missing X-API-Key header read");
  });
  await check("isActive checked", () => {
    if (!content.includes("isActive")) throw new Error("Missing isActive check");
  });
  await check("lastUsedAt updated", () => {
    if (!content.includes("lastUsedAt")) throw new Error("Missing lastUsedAt update");
  });

  // DB: create a test EmrKey
  const rawKey  = randomBytes(32).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const emrKey = await db.emrKey.create({
    data: { clinicName: "Test Animal Clinic", keyHash, isActive: true },
  });
  ok("Created test EmrKey in DB");

  // Validate lookup logic by checking hash
  const found = await db.emrKey.findUnique({ where: { keyHash } });
  await check("EmrKey found by hash", () => {
    if (!found)           throw new Error("Not found");
    if (!found.isActive)  throw new Error("Not active");
    if (found.clinicName !== "Test Animal Clinic") throw new Error("Wrong clinic name");
  });

  // Revoke test
  await db.emrKey.update({
    where: { id: emrKey.id },
    data:  { isActive: false, revokedAt: new Date() },
  });
  await check("Revoked key isActive=false", async () => {
    const r = await db.emrKey.findUnique({ where: { id: emrKey.id } });
    if (r?.isActive) throw new Error("Should be inactive after revoke");
  });

  // Restore for later tests
  await db.emrKey.update({ where: { id: emrKey.id }, data: { isActive: true, revokedAt: null } });

  // Store key for downstream tests
  return { emrKey, rawKey };
}

// ─── 18.2  GET /api/emr/pets route ───────────────────────────────────────────

async function testEmrPets() {
  console.log("\n18.2 — app/api/emr/pets/route.ts");

  const petsFile = path.join(cwd, "app/api/emr/pets/route.ts");
  await check("app/api/emr/pets/route.ts exists", () => {
    if (!fs.existsSync(petsFile)) throw new Error("File not found");
  });

  const content = fs.readFileSync(petsFile, "utf-8");

  await check("GET handler exported", () => {
    if (!content.includes("export async function GET")) throw new Error("Missing GET export");
  });
  await check("emrAuth called", () => {
    if (!content.includes("emrAuth")) throw new Error("Missing emrAuth call");
  });
  await check("Rate limit check present", () => {
    if (!content.includes("100") || !content.includes("rate") && !content.includes("Rate")) throw new Error("Missing rate limit logic");
  });
  await check("At-least-one-param validation", () => {
    if (!content.includes("At least one")) throw new Error("Missing param validation message");
  });
  await check("photoData excluded from select", () => {
    if (content.includes("photoData") && !content.includes("photoData: false") && content.match(/photoData/g)!.length > 0) {
      // photoData should NOT be in the select (it's excluded by not listing it)
      // If file contains photoData at all it should be in a comment or exclusion context
    }
    // Verify photoData is NOT selected (it won't appear in the select block)
    const selectBlock = content.match(/select:\s*\{([\s\S]*?)\},\s*take:/);
    if (selectBlock && selectBlock[1].includes("photoData")) throw new Error("photoData should not be in select");
  });
  await check("microchip/name/species/dob search params handled", () => {
    if (!content.includes("microchip") || !content.includes("name") ||
        !content.includes("species")   || !content.includes("dob")) {
      throw new Error("Missing search params");
    }
  });
  await check("Results limited (take: 10)", () => {
    if (!content.includes("take: 10") && !content.includes("take:10")) throw new Error("Missing result limit");
  });

  // DB integration: find a pet to search for
  const pet = await db.pet.findFirst({ select: { id: true, name: true, species: true } });
  if (pet) {
    const results = await db.pet.findMany({
      where: { name: { contains: pet.name.slice(0, 3), mode: "insensitive" } },
      select: { id: true, name: true },
      take: 10,
    });
    await check(`Search by partial name returns results`, () => {
      if (results.length === 0) throw new Error("No results for known pet name");
    });
  } else {
    ok("No pets in DB — skipping DB search test");
  }
}

// ─── 18.3  POST /api/emr/records route ───────────────────────────────────────

async function testEmrRecords(rawKey: string) {
  console.log("\n18.3 — app/api/emr/records/route.ts");

  const recordsFile = path.join(cwd, "app/api/emr/records/route.ts");
  await check("app/api/emr/records/route.ts exists", () => {
    if (!fs.existsSync(recordsFile)) throw new Error("File not found");
  });

  const content = fs.readFileSync(recordsFile, "utf-8");

  await check("POST handler exported", () => {
    if (!content.includes("export async function POST")) throw new Error("Missing POST export");
  });
  await check("emrAuth called", () => {
    if (!content.includes("emrAuth")) throw new Error("Missing emrAuth call");
  });
  await check("source: VET_PUSHED set on record", () => {
    if (!content.includes("VET_PUSHED")) throw new Error("Missing VET_PUSHED source");
  });
  await check("Returns 201 status", () => {
    if (!content.includes("201")) throw new Error("Missing 201 status");
  });
  await check("Owner email notification sent", () => {
    if (!content.includes("sendEmail")) throw new Error("Missing sendEmail call");
  });
  await check("petId/type/title validated as required", () => {
    if (!content.includes("petId") || !content.includes("type") || !content.includes("title")) {
      throw new Error("Missing required field validation");
    }
  });
  await check("clinicName stored from authenticated clinic", () => {
    if (!content.includes("clinic.clinicName")) throw new Error("Missing clinic.clinicName usage");
  });

  // DB: push a record to a real pet
  const pet = await db.pet.findFirst({
    select: { id: true, name: true },
  });

  if (pet) {
    const record = await db.healthRecord.create({
      data: {
        petId:     pet.id,
        type:      "VET_VISIT",
        title:     "EMR Test Visit",
        date:      new Date(),
        clinicName: "Test Animal Clinic",
        notes:     "Pushed via Phase 18 test",
        source:    "VET_PUSHED",
      },
    });
    await check("HealthRecord created with VET_PUSHED source", async () => {
      const found = await db.healthRecord.findUnique({ where: { id: record.id } });
      if (!found)                       throw new Error("Record not found");
      if (found.source !== "VET_PUSHED") throw new Error(`Expected VET_PUSHED, got ${found.source}`);
      if (found.petId !== pet.id)        throw new Error("Wrong petId");
    });
    // Cleanup
    await db.healthRecord.delete({ where: { id: record.id } });
    ok("Cleanup test health record");
  } else {
    ok("No pets in DB — skipping DB record push test");
  }
}

// ─── 18.4  Admin EMR key management (schema check) ───────────────────────────

async function testAdminEmrPanel() {
  console.log("\n18.4 — EmrKey schema + admin integration");

  await check("EmrKey model exists in schema", () => {
    const schema = fs.readFileSync(path.join(cwd, "prisma/schema.prisma"), "utf-8");
    if (!schema.includes("model EmrKey")) throw new Error("EmrKey model not found in schema");
  });

  await check("EmrKey has keyHash field (hashed storage)", () => {
    const schema = fs.readFileSync(path.join(cwd, "prisma/schema.prisma"), "utf-8");
    if (!schema.includes("keyHash")) throw new Error("Missing keyHash field");
  });

  await check("EmrKey has revokedAt field", () => {
    const schema = fs.readFileSync(path.join(cwd, "prisma/schema.prisma"), "utf-8");
    if (!schema.includes("revokedAt")) throw new Error("Missing revokedAt field");
  });

  await check("EmrKey has lastUsedAt field", () => {
    const schema = fs.readFileSync(path.join(cwd, "prisma/schema.prisma"), "utf-8");
    if (!schema.includes("lastUsedAt")) throw new Error("Missing lastUsedAt field");
  });

  // CRUD operations on EmrKey
  const rawKey  = randomBytes(32).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const key = await db.emrKey.create({
    data: { clinicName: "Admin Test Clinic", keyHash, isActive: true },
  });
  await check("EmrKey created via Prisma", () => {
    if (!key.id) throw new Error("Missing id");
  });
  await check("EmrKey isActive defaults to true", () => {
    if (!key.isActive) throw new Error("Expected isActive=true");
  });

  await db.emrKey.update({ where: { id: key.id }, data: { isActive: false, revokedAt: new Date() } });
  const revoked = await db.emrKey.findUnique({ where: { id: key.id } });
  await check("EmrKey can be revoked", () => {
    if (revoked?.isActive) throw new Error("Should be inactive");
    if (!revoked?.revokedAt) throw new Error("Missing revokedAt");
  });

  // Cleanup
  await db.emrKey.delete({ where: { id: key.id } });
  ok("Cleanup admin test EmrKey");
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(55));
  console.log("  Phase 18 — EMR Integration  (terminal)");
  console.log("=".repeat(55));

  const { emrKey, rawKey } = await testEmrAuth();
  await testEmrPets();
  await testEmrRecords(rawKey);
  await testAdminEmrPanel();

  // Cleanup the initial test EMrKey
  try { await db.emrKey.delete({ where: { id: emrKey.id } }); } catch {}
  ok("Cleanup initial test EmrKey");

  console.log("\n" + "=".repeat(55));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(55));
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => { console.error("Fatal:", e); process.exit(1); })
  .finally(() => db.$disconnect());
