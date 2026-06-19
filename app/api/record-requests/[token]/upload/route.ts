import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const request = await db.recordRequest.findUnique({
      where:   { uploadToken: params.token },
      include: { pet: true },
    });

    if (!request)           return NextResponse.json({ error: "Invalid upload link." }, { status: 404 });
    if (request.isUploaded) return NextResponse.json({ error: "Records already uploaded." }, { status: 409 });

    const formData = await req.formData();
    const notes    = (formData.get("notes") as string | null)?.trim() || null;

    let fileData:     string | null = null;
    let fileMimeType: string | null = null;
    let fileName:     string | null = null;

    const file = formData.get("file") as File | null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File must be under 10 MB." }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      fileData     = Buffer.from(arrayBuffer).toString("base64");
      fileMimeType = file.type;
      fileName     = file.name;
    }

    await db.healthRecord.create({
      data: {
        petId:      request.petId,
        type:       "OTHER",
        title:      `Records from ${request.clinicName}`,
        source:     "CLINIC_UPLOADED",
        clinicName: request.clinicName,
        notes,
        fileData,
        fileMimeType,
        fileName,
      },
    });

    await db.recordRequest.update({
      where: { id: request.id },
      data:  { isUploaded: true, uploadedAt: new Date() },
    });

    return NextResponse.json({ success: true, petName: request.pet.name });
  } catch (err) {
    console.error("[clinic-upload]", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
