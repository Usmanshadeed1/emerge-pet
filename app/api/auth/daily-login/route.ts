import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/points";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if already awarded today
  const today     = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const existing = await db.pointTransaction.findFirst({
    where: {
      userId,
      action:    "daily_login",
      createdAt: { gte: startOfDay },
    },
  });

  if (existing) {
    return NextResponse.json({ awarded: false, message: "Already awarded today" });
  }

  await awardPoints(userId, "daily_login", 5);
  return NextResponse.json({ awarded: true, points: 5 });
}
