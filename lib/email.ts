import { getSetting } from "./settings";

interface EmailPayload {
  to:      string;
  subject: string;
  html:    string;
}

async function sendViaResend(payload: EmailPayload): Promise<void> {
  const apiKey   = await getSetting("resend_api_key");
  const fromEmail = await getSetting("resend_from_email") ?? "noreply@emergepet.com";

  if (!apiKey) throw new Error("Resend API key not configured.");

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from:    `EmergePet <${fromEmail}>`,
    to:      payload.to,
    subject: payload.subject,
    html:    payload.html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

async function sendViaSmtp(payload: EmailPayload): Promise<void> {
  const host      = await getSetting("smtp_host");
  const port      = await getSetting("smtp_port");
  const user      = await getSetting("smtp_user");
  const password  = await getSetting("smtp_password");
  const tls       = await getSetting("smtp_tls");
  const fromEmail = await getSetting("smtp_from_email") ?? user ?? "";

  if (!host || !port || !user || !password) {
    throw new Error("SMTP not fully configured.");
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port:   parseInt(port, 10),
    secure: tls === "true",
    auth:   { user, pass: password },
  });

  await transporter.sendMail({
    from:    `EmergePet <${fromEmail}>`,
    to:      payload.to,
    subject: payload.subject,
    html:    payload.html,
  });
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const provider = await getSetting("email_provider") ?? "resend";

  if (provider === "smtp") {
    await sendViaSmtp(payload);
  } else {
    await sendViaResend(payload);
  }
}

// ─── Named email functions used throughout the app ───────────────────────────

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Reset your EmergePet password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:40px">🐾</span>
          <h1 style="font-size:22px;font-weight:700;color:#111;margin:8px 0 0">EmergePet</h1>
        </div>
        <h2 style="font-size:18px;font-weight:600;color:#111;margin:0 0 8px">Reset your password</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px">
          We received a request to reset the password for your account.
          Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
          Reset password
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendReminderEmail(
  to: string,
  petName: string,
  reminderTitle: string,
  dueDate: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Reminder: ${reminderTitle} for ${petName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <span style="font-size:40px">🐾</span>
        <h2 style="font-size:18px;font-weight:600;color:#111;margin:16px 0 8px">Reminder for ${petName}</h2>
        <p style="color:#555;font-size:14px;line-height:1.6">
          <strong>${reminderTitle}</strong> is due on <strong>${dueDate}</strong>.
        </p>
        <a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard/reminders"
           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px">
          View Reminders
        </a>
      </div>
    `,
  });
}

export async function sendWeeklySummaryEmail(
  to: string,
  petName: string,
  summary: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Weekly Health Update for ${petName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <span style="font-size:40px">🐾</span>
        <h2 style="font-size:18px;font-weight:600;color:#111;margin:16px 0 8px">Weekly Update — ${petName}</h2>
        <p style="color:#555;font-size:14px;line-height:1.6">${summary}</p>
        <a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard"
           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px">
          Open EmergePet
        </a>
      </div>
    `,
  });
}

export async function sendVetRecordPushedEmail(
  to: string,
  petName: string,
  vetName: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `New record added for ${petName} by ${vetName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <span style="font-size:40px">🐾</span>
        <h2 style="font-size:18px;font-weight:600;color:#111;margin:16px 0 8px">New Vet Record</h2>
        <p style="color:#555;font-size:14px;line-height:1.6">
          <strong>${vetName}</strong> has added a new health record for <strong>${petName}</strong>.
        </p>
        <a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard"
           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px">
          View Record
        </a>
      </div>
    `,
  });
}

export async function sendClinicUploadEmail(
  to: string,
  petName: string,
  clinicName: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Records uploaded for ${petName} by ${clinicName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <span style="font-size:40px">🐾</span>
        <h2 style="font-size:18px;font-weight:600;color:#111;margin:16px 0 8px">Records Received</h2>
        <p style="color:#555;font-size:14px;line-height:1.6">
          <strong>${clinicName}</strong> has uploaded health records for <strong>${petName}</strong>.
        </p>
        <a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard"
           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px">
          View Records
        </a>
      </div>
    `,
  });
}
