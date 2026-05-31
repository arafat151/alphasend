"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetch("/api/user/stats")
      .then((r) => { if (r.status === 401) router.push("/login"); return r.json(); })
      .then(setData)
      .catch(console.error);
  }, [router]);

  function copyKey() {
    navigator.clipboard.writeText(data.api_key);
    setCopying(true);
    setTimeout(() => setCopying(false), 1500);
  }

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
  }

  if (!data) return <LoadingScreen />;

  const sub = data.subscription;
  const daysLeft = sub
    ? Math.max(0, Math.ceil((new Date(sub.end_date) - new Date()) / 86400000))
    : 0;

  const pctUsed = sub ? Math.min(100, Math.round((data.today_count / sub.daily_limit) * 100)) : 0;
  const monthPct = sub ? Math.min(100, Math.round((data.month_count / (sub.daily_limit * 30)) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" />
              </svg>
            </div>
            <span className="font-bold">AlphaSend</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Hi, {data.name}</span>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-white transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Renewal warning */}
        {sub && daysLeft <= 3 && sub.status === "active" && (
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-amber-400 text-xl">⚠️</span>
              <div>
                <p className="text-amber-300 font-medium text-sm">Subscription expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</p>
                <p className="text-amber-600 text-xs">Renew now to avoid service interruption</p>
              </div>
            </div>
            <Link href="/user/renew"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              Renew
            </Link>
          </div>
        )}

        {/* Service paused */}
        {sub?.status === "paused" && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-red-300 font-medium text-sm">Service Paused</p>
              <p className="text-red-600 text-xs">Your subscription expired. Renew to restore access.</p>
            </div>
            <Link href="/user/renew"
              className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              Renew Now
            </Link>
          </div>
        )}

        {/* No subscription */}
        {!sub && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <p className="text-gray-300 mb-3">You don't have an active plan yet.</p>
            <Link href="/user/renew"
              className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
              Subscribe Now
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Today Sent" value={data.today_count} max={sub?.daily_limit} pct={pctUsed} color="indigo" />
          <StatCard label="This Month" value={data.month_count} max={sub ? sub.daily_limit * 30 : null} pct={monthPct} color="violet" />
          <StatCard label="Daily Limit" value={sub?.daily_limit ?? "—"} color="gray" />
          <StatCard label="Days Left" value={sub ? daysLeft : "—"} color={daysLeft <= 3 ? "amber" : "emerald"} />
        </div>

        {/* API Key */}
        {data.api_key && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Your API Key</p>
            <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
              <code className="text-indigo-400 font-mono text-sm flex-1 truncate">{data.api_key}</code>
              <button onClick={copyKey}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                {copying ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Use in header: <code className="text-gray-400">x-api-key: {data.api_key?.slice(0, 20)}...</code>
            </p>
          </div>
        )}

        {/* Plan + Billing */}
        {sub && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white">Current Plan</p>
              <Link href="/user/renew"
                className="text-xs bg-indigo-900/40 text-indigo-400 hover:bg-indigo-900/70 px-3 py-1.5 rounded-lg transition-colors">
                Renew / Upgrade
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{sub.daily_limit}</p>
                <p className="text-xs text-gray-500">emails/day</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">${sub.monthly_price_usd}</p>
                <p className="text-xs text-gray-500">per month</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${sub.status === "active" ? "text-emerald-400" : "text-red-400"}`}>
                  {sub.status === "active" ? "Active" : "Paused"}
                </p>
                <p className="text-xs text-gray-500">status</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between text-xs text-gray-500">
              <span>Start: {sub.start_date}</span>
              <span>Expires: {sub.end_date}</span>
            </div>
          </div>
        )}

        {/* API Quick Reference */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Quick API Reference</p>
          <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
            <p className="text-indigo-400">POST /api/v1/send</p>
            <p className="text-gray-600 mt-1">Headers:</p>
            <p className="ml-2 text-gray-400">x-api-key: {data.api_key?.slice(0, 24)}...</p>
            <p className="text-gray-600 mt-1">Body:</p>
            <p className="ml-2">{"{"}</p>
            <p className="ml-4 text-emerald-400">"to": "recipient@email.com",</p>
            <p className="ml-4 text-emerald-400">"subject": "Hello!",</p>
            <p className="ml-4 text-emerald-400">"text": "Plain text",</p>
            <p className="ml-4 text-emerald-400">"html": "&lt;p&gt;HTML version&lt;/p&gt;"</p>
            <p className="ml-2">{"}"}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, max, pct, color }) {
  const colorMap = {
    indigo: "text-indigo-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    gray: "text-gray-300",
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color] || "text-white"}`}>{value}</p>
      {max && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-600 mt-1">{pct}% of {max}</p>
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
