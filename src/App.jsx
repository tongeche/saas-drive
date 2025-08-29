import React, { useState } from "react";

const tenants = [
  { slug: "acme-co", name: "Acme Co Ltd" },
  { slug: "blue-cafe", name: "Blue Café" }
];

export default function App() {
  const [tenant, setTenant] = useState(tenants[0].slug);
  const [result, setResult] = useState("—");

  async function ping() {
    const res = await fetch(`/.netlify/functions/ping?tenant=${tenant}`);
    const txt = await res.text();
    setResult(txt);
  }

  async function listClients() {
    const res = await fetch(`/.netlify/functions/list-clients?tenant=${tenant}`);
    const data = await res.json().catch(() => []);
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <div style={{maxWidth: 720, margin: "40px auto", fontFamily: "system-ui, sans-serif"}}>
      <h1>Drive-based Back Office (MVP)</h1>
      <p>Select tenant and call a function. Replace function stubs with Google Sheets later.</p>

      <label>
        Tenant:&nbsp;
        <select value={tenant} onChange={e => setTenant(e.target.value)}>
          {tenants.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}
        </select>
      </label>

      <div style={{display: "flex", gap: 8, marginTop: 16}}>
        <button onClick={ping}>Ping Function</button>
        <button onClick={listClients}>List Clients (stub)</button>
      </div>

      <pre style={{background:"#f6f8fa", padding:16, marginTop:16, border:"1px solid #eaecef", borderRadius:6, whiteSpace:"pre-wrap"}}>
        {String(result)}
      </pre>
    </div>
  );
}
