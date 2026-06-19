import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configs = await db.llmConfig.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id:        true,
      label:     true,
      provider:  true,
      baseUrl:   true,
      model:     true,
      isActive:  true,
      createdAt: true,
    },
  });

  return NextResponse.json(configs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { label, provider, baseUrl, apiKey, model } =
    await req.json() as {
      label:    string;
      provider: string;
      baseUrl:  string;
      apiKey:   string;
      model:    string;
    };

  if (!label || !provider || !baseUrl || !apiKey || !model) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const encrypted = encrypt(apiKey);

  const config = await db.llmConfig.create({
    data: { label, provider, baseUrl, apiKey: encrypted, model, isActive: true },
    select: { id: true, label: true, provider: true, baseUrl: true, model: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(config, { status: 201 });
}
