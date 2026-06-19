import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const link = await db.sitterAccess.findFirst({
    where: { id: params.id, ownerId: session.user.id },
    select: { id: true },
  });

  if (!link) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await db.sitterAccess.update({
    where: { id: params.id },
    data:  { isActive: false, revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
