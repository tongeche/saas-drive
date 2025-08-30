import { supaAdmin } from "./_supa.js";

function sanitizePhone(p){ return String(p||"").replace(/[^\d]/g,""); }
function nonEmpty(s){ return (s ?? "").toString().trim(); }

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const b = JSON.parse(event.body || "{}");
    const tenantSlug = nonEmpty(b.tenant);
    const c = b.client || {};
    const name = nonEmpty(c.name);
    const email = nonEmpty(c.email);
    const phone = sanitizePhone(c.phone);
    const billing_address = nonEmpty(c.billing_address);
    const notes = nonEmpty(c.notes);
    const external_id = nonEmpty(c.external_id);

    if (!tenantSlug) return bad("missing tenant");
    if (!name) return bad("client.name is required");

    const supa = supaAdmin();

    // tenant lookup
    const t = await supa.from("tenants").select("id,slug").eq("slug", tenantSlug).limit(1).single();
    if (t.error || !t.data) return bad("tenant not found");
    const tenant_id = t.data.id;

    // choose upsert key
    let onConflict = null;
    if (external_id) onConflict = "tenant_id,external_id";
    else if (email) onConflict = "tenant_id,email";

    const payload = { tenant_id, name, email: email || null, phone: phone || null, billing_address, notes, external_id: external_id || null };

    let q;
    if (onConflict) {
      q = await supa.from("clients").upsert(payload, { onConflict, ignoreDuplicates: false }).select("id, name, email, phone, billing_address, notes");
    } else {
      q = await supa.from("clients").insert(payload).select("id, name, email, phone, billing_address, notes");
    }

    if (q.error) return bad(q.error.message);
    const row = (q.data || [])[0];
    if (!row) return bad("insert/upsert returned no row");
    return ok(row);
  } catch (e) {
    return bad(e.message || "error");
  }
}

function ok(b){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}}
function bad(m){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:m})}}
