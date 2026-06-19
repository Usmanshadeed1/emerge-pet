import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  return NextResponse.json({ configured: !!admin });
}

export async function POST(req: Request) {
  // Lock — only works if no admin exists yet
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) {
    return NextResponse.json(
      { error: "App is already configured. Please sign in at /admin/login." },
      { status: 409 }
    );
  }

  const { name, email, password } = await req.json() as {
    name: string; email: string; password: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: {
      name:                name.trim(),
      email:               email.toLowerCase().trim(),
      passwordHash,
      role:                "ADMIN",
      isActive:            true,
      onboardingCompleted: true,
    },
  });

  return NextResponse.json({ success: true });
}
