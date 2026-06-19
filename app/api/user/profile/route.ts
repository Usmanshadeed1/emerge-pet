import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { name: true, email: true, profileEmoji: true, createdAt: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, profileEmoji } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data:  { name: name.trim(), profileEmoji: profileEmoji ?? null },
      select: { name: true, profileEmoji: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
