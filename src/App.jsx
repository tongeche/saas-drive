import React, { useEffect, useMemo, useState } from "react";
import supabase from "./lib/supabase";
import Onboard from "./Onboard";
import TenantProfile from "./TenantProfile";
import { loadMyTenants, getActiveTenant, saveActiveTenant } from "./lib/tenantState";
import { listClients, createClient as apiCreateClient } from "./lib/clients";
import { createInvoice as apiCreateInvoice, sendInvoicePdf } from "./lib/invoices";
import { whatsappShareLink } from "./lib/share";

export default function App() {
  // auth session (for header only)
  const [session, setSession] = useState(null);

  // tenants + active + settings panel
  const [tenants, setTenants] = useState([]);
  const [tenant, setTenant] = useState(getActiveTenant());
  const [showSettings, setShowSettings] = useState(false);

  // clients
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");

  // invoice form
  const today = new Date().toISOString().slice(0, 10);
  const [inv, setInv] = useState({
    issue_date: today,
    due_date: today,
    currency: "KES",
    subtotal: 100,
    tax_total: 23,
    total: 123,
    notes: "Thank you.",
  });

  const [lastInvoice, setLastInvoice] = useState(null); // {id, number}
  const [result, setResult] = useState("—");

  // bootstrap: auth + tenants
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));

    (async () => {
      try {
        const t = await loadMyTenants();
        setTenants(t);
        if (!tenant && t.length) {
          setTenant(t[0]);
          saveActiveTenant(t[0]);
        } else if (tenant) {
          const found = t.find((x) => x.id === tenant.id) || t.find((x) => x.slug === tenant.slug);
          if (found) {
            setTenant(found);
            saveActiveTenant(found);
          }
        }
      } catch (e) {
        setResult(`Tenants error: ${e.message}`);
      }
    })();
  }, []);

  // load clients for active tenant
  useEffect(() => {
    if (!tenant?.id) {
      setClients([]);
      setClientId("");
      return;
    }
    (async () => {
      try {
        const rows = await listClients(tenant.id);
        setClients(rows);
        if (rows.length) setClientId(rows[0].id);
      } catch (e) {
        setResult(`Clients error: ${e.message}`);
      }
    })();
  }, [tenant?.id]);

  function onTenantChange(e) {
    const id = e.target.value;
    const t = tenants.find((x) => x.id === id);
    setTenant(t || null);
    saveActiveTenant(t || null);
    setLastInvoice(null);
    setResult("—");
  }

  function setInvField(k) {
    return (e) => {
      const v = e.target.value;
      setInv((s) => ({ ...s, [k]: ["subtotal", "tax_total", "total"].includes(k) ? Number(v) : v }));
    };
  }

  async function refreshClients() {
    if (!tenant?.id) return;
    const rows = await listClients(tenant.id);
    setClients(rows);
  }

  async function addClient(e) {
    e.preventDefault();
    if (!tenant?.id) return;
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name")?.trim(),
      email: form.get("email")?.trim() || null,
      phone: form.get("phone")?.trim() || null,
      billing_address: form.get("address")?.trim() || null,
      notes: form.get("notes")?.trim() || null,
    };
    if (!payload.name) {
      setResult("Client name required");
      return;
    }
    try {
      const c = await apiCreateClient(tenant.id, payload);
      await refreshClients();
      setClientId(c.id);
      setResult(`Client created: ${c.name}`);
      e.currentTarget.reset();
    } catch (e) {
      setResult(`Create client error: ${e.message}`);
    }
  }

  async function createInvoice() {
    if (!tenant?.id) return setResult("Pick a tenant");
    if (!clientId) return setResult("Pick a client");
    try {
      const row = await apiCreateInvoice(tenant.id, clientId, inv);
      setLastInvoice({ id: row.id, number: row.number });
      setResult(`Invoice created: ${row.number}`);
    } catch (e) {
      setResult(`Create invoice error: ${e.message}`);
    }
  }

  async function sendPdf() {
    if (!tenant?.slug) return setResult("Pick a tenant");
    const number = lastInvoice?.number;
    if (!number) return setResult("Create an invoice first");
    try {
      const out = await sendInvoicePdf(tenant.slug, number);
      setResult(JSON.stringify(out, null, 2));
    } catch (e) {
      setResult(`PDF error: ${e.message}`);
    }
  }

  const waLink = useMemo(() => {
    if (!lastInvoice?.number) return null;
    try {
      const parsed = JSON.parse(result || "{}");
      const link = parsed.qrLink || parsed.signedUrl || "";
      if (!link) return null;
      return whatsappShareLink(lastInvoice.number, link);
    } catch {
      return null;
    }
  }, [lastInvoice?.number, result]);

  // If no tenants yet → show Onboarding
  if ((tenants?.length || 0) === 0) {
    return (
      <div style={{ maxWidth: 980, margin: "24px auto", fontFamily: "system-ui, sans-serif" }}>
        {session ? (
          <p style={{ opacity: 0.7 }}>Signed in as <code>{session.user?.email}</code></p>
        ) : (
          <p style={{ color: "#b00" }}>Not signed in.</p>
        )}
        <Onboard
          onDone={(t) => {
            // adopt the returned tenant immediately
            const next = [t];
            setTenants(next);
            setTenant(t);
            saveActiveTenant(t);
            setShowSettings(true); // jump to settings after creation
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Back Office</h1>
      {session ? (
        <p style={{ opacity: 0.7 }}>
          Signed in as <code>{session.user?.email}</code>
        </p>
      ) : (
        <p style={{ color: "#b00" }}>Not signed in.</p>
      )}

      {/* Tenant selector + Settings */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}>
        <label>Active Tenant:&nbsp;</label>
        <select value={tenant?.id || ""} onChange={onTenantChange}>
          <option value="">— select —</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.business_name}
            </option>
          ))}
        </select>
        <button onClick={() => setShowSettings((v) => !v)}>
          {showSettings ? "Hide Settings" : "Tenant Settings"}
        </button>
        {lastInvoice?.number && (
          <span style={{ marginLeft: 12, opacity: 0.7 }}>
            Last invoice: <b>{lastInvoice.number}</b>
          </span>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && tenant?.id && (
        <TenantProfile
          tenantId={tenant.id}
          onUpdated={(updated) => {
            // refresh local tenant state after save
            const nextTenants = tenants.map((t) => (t.id === updated.id ? { ...t, ...updated } : t));
            setTenants(nextTenants);
            const nextActive = nextTenants.find((t) => t.id === tenant.id) || tenant;
            setTenant(nextActive);
            saveActiveTenant(nextActive);
          }}
        />
      )}

      {/* Client picker + refresh */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
        <label>Client:&nbsp;</label>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={{ minWidth: 260 }}>
          <option value="">— select —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.email ? `(${c.email})` : ""}
            </option>
          ))}
        </select>
        <button onClick={refreshClients}>Refresh Clients</button>
      </div>

      {/* Add client form */}
      <fieldset style={{ padding: 12, border: "1px solid #ddd", borderRadius: 6, margin: "12px 0" }}>
        <legend>Add Client</legend>
        <form onSubmit={addClient} style={{ display: "grid", gridTemplateColumns: "2fr 2fr", gap: 8 }}>
          <input name="name" placeholder="Name *" required />
          <input name="email" placeholder="Email" />
          <input name="phone" placeholder="Phone" />
          <input name="address" placeholder="Billing address" />
          <input name="notes" placeholder="Notes" />
          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit">Create Client</button>
          </div>
        </form>
      </fieldset>

      {/* Invoice form */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input value={inv.issue_date} onChange={setInvField("issue_date")} placeholder="issue_date YYYY-MM-DD" />
        <input value={inv.due_date} onChange={setInvField("due_date")} placeholder="due_date YYYY-MM-DD" />
        <input value={inv.currency} onChange={setInvField("currency")} placeholder="currency" />
        <input value={inv.subtotal} onChange={setInvField("subtotal")} placeholder="subtotal" />
        <input value={inv.tax_total} onChange={setInvField("tax_total")} placeholder="tax_total" />
        <input value={inv.total} onChange={setInvField("total")} placeholder="total" />
        <input
          value={inv.notes}
          onChange={setInvField("notes")}
          placeholder="notes"
          style={{ gridColumn: "1 / -1" }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={createInvoice}>Create Invoice (Supabase)</button>
        <button onClick={sendPdf}>Send Invoice (PDF)</button>
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer">
            <button type="button">Share on WhatsApp</button>
          </a>
        )}
      </div>

      <pre
        style={{
          background: "#f6f8fa",
          padding: 12,
          marginTop: 12,
          border: "1px solid #eaecef",
          borderRadius: 6,
          whiteSpace: "pre-wrap",
        }}
      >
        {String(result)}
      </pre>
    </div>
  );
}
