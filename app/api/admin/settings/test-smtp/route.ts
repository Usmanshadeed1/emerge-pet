import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSetting } from "@/lib/settings";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    host?: string;
    port?: string;
    user?: string;
    password?: string;
    tls?: boolean;
    fromEmail?: string;
  };

  // Prefer inline values from the form; fall back to saved settings
  const host      = body.host      ?? await getSetting("smtp_host");
  const port      = body.port      ?? await getSetting("smtp_port") ?? "587";
  const user      = body.user      ?? await getSetting("smtp_user");
  const password  = body.password  ?? await getSetting("smtp_password");
  const tls       = body.tls !== undefined
    ? body.tls
    : (await getSetting("smtp_tls")) === "true";
  const fromEmail = body.fromEmail ?? await getSetting("smtp_from_email") ?? user ?? "";
  const toEmail   = session.user.email!;

  if (!host || !user || !password) {
    return NextResponse.json({ error: "SMTP host, user, and password are required." }, { status: 400 });
  }

  try {
    const nodemailer = await import("nodemailer");
    const portNum = parseInt(port, 10);
    const transporter = nodemailer.createTransport({
      host,
      port:       portNum,
      secure:     tls,
      requireTLS: !tls && portNum === 587,
      auth:       { user, pass: password },
      logger:     false,
      debug:      false,
    });

    // Verify connection first before trying to send
    await transporter.verify();

    const info = await transporter.sendMail({
      from:    `EmergePet <${fromEmail}>`,
      to:      toEmail,
      subject: "EmergePet SMTP Test",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <span style="font-size:40px">🐾</span>
          <h2 style="font-size:18px;font-weight:600;color:#111;margin:16px 0 8px">SMTP Test Successful</h2>
          <p style="color:#555;font-size:14px;line-height:1.6">
            Your SMTP configuration is working correctly.<br/>
            Host: <strong>${host}:${port}</strong><br/>
            TLS: <strong>${tls ? "enabled" : "disabled"}</strong>
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${toEmail}`,
      details: {
        host,
        port:      portNum,
        tls,
        from:      fromEmail,
        to:        toEmail,
        messageId: info.messageId,
        response:  info.response,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP test failed.";
    const code    = (err as Record<string, unknown>).code ?? null;
    const command = (err as Record<string, unknown>).command ?? null;
    const response= (err as Record<string, unknown>).response ?? null;
    return NextResponse.json(
      { error: message, code, command, response },
      { status: 500 }
    );
  }
}
