import { db } from "./db";

export async function isPremium(userId: string): Promise<boolean> {
  // Admins always have full premium access for testing
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { role: true },
  });
  if (user?.role === "ADMIN") return true;

  const sub = await db.subscription.findUnique({
    where:  { userId },
    select: { status: true, currentPeriodEnd: true },
  });

  if (!sub) return false;
  if (sub.status !== "ACTIVE") return false;

  // If there's an expiry date, check it hasn't passed
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) return false;

  return true;
}
