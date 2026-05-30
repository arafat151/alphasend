"use client";

import { useState } from "react";
import { addClient } from "@/app/actions/clients";

export default function AddClientForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.target);
    try {
      await addClient(formData);
      setMessage({ type: "success", text: "Client added successfully!" });
      e.target.reset();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Client Name</label>
        <input
          name="name"
          required
          placeholder="e.g. Acme Corp"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Gmail Address</label>
        <input
          name="gmail_user"
          type="email"
          required
          placeholder="sender@gmail.com"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Gmail App Password</label>
        <input
          name="gmail_app_password"
          type="password"
          required
          placeholder="xxxx xxxx xxxx xxxx"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="md:col-span-3 flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Adding..." : "Add Client"}
        </button>
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
