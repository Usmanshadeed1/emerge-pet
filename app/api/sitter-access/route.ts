import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

const EXPIRY_DAYS: Record<number, true> = { 1: true, 3: true, 7: true, 30: true };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const { label, expiresIn, petIds } = body;

  if (!EXPIRY_DAYS[expiresIn as number]) {
    return NextResponse.json({ error: "expiresIn must be 1, 3, 7, or 30." }, { status: 400 });
  }
  if (!Array.isArray(petIds) || petIds.length === 0) {
    return NextResponse.json({ error: "At least one pet must be selected." }, { status: 400 });
  }

  // Verify all petIds belong to the user
  const ownedPets = await db.pet.findMany({
    where: { ownerId: session.user.id, id: { in: petIds } },
    select: { id: true },
  });
  if (ownedPets.length !== petIds.length) {
    return NextResponse.json({ error: "One or more pets not found." }, { status: 400 });
  }

  const token     = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(expiresIn));

  const sitterAccess = await db.sitterAccess.create({
    data: {
      ownerId:   session.user.id,
      label:     label?.trim() || null,
      token,
      expiresAt,
      petIds,
      isActive:  true,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3333";
  return NextResponse.json({
    id:        sitterAccess.id,
    token:     sitterAccess.token,
    expiresAt: sitterAccess.expiresAt,
    url:       `${baseUrl}/sitter/${token}`,
  }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await db.sitterAccess.findMany({
    where:   { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id:        true,
      label:     true,
      token:     true,
      expiresAt: true,
      petIds:    true,
      isActive:  true,
      createdAt: true,
      revokedAt: true,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3333";
  return NextResponse.json(
    links.map((l) => ({ ...l, url: `${baseUrl}/sitter/${l.token}` }))
  );
}
