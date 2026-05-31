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

  const today = new Date().toISOString().split("T")[0];

  // Get all Gmails for this client (rotation support)
  const { data: gmails } = await supabase
    .from("client_gmails")
    .select("*")
    .eq("client_id", client.id)
    .order("sort_order", { ascending: true });

  const gmailList = (gmails && gmails.length > 0)
    ? gmails
    : [{ id: null, gmail_user: client.gmail_user, gmail_app_password: client.gmail_app_password }];

  // Find first Gmail with remaining capacity
  let selectedGmail = null;
  let usageRow = null;

  for (const g of gmailList) {
    let query = supabase.from("api_usage").select("email_count, extra_count").eq("date", today);
    if (g.id) query = query.eq("gmail_id", g.id);
    else query = query.eq("client_id", client.id).is("gmail_id", null);
    const { data: row } = await query.single();
    const used = (row?.email_count || 0) + (row?.extra_count || 0);
    if (used < 500) { selectedGmail = g; usageRow = row; break; }
  }

  if (!selectedGmail) {
    return Response.json({ success: false, error: "Daily limit reached across all Gmail accounts." }, { status: 429, headers: CORS });
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
      auth: { user: selectedGmail.gmail_user, pass: selectedGmail.gmail_app_password },
    });

    const info = await transporter.sendMail({
      from: `"${client.name}" <${selectedGmail.gmail_user}>`,
      to, subject,
      ...(text && { text }),
      ...(html && { html }),
    });

    const emailCount = usageRow?.email_count || 0;
    const extraCount = usageRow?.extra_count || 0;
    const isExtra = (emailCount + extraCount) >= 500;

    if (usageRow) {
      let upd = supabase.from("api_usage").update(isExtra ? { extra_count: extraCount + 1 } : { email_count: emailCount + 1 }).eq("date", today);
      if (selectedGmail.id) upd = upd.eq("gmail_id", selectedGmail.id);
      else upd = upd.eq("client_id", client.id);
      await upd;
    } else {
      await supabase.from("api_usage").insert({
        client_id: client.id, gmail_id: selectedGmail.id || null, date: today,
        email_count: isExtra ? 0 : 1, extra_count: isExtra ? 1 : 0,
      });
    }

    return Response.json({ success: true, message: "Email sent successfully", messageId: info.messageId, sentFrom: selectedGmail.gmail_user }, { status: 200, headers: CORS });
  } catch (err) {
    return Response.json({ success: false, error: "Send failed.", detail: err.message }, { status: 500, headers: CORS });
  }
}

export async function GET() {
  return Response.json({ error: "Use POST." }, { status: 405, headers: CORS });
}
