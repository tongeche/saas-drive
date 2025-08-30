import { supaAdmin } from "./_supa.js";

export async function handler(event) {
  try {
    const q = new URLSearchParams(event.rawQuery || "");
    const slug = (q.get("tenant") || "").trim();
    const id   = (q.get("id") || "").trim();
    const num  = (q.get("number") || "").trim();
    if (!slug) return bad("missing tenant");

    const supa = supaAdmin();
    const t = await supa.from("tenants").select("id,slug").eq("slug", slug).limit(1).single();
    if (t.error || !t.data) return bad("tenant not found");
    const tid = t.data.id;

    const A = await supa.from("invoices").select("id,tenant_id,number").eq("tenant_id", tid).eq("id", id).limit(1);
    const B = await supa.from("invoices").select("id,tenant_id,number").eq("tenant_id", tid).eq("number", num).limit(1);
    const C = await supa.from("invoices").select("id,tenant_id,number").eq("id", id).limit(1);
    const D = await supa.from("invoices").select("id,tenant_id,number").eq("number", num).limit(1);

    const recent = await supa.from("invoices")
      .select("id,number,tenant_id,created_at").eq("tenant_id", tid)
      .order("created_at", { ascending: false }).limit(5);

    return ok({
      inputs: { slug, id, number: num, tenant_id: tid },
      A_tenant_id_and_id: A.data,
      B_tenant_id_and_number: B.data,
      C_id_only: C.data,
      D_number_only: D.data,
      recent: recent.data
    });
  } catch (e) {
    return bad(e.message || "error");
  }
}
function ok(b){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}}
function bad(m){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:m})}}
