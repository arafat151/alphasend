import { supabase } from "@/lib/supabase";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { daily_limit, gmails } = await request.json();
  // gmails = [{ gmail_user, gmail_app_password }, ...]

  if (!daily_limit || !gmails || gmails.length === 0) {
    return Response.json({ error: "daily_limit and at least one Gmail required" }, { status: 400 });
  }
  if (daily_limit % 500 !== 0 || daily_limit < 500 || daily_limit > 5000) {
    return Response.json({ error: "Daily limit must be 500, 1000, 1500 ... 5000" }, { status: 400 });
  }

  const requiredGmails = daily_limit / 500;
  if (gmails.length !== requiredGmails) {
    return Response.json({ error: `Plan needs exactly ${requiredGmails} Gmail account(s)` }, { status: 400 });
  }

  const priceUSD = parseFloat((daily_limit * 0.01).toFixed(2));
  const apiKey = "as_live_" + randomBytes(20).toString("hex");
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  // Create client (use first Gmail for display)
  const { data: client, error: clientErr } = await supabase.from("clients").insert({
    name: payload.name,
    api_key: apiKey,
    status: "inactive",
    gmail_user: gmails[0].gmail_user,
    gmail_app_password: gmails[0].gmail_app_password,
    daily_limit,
    user_id: payload.id,
  }).select().single();

  if (clientErr) return Response.json({ error: clientErr.message }, { status: 500 });

  // Insert all Gmails into client_gmails
  const gmailRows = gmails.map((g, i) => ({
    client_id: client.id,
    gmail_user: g.gmail_user,
    gmail_app_password: g.gmail_app_password,
    sort_order: i,
  }));
  await supabase.from("client_gmails").insert(gmailRows);

  // Create subscription
  const { data: sub, error: subErr } = await supabase.from("subscriptions").insert({
    user_id: payload.id,
    client_id: client.id,
    daily_limit,
    monthly_price_usd: priceUSD,
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    status: "pending",
  }).select().single();

  if (subErr) return Response.json({ error: subErr.message }, { status: 500 });

  return Response.json({ success: true, subscription_id: sub.id, api_key: apiKey });
}
