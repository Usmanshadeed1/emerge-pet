import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emrAuth, emrUnauthorized } from "@/lib/emr-auth";

// Simple in-memory rate limiter: 100 req/hr per API key hash
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(keyId: string): boolean {
  const now    = Date.now();
  const window = 60 * 60 * 1000; // 1 hour
  const entry  = rateLimitMap.get(keyId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(keyId, { count: 1, resetAt: now + window });
    return true;
  }
  if (entry.count >= 100) return false;
  entry.count++;
  return true;
}

export async function GET(req: Request) {
  const clinic = await emrAuth(req);
  if (!clinic) return emrUnauthorized();

  if (!checkRateLimit(clinic.id)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 100 requests per hour." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const microchip = searchParams.get("microchip");
  const name      = searchParams.get("name");
  const species   = searchParams.get("species");
  const dob       = searchParams.get("dob");

  if (!microchip && !name && !species && !dob) {
    return NextResponse.json(
      { error: "At least one search parameter required: microchip, name, species, or dob." },
      { status: 400 },
    );
  }

  const where: Record<string, unknown> = {};
  if (microchip) where.microchipId  = { contains: microchip, mode: "insensitive" };
  if (name)      where.name         = { contains: name, mode: "insensitive" };
  if (species)   where.species      = species.toUpperCase();
  if (dob)       where.dateOfBirth  = new Date(dob);

  const pets = await db.pet.findMany({
    where,
    select: {
      id:          true,
      name:        true,
      species:     true,
      breed:       true,
      dateOfBirth: true,
      weight:      true,
      weightUnit:  true,
      color:       true,
      markings:    true,
      microchipId: true,
      sex:         true,
      isNeutered:  true,
      specialNotes: true,
      createdAt:   true,
      healthRecords: {
        select: {
          id:         true,
          type:       true,
          title:      true,
          date:       true,
          nextDueDate: true,
          vetName:    true,
          clinicName: true,
          dosage:     true,
          notes:      true,
          source:     true,
          createdAt:  true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      vaccines: {
        select: {
          id:               true,
          name:             true,
          administeredDate: true,
          nextDueDate:      true,
          vetName:          true,
          clinicName:       true,
          status:           true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    take: 10,
  });

  return NextResponse.json({ pets, clinic: clinic.clinicName, total: pets.length });
}
