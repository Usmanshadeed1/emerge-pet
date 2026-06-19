import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { callProviderDirect } from "@/lib/ai";
import { db } from "@/lib/db";

function decrypt(text: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createDecipheriv, createHash } = require("crypto") as typeof import("crypto");
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback-secret";
  const key    = createHash("sha256").update(secret).digest();
  const [ivHex, encHex] = text.split(":");
  const iv       = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  const dec      = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
  return dec.toString("utf8");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    baseUrl?:  string;
    apiKey?:   string;
    model?:    string;
    configId?: string;
  };

  let baseUrl: string;
  let apiKey:  string;
  let model:   string;

  if (body.configId) {
    // Test a saved provider by ID — decrypt the stored key
    const config = await db.llmConfig.findUnique({ where: { id: body.configId } });
    if (!config) return NextResponse.json({ error: "Provider not found." }, { status: 404 });
    baseUrl = body.baseUrl  ?? config.baseUrl;
    model   = body.model    ?? config.model;
    apiKey  = (body.apiKey && body.apiKey !== "__saved__")
      ? body.apiKey
      : decrypt(config.apiKey);
  } else {
    if (!body.baseUrl || !body.apiKey || !body.model) {
      return NextResponse.json({ error: "baseUrl, apiKey, and model are required." }, { status: 400 });
    }
    baseUrl = body.baseUrl;
    apiKey  = body.apiKey;
    model   = body.model;
  }

  try {
    const response = await callProviderDirect(
      baseUrl, apiKey, model,
      [{ role: "user", content: "Say hello in one friendly sentence." }]
    );
    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Test failed." },
      { status: 500 }
    );
  }
}
