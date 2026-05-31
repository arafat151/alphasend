import { supabase } from "@/lib/supabase";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.slice(0, 7) + "-01";

  // Get active subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", payload.id)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get client (API key)
  let client = null;
  if (sub?.client_id) {
    const { data } = await supabase.from("clients").select("api_key").eq("id", sub.client_id).single();
    client = data;
  }

  // Today's usage
  let todayCount = 0, monthCount = 0;
  if (sub?.client_id) {
    const { data: todayRow } = await supabase
      .from("api_usage").select("email_count, extra_count").eq("client_id", sub.client_id).eq("date", today).single();
    todayCount = (todayRow?.email_count || 0) + (todayRow?.extra_count || 0);

    const { data: monthRows } = await supabase
      .from("api_usage").select("email_count, extra_count")
      .eq("client_id", sub.client_id).gte("date", firstOfMonth);
    monthCount = (monthRows || []).reduce((s, r) => s + r.email_count + r.extra_count, 0);
  }

  return Response.json({
    name: payload.name,
    email: payload.email,
    subscription: sub || null,
    api_key: client?.api_key || null,
    today_count: todayCount,
    month_count: monthCount,
  });
}
