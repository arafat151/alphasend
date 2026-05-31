"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const RATE = 133;
const MIN = 100;
const MAX = 5000;
const STEP = 10;

export default function PricingPage() {
  const [daily, setDaily] = useState(500);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  const gmailsNeeded = Math.ceil(daily / 500);
  const monthly = daily * 30;
  const priceUSD = (daily * 0.01).toFixed(2);
  const priceBDT = Math.round(daily * 0.01 * RATE);

  function valueToPercent(v) { return ((v - MIN) / (MAX - MIN)) * 100; }
  function percentToValue(pct) {
    const raw = MIN + (pct / 100) * (MAX - MIN);
    return Math.round(raw / STEP) * STEP;
  }

  function handleSliderInteraction(clientX) {
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setDaily(Math.max(MIN, Math.min(MAX, percentToValue(pct))));
  }

  function onMouseDown(e) { isDragging.current = true; handleSliderInteraction(e.clientX); }

  useEffect(() => {
    function onMouseMove(e) { if (isDragging.current) handleSliderInteraction(e.clientX); }
    function onMouseUp() { isDragging.current = false; }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);

  const pct = valueToPercent(daily);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">AlphaSend</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/50 text-indigo-400 text-xs px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Transactional Email API
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
          Send emails from your app<span className="text-indigo-400"> in minutes</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">One API. Any website. Scale up to 150,000 emails/month.</p>
      </section>

      <section className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm mb-1">Monthly estimate</p>
            <p className="text-5xl font-extrabold text-white">${priceUSD}<span className="text-xl text-gray-500 font-normal">/mo</span></p>
            <p className="text-indigo-400 text-sm mt-1">≈ {priceBDT} BDT/month</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatBox label="Per Day" value={daily.toLocaleString()} unit="emails" />
            <StatBox label="Per Month" value={`~${monthly.toLocaleString()}`} unit="emails" />
            <StatBox label="Gmail Accounts" value={gmailsNeeded} unit={gmailsNeeded === 1 ? "account" : "accounts"} color="text-emerald-400" />
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>100/day</span>
              <span className="text-gray-400 font-medium">{daily.toLocaleString()}/day selected</span>
              <span>5,000/day</span>
            </div>
            <div ref={sliderRef} className="relative h-10 flex items-center cursor-pointer select-none"
              onMouseDown={onMouseDown}
              onTouchStart={(e) => handleSliderInteraction(e.touches[0].clientX)}
              onTouchMove={(e) => handleSliderInteraction(e.touches[0].clientX)}>
              <div className="absolute w-full h-2 bg-gray-800 rounded-full" />
              <div className="absolute h-2 bg-indigo-600 rounded-full transition-all duration-75" style={{ width: `${pct}%` }} />
              <div className="absolute w-6 h-6 bg-indigo-500 rounded-full border-2 border-white shadow-lg shadow-indigo-900/50 transition-all duration-75 hover:scale-110"
                style={{ left: `calc(${pct}% - 12px)` }} />
            </div>
            <div className="relative mt-1 h-5">
              {[100,500,1000,2000,3000,5000].map((v) => (
                <button key={v} onClick={() => setDaily(v)}
                  className={`absolute text-xs -translate-x-1/2 transition-colors ${daily === v ? "text-indigo-400 font-bold" : "text-gray-600 hover:text-gray-400"}`}
                  style={{ left: `${valueToPercent(v)}%` }}>
                  {v >= 1000 ? `${v/1000}k` : v}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 mb-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Gmail accounts needed</span>
              <span className="text-white font-medium">{gmailsNeeded} × Gmail</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Capacity per Gmail</span>
              <span className="text-white">500 emails/day</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-700 pt-2 mt-2">
              <span className="text-gray-400">Total monthly</span>
              <span className="text-indigo-400 font-bold">${priceUSD}</span>
            </div>
          </div>

          <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3 mb-5 text-xs text-indigo-300">
            💡 Multiple Gmails rotate automatically — your API key stays the same. One endpoint, unlimited scale.
          </div>

          <Link href="/register" className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl text-center transition-colors text-sm">
            Get Started — ${priceUSD}/month
          </Link>
          <p className="text-center text-xs text-gray-600 mt-3">No credit card required · Cancel anytime</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { icon: "⚡", title: "Instant delivery", desc: "Emails sent in seconds" },
            { icon: "🔄", title: "Auto Gmail rotation", desc: "Seamless multi-account sending" },
            { icon: "📊", title: "Usage tracking", desc: "See stats in your dashboard" },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-sm font-medium text-white">{f.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatBox({ label, value, unit, color = "text-white" }) {
  return (
    <div className="bg-gray-800/60 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-600">{unit}</p>
    </div>
  );
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              