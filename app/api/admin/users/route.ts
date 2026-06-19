import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  const users = await db.user.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id:                  true,
      name:                true,
      email:               true,
      role:                true,
      isActive:            true,
      onboardingCompleted: true,
      createdAt:           true,
      _count:       { select: { pets: true } },
      subscription: { select: { plan: true, status: true } },
      pets:         { select: { id: true, name: true, species: true }, take: 10 },
    },
  });

  return NextResponse.json(users);
}
