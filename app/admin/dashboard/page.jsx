"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({ bkash_number: "", usd_to_bdt_rate: "133", site_name: "AlphaSend", logo_url: "", system_gmail: "", system_gmail_app_password: "" });
  const [tab, setTab] = useState("payments");
  const [loading, setLoading] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAll() {
    const [pRes, sRes, cRes] = await Promise.all([
      fetch("/api/admin/payments"), fetch("/api/admin/settings"), fetch("/api/admin/clients"),
    ]);
    if (pRes.status === 403) { router.push("/login"); return; }
    const pData = await pRes.json();
    const sData = await sRes.json();
    const cData = cRes.ok ? await cRes.json() : { clients: [] };
    setPayments(pData.payments || []);
    if (sData.settings) setSettings((p) => ({ ...p, ...sData.settings }));
    setClients(cData.clients || []);
  }

  async function handlePaymentAction(id, action) {
    setLoading((p) => ({ ...p, [id]: true }));
    await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payment_id: id, action }) });
    setLoading((p) => ({ ...p, [id]: false }));
    fetchAll();
  }

  async function deletePayment(id) {
    if (!confirm("Delete this payment?")) return;
    setLoading((p) => ({ ...p, [id]: true }));
    await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payment_id: id, action: "delete" }) });
    setLoading((p) => ({ ...p, [id]: false }));
    fetchAll();
  }

  async function deleteClient(id) {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    setLoading((p) => ({ ...p, [id]: true }));
    await fetch("/api/admin/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: id, action: "delete" }) });
    setLoading((p) => ({ ...p, [id]: false }));
    fetchAll();
  }

  async function saveSettings() {
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function toggleClient(id, status) {
    setLoading((p) => ({ ...p, [id]: true }));
    await fetch("/api/admin/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: id, status: status === "active" ? "inactive" : "active" }) });
    setLoading((p) => ({ ...p, [id]: false }));
    fetchAll();
  }

  const pending = payments.filter((p) => p.status === "pending");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logo_url
              ? <img src={settings.logo_url} alt="logo" className="w-8 h-8 rounded-lg object-cover" />
              : <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" /></svg></div>}
            <span className="text-xl font-bold">{settings.site_name || "AlphaSend"}</span>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            {pending.length > 0 && <span className="bg-amber-500 text-black text-xs font-bold px-2.5 py-1 rounded-full">{pending.length} pending</span>}
            <span className="text-xs text-gray-600">Auto-refresh: 5s</span>
          </div>
        </div>
      </header>

      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {["payments","clients","settings"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${tab===t?"border-indigo-500 text-indigo-400":"border-transparent text-gray-500 hover:text-gray-300"}`}>
              {t}{t==="payments"&&pending.length>0&&<span className="ml-1.5 bg-amber-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">{pending.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab==="payments" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Payment Requests</h2>
            {payments.length===0
              ? <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">No payments yet</div>
              : payments.map((p) => (
                <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{p.users?.name}</p>
                      <p className="text-xs text-gray-500">{p.users?.email}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status==="pending"?"bg-amber-900/40 text-amber-400":p.status==="approved"?"bg-emerald-900/40 text-emerald-400":"bg-red-900/40 text-red-400"}`}>{p.status}</span>
                    </div>
                    <p className="text-sm text-gray-400">Plan: <span className="text-white">{p.subscriptions?.daily_limit}/day</span> · Amount: <span className="text-white">{p.amount_bdt} BDT (${p.amount_usd})</span></p>
                    <p className="text-sm text-gray-400">TxID: <span className="text-white font-mono">{p.transaction_id}</span></p>
                    <p className="text-xs text-gray-600">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-col items-end">
                    {p.status==="pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => handlePaymentAction(p.id,"approve")} disabled={loading[p.id]} className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg">{loading[p.id]?"...":"Approve"}</button>
                        <button onClick={() => handlePaymentAction(p.id,"reject")} disabled={loading[p.id]} className="bg-red-900/50 hover:bg-red-900 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg">Reject</button>
                      </div>
                    )}
                    <button onClick={() => deletePayment(p.id)} disabled={loading[p.id]} className="text-xs text-gray-600 hover:text-red-400 transition-colors">🗑 Delete</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab==="clients" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Clients with Plans</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>{["Name","Gmail","Limit/Day","Status","Action"].map(h=><th key={h} className="px-5 py-3 text-left">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-950">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-900/50">
                      <td className="px-5 py-4 font-medium">{c.name}</td>
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs">{c.gmail_user}</td>
                      <td className="px-5 py-4">{c.daily_limit}</td>
                      <td className="px-5 py-4"><span className={`text-xs px-2 py-1 rounded-full ${c.status==="active"?"bg-emerald-900/40 text-emerald-400":"bg-red-900/40 text-red-400"}`}>{c.status}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => toggleClient(c.id,c.status)} disabled={loading[c.id]} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${c.status==="active"?"bg-red-900/30 text-red-400 hover:bg-red-900/60":"bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60"}`}>{loading[c.id]?"...":c.status==="active"?"Deactivate":"Activate"}</button>
                          <button onClick={() => deleteClient(c.id)} disabled={loading[c.id]} className="text-xs text-gray-600 hover:text-red-400 transition-colors px-2">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab==="settings" && (
          <div className="max-w-xl space-y-5">
            <h2 className="text-lg font-semibold">Admin Settings</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              {[
                {key:"site_name",label:"Site Name",type:"text"},
                {key:"bkash_number",label:"bKash Number",type:"text"},
                {key:"usd_to_bdt_rate",label:"USD → BDT Rate",type:"number"},
                {key:"logo_url",label:"Logo Image URL",type:"url"},
                {key:"system_gmail",label:"System Gmail (OTP + Reminders)",type:"email"},
                {key:"system_gmail_app_password",label:"System Gmail App Password",type:"password"},
              ].map(({key,label,type}) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
                  <input type={type} value={settings[key]||""} onChange={(e) => setSettings((p) => ({...p,[key]:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              ))}
              <button onClick={saveSettings} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors">
                {saved ? "✓ Saved!" : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
