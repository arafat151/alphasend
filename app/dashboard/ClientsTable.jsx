"use client";

import { useState } from "react";
import { toggleStatus, deleteClient } from "@/app/actions/clients";

export default function ClientsTable({ clients }) {
  const [copying, setCopying] = useState(null);
  const [loading, setLoading] = useState(null);

  async function handleToggle(id, status) {
    setLoading(id + "-toggle");
    await toggleStatus(id, status);
    setLoading(null);
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return;
    setLoading(id + "-delete");
    await deleteClient(id);
    setLoading(null);
  }

  function copyKey(key, id) {
    navigator.clipboard.writeText(key);
    setCopying(id);
    setTimeout(() => setCopying(null), 1500);
  }

  if (clients.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500">
        No clients yet. Add your first one above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-5 py-3 text-left">Name</th>
            <th className="px-5 py-3 text-left">Gmail</th>
            <th className="px-5 py-3 text-left">API Key</th>
            <th className="px-5 py-3 text-left">Status</th>
            <th className="px-5 py-3 text-left">Created</th>
            <th className="px-5 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-gray-950">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-gray-900 transition-colors">
              <td className="px-5 py-4 font-medium text-white">{client.name}</td>
              <td className="px-5 py-4 text-gray-300 font-mono text-xs">{client.gmail_user}</td>

              {/* API Key with copy button */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <code className="text-indigo-400 font-mono text-xs truncate max-w-[180px]">
                    {client.api_key}
                  </code>
                  <button
                    onClick={() => copyKey(client.api_key, client.id)}
                    className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                    title="Copy API key"
                  >
                    {copying === client.id ? (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </td>

              {/* Status badge */}
              <td className="px-5 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  client.status === "active"
                    ? "bg-emerald-900/40 text-emerald-400"
                    : "bg-red-900/40 text-red-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    client.status === "active" ? "bg-emerald-400" : "bg-red-400"
                  }`} />
                  {client.status === "active" ? "Active" : "Inactive"}
                </span>
              </td>

              <td className="px-5 py-4 text-gray-500 text-xs">
                {new Date(client.created_at).toLocaleDateString()}
              </td>

              {/* Actions */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(client.id, client.status)}
                    disabled={loading === client.id + "-toggle"}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      client.status === "active"
                        ? "bg-red-900/30 text-red-400 hover:bg-red-900/60"
                        : "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60"
                    }`}
                  >
                    {loading === client.id + "-toggle"
                      ? "..."
                      : client.status === "active"
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(client.id, client.name)}
                    disabled={loading === client.id + "-delete"}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {loading === client.id + "-delete" ? "..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
