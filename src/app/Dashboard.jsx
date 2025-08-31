import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import supabase from "../lib/supabase";
import { listClients, createClient } from "../lib/clients";
import { createInvoice as apiCreateInvoice } from "../lib/invoices";

export default function Dashboard() {
  const { tenant, tenants, setTenant } = useOutletContext() || {};
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!tenant?.id) return;
    loadInvoices(tenant.id).catch(() => {});
  }, [tenant?.id]);

  async function loadInvoices(tenantId) {
    setLoading(true);
    setMsg("");
    try {
      const { data: invs, error } = await supabase
        .from("invoices")
        .select("id, number, client_id, due_date, issue_date, total, currency, created_at, tenant_id")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      let out = (invs || []).filter(r => r.tenant_id === tenantId);

      // map client names
      const ids = Array.from(new Set(out.map(i => i.client_id).filter(Boolean)));
      if (ids.length) {
        const { data: clients, error: cErr } = await supabase
          .from("clients")
          .select("id, name")
          .in("id", ids);
        if (cErr) throw cErr;
        const nameMap = new Map((clients || []).map(c => [c.id, c.name]));
        out = out.map(i => ({ ...i, clientName: nameMap.get(i.client_id) || "—" }));
      } else {
        out = out.map(i => ({ ...i, clientName: "—" }));
      }

      setInvoices(out);
    } catch (e) {
      setMsg(e.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  // Seed demo data for tenant with slug "router-limited"
  async function seedRouterLimited() {
    if (!Array.isArray(tenants) || tenants.length === 0) {
      setMsg("No tenants found on this account.");
      return;
    }
    setSeeding(true);
    setMsg("");

    try {
      const target = tenants.find(t => t?.slug === "router-limited");
      if (!target) {
        setMsg('No tenant with slug "router-limited" in your workspaces.');
        return;
      }
      if (!tenant || tenant.id !== target.id) setTenant?.(target);

      // ensure 3 clients minimum
      let clients = await listClients(target.id);
      const seedClients = [
        { name: "Acme Inc.", email: "billing@acme.test", phone: "912 345 678" },
        { name: "Globex Corp", email: "ap@globex.test", phone: "910 111 222" },
        { name: "Tech Solutions", email: "ap@techsolutions.test", phone: "913 222 333" }
      ];
      for (let i = clients.length; i < 3; i++) {
        const c = await createClient(target.id, seedClients[i]);
        clients.push(c);
      }

      // create 8 invoices
      const todayISO = new Date().toISOString().slice(0, 10);
      const cur = (target.currency || "EUR").toUpperCase();
      const toISO = d => new Date(d).toISOString().slice(0, 10);

      for (let i = 0; i < 8; i++) {
        const c = clients[i % clients.length];
        const due = new Date();
        due.setDate(due.getDate() + (i % 5 === 0 ? -5 : (i * 3) % 30));
        const subtotal = 100 + i * 50;
        const tax = Math.round(subtotal * 0.16);
        const total = subtotal + tax;

        await apiCreateInvoice(target.id, c.id, {
          issue_date: todayISO,
          due_date: toISO(due),
          currency: cur,
          subtotal,
          tax_total: tax,
          total,
          notes: "Seeded demo invoice"
        });
      }

      await loadInvoices(target.id);
      setMsg(`Seeded 8 invoices for ${target.business_name}.`);
    } catch (e) {
      setMsg(e.message || "Seeding failed.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-5">
        <Card title="Total Sales" subtitle="+12% MoM" accent="text-green-600">
          {formatMoney(sum(invoices.map(i => i.total)), tenant?.currency)}
        </Card>
        <Card title="Pending Invoices" subtitle="Not paid yet" accent="text-amber-600">
          {invoices.filter(i => statusOf(i) !== "Paid").length}
        </Card>
        <Card title="Issued this month" subtitle="Counts">
          {invoices.filter(i => inThisMonth(i.issue_date)).length}
        </Card>
        <Card title="Clients Billed" subtitle="Unique this month">
          {new Set(invoices.filter(i => inThisMonth(i.issue_date)).map(i => i.client_id)).size}
        </Card>
      </div>

      {/* Quotes + Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
        {/* Quotes (placeholder) */}
        <section className="lg:col-span-1 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
          <Header title="Recent Quotes">
            <button className="text-xs rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5">
              New Quote
            </button>
          </Header>
          <ul className="divide-y divide-black/5 text-sm">
            {[
              { id: "Q-2045", who: "Tech Solutions", what: "Website revamp", status: "Accepted", cls: "text-emerald-700 bg-emerald-50" },
              { id: "Q-2046", who: "Acme Inc.", what: "Annual support", status: "Pending", cls: "text-amber-700 bg-amber-50" },
              { id: "Q-2047", who: "Globex Corp.", what: "On-site training", status: "Declined", cls: "text-rose-700 bg-rose-50" }
            ].map(q => (
              <li key={q.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium">{q.id} · {q.who}</div>
                  <div className="text-black/60">{q.what}</div>
                </div>
                <span className={`inline-flex items-center ${q.cls} px-2 py-0.5 rounded-full text-xs`}>{q.status}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Invoices (real data) */}
        <section className="lg:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
          <Header title="Invoices">
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-lg px-2 py-1 ring-1 ring-black/10">
                <svg className="h-4 w-4 opacity-60" viewBox="0 0 24 24" fill="currentColor"><path d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z"/></svg>
                <input className="bg-transparent outline-none text-sm" placeholder="Search invoices…" />
              </div>
              <button
                onClick={seedRouterLimited}
                disabled={seeding}
                className="text-xs rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5 disabled:opacity-50"
                title='Seed invoices for tenant slug "router-limited"'
              >
                {seeding ? "Seeding…" : "Seed demo"}
              </button>
              <Link to="/app/invoices/new" className="text-xs rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5">
                New Invoice
              </Link>
            </div>
          </Header>

          {msg && <div className="px-4 py-2 text-xs text-black/70 bg-amber-50 border-t border-amber-200">{msg}</div>}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-4 py-8 text-sm text-black/60">Loading…</div>
            ) : invoices.length === 0 ? (
              <div className="px-4 py-8 text-sm text-black/60">No invoices yet.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-[#F3F4F6] text-black/60">
                  <tr>
                    <th className="text-left px-4 py-2">Invoice #</th>
                    <th className="text-left px-4 py-2">Client</th>
                    <th className="text-left px-4 py-2">Issued</th>
                    <th className="text-left px-4 py-2">Due</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-right px-4 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {invoices.map((r) => {
                    const status = statusOf(r);
                    const badge = statusBadge(status);
                    return (
                      <tr key={r.id}>
                        <td className="px-4 py-2 font-medium">{r.number || r.id}</td>
                        <td className="px-4 py-2">{r.clientName}</td>
                        <td className="px-4 py-2">{formatDate(r.issue_date)}</td>
                        <td className="px-4 py-2">{formatDate(r.due_date)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center ${badge.cls} px-2 py-0.5 rounded-full text-xs`}>{badge.text}</span>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">{formatMoney(r.total, r.currency || tenant?.currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* Quick actions */}
      <div className="pb-8">
        <div className="rounded-2xl shadow-sm ring-1 ring-black/5 p-4 flex flex-wrap gap-3" style={{ background: "#E9F5EE" }}>
          <button className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5">
            Create Quote
          </button>
          <Link to="/app/invoices/new" className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5">
            Create Invoice
          </Link>
          <Link to="/app/clients/new" className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5">
            Add Client
          </Link>
          <button className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5">
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- UI bits ------------------------- */
function Header({ title, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 bg-white/60 backdrop-blur">
      <div className="font-semibold">{title}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Card({ title, subtitle, accent, children }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
      <div className="text-xs uppercase tracking-wide text-black/50">{title}</div>
      <div className="mt-2 text-2xl font-bold">{children}</div>
      {subtitle ? <div className={`text-xs mt-1 ${accent || "text-black/60"}`}>{subtitle}</div> : null}
    </div>
  );
}

/* ----------------------- helpers ----------------------- */
function formatDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
}
function sum(arr) { return arr.reduce((a, b) => a + (Number(b) || 0), 0); }
function formatMoney(amount, currency = "EUR") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}
function inThisMonth(iso) {
  if (!iso) return false;
  const d = new Date(iso); const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
function statusOf(inv) {
  const due = inv?.due_date ? new Date(inv.due_date) : null;
  if (!due) return "Issued";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = (due - today) / 86400000;
  if (diff < 0) return "Overdue";
  if (diff <= 7) return "Due Soon";
  return "Issued";
}
function statusBadge(status) {
  switch (status) {
    case "Overdue": return { text: "Overdue", cls: "text-rose-700 bg-rose-50" };
    case "Due Soon": return { text: "Due Soon", cls: "text-amber-700 bg-amber-50" };
    case "Paid": return { text: "Paid", cls: "text-emerald-700 bg-emerald-50" };
    default: return { text: "Issued", cls: "text-sky-700 bg-sky-50" };
  }
}
