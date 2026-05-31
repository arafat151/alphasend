import { supabase } from "@/lib/supabase";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// GET — fetch all settings (public for bkash number + rate)
export async function GET() {
  const { data } = await supabase.from("settings").select("key, value");
  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  return Response.json({ settings: map });
}

// POST — update settings (admin only)
export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload?.is_admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const updates = await request.json(); // { key: value, ... }
  for (const [key, value] of Object.entries(updates)) {
    await supabase.from("settings").upsert({ key, value }).eq("key", key);
  }

  return Response.json({ success: true });
}
