import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const pet = await db.pet.findUnique({
      where: { id: params.id },
      select: { photoData: true, photoMimeType: true },
    });

    if (!pet?.photoData || !pet?.photoMimeType) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = Buffer.from(pet.photoData, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": pet.photoMimeType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
