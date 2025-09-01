import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import supabase from "../lib/supabase";
import { createReceipt } from "../lib/receipts";

export default function InvoicePay() {
  const nav = useNavigate();
  const { tenant } = useOutletContext() || {};
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [received, setReceived] = useState(0);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [created, setCreated] = useState(null);

  const outstanding = useMemo(() => {
    const tot = Number(invoice?.total || 0);
    return Math.max(0, Math.round((tot - Number(received || 0)) * 100) / 100);
  }, [invoice, received]);

  useEffect(() => {
    if (!tenant?.id || !id) return;
    (async () => {
      setLoading(true); setErr("");
      try {
        const { data: inv, error: iErr } = await supabase
          .from("invoices")
          .select("id, tenant_id, number, total, currency, due_date, issue_date, client_id")
          .eq("tenant_id", tenant.id)
          .eq("id", id)
          .maybeSingle();
        if (iErr) throw iErr;
        if (!inv) throw new Error("Invoice not found.");
        setInvoice(inv);

        const { data: recs, error: rErr } = await supabase
          .from("receipts")
          .select("amount")
          .eq("invoice_id", id);
        if (rErr) throw rErr;
        const sum = (recs || []).reduce((a, r) => a + Number(r.amount || 0), 0);
        setReceived(sum);
        const out = Math.max(0, Math.round((Number(inv.total||0) - sum) * 100) / 100);
        setAmount(String(out || ""));
      } catch (e) {
        setErr(e.message || "Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tenant?.id, id]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!tenant?.id) { setErr("No active tenant."); return; }
    if (!invoice?.id) { setErr("Missing invoice."); return; }
    const amt = Number(amount || 0);
    if (amt <= 0) { setErr("Enter a valid amount."); return; }
    try {
      const res = await createReceipt(tenant.id, invoice.id, { date, amount: amt, method, reference, notes });
      setCreated(res);
    } catch (e2) {
      setErr(e2.message || "Failed to record payment.");
    }
  }

  function shareWhatsApp() {
    if (!created?.receipt || !invoice) return;
    const curr = invoice.currency || "EUR";
    const fmt = (n) => {
      try { return new Intl.NumberFormat(undefined, { style:"currency", currency: curr }).format(n); }
      catch { return `${curr} ${Number(n).toFixed(2)}`; }
    };
    const lines = [
      `Receipt`,
      `Invoice: ${invoice.number || invoice.id}`,
      `Amount: ${fmt(created.receipt.amount)}`,
      `Date: ${created.receipt.date}`,
      `Thank you.`,
    ];
    const url = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) return <div className="mx-auto max-w-xl px-4 py-10 text-black/70">Loading…</div>;

  if (!invoice) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {err || "Invoice not found."}
        </div>
        <Link to="/app" className="text-sm rounded-lg px-3 py-2 ring-1 ring-black/10 bg-white hover:bg-black/5">Back</Link>
      </div>
    );
  }

  if (created?.receipt) {
    const out = Math.max(0, Math.round(((Number(invoice.total||0) - Number(created.totalReceipts||0)) * 100)) / 100);
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="text-lg font-semibold mb-1">Payment recorded</div>
          <div className="text-sm text-black/70">Invoice {invoice.number || invoice.id}</div>
          <div className="mt-3 text-sm">
            Amount received: <b>{formatMoney(created.receipt.amount, invoice.currency)}</b><br/>
            Date: {created.receipt.date}<br/>
            Outstanding: <b>{formatMoney(out, invoice.currency)}</b>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={shareWhatsApp} className="rounded-lg px-3 py-2 text-sm bg-[#25D366] text-white hover:opacity-95">
              Share via WhatsApp
            </button>
            <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4">
        <div className="text-xl font-semibold">Mark as Paid</div>
        <div className="text-sm text-black/60">Invoice {invoice.number || invoice.id}</div>
      </div>

      {err && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{err}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-black/70 mb-1">Amount</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e)=>setAmount(e.target.value)}
                   className="w-full rounded-lg border border-black/10 px-3 py-2" />
            <div className="text-xs text-black/60 mt-1">
              Outstanding: <b>{formatMoney(outstanding, invoice.currency)}</b>
            </div>
          </div>
          <div>
            <label className="block text-sm text-black/70 mb-1">Date</label>
            <input type="date" value={date} onChange={(e)=>setDate(e.target.value)}
                   className="w-full rounded-lg border border-black/10 px-3 py-2" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-black/70 mb-1">Method</label>
            <select value={method} onChange={(e)=>setMethod(e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 bg-white">
              <option>Cash</option>
              <option>Mobile</option>
              <option>Bank</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-black/70 mb-1">Reference</label>
            <input value={reference} onChange={(e)=>setReference(e.target.value)}
                   className="w-full rounded-lg border border-black/10 px-3 py-2"
                   placeholder="Txn / M-Pesa / Ref" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-black/70 mb-1">Notes (optional)</label>
          <textarea rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2"
                    placeholder="Thanks for your payment" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5">Cancel</Link>
          <button type="submit" className="rounded-lg px-4 py-2 text-sm bg-finovo text-white font-medium hover:opacity-95">
            Save receipt
          </button>
        </div>
      </form>
    </div>
  );
}

function formatMoney(n, c="EUR") {
  try { return new Intl.NumberFormat(undefined, { style:"currency", currency:c }).format(Number(n||0)); }
  catch { return `${c} ${Number(n||0).toFixed(2)}`; }
}
