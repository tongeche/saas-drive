import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import supabase from "../lib/supabase";
import { createReceipt } from "../lib/receipts";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ReceiptNew() {
  const nav = useNavigate();
  const { tenant } = useOutletContext() || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // invoices
  const [invoices, setInvoices] = useState([]);
  const [invoiceId, setInvoiceId] = useState("");

  // receipt fields
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!tenant?.id) return;
    (async () => {
      try {
        // Load unpaid/partially paid invoices
        const { data: invs, error } = await supabase
          .from("invoices")
          .select("id, number, client_id, total, currency, issue_date")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        // Get client names for invoices
        const clientIds = Array.from(new Set(invs?.map(i => i.client_id).filter(Boolean)));
        let clientMap = new Map();
        
        if (clientIds.length) {
          const { data: clients, error: cErr } = await supabase
            .from("clients")
            .select("id, name")
            .in("id", clientIds);
          if (!cErr) {
            clientMap = new Map((clients || []).map(c => [c.id, c.name]));
          }
        }
        
        const invoicesWithClient = (invs || []).map(i => ({
          ...i,
          clientName: clientMap.get(i.client_id) || "Unknown Client"
        }));
        
        setInvoices(invoicesWithClient);
        if (invoicesWithClient.length) {
          setInvoiceId(invoicesWithClient[0].id);
        }
      } catch (e) {
        setErr(e.message || "Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tenant?.id]);

  const selectedInvoice = invoices.find(i => i.id === invoiceId);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!invoiceId) { setErr("Please select an invoice."); return; }
    if (!amount || Number(amount) <= 0) { setErr("Please enter a valid amount."); return; }

    try {
      setSaving(true);
      await createReceipt(tenant.id, invoiceId, {
        date,
        amount: Number(amount),
        method,
        reference: reference || null,
        notes: notes || null,
      });
      nav("/app", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Failed to create receipt.");
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

  if (!invoices.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">New Receipt</h1>
          <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5">Back</Link>
        </div>
        
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-8 text-center">
          <div className="text-black/60 mb-4">No invoices found to create receipts for.</div>
          <Link to="/app/invoices/new" className="rounded-lg px-4 py-2 text-sm bg-emerald-600 text-white font-medium hover:opacity-95">
            Create Invoice First
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">New Receipt</h1>
        <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5">Cancel</Link>
      </div>

      {err && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Invoice Selection */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="font-medium mb-3">Invoice</div>
          <div>
            <label className="block text-sm text-black/70 mb-1">Select invoice to record payment for</label>
            <select
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 bg-white"
            >
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.number || inv.id} - {inv.clientName} - {formatMoney(inv.total, inv.currency)}
                </option>
              ))}
            </select>
            {selectedInvoice && (
              <div className="mt-2 text-xs text-black/60">
                Invoice total: <b>{formatMoney(selectedInvoice.total, selectedInvoice.currency)}</b>
              </div>
            )}
          </div>
        </section>

        {/* Receipt Details */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="font-medium mb-3">Receipt Details</div>
          
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm text-black/70 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm text-black/70 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2 bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Check">Check</option>
                <option value="PayPal">PayPal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Reference</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="Transaction ID, check number, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-black/70 mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              placeholder="Additional notes about this payment..."
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5">Cancel</Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm bg-emerald-600 text-white font-medium hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Record Receipt"}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatMoney(amount, currency = "EUR") {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0)); }
  catch { return `${currency} ${Number(amount || 0).toFixed(2)}`; }
}
