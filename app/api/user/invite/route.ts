import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST — generate a family invite link
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.familyInvite.create({
    data: {
      ownerId: session.user.id,
      token,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3333";
  const link = `${baseUrl}/invite/${token}`;

  return NextResponse.json({ link });
}

// POST /api/user/invite/accept — consume an invite token
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token required." }, { status: 400 });

  const invite = await db.familyInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
  if (invite.usedAt) return NextResponse.json({ error: "This invite has already been used." }, { status: 410 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
  if (invite.ownerId === session.user.id) {
    return NextResponse.json({ error: "You cannot join your own account as a family member." }, { status: 400 });
  }

  // Check not already a family member
  const existing = await db.familyMember.findUnique({
    where: { userId_memberId: { userId: invite.ownerId, memberId: session.user.id } },
  });
  if (existing) {
    // Already linked — mark invite used and return success
    await db.familyInvite.update({ where: { token }, data: { usedAt: new Date() } });
    return NextResponse.json({ success: true, ownerName: null });
  }

  await db.$transaction([
    db.familyMember.create({
      data: { userId: invite.ownerId, memberId: session.user.id },
    }),
    db.familyInvite.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  const owner = await db.user.findUnique({ where: { id: invite.ownerId }, select: { name: true } });

  return NextResponse.json({ success: true, ownerName: owner?.name ?? "the owner" });
}
