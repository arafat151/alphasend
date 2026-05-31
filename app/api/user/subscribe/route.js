import { supabase } from "@/lib/supabase";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { daily_limit, gmail_user, gmail_app_password } = await request.json();

  if (!daily_limit || !gmail_user || !gmail_app_password) {
    return Response.json({ error: "All fields required" }, { status: 400 });
  }
  if (daily_limit < 100 || daily_limit > 500) {
    return Response.json({ error: "Daily limit must be between 100 and 500" }, { status: 400 });
  }

  const priceUSD = parseFloat((daily_limit * 0.01).toFixed(2));
  const apiKey = "as_live_" + randomBytes(20).toString("hex");

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  // Create client entry
  const { data: client, error: clientErr } = await supabase.from("clients").insert({
    name: payload.name,
    api_key: apiKey,
    status: "inactive", // activates after payment approval
    gmail_user,
    gmail_app_password,
    daily_limit,
    user_id: payload.id,
  }).select().single();

  if (clientErr) return Response.json({ error: clientErr.message }, { status: 500 });

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
