import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export async function POST(req: Request) {
  let email: string | undefined;
  try {
    const body = await req.json();
    email = body?.email;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ success: false, error: "Valid email required." }, { status: 400 });
  }

  // Best-effort Mailchimp subscribe — never fail the user
  try {
    const apiKey    = await getSetting("mailchimp_api_key");
    const listId    = await getSetting("mailchimp_list_id");
    const serverPrefix = await getSetting("mailchimp_server_prefix"); // e.g. "us1"

    if (apiKey && listId && serverPrefix) {
      const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`;

      await fetch(url, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
        },
        body: JSON.stringify({
          email_address: email.toLowerCase(),
          status:        "subscribed",
          tags:          ["website-signup"],
        }),
      });
    }
  } catch {
    // Non-fatal — subscriber is logged regardless
  }

  return NextResponse.json({ success: true });
}
