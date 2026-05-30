import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return Response.json(
      { success: false, error: "Missing x-api-key header" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const { data: client, error: dbError } = await supabase
    .from("clients")
    .select("id, name, status, gmail_user, gmail_app_password")
    .eq("api_key", apiKey)
    .single();

  if (dbError || !client) {
    return Response.json(
      { success: false, error: "Invalid API key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  if (client.status !== "active") {
    return Response.json(
      { success: false, error: "API key is inactive or expired." },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { to, subject, text, html } = body;

  if (!to || !subject) {
    return Response.json(
      { success: false, error: "Missing required fields: to, subject" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!text && !html) {
    return Response.json(
      { success: false, error: "Provide at least one of: text, html" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

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
      { success: true, message: "Email sent successfully", messageId: info.messageId },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (sendError) {
    return Response.json(
      { success: false, error: "Failed to send email.", detail: sendError.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET() {
  return Response.json(
    { error: "Method not allowed. Use POST." },
    { status: 405, headers: CORS_HEADERS }
  );
}
