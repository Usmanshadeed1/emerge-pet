import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public route — no auth required
export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({ code: null }));

  if (!code?.trim()) {
    return NextResponse.json({ error: "Access code is required." }, { status: 400 });
  }

  const vetAccess = await db.vetAccess.findUnique({
    where: { accessCode: code.trim().toUpperCase() },
    select: {
      id:       true,
      isActive: true,
      pet: {
        select: {
          id:           true,
          name:         true,
          species:      true,
          breed:        true,
          dateOfBirth:  true,
          weight:       true,
          weightUnit:   true,
          color:        true,
          markings:     true,
          microchipId:  true,
          sex:          true,
          isNeutered:   true,
          specialNotes: true,
          photoData:    true,
          healthRecords: {
            orderBy: { date: "desc" },
            take:    50,
            select: {
              id:          true,
              type:        true,
              title:       true,
              date:        true,
              nextDueDate: true,
              vetName:     true,
              clinicName:  true,
              dosage:      true,
              notes:       true,
              source:      true,
              normalizedDrugName: true,
            },
          },
        },
      },
    },
  });

  if (!vetAccess || !vetAccess.isActive) {
    return NextResponse.json({ error: "Invalid or revoked access code." }, { status: 404 });
  }

  const { photoData, ...petWithoutPhoto } = vetAccess.pet;

  return NextResponse.json({
    vetAccessId: vetAccess.id,
    pet: {
      ...petWithoutPhoto,
      hasPhoto: !!photoData,
    },
  });
}
