import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import { getActiveTenant } from "../lib/tenantState";
import { fetchClientsForActiveTenant, getOrCreateClient, searchClientsForActiveTenant } from "../lib/clients_extra";
import { fetchCatalogForActiveTenant, searchCatalogForActiveTenant } from "../lib/catalog";
import SearchSelect from "../components/inputs/SearchSelect";

async function getNextInvoiceNumberFallbackAware(tenantId) {
  try {
    const { data, error } = await supabase.rpc("next_invoice_number", { p_tenant: tenantId });
    if (!error && data) return data;
  } catch (_) {}
  return `INV-${String(Date.now()).slice(-6)}`;
}

function currencyList() { return ["EUR","USD","GBP","KES","NGN","ZAR","GHS","UGX","TND","MAD","INR"]; }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function addDays(d = 14) { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString().slice(0, 10); }

export default function InvoiceWizard() {
  const nav = useNavigate();
  const tenant = getActiveTenant();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Client step
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", billing_address: "" });

  // Details
  const [details, setDetails] = useState({
    number: "",
    issue_date: todayISO(),
    due_date: addDays(14),
    currency: tenant?.currency || "EUR",
  });

  // Items
  const [items, setItems] = useState([{ description: "", qty: 1, unit_price: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [catalog, setCatalog] = useState([]);

  // Notes
  const [notes, setNotes] = useState("");

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + (Number(it.qty || 0) * Number(it.unit_price || 0)), 0);
    const tax_total = (Number(taxRate || 0) / 100) * subtotal;
    const total = subtotal + tax_total;
    return { subtotal, tax_total, total, balance_due: total };
  }, [items, taxRate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true); setErr("");
        if (!tenant?.id) throw new Error("No active tenant.");
        const [list, invNo, cat] = await Promise.all([
          fetchClientsForActiveTenant(),
          getNextInvoiceNumberFallbackAware(tenant.id),
          fetchCatalogForActiveTenant().catch(() => []),
        ]);
        if (!mounted) return;
        setClients(list);
        setDetails(d => ({ ...d, number: invNo || d.number || "" }));
        setCatalog(cat || []);
      } catch (e) {
        setErr(e.message || "Failed to load wizard data.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [tenant?.id]);

  function next() { setErr(""); setStep(s => Math.min(s + 1, 4)); }
  function back() { setErr(""); setStep(s => Math.max(s - 1, 0)); }

  function addCatalogLineFromRow(row) {
    if (!row) return;
    const desc = row.description ? `${row.name} — ${row.description}` : row.name;
    setItems(arr => [...arr, { description: desc, qty: 1, unit_price: Number(row.unit_price || 0) }]);
  }

  async function onCreate() {
    try {
      setLoading(true); setErr("");
      // resolve client
      let resolvedClientId = clientId || "";
      if (!resolvedClientId) {
        const c = await getOrCreateClient(newClient);
        resolvedClientId = c?.id;
      }

      const payload = {
        tenant_id: tenant.id,
        client_id: resolvedClientId || null,
        number: details.number,
        issue_date: details.issue_date,
        due_date: details.due_date || null,
        currency: details.currency || tenant?.currency || "EUR",
        subtotal: totals.subtotal,
        tax_total: totals.tax_total,
        total: totals.total,
        balance_due: totals.total,
        notes: notes || null,
      };

      const { data: inv, error: e1 } = await supabase
        .from("invoices")
        .insert(payload)
        .select("id, number")
        .maybeSingle();
      if (e1) throw e1;

      if (items.length) {
        const rows = items
          .filter(i => (i.description || "").trim() !== "")
          .map((it, idx) => ({
            invoice_id: inv.id,
            description: it.description || "",
            qty: Number(it.qty || 0),
            unit_price: Number(it.unit_price || 0),
            line_total: Number(it.qty || 0) * Number(it.unit_price || 0),
            position: idx + 1,
          }));
        if (rows.length) {
          const { error: e2 } = await supabase.from("invoice_items").insert(rows);
          if (e2) throw e2;
        }
      }

      nav(`/app`, { replace: true });
    } catch (e) {
      setErr(e.message || "Failed to create invoice.");
    } finally {
      setLoading(false);
    }
  }

  const label = "block text-sm font-medium text-gray-700 mb-1";
  const input = "w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-finovo";

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
          Preparing invoice wizard…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">New Invoice</h1>
        <p className="text-gray-600 mb-4">Search & pick, or create if missing. Mobile-first.</p>

        {/* Stepper */}
        <div className="flex items-center gap-2 text-sm mb-6 overflow-x-auto">
          {["Client","Details","Items","Notes","Review"].map((s, idx) => (
            <div key={s} className={`px-3 py-1 rounded-full border ${idx===step?"bg-finovo text-white border-finovo":"bg-white border-gray-200 text-gray-700"} whitespace-nowrap`}>
              {idx+1}. {s}
            </div>
          ))}
        </div>

        {err && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-2 text-sm">
            {err}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          {/* STEP 0: CLIENT */}
          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="font-semibold text-lg mb-2">Search client</h2>
                <SearchSelect
                  placeholder="Type name or email…"
                  valueLabel={(() => {
                    if (!clientId) return "";
                    const c = clients.find(x => x.id === clientId);
                    return c ? `${c.name}${c.email ? " · " + c.email : ""}` : "";
                  })()}
                  fetchOptions={async (term) => {
                    const rows = await searchClientsForActiveTenant(term);
                    return rows.map(r => ({
                      id: r.id,
                      label: r.name,
                      subLabel: r.email || r.phone || "",
                      data: r,
                    }));
                  }}
                  onSelect={(opt) => {
                    setClientId(opt.id);
                    // hydrate new form with picked (for consistency)
                    if (opt?.data) {
                      setNewClient({
                        name: opt.data.name || "",
                        email: opt.data.email || "",
                        phone: opt.data.phone || "",
                        billing_address: opt.data.billing_address || "",
                      });
                    }
                  }}
                  onCreate={(query) => {
                    // prefill the "new client" form and clear selection
                    setClientId("");
                    setNewClient(s => ({
                      ...s,
                      name: query,
                    }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">Pick existing. If nothing matches, click “Create …” to prefill.</p>
              </div>

              <div>
                <h2 className="font-semibold text-lg mb-2">New client (if needed)</h2>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className={label}>Name</label>
                    <input className={input} value={newClient.name} onChange={(e)=>setNewClient(s=>({...s, name:e.target.value}))}/>
                  </div>
                  <div>
                    <label className={label}>Email</label>
                    <input type="email" className={input} value={newClient.email} onChange={(e)=>setNewClient(s=>({...s, email:e.target.value}))}/>
                  </div>
                  <div>
                    <label className={label}>Phone</label>
                    <input className={input} value={newClient.phone} onChange={(e)=>setNewClient(s=>({...s, phone:e.target.value}))}/>
                  </div>
                  <div>
                    <label className={label}>Billing address</label>
                    <textarea rows="3" className={input} value={newClient.billing_address} onChange={(e)=>setNewClient(s=>({...s, billing_address:e.target.value}))}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: DETAILS */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={label}>Invoice number</label>
                <input className={input} value={details.number} onChange={(e)=>setDetails(d=>({...d, number:e.target.value}))}/>
              </div>
              <div>
                <label className={label}>Currency</label>
                <select
                  className={input}
                  value={details.currency}
                  onChange={(e)=>setDetails(d=>({...d, currency:e.target.value}))}
                >
                  {currencyList().map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Issue date</label>
                <input type="date" className={input} value={details.issue_date} onChange={(e)=>setDetails(d=>({...d, issue_date:e.target.value}))}/>
              </div>
              <div>
                <label className={label}>Due date</label>
                <input type="date" className={input} value={details.due_date} onChange={(e)=>setDetails(d=>({...d, due_date:e.target.value}))}/>
              </div>
            </div>
          )}

          {/* STEP 2: ITEMS */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-lg mb-2">Search saved items</h2>
                <SearchSelect
                  placeholder="Type item/service name…"
                  fetchOptions={async (term) => {
                    const rows = await searchCatalogForActiveTenant(term);
                    return rows.map(r => ({
                      id: r.id,
                      label: r.name,
                      subLabel: (r.unit ? `${r.unit} · ` : "") + Number(r.unit_price||0).toFixed(2),
                      data: r,
                    }));
                  }}
                  onSelect={(opt) => {
                    if (opt?.data) addCatalogLineFromRow(opt.data);
                  }}
                  onCreate={(query) => {
                    // Add an ad-hoc line with the typed description
                    setItems(arr => [...arr, { description: query, qty: 1, unit_price: 0 }]);
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">Pick from catalog or create an ad-hoc line instantly.</p>
              </div>

              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-6">
                    <label className={label}>Description</label>
                    <input className={input} value={it.description} onChange={(e)=>setItems(arr=>{
                      const c=[...arr]; c[idx].description=e.target.value; return c;
                    })}/>
                  </div>
                  <div className="md:col-span-2">
                    <label className={label}>Qty</label>
                    <input type="number" className={input} value={it.qty} onChange={(e)=>setItems(arr=>{
                      const c=[...arr]; c[idx].qty=e.target.value; return c;
                    })}/>
                  </div>
                  <div className="md:col-span-2">
                    <label className={label}>Unit price</label>
                    <input type="number" className={input} value={it.unit_price} onChange={(e)=>setItems(arr=>{
                      const c=[...arr]; c[idx].unit_price=e.target.value; return c;
                    })}/>
                  </div>
                  <div className="md:col-span-2">
                    <label className={label}>Line total</label>
                    <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                      {(Number(it.qty||0)*Number(it.unit_price||0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-gray-300 text-sm"
                  onClick={()=>setItems(arr=>[...arr, { description:"", qty:1, unit_price:0 }])}
                >
                  + Add line
                </button>
                {items.length>1 && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md border border-gray-300 text-sm"
                    onClick={()=>setItems(arr=>arr.slice(0,-1))}
                  >
                    Remove last
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={label}>Tax rate (%)</label>
                  <input type="number" className={input} value={taxRate} onChange={(e)=>setTaxRate(e.target.value)}/>
                </div>
                <div className="md:col-span-2">
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">Subtotal</div>
                      <div className="font-semibold">{totals.subtotal.toFixed(2)} {details.currency}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Tax</div>
                      <div className="font-semibold">{totals.tax_total.toFixed(2)} {details.currency}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total</div>
                      <div className="font-semibold">{totals.total.toFixed(2)} {details.currency}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: NOTES */}
          {step === 3 && (
            <div>
              <label className={label}>Notes (shown on invoice)</label>
              <textarea rows="6" className={input} value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Add payment instructions, bank details, etc."/>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-gray-200">
                  <div className="font-semibold mb-1">Client</div>
                  {clientId ? (
                    <div className="text-sm text-gray-700">
                      {(() => {
                        const c = clients.find(x => x.id === clientId);
                        if (!c) return "Selected client";
                        return (<>
                          <div>{c.name}</div>
                          {c.email && <div className="text-gray-500">{c.email}</div>}
                          {c.phone && <div className="text-gray-500">{c.phone}</div>}
                          {c.billing_address && <div className="text-gray-500 whitespace-pre-wrap">{c.billing_address}</div>}
                        </>);
                      })()}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700">
                      <div>{newClient.name || "Client"}</div>
                      {newClient.email && <div className="text-gray-500">{newClient.email}</div>}
                      {newClient.phone && <div className="text-gray-500">{newClient.phone}</div>}
                      {newClient.billing_address && <div className="text-gray-500 whitespace-pre-wrap">{newClient.billing_address}</div>}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg border border-gray-200">
                  <div className="font-semibold mb-1">Invoice details</div>
                  <div className="text-sm text-gray-700">
                    <div>Number: <span className="font-semibold">{details.number}</span></div>
                    <div>Issue date: {details.issue_date}</div>
                    <div>Due date: {details.due_date || "—"}</div>
                    <div>Currency: {details.currency}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-gray-500">
                    <tr>
                      <th className="text-left py-2 pr-3">Description</th>
                      <th className="text-right py-2 px-3">Qty</th>
                      <th className="text-right py-2 px-3">Unit</th>
                      <th className="text-right py-2 pl-3">Line</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-3">{it.description || <span className="text-gray-400">—</span>}</td>
                        <td className="py-2 px-3 text-right">{Number(it.qty||0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">{Number(it.unit_price||0).toFixed(2)}</td>
                        <td className="py-2 pl-3 text-right">
                          {(Number(it.qty||0)*Number(it.unit_price||0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {notes && (
                <div className="p-3 rounded-lg border border-gray-200">
                  <div className="font-semibold mb-1">Notes</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</div>
                </div>
              )}

              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Subtotal</div>
                  <div className="font-semibold">{totals.subtotal.toFixed(2)} {details.currency}</div>
                </div>
                <div>
                  <div className="text-gray-500">Tax</div>
                  <div className="font-semibold">{totals.tax_total.toFixed(2)} {details.currency}</div>
                </div>
                <div>
                  <div className="text-gray-500">Total</div>
                  <div className="font-semibold">{totals.total.toFixed(2)} {details.currency}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step===0}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              className="px-5 py-2 rounded-lg bg-finovo text-white hover:opacity-95"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreate}
              className="px-5 py-2 rounded-lg bg-finovo text-white hover:opacity-95"
            >
              Create invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
