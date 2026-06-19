import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalPets, totalRecords, activeSubs, newUsersThisWeek, totalReminders] =
    await Promise.all([
      db.user.count(),
      db.pet.count(),
      db.healthRecord.count(),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.user.count({ where: { createdAt: { gte: weekAgo } } }),
      db.reminder.count(),
    ]);

  return NextResponse.json({
    totalUsers,
    totalPets,
    totalRecords,
    activeSubs,
    newUsersThisWeek,
    totalReminders,
  });
}
