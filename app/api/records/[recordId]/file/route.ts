import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { recordId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  try {
    const record = await db.healthRecord.findUnique({
      where: { id: params.recordId },
      include: { pet: { select: { ownerId: true } } },
    });

    if (!record) return new NextResponse(null, { status: 404 });
    if (record.pet.ownerId !== session.user.id) return new NextResponse(null, { status: 403 });
    if (!record.fileData || !record.fileMimeType) return new NextResponse(null, { status: 404 });

    const buffer = Buffer.from(record.fileData, "base64");
    const filename = record.fileName ?? "document";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": record.fileMimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
