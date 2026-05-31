import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return Response.json({ success: false, error: "Missing x-api-key header" }, { status: 401, headers: CORS });

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, status, gmail_user, gmail_app_password, daily_limit")
    .eq("api_key", apiKey)
    .single();

  if (!client) return Response.json({ success: false, error: "Invalid API key" }, { status: 401, headers: CORS });
  if (client.status !== "active") return Response.json({ success: false, error: "API key inactive or subscription expired." }, { status: 401, headers: CORS });

  // Check daily usage
  const today = new Date().toISOString().split("T")[0];
  const { data: usageRow } = await supabase
    .from("api_usage").select("email_count, extra_count").eq("client_id", client.id).eq("date", today).single();

  const emailCount = usageRow?.email_count || 0;
  const extraCount = usageRow?.extra_count || 0;
  const totalToday = emailCount + extraCount;
  const limit = client.daily_limit || 500;

  if (limit >= 500 && totalToday >= 500) {
    return Response.json({ success: false, error: "Daily limit reached (500). Contact admin to add more capacity." }, { status: 429, headers: CORS });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: CORS }); }

  const { to, subject, text, html } = body;
  if (!to || !subject) return Response.json({ success: false, error: "Missing: to, subject" }, { status: 400, headers: CORS });
  if (!text && !html) return Response.json({ success: false, error: "Provide text or html" }, { status: 400, headers: CORS });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: client.gmail_user, pass: client.gmail_app_password },
    });

    const info = await transporter.sendMail({
      from: `"${client.name}" <${client.gmail_user}>`,
      to, subject,
      ...(text && { text }),
      ...(html && { html }),
    });

    // Track usage
    const isExtra = totalToday >= limit;
    if (usageRow) {
      await supabase.from("api_usage").update(
        isExtra ? { extra_count: extraCount + 1 } : { email_count: emailCount + 1 }
      ).eq("client_id", client.id).eq("date", today);
    } else {
      await supabase.from("api_usage").insert({
        client_id: client.id, date: today,
        email_count: isExtra ? 0 : 1,
        extra_count: isExtra ? 1 : 0,
      });
    }

    return Response.json({
      success: true, message: "Email sent successfully", messageId: info.messageId,
      ...(isExtra && { warning: "Exceeded daily plan — counted as extra." }),
    }, { status: 200, headers: CORS });

  } catch (err) {
    return Response.json({ success: false, error: "Send failed.", detail: err.message }, { status: 500, headers: CORS });
  }
}

export async function GET() {
  return Response.json({ error: "Use POST." }, { status: 405, headers: CORS });
}
