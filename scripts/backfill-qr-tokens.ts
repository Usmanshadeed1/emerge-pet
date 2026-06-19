import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const db = new PrismaClient();

async function main() {
  const pets = await db.pet.findMany({ where: { qrToken: null }, select: { id: true, name: true } });
  console.log(`Backfilling ${pets.length} pets with qrTokens...`);
  for (const pet of pets) {
    const token = randomBytes(16).toString("hex");
    await db.pet.update({ where: { id: pet.id }, data: { qrToken: token } });
    console.log(`  ✅ ${pet.name} → ${token}`);
  }
  console.log("Done.");
}

main().catch(console.error).finally(() => db.$disconnect());
