// Daily cron job — checks renewals, sends reminders, pauses expired services
// Netlify calls this via netlify.toml scheduled function (or set up a cron service)
// Secret header: x-cron-secret = CRON_SECRET env var

import { supabase } from "@/lib/supabase";
import { sendRenewalReminder, sendServicePaused } from "@/lib/mailer";

export async function GET(request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // 1. Get all active subscriptions
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*, users(name, email)")
    .eq("status", "active");

  let reminded = 0, paused = 0;

  for (const sub of subs || []) {
    const endDate = new Date(sub.end_date);
    const daysLeft = Math.ceil((endDate - today) / 86400000);
    const user = sub.users;

    // Send reminders 3, 2, 1 days before
    if ([3, 2, 1].includes(daysLeft)) {
      const rate = 133;
      const amountBdt = Math.round(sub.monthly_price_usd * rate);
      try {
        await sendRenewalReminder({
          to: user.email, name: user.name,
          endDate: sub.end_date, amountBdt, daysLeft,
        });
        reminded++;
      } catch (e) { console.error("Reminder failed:", e.message); }
    }

    // Pause if expired
    if (daysLeft <= 0) {
      await supabase.from("subscriptions").update({ status: "paused" }).eq("id", sub.id);
      if (sub.client_id) {
        await supabase.from("clients").update({ status: "inactive" }).eq("id", sub.client_id);
      }
      try {
        await sendServicePaused({ to: user.email, name: user.name });
        paused++;
      } catch (e) { console.error("Pause email failed:", e.message); }
    }
  }

  return Response.json({ success: true, reminded, paused, checked: subs?.length || 0 });
}
