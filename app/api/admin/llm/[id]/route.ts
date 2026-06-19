import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/settings";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    label?:    string;
    provider?: string;
    baseUrl?:  string;
    apiKey?:   string;
    model?:    string;
    isActive?: boolean;
  };

  const data: Record<string, unknown> = {};
  if (body.label    !== undefined) data.label    = body.label;
  if (body.provider !== undefined) data.provider = body.provider;
  if (body.baseUrl  !== undefined) data.baseUrl  = body.baseUrl;
  if (body.model    !== undefined) data.model    = body.model;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.apiKey   && body.apiKey.trim()) data.apiKey = encrypt(body.apiKey);

  const updated = await db.llmConfig.update({
    where:  { id: params.id },
    data,
    select: { id: true, label: true, provider: true, baseUrl: true, model: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.llmConfig.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
