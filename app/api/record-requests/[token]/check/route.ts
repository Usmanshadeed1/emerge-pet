import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const request = await db.recordRequest.findUnique({
    where:   { uploadToken: params.token },
    include: { pet: { select: { name: true } } },
  });

  if (!request) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid:      true,
    uploaded:   request.isUploaded,
    petName:    request.pet.name,
    clinicName: request.clinicName,
  });
}
