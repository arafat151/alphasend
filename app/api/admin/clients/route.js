import { supabase } from "@/lib/supabase";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload?.is_admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  // Only show clients who have a subscription
  const { data } = await supabase
    .from("clients")
    .select("*, subscriptions(status, daily_limit, end_date)")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false });

  return Response.json({ clients: data || [] });
}

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload?.is_admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  // Delete client
  if (body.action === "delete") {
    await supabase.from("client_gmails").delete().eq("client_id", body.client_id);
    await supabase.from("api_usage").delete().eq("client_id", body.client_id);
    await supabase.from("clients").delete().eq("id", body.client_id);
    return Response.json({ success: true });
  }

  // Toggle status
  const { client_id, status } = body;
  await supabase.from("clients").update({ status }).eq("id", client_id);
  return Response.json({ success: true });
}
