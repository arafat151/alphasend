import { supabase } from "@/lib/supabase";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload?.is_admin) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
  return Response.json({ clients: data || [] });
}

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload?.is_admin) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { client_id, status } = await request.json();
  await supabase.from("clients").update({ status }).eq("id", client_id);
  return Response.json({ success: true });
}
