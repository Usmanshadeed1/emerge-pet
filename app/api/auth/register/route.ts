import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 10 registrations per IP per hour
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`register:${ip}`, { windowMs: 60_000 * 60, max: 10 });
  if (!allowed) return rateLimitResponse();

  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "OWNER",
        onboardingCompleted: false,
      },
    });

    // Fire-and-forget Mailchimp subscribe — reads config from AppSettings (set in admin)
    subscribeToMailchimp(email, name).catch(() => {});

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

async function subscribeToMailchimp(email: string, name: string) {
  try {
    const apiKey = await getSetting("mailchimp_api_key");
    const audienceId = await getSetting("mailchimp_audience_id");
    if (!apiKey || !audienceId) return;

    const datacenter = apiKey.split("-").pop();
    await fetch(
      `https://${datacenter}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `apikey ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
          merge_fields: { FNAME: name },
          tags: ["app-user"],
        }),
      }
    );
  } catch {
    // Silently ignore — never block registration
  }
}
