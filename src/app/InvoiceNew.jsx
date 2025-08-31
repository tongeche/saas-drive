import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { listClients, createClient } from "../lib/clients";
import { createInvoice as apiCreateInvoice } from "../lib/invoices";

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (baseISO, days) => {
  const d = new Date(baseISO || todayISO());
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function InvoiceNew() {
  const nav = useNavigate();
  const { tenant } = useOutletContext() || {};

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  // clients
  const [clients, setClients]   = useState([]);
  const [clientId, setClientId] = useState("");

  // quick add client (optional)
  const [qaOpen, setQaOpen] = useState(false);
  const [qa, setQa] = useState({ name: "", email: "", phone: "" });

  // invoice fields
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate]     = useState(addDaysISO(todayISO(), 14));
  const [currency, setCurrency]   = useState("EUR");
  const [subtotal, setSubtotal]   = useState(0);
  const [taxPct, setTaxPct]       = useState(16);
  const [notes, setNotes]         = useState("");

  useEffect(() => {
    if (!tenant?.id) return;
    setCurrency((tenant.currency || "EUR").toUpperCase());
    (async () => {
      try {
        const rows = await listClients(tenant.id);
        setClients(rows || []);
        if (rows?.length) setClientId(rows[0].id);
      } catch (e) {
        setErr(e.message || "Failed to load clients.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tenant?.id]);

  const taxTotal = useMemo(() => {
    const s = Number(subtotal || 0);
    const p = Number(taxPct || 0) / 100;
    return Math.max(0, Math.round((s * p) * 100) / 100);
  }, [subtotal, taxPct]);

  const total = useMemo(() => {
    return Math.max(0, Math.round(((Number(subtotal || 0) + taxTotal) * 100)) / 100);
  }, [subtotal, taxTotal]);

  async function onQuickAdd(e) {
    e.preventDefault();
    setErr("");
    if (!qa.name.trim()) { setErr("Client name is required."); return; }
    try {
      const c = await createClient(tenant.id, qa);
      setClients(prev => [c, ...prev]);
      setClientId(c.id);
      setQa({ name: "", email: "", phone: "" });
      setQaOpen(false);
    } catch (e2) {
      setErr(e2.message || "Failed to create client.");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!clientId) { setErr("Please select a client."); return; }

    try {
      setSaving(true);
      await apiCreateInvoice(tenant.id, clientId, {
        issue_date: issueDate,
        due_date: dueDate,
        currency: currency.toUpperCase(),
        subtotal: Number(subtotal || 0),
        tax_total: Number(taxTotal || 0),
        total: Number(total || 0),
        notes: notes || null,
      });
      nav("/app", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Failed to create invoice.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-black/70">Loading…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">New Invoice</h1>
        <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5">Cancel</Link>
      </div>

      {err && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Client */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Client</div>
            <button
              type="button"
              className="text-xs rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5"
              onClick={() => setQaOpen(v => !v)}
            >
              {qaOpen ? "Close" : "Quick add"}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-black/70 mb-1">Select client</label>
              <select
                value={clientId}
                onChange={(e)=>setClientId(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2 bg-white"
              >
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-black/70 mb-1">Currency</label>
              <input
                value={currency}
                onChange={(e)=>setCurrency(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="EUR"
              />
            </div>
          </div>

          {qaOpen && (
            <div className="mt-4 rounded-lg border border-dashed border-black/10 p-3">
              <div className="text-xs text-black/60 mb-2">Quick add client</div>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  className="rounded-lg border border-black/10 px-3 py-2"
                  placeholder="Name"
                  value={qa.name}
                  onChange={(e)=>setQa(a=>({ ...a, name: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-black/10 px-3 py-2"
                  placeholder="Email"
                  value={qa.email}
                  onChange={(e)=>setQa(a=>({ ...a, email: e.target.value }))}
                />
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-black/10 px-3 py-2"
                    placeholder="Phone"
                    value={qa.phone}
                    onChange={(e)=>setQa(a=>({ ...a, phone: e.target.value }))}
                  />
                  <button onClick={onQuickAdd} className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5">
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Dates & amounts */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="font-medium mb-3">Details</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-black/70 mb-1">Issue date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e)=>setIssueDate(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e)=>setDueDate(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-sm text-black/70 mb-1">Subtotal</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={subtotal}
                onChange={(e)=>setSubtotal(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Tax %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxPct}
                onChange={(e)=>setTaxPct(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
              />
              <div className="text-xs text-black/50 mt-1">Tax total: <b>{formatMoney(taxTotal, currency)}</b></div>
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Total</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={total}
                readOnly
                className="w-full rounded-lg border border-black/10 px-3 py-2 bg-gray-50"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm text-black/70 mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e)=>setNotes(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              placeholder="Thanks for your business. Payment due in 14 days."
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5">Cancel</Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm bg-finovo text-white font-medium hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatMoney(amount, currency="EUR") {
  try { return new Intl.NumberFormat(undefined, { style:"currency", currency }).format(Number(amount||0)); }
  catch { return `${currency} ${Number(amount||0).toFixed(2)}`; }
}
