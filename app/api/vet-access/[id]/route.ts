import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE — revoke a vet access record
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the vet access belongs to one of the user's pets
  const vetAccess = await db.vetAccess.findFirst({
    where: { id: params.id, pet: { ownerId: session.user.id } },
    select: { id: true },
  });

  if (!vetAccess) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await db.vetAccess.update({
    where: { id: params.id },
    data:  { isActive: false, revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
