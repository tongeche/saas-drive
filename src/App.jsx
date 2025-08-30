import React, { useEffect, useState } from "react";

export default function App() {
  const [tenants, setTenants] = useState([]);
  const [tenant, setTenant]   = useState(""); // slug
  const [result, setResult]   = useState("—");

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientUuid, setClientUuid] = useState("");

  const [lastInvoice, setLastInvoice] = useState({ id: "", number: "" });
  const [lastPdfUrl, setLastPdfUrl]   = useState("");

  // invoice form
  const [form, setForm] = useState({
    issue_date: "2025-09-01",
    due_date:   "2025-09-15",
    currency:   "EUR",
    subtotal:   "100",
    tax_total:  "23",
    total:      "123",
    notes:      "Thank you."
  });
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // create-client form
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    billing_address: "",
    notes: "",
    external_id: ""
  });
  const updateClient = (k) => (e) => setNewClient((c) => ({ ...c, [k]: e.target.value }));

  // load tenants from DB
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/.netlify/functions/list-tenants");
        const data = await res.json().catch(() => []);
        if (Array.isArray(data) && data.length) {
          setTenants(data);
          setTenant((t) => t || data[0].slug);
        } else {
          setTenants([]);
          setTenant("");
        }
      } catch (e) {
        setResult("Failed to load tenants");
      }
    })();
  }, []);

  // load clients when tenant changes
  useEffect(() => {
    if (!tenant) return;
    (async () => {
      try {
        setClientsLoading(true);
        const res = await fetch(`/.netlify/functions/list-clients?tenant=${tenant}`);
        const data = await res.json().catch(() => []);
        setClients(Array.isArray(data) ? data : []);
        setClientUuid("");
      } finally {
        setClientsLoading(false);
      }
    })();
  }, [tenant]);

  async function ping() {
    const res = await fetch(`/.netlify/functions/ping?tenant=${tenant}`);
    setResult(await res.text());
  }

  async function refreshClients() {
    const res = await fetch(`/.netlify/functions/list-clients?tenant=${tenant}`);
    const data = await res.json().catch(() => []);
    setClients(Array.isArray(data) ? data : []);
    setResult(`Loaded ${Array.isArray(data) ? data.length : 0} clients`);
  }

  async function createClient() {
    if (!tenant) { setResult("Choose a tenant first."); return; }
    if (!newClient.name.trim()) { setResult("Client name is required."); return; }

    try {
      const res = await fetch("/.netlify/functions/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant, client: newClient }),
      });
      const data = await res.json().catch(async () => ({ raw: await res.text() }));
      if (!res.ok) { setResult(JSON.stringify(data, null, 2)); return; }

      // append to list and select it
      setClients((cs) => [...cs, data]);
      setClientUuid(data.id);
      setResult(JSON.stringify({ created: data }, null, 2));

      // clear form (keep external_id if you like)
      setNewClient({ name: "", email: "", phone: "", billing_address: "", notes: "", external_id: "" });
    } catch (err) {
      setResult(`Error: ${err?.message || String(err)}`);
    }
  }

  async function createInvoice() {
    if (!tenant) { setResult("Choose a tenant first."); return; }
    if (!clientUuid) { setResult("Pick a client first."); return; }

    const payload = {
      tenant,
      client_uuid: clientUuid,
      issue_date: form.issue_date,
      due_date:   form.due_date,
      currency:   form.currency,
      subtotal:   Number(form.subtotal),
      tax_total:  Number(form.tax_total),
      total:      Number(form.total),
      notes:      form.notes,
      lines: [
        { description: "Service", qty: 1, unit_price: Number(form.subtotal), line_total: Number(form.subtotal) },
        { description: "Tax",     qty: 1, unit_price: Number(form.tax_total), line_total: Number(form.tax_total) }
      ]
    };
    try {
      const res = await fetch("/.netlify/functions/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(async () => ({ raw: await res.text() }));
      if (data?.id && data?.number) {
        setLastInvoice({ id: data.id, number: data.number });
        setLastPdfUrl("");
      }
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(`Error: ${err?.message || String(err)}`);
    }
  }

  async function ensureSignedPdf(invoiceHint = {}) {
    const body = { tenant, ...invoiceHint };
    if (!body.invoice_id && lastInvoice.id) body.invoice_id = lastInvoice.id;
    if (!body.invoice_number && lastInvoice.number) body.invoice_number = lastInvoice.number;
    if (!body.invoice_id && !body.invoice_number) {
      const number = window.prompt("Invoice number to generate:", "");
      if (!number) throw new Error("No invoice number provided.");
      body.invoice_number = number.trim();
    }
    const res = await fetch("/.netlify/functions/invoice-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(async () => ({ raw: await res.text() }));
    if (!res.ok) throw new Error(data?.error || "PDF failed");
    if (data?.signedUrl) setLastPdfUrl(data.signedUrl);
    return data;
  }

  async function sendPdf() {
    try {
      const data = await ensureSignedPdf();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(`Error: ${err?.message || String(err)}`);
    }
  }

  function sanitizePhone(p){ return String(p||"").replace(/[^\d]/g,""); }

  async function shareWhatsApp() {
    try {
      const data = await ensureSignedPdf();

      const selected = clients.find(c => c.id === clientUuid);
      let phone = sanitizePhone(selected?.phone);
      if (!phone) {
        const input = window.prompt("WhatsApp phone (international, e.g. 254700000000):", "");
        phone = sanitizePhone(input || "");
      }

      const tenantName = tenants.find(x => x.slug === tenant)?.business_name || tenant;
      const msg =
        `Invoice ${data.number} from ${tenantName}\n` +
        `Total: ${form.total} ${form.currency}\n` +
        `Due: ${form.due_date}\n` +
        `PDF: ${data.signedUrl}`;

      const base = phone ? `https://wa.me/${phone}` : `https://wa.me/`;
      const url = `${base}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank", "noopener,noreferrer");

      setResult(JSON.stringify({ action: "whatsapp", to: phone || "(choose in WhatsApp)", number: data.number, link: url }, null, 2));
    } catch (err) {
      setResult(`Error: ${err?.message || String(err)}`);
    }
  }

  async function emailInvoice() {
    try {
      const body = { tenant };
      if (lastInvoice.id) body.invoice_id = lastInvoice.id;
      if (lastInvoice.number) body.invoice_number = lastInvoice.number;
      if (!body.invoice_id && !body.invoice_number) {
        const number = window.prompt("Invoice number:", "");
        if (!number) { setResult("No invoice number provided."); return; }
        body.invoice_number = number.trim();
      }
      const to = window.prompt("Send to email (blank = use client's email):", "");
      if (to) body.to_email = to.trim();

      const res = await fetch("/.netlify/functions/email-invoice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(async () => ({ raw: await res.text() }));
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(`Error: ${err?.message || String(err)}`);
    }
  }

  return (
    <div style={{maxWidth: 900, margin: "40px auto", fontFamily: "system-ui, sans-serif"}}>
      <h1>Back Office</h1>

      {/* Tenant selector (from DB) */}
      <label>
        Tenant:&nbsp;
        <select value={tenant} onChange={e => setTenant(e.target.value)}>
          {tenants.map(t => <option key={t.id} value={t.slug}>{t.business_name || t.slug}</option>)}
        </select>
      </label>

      {/* Client selector */}
      <div style={{ marginTop: 12 }}>
        <label>
          Client:&nbsp;
          <select
            value={clientUuid}
            onChange={(e) => setClientUuid(e.target.value)}
            disabled={!tenant || clientsLoading || clients.length === 0}
          >
            <option value="">{clientsLoading ? "Loading…" : clients.length ? "— select —" : "No clients found"}</option>
            {clients.map(c =>
              <option key={c.id} value={c.id}>
                {c.name} {c.email ? `(${c.email})` : ""} {c.phone ? `— ${c.phone}` : ""}
              </option>
            )}
          </select>
        </label>
        <button style={{ marginLeft: 8 }} onClick={refreshClients}>Refresh</button>
      </div>

      {lastInvoice.number && (
        <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
          Last invoice: <strong>{lastInvoice.number}</strong>
        </div>
      )}

      {/* Create Client form */}
      <fieldset style={{ marginTop: 16, padding: 12, border: "1px solid #eaecef", borderRadius: 6 }}>
        <legend>Add Client</legend>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
          <input placeholder="Name *" value={newClient.name} onChange={updateClient("name")} />
          <input placeholder="Email"   value={newClient.email} onChange={updateClient("email")} />
          <input placeholder="Phone (e.g. 254700000000)" value={newClient.phone} onChange={updateClient("phone")} />
          <input placeholder="External ID (optional)" value={newClient.external_id} onChange={updateClient("external_id")} />
          <input placeholder="Billing address" value={newClient.billing_address} onChange={updateClient("billing_address")} />
          <input placeholder="Notes" value={newClient.notes} onChange={updateClient("notes")} />
        </div>
        <button style={{ marginTop: 10 }} onClick={createClient}>Create Client</button>
      </fieldset>

      {/* Invoice fields */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:16}}>
        <input placeholder="issue_date YYYY-MM-DD" value={form.issue_date} onChange={update("issue_date")} />
        <input placeholder="due_date YYYY-MM-DD"   value={form.due_date}   onChange={update("due_date")} />
        <input placeholder="currency"  value={form.currency}  onChange={update("currency")} />
        <input placeholder="subtotal"  value={form.subtotal} onChange={update("subtotal")} />
        <input placeholder="tax_total" value={form.tax_total} onChange={update("tax_total")} />
        <input placeholder="total"     value={form.total}     onChange={update("total")} />
        <input placeholder="notes"     value={form.notes}     onChange={update("notes")} />
      </div>

      {/* Actions */}
      <div style={{display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap"}}>
        <button onClick={ping}>Ping</button>
        <button onClick={createInvoice} disabled={!clientUuid}>Create Invoice (Supabase)</button>
        <button onClick={sendPdf} disabled={!lastInvoice.id && !lastInvoice.number}>Generate PDF / Link</button>
        <button onClick={shareWhatsApp} disabled={!lastInvoice.id && !lastInvoice.number}>Share via WhatsApp</button>
        <button onClick={emailInvoice} disabled={!lastInvoice.id && !lastInvoice.number}>Email Invoice</button>
      </div>

      {/* Quick link to latest generated PDF */}
      {lastPdfUrl && (
        <div style={{marginTop:12}}>
          <a href={lastPdfUrl} target="_blank" rel="noopener noreferrer">Open latest PDF</a>
        </div>
      )}

      <pre style={{background:"#f6f8fa", padding:16, marginTop:16, border:"1px solid #eaecef", borderRadius:6, whiteSpace:"pre-wrap"}}>
        {String(result)}
      </pre>
    </div>
  );
}
