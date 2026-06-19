import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent admin from modifying their own account status/role via this route
  if (params.id === session.user.id) {
    return NextResponse.json({ error: "Cannot modify your own account here." }, { status: 400 });
  }

  const body = await req.json() as { isActive?: boolean; role?: "OWNER" | "ADMIN" };

  // Validate role value if provided
  if (body.role !== undefined && body.role !== "OWNER" && body.role !== "ADMIN") {
    return NextResponse.json({ error: "Invalid role value." }, { status: 400 });
  }

  const data: { isActive?: boolean; role?: "OWNER" | "ADMIN" } = {};
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.role     !== undefined) data.role     = body.role;

  const updated = await db.user.update({
    where:  { id: params.id },
    data,
    select: { id: true, isActive: true, role: true, name: true, email: true },
  });

  return NextResponse.json(updated);
}
