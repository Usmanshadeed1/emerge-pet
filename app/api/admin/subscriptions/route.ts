import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = new URL(req.url).searchParams.get("status") ?? "ALL";

  const [subs, activeSubs] = await Promise.all([
    db.subscription.findMany({
      where:   status !== "ALL" ? { status: status as "ACTIVE" | "CANCELLED" | "EXPIRED" } : undefined,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  // Monthly revenue estimate: MONTHLY=$9.99, ANNUAL=$99.99/12
  const monthly = await db.subscription.findMany({
    where:  { status: "ACTIVE", plan: "MONTHLY" },
    select: { id: true },
  });
  const annual = await db.subscription.findMany({
    where:  { status: "ACTIVE", plan: "ANNUAL" },
    select: { id: true },
  });
  const monthlyRevenue = monthly.length * 9.99 + annual.length * (99.99 / 12);

  return NextResponse.json({ subs, activeSubs, monthlyRevenue: Math.round(monthlyRevenue * 100) / 100 });
}
