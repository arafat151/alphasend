"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push(`/verify?email=${encodeURIComponent(form.email)}`);
    } else {
      setError(data.error || "Registration failed");
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start sending emails in minutes">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full Name" name="name" type="text" value={form.name} onChange={onChange} placeholder="Arafat Rahman" />
        <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} placeholder="you@gmail.com" />
        <Field label="Phone (optional)" name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="01XXXXXXXXX" />
        <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} placeholder="Min 8 characters" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Login</Link>
      </p>
    </AuthLayout>
  );
}

function Field({ label, name, type, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={name !== "phone"}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors" />
    </div>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="font-bold text-white text-lg">AlphaSend</span>
      </Link>
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">{title}</h1>
        <p className="text-sm text-gray-400 mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
