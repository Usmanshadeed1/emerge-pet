import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, species, breed, sex, isNeutered,
      dateOfBirth, weight, weightUnit, microchipId,
      photoBase64, photoMimeType,
    } = body;

    if (!name?.trim() || !species) {
      return NextResponse.json({ error: "Pet name and species are required." }, { status: 400 });
    }

    const pet = await db.pet.create({
      data: {
        ownerId:      session.user.id,
        name:         name.trim(),
        species,
        breed:        breed?.trim() || null,
        sex:          sex || null,
        isNeutered:   !!isNeutered,
        dateOfBirth:  dateOfBirth ? new Date(dateOfBirth) : null,
        weight:       weight ? parseFloat(weight) : null,
        weightUnit:   weightUnit ?? "LBS",
        microchipId:  microchipId?.trim() || null,
        photoData:    photoBase64 || null,
        photoMimeType: photoMimeType || null,
      },
    });

    await db.user.update({
      where: { id: session.user.id },
      data:  { onboardingCompleted: true },
    });

    return NextResponse.json({ petId: pet.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
