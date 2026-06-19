import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to use this." }, { status: 401 });
  }

  const { secret } = await req.json() as { secret: string };

  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Invalid setup secret." }, { status: 403 });
  }

  // Only works when zero admins exist
  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) {
    return NextResponse.json({ error: "Setup already complete. An admin already exists." }, { status: 410 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data:  { role: "ADMIN" },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  return NextResponse.json({ available: adminCount === 0 });
}
