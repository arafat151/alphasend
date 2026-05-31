import { supabase } from "@/lib/supabase";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription_id, transaction_id, amount_usd, amount_bdt } = await request.json();

  if (!transaction_id?.trim()) return Response.json({ error: "Transaction ID required" }, { status: 400 });

  const { error } = await supabase.from("payments").insert({
    user_id: payload.id,
    subscription_id,
    amount_usd,
    amount_bdt,
    transaction_id: transaction_id.trim(),
    status: "pending",
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, message: "Payment submitted for review" });
}
