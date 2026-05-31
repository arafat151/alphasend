"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const RATE = 133;

export default function RenewPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [settings, setSettings] = useState({ bkash_number: "01959090281", usd_to_bdt_rate: "133" });
  const [daily, setDaily] = useState(500);
  const [gmails, setGmails] = useState([{ gmail_user: "", gmail_app_password: "" }]);
  const [txId, setTxId] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subId, setSubId] = useState(null);

  const gmailsNeeded = daily / 500;
  const priceUSD = parseFloat((daily * 0.01).toFixed(2));
  const priceBDT = Math.round(priceUSD * parseInt(settings.usd_to_bdt_rate || RATE));

  useEffect(() => {
    fetch("/api/user/stats").then((r) => r.json()).then((d) => {
      setUserData(d);
      if (d.subscription) setDaily(d.subscription.daily_limit);
    });
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => {
      if (d.settings) setSettings(d.settings);
    });
  }, []);

  // Sync gmail slots with gmailsNeeded
  useEffect(() => {
    setGmails((prev) => {
      const next = [...prev];
      while (next.length < gmailsNeeded) next.push({ gmail_user: "", gmail_app_password: "" });
      return next.slice(0, gmailsNeeded);
    });
  }, [gmailsNeeded]);

  function updateGmail(i, field, val) {
    setGmails((prev) => prev.map((g, idx) => idx === i ? { ...g, [field]: val } : g));
  }

  async function handleSubscribe() {
    setLoading(true); setError("");
    const res = await fetch("/api/user/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daily_limit: daily, gmails }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { setSubId(data.subscription_id); setStep(3); }
    else setError(data.error || "Failed");
  }

  async function handlePayment() {
    if (!txId.trim()) { setError("Enter transaction ID"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/user/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription_id: subId, transaction_id: txId, amount_usd: priceUSD, amount_bdt: priceBDT }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setStep(4);
    else setError(data.error || "Failed");
  }

  if (!userData) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/user/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">← Back</Link>
          <span className="font-bold text-indigo-400">AlphaSend</span>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["Plan", "Gmail Setup", "Payment", "Done"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step > i+1 ? "bg-emerald-600 text-white" : step === i+1 ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-500"}`}>
                {step > i+1 ? "✓" : i+1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i+1 ? "text-white" : "text-gray-600"}`}>{s}</span>
              {i < 3 && <div className="flex-1 h-px bg-gray-800" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Plan */}
        {step === 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-lg">Choose your plan</h2>
            <p className="text-xs text-gray-400">Each 500 emails/day = 1 Gmail account = $5/month</p>
            <div className="space-y-2">
              {[500,1000,1500,2000,2500,3000].map((v) => (
                <button key={v} onClick={() => setDaily(v)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${daily === v ? "border-indigo-500 bg-indigo-950/40" : "border-gray-700 hover:border-gray-600"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${daily === v ? "border-indigo-500" : "border-gray-600"}`}>
                      {daily === v && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{v.toLocaleString()} emails/day · {v/500} Gmail{v > 500 ? "s" : ""}</p>
                      <p className="text-xs text-gray-500">~{(v*30).toLocaleString()} emails/month</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-400">${(v*0.01).toFixed(2)}/mo</p>
                    <p className="text-xs text-gray-500">{Math.round(v*0.01*parseInt(settings.usd_to_bdt_rate))} BDT</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors">Continue →</button>
          </div>
        )}

        {/* Step 2 — Gmail Setup */}
        {step === 2 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-lg">Gmail Setup</h2>
            <p className="text-sm text-gray-400">
              Your plan needs <strong className="text-white">{gmailsNeeded} Gmail account{gmailsNeeded > 1 ? "s" : ""}</strong>.
              Create App Passwords from{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-indigo-400 underline">Google Account Settings</a>.
            </p>
            {gmails.map((g, i) => (
              <div key={i} className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                <p className="text-xs text-indigo-400 font-medium">Gmail #{i+1}</p>
                <input type="email" value={g.gmail_user} onChange={(e) => updateGmail(i, "gmail_user", e.target.value)}
                  placeholder="account@gmail.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                <input type="password" value={g.gmail_app_password} onChange={(e) => updateGmail(i, "gmail_app_password", e.target.value)}
                  placeholder="App Password (xxxx xxxx xxxx xxxx)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
              </div>
            ))}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl">← Back</button>
              <button onClick={handleSubscribe} disabled={!gmails.every(g => g.gmail_user && g.gmail_app_password) || loading}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl">
                {loading ? "Saving..." : "Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Payment */}
        {step === 3 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-lg">Pay via bKash</h2>
            <div className="bg-gray-800/60 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Plan</span><span>{daily.toLocaleString()} emails/day</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Gmail accounts</span><span>{gmailsNeeded}</span></div>
              <div className="flex justify-between text-sm border-t border-gray-700 pt-2 mt-2">
                <span className="text-gray-400">Amount (BDT)</span>
                <span className="text-white font-bold text-lg">{priceBDT} ৳</span>
              </div>
            </div>
            <div className="bg-pink-950/30 border border-pink-800/40 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-pink-300">bKash Payment Instructions</p>
              <p className="text-xs text-gray-400">1. Open bKash → Send Money</p>
              <p className="text-xs text-gray-400">2. Number: <span className="text-white font-mono font-bold">{settings.bkash_number}</span></p>
              <p className="text-xs text-gray-400">3. Amount: <span className="text-white font-bold">{priceBDT} BDT</span></p>
              <p className="text-xs text-gray-400">4. Paste Transaction ID below</p>
            </div>
            <input type="text" value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="Transaction ID (e.g. 8N6YG2ABCD)"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handlePayment} disabled={!txId || loading}
              className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl">
              {loading ? "Submitting..." : "Submit Payment"}
            </button>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-950 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Payment Submitted!</h2>
            <p className="text-gray-400 text-sm">Admin will approve shortly. Your API will activate automatically.</p>
            <Link href="/user/dashboard" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl">Go to Dashboard</Link>
          </div>
        )}
      </main>
    </div>
  );
}

function Loading() {
  return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
}
