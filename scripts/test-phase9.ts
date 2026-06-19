// Run with: npx tsx scripts/test-phase9.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("\n=== Phase 9 DB Test Setup ===\n");

  // List all users
  const users = await db.user.findMany({
    select: { id: true, email: true, role: true, onboardingCompleted: true },
    orderBy: { createdAt: "asc" },
  });

  console.log("Users in database:");
  users.forEach((u) => console.log(`  ${u.email} (${u.role}) — id: ${u.id}`));

  if (users.length === 0) {
    console.log("  No users found. Sign up first.");
    return;
  }

  // Check subscriptions
  const subs = await db.subscription.findMany({
    select: { userId: true, status: true, plan: true, currentPeriodEnd: true },
  });
  console.log("\nExisting subscriptions:", subs.length > 0 ? subs : "none");

  // Find non-admin user to make premium (or first user if all are admins)
  const testUser = users.find((u) => u.role !== "ADMIN") ?? users[0];
  console.log(`\nTest user for premium: ${testUser.email}`);

  // Insert/upsert a test ACTIVE subscription for this user
  const existing = await db.subscription.findUnique({ where: { userId: testUser.id } });

  if (existing) {
    await db.subscription.update({
      where: { userId: testUser.id },
      data: {
        status:           "ACTIVE",
        plan:             "MONTHLY",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });
    console.log(`Updated subscription to ACTIVE for ${testUser.email}`);
  } else {
    await db.subscription.create({
      data: {
        userId:           testUser.id,
        plan:             "MONTHLY",
        status:           "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`Created ACTIVE subscription for ${testUser.email}`);
  }

  // Verify pets exist for testing
  const pets = await db.pet.findMany({
    where:  { ownerId: testUser.id },
    select: { id: true, name: true, species: true },
  });
  console.log(`\nPets for test user: ${pets.length > 0 ? pets.map(p => `${p.name} (${p.species})`).join(", ") : "none"}`);

  console.log("\n=== DONE ===");
  console.log(`\nNow log in as: ${testUser.email}`);
  console.log("Visit: http://localhost:3333/dashboard/symptom-checker");
  console.log("You should see the full symptom checker (not the upgrade prompt).\n");
}

main().catch(console.error).finally(() => db.$disconnect());
