import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const toEmail = session.user.email!;

  try {
    await sendEmail({
      to:      toEmail,
      subject: "EmergePet Email Test",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <span style="font-size:40px">🐾</span>
          <h2 style="font-size:18px;font-weight:600;color:#111;margin:16px 0 8px">Email Test Successful</h2>
          <p style="color:#555;font-size:14px;line-height:1.6">
            Your email configuration is working correctly.<br/>
            This test was sent via the active email provider.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ message: `Test email sent to ${toEmail}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email test failed." },
      { status: 500 }
    );
  }
}
