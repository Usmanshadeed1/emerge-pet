import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPremium } from "@/lib/premium";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [premium, sub] = await Promise.all([
    isPremium(userId),
    db.subscription.findUnique({
      where:  { userId },
      select: { plan: true, status: true, currentPeriodEnd: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    isPremium:        premium,
    plan:             sub?.plan             ?? null,
    status:           sub?.status           ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    subscribedAt:     sub?.createdAt        ?? null,
  });
}
