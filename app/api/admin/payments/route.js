import { supabase } from "@/lib/supabase";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// GET — list all payments
export async function GET(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload?.is_admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("payments")
    .select(`*, users(name, email), subscriptions(daily_limit, monthly_price_usd)`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ payments: data });
}

// POST — approve or reject a payment
export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload?.is_admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { payment_id, action, note } = await request.json(); // action: "approve" | "reject"

  const { data: payment } = await supabase.from("payments").select("*").eq("id", payment_id).single();
  if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });

  await supabase.from("payments").update({
    status: action === "approve" ? "approved" : "rejected",
    admin_note: note || null,
  }).eq("id", payment_id);

  if (action === "approve" && payment.subscription_id) {
    // Activate subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    await supabase.from("subscriptions").update({
      status: "active",
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    }).eq("id", payment.subscription_id);

    // Activate the linked client
    const { data: sub } = await supabase.from("subscriptions").select("client_id").eq("id", payment.subscription_id).single();
    if (sub?.client_id) {
      await supabase.from("clients").update({ status: "active" }).eq("id", sub.client_id);
    }
  }

  return Response.json({ success: true });
}
