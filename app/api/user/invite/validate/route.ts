import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required." }, { status: 400 });

  const invite = await db.familyInvite.findUnique({
    where: { token },
    include: { owner: { select: { name: true } } },
  });

  if (!invite) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
  if (invite.usedAt) return NextResponse.json({ error: "This invite has already been used." }, { status: 410 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "This invite has expired." }, { status: 410 });

  return NextResponse.json({ valid: true, ownerName: invite.owner.name ?? "" });
}
