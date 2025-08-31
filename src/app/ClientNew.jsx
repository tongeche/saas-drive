import React, { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { createClient } from "../lib/clients";

export default function ClientNew() {
  const nav = useNavigate();
  const { tenant } = useOutletContext() || {};

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!tenant?.id) { setErr("No active tenant."); return; }

    const name = (form.name || "").trim();
    if (!name) { setErr("Client name is required."); return; }

    try {
      setSaving(true);
      await createClient(tenant.id, {
        name,
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
      });
      nav("/app", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Failed to create client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Add Client</h1>
        <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5">
          Cancel
        </Link>
      </div>

      {err && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-black/70 mb-1">Client name</label>
              <input
                value={form.name}
                onChange={(e)=>setField("name", e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="Acme Inc."
                required
              />
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e)=>setField("email", e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="billing@acme.test"
              />
            </div>
            <div>
              <label className="block text-sm text-black/70 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e)=>setField("phone", e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="+351 912 345 678"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <Link to="/app" className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 bg-white hover:bg-black/5">Cancel</Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm bg-finovo text-white font-medium hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create client"}
          </button>
        </div>
      </form>
    </div>
  );
}
