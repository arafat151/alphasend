import { supabase } from "@/lib/supabase";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { sendSystemEmail } from "@/lib/mailer";

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

  // Notify admin by email
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendSystemEmail({
        to: adminEmail,
        subject: `💰 New Payment — ${payload.name} (${amount_bdt} BDT)`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px">
            <h2 style="color:#22c55e;margin:0 0 16px">New Payment Received</h2>
            <p><strong>Name:</strong> ${payload.name}</p>
            <p><strong>Email:</strong> ${payload.email}</p>
            <p><strong>Amount:</strong> ${amount_bdt} BDT ($${amount_usd})</p>
            <p><strong>TxID:</strong> <code>${transaction_id.trim()}</code></p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/dashboard"
               style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
              Open Admin Dashboard
            </a>
          </div>
        `,
      });
    }
  } catch (e) {
    console.error("Admin notify failed:", e.message);
  }

  return Response.json({ success: true, message: "Payment submitted for review" });
}
