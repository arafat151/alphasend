import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

// POST /api/v1/send
// Headers: x-api-key
// Body:    { to, subject, text?, html? }
export async function POST(request) {
  // ── 1. Extract & validate API key ──────────────────────────
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return Response.json(
      { success: false, error: "Missing x-api-key header" },
      { status: 401 }
    );
  }

  // ── 2. Look up client in Supabase ──────────────────────────
  const { data: client, error: dbError } = await supabase
    .from("clients")
    .select("id, name, status, gmail_user, gmail_app_password")
    .eq("api_key", apiKey)
    .single();

  if (dbError || !client) {
    return Response.json(
      { success: false, error: "Invalid API key" },
      { status: 401 }
    );
  }

  // ── 3. Check subscription status ───────────────────────────
  if (client.status !== "active") {
    return Response.json(
      {
        success: false,
        error: "Your API key is inactive or expired. Contact the administrator.",
      },
      { status: 401 }
    );
  }

  // ── 4. Parse & validate request body ───────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { to, subject, text, html } = body;

  if (!to || !subject) {
    return Response.json(
      { success: false, error: "Missing required fields: to, subject" },
      { status: 400 }
    );
  }

  if (!text && !html) {
    return Response.json(
      { success: false, error: "Provide at least one of: text, html" },
      { status: 400 }
    );
  }

  // ── 5. Send email via Nodemailer + Gmail App Password ───────
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: client.gmail_user,
        pass: client.gmail_app_password,
      },
    });

    const info = await transporter.sendMail({
      from: `"${client.name}" <${client.gmail_user}>`,
      to,
      subject,
      ...(text && { text }),
      ...(html && { html }),
    });

    return Response.json(
      {
        success: true,
        message: "Email sent successfully",
        messageId: info.messageId,
      },
      { status: 200 }
    );
  } catch (sendError) {
    console.error("[AlphaSend] Send error:", sendError);
    return Response.json(
      {
        success: false,
        error: "Failed to send email. Check Gmail credentials.",
        detail: sendError.message,
      },
      { status: 500 }
    );
  }
}

// Return 405 for any other method
export async function GET() {
  return Response.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
