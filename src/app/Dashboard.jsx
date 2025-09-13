import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFileInvoice, 
  faFileContract, 
  faBoxes, 
  faBuilding, 
  faMoneyBillWave,
  faArrowUp,
  faArrowDown,
  faEye,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import supabase from "../lib/supabase";
import { listClients, createClient } from "../lib/clients";
import { createInvoice as apiCreateInvoice, statusOf, statusBadge } from "../lib/invoices";
import { listQuotes } from "../lib/quotes";
import { listItems } from "../lib/items";
import { getCashflowTransactions, getCashflowBalance } from "../lib/cashflow";
import { formatMoney } from "../lib/catalog";

export default function Dashboard() {
  const { tenant, tenants, setTenant } = useOutletContext() || {};
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [cashflowTransactions, setCashflowTransactions] = useState([]);
  const [cashflowBalance, setCashflowBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!tenant?.id) return;
    loadAllData(tenant.id);
  }, [tenant?.id]);

  async function loadAllData(tenantId) {
    setLoading(true);
    setMsg("");
    try {
      await Promise.all([
        loadInvoices(tenantId),
        loadQuotes(tenantId),
        loadClients(tenantId),
        loadItems(tenantId),
        loadCashflow(tenantId)
      ]);
    } catch (e) {
      setMsg(e.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadInvoices(tenantId) {
    try {
      const { data: invs, error } = await supabase
        .from("invoices")
        .select("id, number, client_id, due_date, issue_date, total, currency, created_at, tenant_id")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      let out = (invs || []).filter(r => r.tenant_id === tenantId);

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
      console.error("Failed to load invoices:", e);
    }
  }

  async function loadQuotes(tenantId) {
    try {
      const quoteRows = await listQuotes(tenantId);
      let out = (quoteRows || []).filter(r => r.tenant_id === tenantId);

      const ids = Array.from(new Set(out.map(q => q.client_id).filter(Boolean)));
      if (ids.length) {
        const { data: clients, error: cErr } = await supabase
          .from("clients")
          .select("id, name")
          .in("id", ids);
        if (cErr) throw cErr;
        const nameMap = new Map((clients || []).map(c => [c.id, c.name]));
        out = out.map(q => ({ ...q, clientName: nameMap.get(q.client_id) || "—" }));
      } else {
        out = out.map(q => ({ ...q, clientName: "—" }));
      }

      setQuotes(out);
    } catch (e) {
      console.error("Failed to load quotes:", e);
    }
  }

  async function loadClients(tenantId) {
    try {
      const clientRows = await listClients(tenantId);
      setClients(clientRows || []);
    } catch (e) {
      console.error("Failed to load clients:", e);
    }
  }

  async function loadItems(tenantId) {
    try {
      const { data: itemRows, error } = await supabase
        .from("items")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      setItems(itemRows || []);
    } catch (e) {
      console.error("Failed to load items:", e);
    }
  }

  async function loadCashflow(tenantId) {
    try {
      const [transactions, balance] = await Promise.all([
        getCashflowTransactions(tenantId, {}),
        getCashflowBalance(tenantId, tenant?.currency || 'EUR')
      ]);
      setCashflowTransactions(transactions || []);
      setCashflowBalance(balance || 0);
    } catch (e) {
      console.error("Failed to load cashflow:", e);
    }
  }

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

  const getQuoteStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return { cls: 'bg-gray-100 text-gray-800', text: 'Draft' };
      case 'Sent':
        return { cls: 'bg-blue-100 text-blue-800', text: 'Sent' };
      case 'Accepted':
        return { cls: 'bg-green-100 text-green-800', text: 'Accepted' };
      case 'Rejected':
        return { cls: 'bg-red-100 text-red-800', text: 'Rejected' };
      default:
        return { cls: 'bg-gray-100 text-gray-800', text: status || 'Unknown' };
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Enhanced KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pb-6">
        <Card title="Total Sales" subtitle="+12% MoM" accent="text-green-600" icon={faFileInvoice}>
          {formatMoney(sum(invoices.map(i => i.total)), tenant?.currency)}
        </Card>
        <Card title="Cashflow Balance" subtitle={`${cashflowTransactions.length} transactions`} accent={cashflowBalance >= 0 ? "text-green-600" : "text-red-600"} icon={faMoneyBillWave}>
          {formatMoney(cashflowBalance, tenant?.currency)}
        </Card>
        <Card title="Active Quotes" subtitle={`${quotes.filter(q => ['Draft', 'Sent'].includes(q.status)).length} pending`} accent="text-blue-600" icon={faFileContract}>
          {quotes.length}
        </Card>
        <Card title="Inventory Items" subtitle={`${items.filter(i => i.is_service).length} services`} accent="text-purple-600" icon={faBoxes}>
          {items.length}
        </Card>
        <Card title="Active Clients" subtitle="Total registered" accent="text-indigo-600" icon={faBuilding}>
          {clients.length}
        </Card>
      </div>

      {/* Main content grid - responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
        {/* Recent Invoices - takes full width on mobile, 8 cols on desktop */}
        <section className="lg:col-span-8 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
          <Header title="Recent Invoices" count={invoices.length}>
            <div className="flex items-center gap-2">
              <Link to="/app/invoices" className="text-xs rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5 flex items-center gap-1">
                <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                <span className="hidden sm:inline">View All</span>
              </Link>
              <Link to="/app/invoices/wizard" className="text-xs rounded-lg px-2 py-1 bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                <span className="hidden sm:inline">New Invoice</span>
              </Link>
            </div>
          </Header>

          {msg && <div className="px-4 py-2 text-xs text-black/70 bg-amber-50 border-t border-amber-200">{msg}</div>}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-4 py-8 text-sm text-black/60 text-center">Loading…</div>
            ) : invoices.length === 0 ? (
              <div className="px-4 py-8 text-sm text-black/60 text-center">
                <FontAwesomeIcon icon={faFileInvoice} className="w-12 h-12 text-gray-300 mb-3" />
                <p>No invoices yet.</p>
                <Link to="/app/invoices/wizard" className="text-emerald-600 hover:text-emerald-700">Create your first invoice</Link>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-[#F3F4F6] text-black/60 hidden sm:table-header-group">
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
                  {invoices.slice(0, 10).map((r) => {
                    const status = statusOf(r);
                    const badge = statusBadge(status);
                    return (
                      <tr key={r.id} className="sm:table-row flex flex-col sm:flex-row border-b sm:border-b-0 pb-4 sm:pb-0 mb-4 sm:mb-0">
                        <td className="px-4 py-2 font-medium flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Invoice:</span>
                          {r.number || r.id}
                        </td>
                        <td className="px-4 py-2 flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Client:</span>
                          {r.clientName}
                        </td>
                        <td className="px-4 py-2 flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Issued:</span>
                          {formatDate(r.issue_date)}
                        </td>
                        <td className="px-4 py-2 flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Due:</span>
                          {formatDate(r.due_date)}
                        </td>
                        <td className="px-4 py-2 flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Status:</span>
                          <span className={`inline-flex items-center ${badge.cls} px-2 py-0.5 rounded-full text-xs`}>{badge.text}</span>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Amount:</span>
                          {formatMoney(r.total, r.currency || tenant?.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Sidebar content - stacks on mobile, 4 cols on desktop */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Quotes */}
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
            <Header title="Recent Quotes" count={quotes.length}>
              <Link to="/app/quotes/new" className="text-xs rounded-lg px-2 py-1 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                <span className="hidden sm:inline">New</span>
              </Link>
            </Header>
            <ul className="divide-y divide-black/5 text-sm">
              {quotes.length === 0 ? (
                <li className="px-4 py-8 text-center text-black/60">
                  <FontAwesomeIcon icon={faFileContract} className="w-8 h-8 text-gray-300 mb-2" />
                  <p>No quotes yet.</p>
                </li>
              ) : (
                quotes.slice(0, 5).map(q => {
                  const statusBadge = getQuoteStatusBadge(q.status);
                  return (
                    <li key={q.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{q.number || q.id}</div>
                          <div className="text-black/60 text-xs">{q.clientName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatMoney(q.total, q.currency || tenant?.currency)}</div>
                          <span className={`inline-flex items-center ${statusBadge.cls} px-1.5 py-0.5 rounded-full text-xs`}>
                            {statusBadge.text}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          {/* Recent Cashflow */}
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
            <Header title="Recent Transactions" count={cashflowTransactions.length}>
              <Link to="/app/cashflow/new" className="text-xs rounded-lg px-2 py-1 bg-green-600 text-white hover:bg-green-700 flex items-center gap-1">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                <span className="hidden sm:inline">Add</span>
              </Link>
            </Header>
            <ul className="divide-y divide-black/5 text-sm">
              {cashflowTransactions.length === 0 ? (
                <li className="px-4 py-8 text-center text-black/60">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="w-8 h-8 text-gray-300 mb-2" />
                  <p>No transactions yet.</p>
                </li>
              ) : (
                cashflowTransactions.slice(0, 5).map(t => (
                  <li key={t.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon 
                            icon={t.transaction_type === 'cash_in' ? faArrowUp : faArrowDown} 
                            className={`w-3 h-3 ${t.transaction_type === 'cash_in' ? 'text-green-600' : 'text-red-600'}`}
                          />
                          <span className="font-medium truncate">{t.description}</span>
                        </div>
                        <div className="text-black/60 text-xs">{t.category || 'Uncategorized'}</div>
                      </div>
                      <div className={`text-right font-medium ${t.transaction_type === 'cash_in' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.transaction_type === 'cash_in' ? '+' : '-'}{formatMoney(t.amount, t.currency)}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>

      {/* Quick actions */}
      <div className="pb-8">
        <div className="rounded-2xl shadow-sm ring-1 ring-black/5 p-4 sm:p-6" style={{ background: "#E9F5EE" }}>
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link to="/app/invoices/wizard" className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center">
              <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4 mb-1 text-emerald-600" />
              <div>Invoice</div>
            </Link>
            <Link to="/app/quotes/new" className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center">
              <FontAwesomeIcon icon={faFileContract} className="w-4 h-4 mb-1 text-blue-600" />
              <div>Quote</div>
            </Link>
            <Link to="/app/cashflow/new" className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center">
              <FontAwesomeIcon icon={faMoneyBillWave} className="w-4 h-4 mb-1 text-green-600" />
              <div>Transaction</div>
            </Link>
            <Link to="/app/clients/new" className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center">
              <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 mb-1 text-indigo-600" />
              <div>Client</div>
            </Link>
            <Link to="/app/items/new" className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center">
              <FontAwesomeIcon icon={faBoxes} className="w-4 h-4 mb-1 text-purple-600" />
              <div>Item</div>
            </Link>
            <button 
              onClick={seedRouterLimited}
              disabled={seeding}
              className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center disabled:opacity-50"
            >
              <div>{seeding ? "Seeding..." : "Demo Data"}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ title, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 bg-white/60 backdrop-blur">
      <div className="font-semibold">{title}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
function Card({ title, subtitle, accent, icon, children }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-black/50">{title}</div>
          <div className="mt-2 text-2xl font-bold">{children}</div>
          {subtitle ? <div className={`text-xs mt-1 ${accent || "text-black/60"}`}>{subtitle}</div> : null}
        </div>
        {icon && (
          <FontAwesomeIcon icon={icon} className={`w-5 h-5 ${accent || "text-black/60"}`} />
        )}
      </div>
    </div>
  );
}
function formatDate(d) { if (!d) return "—"; try { return new Date(d).toLocaleDateString(); } catch { return String(d); } }
function sum(arr) { return arr.reduce((a, b) => a + (Number(b) || 0), 0); }
function inThisMonth(iso) { if (!iso) return false; const d = new Date(iso); const now = new Date(); return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth(); }

function getQuoteStatusBadge(status) {
  switch (status) {
    case "Accepted": return { text: "Accepted", cls: "text-emerald-700 bg-emerald-50" };
    case "Declined": return { text: "Declined", cls: "text-rose-700 bg-rose-50" };
    case "Sent": return { text: "Sent", cls: "text-blue-700 bg-blue-50" };
    case "Expired": return { text: "Expired", cls: "text-gray-700 bg-gray-50" };
    default: return { text: "Draft", cls: "text-amber-700 bg-amber-50" };
  }
}
