import { db } from "@/lib/db";

export function calculateTier(totalPoints: number): string {
  if (totalPoints >= 1000) return "Platinum Pet Parent";
  if (totalPoints >= 601)  return "Expert Caregiver";
  if (totalPoints >= 301)  return "Dedicated Owner";
  if (totalPoints >= 101)  return "Pet Lover";
  return "New Member";
}

export async function awardPoints(userId: string, action: string, points: number): Promise<void> {
  try {
    const [updated] = await db.$transaction([
      db.rewardPoints.upsert({
        where:  { userId },
        create: { userId, totalPoints: points, tier: calculateTier(points) },
        update: { totalPoints: { increment: points } },
      }),
      db.pointTransaction.create({
        data: { userId, action, points },
      }),
    ]);

    // Recalculate tier after increment
    const tier = calculateTier(updated.totalPoints);
    if (updated.tier !== tier) {
      await db.rewardPoints.update({ where: { userId }, data: { tier } });
    }

    // Check achievements asynchronously — non-fatal
    void checkAchievements(userId).catch(() => {});
  } catch (err) {
    console.error("[points] Failed to award points:", err);
  }
}

// ─── Achievements ─────────────────────────────────────────────────────────────

const BADGE_CHECKS: Record<string, (userId: string) => Promise<boolean>> = {
  "First Step": async (userId) => {
    const u = await db.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
    return !!u;
  },
  "Pet Parent": async (userId) => {
    const count = await db.pet.count({ where: { ownerId: userId } });
    return count >= 1;
  },
  "Record Keeper": async (userId) => {
    const count = await db.healthRecord.count({ where: { pet: { ownerId: userId } } });
    return count >= 10;
  },
  "On Schedule": async (userId) => {
    const count = await db.reminder.count({ where: { pet: { ownerId: userId }, isCompleted: true } });
    return count >= 5;
  },
  "AI Explorer": async (userId) => {
    const count = await db.pointTransaction.count({ where: { userId, action: { in: ["symptom_check", "health_score", "visit_prep"] } } });
    return count >= 1;
  },
  "Consistent Care": async (userId) => {
    const count = await db.reminder.count({ where: { pet: { ownerId: userId }, isCompleted: true } });
    return count >= 30;
  },
  "Health Champion": async (userId) => {
    const count = await db.pointTransaction.count({ where: { userId, action: "health_score" } });
    return count >= 5;
  },
  "Family First": async (userId) => {
    const count = await db.familyMember.count({ where: { userId } });
    return count >= 1;
  },
  "Platinum Pet Parent": async (userId) => {
    const rp = await db.rewardPoints.findUnique({ where: { userId }, select: { totalPoints: true } });
    return (rp?.totalPoints ?? 0) >= 1000;
  },
};

export async function checkAchievements(userId: string): Promise<void> {
  const existing = await db.achievement.findMany({
    where:  { userId },
    select: { badge: true },
  });
  const earned = new Set(existing.map((a) => a.badge));

  const toUnlock: string[] = [];
  for (const [badge, check] of Object.entries(BADGE_CHECKS)) {
    if (earned.has(badge)) continue;
    try {
      const unlocked = await check(userId);
      if (unlocked) toUnlock.push(badge);
    } catch { /* skip individual badge failures */ }
  }

  if (toUnlock.length > 0) {
    await db.achievement.createMany({
      data:            toUnlock.map((badge) => ({ userId, badge })),
      skipDuplicates:  true,
    });
  }
}
