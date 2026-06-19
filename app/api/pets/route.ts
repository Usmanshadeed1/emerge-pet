import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { awardPoints } from "@/lib/points";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const petsWithFlag = await db.pet.findMany({
    where:   { ownerId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, species: true, breed: true,
      dateOfBirth: true, sex: true, isNeutered: true,
      weight: true, weightUnit: true,
      photoData: true,
    },
  });

  const result = petsWithFlag.map(({ photoData, ...rest }) => ({
    ...rest,
    hasPhoto: !!photoData,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, species, breed, sex, isNeutered, dateOfBirth,
            weight, weightUnit, color, markings, microchipId,
            specialNotes, photoBase64, photoMimeType } = body;

    if (!name?.trim() || !species) {
      return NextResponse.json({ error: "Name and species are required." }, { status: 400 });
    }

    const qrToken = randomBytes(16).toString("hex");

    const pet = await db.pet.create({
      data: {
        ownerId:       session.user.id,
        qrToken,
        name:          name.trim(),
        species,
        breed:         breed?.trim()        || null,
        sex:           sex                  || null,
        isNeutered:    !!isNeutered,
        dateOfBirth:   dateOfBirth ? new Date(dateOfBirth) : null,
        weight:        weight ? parseFloat(weight) : null,
        weightUnit:    weightUnit ?? "LBS",
        color:         color?.trim()        || null,
        markings:      markings?.trim()     || null,
        microchipId:   microchipId?.trim()  || null,
        specialNotes:  specialNotes?.trim() || null,
        photoData:     photoBase64          || null,
        photoMimeType: photoMimeType        || null,
      },
    });

    void awardPoints(session.user.id, "add_pet", 50);
    if (photoBase64) void awardPoints(session.user.id, "add_photo", 20);

    return NextResponse.json({ id: pet.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
