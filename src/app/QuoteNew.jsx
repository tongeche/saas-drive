import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { listClients, createClient } from "../lib/clients";
import { createQuote, calculateLineItem } from "../lib/quotes";
import { listItems } from "../lib/items";

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (baseISO, days) => {
  const d = new Date(baseISO || todayISO());
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function QuoteNew() {
  const nav = useNavigate();
  const { tenant } = useOutletContext() || {};
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [createdQuote, setCreatedQuote] = useState(null);
  const [err, setErr] = useState("");

  // Check if we're coming back from preview with save action
  const { saveQuote, quoteData: savedQuoteData, client: savedClient } = location.state || {};

  // clients and items
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [availableItems, setAvailableItems] = useState([]);

  // quick add client (optional)
  const [qaOpen, setQaOpen] = useState(false);
  const [qa, setQa] = useState({ name: "", email: "", phone: "" });

  // quote fields
  const [validUntil, setValidUntil] = useState(addDaysISO(todayISO(), 30));
  const [currency, setCurrency] = useState("EUR");
  const [notes, setNotes] = useState("");

  // line items
  const [items, setItems] = useState([
    {
      description: "",
      unit: "each",
      qty: 1,
      unit_price: 0,
      tax_rate: 16,
      line_subtotal: 0,
      line_tax: 0,
      line_total: 0
    }
  ]);

  // Common items for quick selection
  const commonItems = [
    { description: "Website Development", unit: "hour", unit_price: 75, tax_rate: 16 },
    { description: "Web Design", unit: "hour", unit_price: 65, tax_rate: 16 },
    { description: "Consultation", unit: "hour", unit_price: 100, tax_rate: 16 },
    { description: "Project Management", unit: "hour", unit_price: 80, tax_rate: 16 },
    { description: "Logo Design", unit: "each", unit_price: 500, tax_rate: 16 },
    { description: "SEO Optimization", unit: "month", unit_price: 300, tax_rate: 16 },
    { description: "Content Writing", unit: "hour", unit_price: 45, tax_rate: 16 },
    { description: "Server Setup", unit: "each", unit_price: 200, tax_rate: 16 },
    { description: "Database Design", unit: "hour", unit_price: 85, tax_rate: 16 },
    { description: "API Development", unit: "hour", unit_price: 90, tax_rate: 16 }
  ];

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
        if (clientRows?.length) setClientId(clientRows[0].id);
        
        setAvailableItems(itemRows || []);

        // If coming back from preview, restore the quote data (but don't auto-save)
        if (savedQuoteData && savedClient && !saveQuote) {
          setClientId(savedClient.id);
          setValidUntil(savedQuoteData.valid_until);
          setCurrency(savedQuoteData.currency);
          setNotes(savedQuoteData.notes || "");
          setItems(savedQuoteData.items);
        }
      } catch (e) {
        setErr(e.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tenant?.id, savedQuoteData, savedClient]);

  // Calculate quote totals
  const quoteTotals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.line_subtotal || 0), 0);
    const tax_total = items.reduce((sum, item) => sum + (item.line_tax || 0), 0);
    const total = subtotal + tax_total;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax_total: Math.round(tax_total * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }, [items]);

  function updateItem(index, field, value) {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate line totals when qty, unit_price, or tax_rate changes
      if (['qty', 'unit_price', 'tax_rate'].includes(field)) {
        const { line_subtotal, line_tax, line_total } = calculateLineItem(
          updated[index].qty,
          updated[index].unit_price,
          updated[index].tax_rate
        );
        updated[index] = {
          ...updated[index],
          line_subtotal,
          line_tax,
          line_total
        };
      }
      
      return updated;
    });
  }

  function addItem() {
    setItems(prev => [...prev, {
      description: "",
      unit: "each",
      qty: 1,
      unit_price: 0,
      tax_rate: 16,
      line_subtotal: 0,
      line_tax: 0,
      line_total: 0
    }]);
  }

  function removeItem(index) {
    if (items.length <= 1) return; // Keep at least one item
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  function selectCommonItem(index, item) {
    updateItem(index, 'description', item.name || item.description);
    updateItem(index, 'unit', item.unit);
    updateItem(index, 'unit_price', item.unit_price);
    updateItem(index, 'tax_rate', item.tax_rate);
    
    // Recalculate totals
    const { line_subtotal, line_tax, line_total } = calculateLineItem(
      1, // Default qty
      item.unit_price,
      item.tax_rate
    );
    
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        qty: 1,
        line_subtotal,
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

  function handlePreview(e) {
    e.preventDefault();
    setErr("");
    if (!clientId) { setErr("Please select a client."); return; }
    if (items.every(item => !item.description.trim())) {
      setErr("Please add at least one item with a description.");
      return;
    }

    const selectedClient = clients.find(c => c.id === clientId);
    if (!selectedClient) { setErr("Selected client not found."); return; }

    const quoteData = {
      valid_until: validUntil,
      currency: currency.toUpperCase(),
      notes: notes || null,
      items: items.filter(item => item.description.trim())
    };

    nav("/app/quotes/preview", {
      state: {
        quoteData,
        tenant,
        client: selectedClient
      }
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!clientId) { setErr("Please select a client."); return; }
    if (items.every(item => !item.description.trim())) {
      setErr("Please add at least one item with a description.");
      return;
    }

    try {
      setSaving(true);
      const quote = await createQuote(tenant.id, clientId, {
        valid_until: validUntil,
        currency: currency.toUpperCase(),
        notes: notes || null,
        items: items.filter(item => item.description.trim()) // Only include items with descriptions
      });

      // Store the created quote and show thank you modal
      setCreatedQuote(quote);
      setShowThankYouModal(true);
      
      // Start the loading animation
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            // After loading is complete, navigate to preview
            setTimeout(() => {
              const selectedClient = clients.find(c => c.id === clientId);
              const quoteData = {
                id: quote.id, // Include the actual quote ID
                valid_until: validUntil,
                currency: currency.toUpperCase(),
                notes: notes || null,
                items: items.filter(item => item.description.trim()),
                number: quote.number || quote.id
              };

              nav("/app/quotes/preview", {
                state: {
                  quoteData,
                  tenant,
                  client: selectedClient,
                  isCreated: true // Flag to indicate this is a newly created quote
                }
              });
            }, 500);
            return 100;
          }
          return prev + 1;
        });
      }, 100); // 10 seconds total (100ms * 100 steps)

    } catch (e2) {
      setErr(e2.message || "Failed to create quote.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-black/70">Loading…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">New Quote</h1>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <div className="font-medium">Client</div>
            <button
              type="button"
              className="text-xs rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5 w-full sm:w-auto text-center"
              onClick={() => setQaOpen(v => !v)}
            >
              {qaOpen ? "Close" : "Quick add"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm text-black/70 mb-1">Select client</label>
              <select
                value={clientId}
                onChange={(e)=>setClientId(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2 bg-white text-sm sm:text-base"
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
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm sm:text-base"
                placeholder="EUR"
              />
            </div>
          </div>

          {qaOpen && (
            <div className="mt-4 rounded-lg border border-dashed border-black/10 p-3">
              <div className="text-xs text-black/60 mb-2">Quick add client</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm sm:text-base"
                  placeholder="Name"
                  value={qa.name}
                  onChange={(e)=>setQa(a=>({ ...a, name: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm sm:text-base"
                  placeholder="Email"
                  value={qa.email}
                  onChange={(e)=>setQa(a=>({ ...a, email: e.target.value }))}
                />
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm sm:text-base"
                    placeholder="Phone"
                    value={qa.phone}
                    onChange={(e)=>setQa(a=>({ ...a, phone: e.target.value }))}
                  />
                  <button onClick={onQuickAdd} className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5 whitespace-nowrap">
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Quote Details */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="font-medium mb-3">Quote Details</div>
          <div className="grid sm:grid-cols-2 gap-3">
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
              <label className="block text-sm text-black/70 mb-1">Status</label>
              <input
                value="Draft"
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
              placeholder="This quote is valid for 30 days. Terms and conditions apply."
            />
          </div>
        </section>

        {/* Line Items */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <div className="font-medium">Line Items</div>
            <button
              type="button"
              onClick={addItem}
              className="text-xs rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5 w-full sm:w-auto text-center"
            >
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="rounded-lg border border-black/10 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Item {index + 1}</div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                    <div className="lg:col-span-3">
                      <label className="block text-sm text-black/70 mb-1">Description</label>
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm sm:text-base"
                        placeholder="Item description..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-black/70 mb-1">Select Item</label>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedItem = availableItems[e.target.value];
                            selectCommonItem(index, selectedItem);
                            e.target.value = ""; // Reset select
                          }
                        }}
                        className="w-full rounded-lg border border-black/10 px-3 py-2 bg-white text-sm"
                      >
                        <option value="">Select from catalog...</option>
                        {availableItems.map((item, idx) => (
                          <option key={item.id} value={idx}>
                            {item.name} ({formatMoney(item.unit_price, currency)}/{item.unit})
                            {item.category && ` - ${item.category}`}
                          </option>
                        ))}
                      </select>
                      {availableItems.length === 0 && (
                        <div className="text-xs text-black/60 mt-1">
                          No items in catalog. <Link to="/app/items/new" className="text-emerald-600 hover:underline">Add some items</Link> first.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-sm text-black/70 mb-1">Unit</label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
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
                        onChange={(e) => updateItem(index, 'qty', e.target.value)}
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
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
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
                        onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
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

          {/* Quote Totals */}
          <div className="mt-6 border-t border-black/10 pt-4">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span>{formatMoney(quoteTotals.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tax Total:</span>
                  <span>{formatMoney(quoteTotals.tax_total, currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-black/10 pt-2">
                  <span>Total:</span>
                  <span>{formatMoney(quoteTotals.total, currency)}</span>
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
            👁️ Preview Quote
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm bg-emerald-600 text-white font-medium hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create quote"}
          </button>
        </div>
      </form>

      {/* Thank You Modal */}
      {showThankYouModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-auto text-center shadow-2xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Quote Created Successfully!</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Thank you for using Finovo's quote maker.
              </p>
            </div>

            {/* Loading Animation */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                Preparing your quote preview... {Math.round(loadingProgress)}%
              </p>
            </div>

            {/* Loading Spinner */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMoney(amount, currency="EUR") {
  try { return new Intl.NumberFormat(undefined, { style:"currency", currency }).format(Number(amount||0)); }
  catch { return `${currency} ${Number(amount||0).toFixed(2)}`; }
}
