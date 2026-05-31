import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

async function getSystemTransporter() {
  // Try env vars first, then fall back to Supabase settings
  let gmailUser = process.env.SYSTEM_GMAIL;
  let gmailPass = process.env.SYSTEM_GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["system_gmail", "system_gmail_app_password"]);
    const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    gmailUser = map.system_gmail;
    gmailPass = map.system_gmail_app_password;
  }

  if (!gmailUser || !gmailPass) throw new Error("System Gmail not configured");

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });
}

export async function sendSystemEmail({ to, subject, html, text }) {
  const transporter = await getSystemTransporter();
  const { data: nameSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "site_name")
    .single();
  const siteName = nameSetting?.value || "AlphaSend";
  const gmailUser = process.env.SYSTEM_GMAIL || "";

  await transporter.sendMail({
    from: `"${siteName}" <${gmailUser}>`,
    to,
    subject,
    ...(html && { html }),
    ...(text && { text }),
  });
}

export async function sendOTP({ to, name, code }) {
  await sendSystemEmail({
    to,
    subject: "Your AlphaSend verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px">
        <h2 style="margin:0 0 8px;color:#818cf8">AlphaSend</h2>
        <p style="color:#94a3b8">Hi ${name},</p>
        <p style="color:#94a3b8">Your verification code is:</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#fff;background:#1e293b;padding:20px;border-radius:8px;text-align:center;margin:20px 0">
          ${code}
        </div>
        <p style="color:#64748b;font-size:13px">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
}

export async function sendRenewalReminder({ to, name, endDate, amountBdt, daysLeft }) {
  await sendSystemEmail({
    to,
    subject: `⚠️ AlphaSend — Renewal in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px">
        <h2 style="color:#f59e0b">Renewal Reminder</h2>
        <p>Hi ${name}, your AlphaSend subscription expires on <strong>${endDate}</strong>.</p>
        <p>Amount due: <strong>${amountBdt} BDT</strong></p>
        <p>Please renew to keep your email service active.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/user/renew"
           style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:12px">
          Renew Now
        </a>
      </div>
    `,
  });
}

export async function sendServicePaused({ to, name }) {
  await sendSystemEmail({
    to,
    subject: "AlphaSend — Your service has been paused",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px">
        <h2 style="color:#ef4444">Service Paused</h2>
        <p>Hi ${name}, your AlphaSend subscription has expired and your email API has been paused.</p>
        <p>Renew your plan to restore access immediately.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/user/renew"
           style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:12px">
          Renew Now
        </a>
      </div>
    `,
  });
}
