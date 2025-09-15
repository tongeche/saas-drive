import React, { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { createItem } from "../lib/items";

export default function ItemNew() {
  const nav = useNavigate();
  const { tenant } = useOutletContext() || {};

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Item fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitOfMeasurement, setUnitOfMeasurement] = useState("each");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [taxRate, setTaxRate] = useState(16);
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [isService, setIsService] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    
    if (!name.trim()) {
      setErr("Item name is required.");
      return;
    }

    try {
      setSaving(true);
      await createItem(tenant.id, {
        name: name.trim(),
        description: description.trim() || null,
        unit_of_measurement: unitOfMeasurement,
        default_price: Number(defaultPrice) || 0,
        tax_rate: Number(taxRate) || 0,
        category: category.trim() || null,
        sku: sku.trim() || null,
        is_service: isService
      });
      nav("/app/items", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Failed to create item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Add New Item</h1>
        <Link to="/app/items" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5 w-full sm:w-auto text-center">Cancel</Link>
      </div>

      {err && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="font-medium mb-3">Item Details</div>
          
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-black/70 mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2"
                  placeholder="e.g., Website Development, Logo Design"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-black/70 mb-1">SKU / Item Code</label>
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2"
                  placeholder="e.g., WEB-DEV-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-black/70 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="Detailed description of the item or service..."
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-black/70 mb-1">Unit</label>
                <select
                  value={unitOfMeasurement}
                  onChange={(e) => setUnitOfMeasurement(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 bg-white text-sm sm:text-base"
                >
                  <option value="each">Each</option>
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="kg">Kilogram</option>
                  <option value="lbs">Pounds</option>
                  <option value="meter">Meter</option>
                  <option value="foot">Foot</option>
                  <option value="liter">Liter</option>
                  <option value="gallon">Gallon</option>
                  <option value="piece">Piece</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-black/70 mb-1">Default Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm sm:text-base"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm text-black/70 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm text-black/70 mb-1">Category</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2"
                  placeholder="e.g., Services, Products"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isService"
                checked={isService}
                onChange={(e) => setIsService(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isService" className="ml-2 text-sm text-black/70">
                This is a service (not a physical product)
              </label>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <Link to="/app/items" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5 text-center">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm bg-emerald-600 text-white font-medium hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
