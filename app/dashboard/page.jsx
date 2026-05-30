import { getClients } from "@/app/actions/clients";
import ClientsTable from "./ClientsTable";
import AddClientForm from "./AddClientForm";

export const dynamic = "force-dynamic"; // always fetch fresh data

export default async function DashboardPage() {
  const clients = await getClients();

  const total = clients.length;
  const active = clients.filter((c) => c.status === "active").length;
  const inactive = total - active;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ── Header ── */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">AlphaSend</span>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="text-sm text-gray-400">
            API endpoint: <code className="text-indigo-400 font-mono">/api/v1/send</code>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Clients" value={total} color="text-white" />
          <StatCard label="Active" value={active} color="text-emerald-400" />
          <StatCard label="Inactive" value={inactive} color="text-red-400" />
        </div>

        {/* ── Add Client Form ── */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Client</h2>
          <AddClientForm />
        </section>

        {/* ── Clients Table ── */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Clients ({total})
          </h2>
          <ClientsTable clients={clients} />
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
