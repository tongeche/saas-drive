import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { listClients, createClient } from "../lib/clients";
import { listItems } from "../lib/items";
import { createQuotation, calculateQuotationLineItem } from "../lib/quotations";

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (baseISO, days) => {
  const d = new Date(baseISO || todayISO());
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function QuotationNew() {
  const nav = useNavigate();
  const { tenant } = useOutletContext() || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // clients and items
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [clientId, setClientId] = useState("");

  // quick add client (optional)
  const [qaOpen, setQaOpen] = useState(false);
  const [qa, setQa] = useState({ name: "", email: "", phone: "" });

  // quotation fields
  const [validUntil, setValidUntil] = useState(addDaysISO(todayISO(), 30));
  const [currency, setCurrency] = useState("EUR");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [discountRate, setDiscountRate] = useState(0);

  // line items
  const [lineItems, setLineItems] = useState([
    {
      item_id: null,
      description: "",
      unit: "each",
      qty: 1,
      unit_price: 0,
      tax_rate: 16,
      discount_rate: 0,
      line_subtotal: 0,
      line_discount: 0,
      line_tax: 0,
      line_total: 0
    }
  ]);

  useEffect(() => {
    if (!tenant?.id) return;
    setCurrency((tenant.currency || "EUR").toUpperCase());
    (async () => {
      try {
        const [clientRows, itemRows] = await Promise.all([
          listClients(tenant.id),
          listItems(tenant.id)
        ]);
        
        setClients(clientRows || []);
        setItems(itemRows || []);
        if (clientRows?.length) setClientId(clientRows[0].id);
      } catch (e) {
        setErr(e.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tenant?.id]);

  // Calculate quotation totals
  const quotationTotals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.line_subtotal || 0), 0);
    const item_discount = lineItems.reduce((sum, item) => sum + (item.line_discount || 0), 0);
    const global_discount = (subtotal - item_discount) * (Number(discountRate) || 0) / 100;
    const total_discount = item_discount + global_discount;
    const tax_total = lineItems.reduce((sum, item) => sum + (item.line_tax || 0), 0);
    const total = subtotal - total_discount + tax_total;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      item_discount: Math.round(item_discount * 100) / 100,
      global_discount: Math.round(global_discount * 100) / 100,
      total_discount: Math.round(total_discount * 100) / 100,
      tax_total: Math.round(tax_total * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }, [lineItems, discountRate]);

  function updateLineItem(index, field, value) {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate line totals when qty, unit_price, tax_rate, or discount_rate changes
      if (['qty', 'unit_price', 'tax_rate', 'discount_rate'].includes(field)) {
        const { line_subtotal, line_discount, line_tax, line_total } = calculateQuotationLineItem(
          updated[index].qty,
          updated[index].unit_price,
          updated[index].tax_rate,
          updated[index].discount_rate
        );
        updated[index] = {
          ...updated[index],
          line_subtotal,
          line_discount,
          line_tax,
          line_total
        };
      }
      
      return updated;
    });
  }

  function addLineItem() {
    setLineItems(prev => [...prev, {
      item_id: null,
      description: "",
      unit: "each",
      qty: 1,
      unit_price: 0,
      tax_rate: 16,
      discount_rate: 0,
      line_subtotal: 0,
      line_discount: 0,
      line_tax: 0,
      line_total: 0
    }]);
  }

  function removeLineItem(index) {
    if (lineItems.length <= 1) return; // Keep at least one item
    setLineItems(prev => prev.filter((_, i) => i !== index));
  }

  function selectCatalogItem(index, selectedItem) {
    if (!selectedItem) return;
    
    updateLineItem(index, 'item_id', selectedItem.id);
    updateLineItem(index, 'description', selectedItem.name);
    updateLineItem(index, 'unit', selectedItem.unit);
    updateLineItem(index, 'unit_price', selectedItem.price);
    updateLineItem(index, 'tax_rate', selectedItem.tax_rate);
    
    // Recalculate totals
    const { line_subtotal, line_discount, line_tax, line_total } = calculateQuotationLineItem(
      1, // Default qty
      selectedItem.price,
      selectedItem.tax_rate,
      0 // No discount by default
    );
    
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        qty: 1,
        line_subtotal,
        line_discount,
        line_tax,
        line_total
      };
      return updated;
    });
  }

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
    if (lineItems.every(item => !item.description.trim())) {
      setErr("Please add at least one item with a description.");
      return;
    }

    try {
      setSaving(true);
      await createQuotation(tenant.id, clientId, {
        valid_until: validUntil,
        currency: currency.toUpperCase(),
        notes: notes || null,
        terms: terms || null,
        discount_rate: Number(discountRate) || 0,
        items: lineItems.filter(item => item.description.trim()) // Only include items with descriptions
      });
      nav("/app", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Failed to create quotation.");
    } finally {
      setSaving(false);
    }
  }

  function handlePreview(e) {
    e.preventDefault();
    setErr("");
    if (!clientId) { setErr("Please select a client."); return; }
    if (lineItems.every(item => !item.description.trim())) {
      setErr("Please add at least one item with a description.");
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) { setErr("Client not found."); return; }

    const today = new Date().toISOString().slice(0, 10);
    const quotationData = {
      number: `QUO-${Date.now()}`, // Temporary number for preview
      date: today,
      valid_until: validUntil,
      currency: currency.toUpperCase(),
      notes: notes || null,
      terms: terms || null,
      discount_rate: Number(discountRate) || 0,
      items: lineItems.filter(item => item.description.trim())
    };

    nav("/app/quotations/preview", {
      state: {
        quotationData,
        tenant,
        client,
        isCreated: false
      }
    });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-black/70">Loading…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">New Quotation</h1>
        <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5 w-full sm:w-auto text-center">Cancel</Link>
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
            <div className="font-medium">Client Information</div>
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
                <option value="">Select a client...</option>
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

        {/* Quotation Details */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="font-medium mb-3">Quotation Details</div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-black/70 mb-1">Valid until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e)=>setValidUntil(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Global Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discountRate}
                onChange={(e)=>setDiscountRate(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Status</label>
              <input
                value="Draft"
                readOnly
                className="w-full rounded-lg border border-black/10 px-3 py-2 bg-gray-50"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm text-black/70 mb-1">Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e)=>setNotes(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="Additional notes or special instructions..."
              />
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Terms & Conditions</label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e)=>setTerms(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="Payment terms, delivery conditions, warranty..."
              />
            </div>
          </div>
        </section>

        {/* Line Items */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Line Items</div>
            <div className="flex gap-2">
              <Link 
                to="/app/items/new" 
                className="text-xs rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5"
              >
                Add Item to Catalog
              </Link>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5"
              >
                Add Line Item
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={index} className="rounded-lg border border-black/10 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Item {index + 1}</div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                    <div className="lg:col-span-2">
                      <label className="block text-sm text-black/70 mb-1">Description</label>
                      <input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="w-full rounded-lg border border-black/10 px-3 py-2"
                        placeholder="Item description..."
                      />
                    </div>
                    
                    <div className="lg:col-span-2">
                      <label className="block text-sm text-black/70 mb-1">Select from Catalog</label>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedItem = items.find(item => item.id === e.target.value);
                            selectCatalogItem(index, selectedItem);
                            e.target.value = ""; // Reset select
                          }
                        }}
                        className="w-full rounded-lg border border-black/10 px-3 py-2 bg-white text-sm"
                      >
                        <option value="">Select from catalog...</option>
                        {items.map((catalogItem) => (
                          <option key={catalogItem.id} value={catalogItem.id}>
                            {catalogItem.name} ({formatMoney(catalogItem.price, currency)}/{catalogItem.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
                    <div>
                      <label className="block text-sm text-black/70 mb-1">Unit</label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                        className="w-full rounded-lg border border-black/10 px-3 py-2 bg-white text-sm"
                      >
                        <option value="each">Each</option>
                        <option value="hour">Hour</option>
                        <option value="day">Day</option>
                        <option value="month">Month</option>
                        <option value="kg">Kg</option>
                        <option value="meter">Meter</option>
                        <option value="liter">Liter</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-black/70 mb-1">Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.qty}
                        onChange={(e) => updateLineItem(index, 'qty', e.target.value)}
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black/70 mb-1">Unit Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black/70 mb-1">Discount %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discount_rate}
                        onChange={(e) => updateLineItem(index, 'discount_rate', e.target.value)}
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black/70 mb-1">Tax %</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.tax_rate}
                        onChange={(e) => updateLineItem(index, 'tax_rate', e.target.value)}
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black/70 mb-1">Subtotal</label>
                      <input
                        type="text"
                        value={formatMoney(item.line_subtotal, currency)}
                        readOnly
                        className="w-full rounded-lg border border-black/10 px-3 py-2 bg-gray-50 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black/70 mb-1">Total</label>
                      <input
                        type="text"
                        value={formatMoney(item.line_total, currency)}
                        readOnly
                        className="w-full rounded-lg border border-black/10 px-3 py-2 bg-gray-50 text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quotation Totals */}
          <div className="mt-6 border-t border-black/10 pt-4">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span>{formatMoney(quotationTotals.subtotal, currency)}</span>
                </div>
                {quotationTotals.item_discount > 0 && (
                  <div className="flex justify-between text-sm mb-2 text-green-600">
                    <span>Item Discounts:</span>
                    <span>-{formatMoney(quotationTotals.item_discount, currency)}</span>
                  </div>
                )}
                {quotationTotals.global_discount > 0 && (
                  <div className="flex justify-between text-sm mb-2 text-green-600">
                    <span>Global Discount ({discountRate}%):</span>
                    <span>-{formatMoney(quotationTotals.global_discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mb-2">
                  <span>Tax Total:</span>
                  <span>{formatMoney(quotationTotals.tax_total, currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-black/10 pt-2">
                  <span>Total:</span>
                  <span>{formatMoney(quotationTotals.total, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5 text-center">Cancel</Link>
          <button
            type="button"
            onClick={handlePreview}
            className="rounded-lg px-4 py-2 text-sm bg-blue-600 text-white font-medium hover:opacity-95"
          >
            👁️ Preview Quotation
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm bg-emerald-600 text-white font-medium hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create Quotation"}
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
