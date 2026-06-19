import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

// Generate a unique 8-character alphanumeric code
function generateCode(): string {
  return randomBytes(4).toString("hex").toUpperCase(); // e.g. "A3F9B21C"
}

// POST — generate a new vet access code for a pet
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { petId, vetName, vetEmail } = await req.json();

  if (!petId) {
    return NextResponse.json({ error: "petId is required." }, { status: 400 });
  }

  // Verify pet belongs to user
  const pet = await db.pet.findFirst({
    where: { id: petId, ownerId: session.user.id },
    select: { id: true, name: true },
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  }

  // Generate unique code (retry on collision)
  let accessCode = generateCode();
  let attempts   = 0;
  while (attempts < 5) {
    const existing = await db.vetAccess.findUnique({ where: { accessCode } });
    if (!existing) break;
    accessCode = generateCode();
    attempts++;
  }

  const vetAccess = await db.vetAccess.create({
    data: {
      petId,
      accessCode,
      vetName:  vetName?.trim()  || null,
      vetEmail: vetEmail?.trim() || null,
      isActive: true,
    },
  });

  return NextResponse.json({
    id:         vetAccess.id,
    accessCode: vetAccess.accessCode,
    petName:    pet.name,
  }, { status: 201 });
}

// GET — list all active vet access records for user's pets
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await db.vetAccess.findMany({
    where: {
      pet:      { ownerId: session.user.id },
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id:         true,
      accessCode: true,
      vetName:    true,
      vetEmail:   true,
      isActive:   true,
      createdAt:  true,
      pet:        { select: { id: true, name: true, species: true } },
    },
  });

  return NextResponse.json(records);
}
