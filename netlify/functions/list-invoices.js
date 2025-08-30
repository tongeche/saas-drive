import { supaAdmin } from "./_supa.js";

export async function handler(event) {
  try {
    const slug = (event.queryStringParameters?.tenant || "").trim();
    if (!slug) return bad("missing tenant");
    const supa = supaAdmin();

    const { data: t, error: tErr } = await supa
      .from("tenants").select("id, slug").eq("slug", slug).single();
    if (tErr || !t) return bad("tenant not found");

    const { data, error } = await supa
      .from("invoices")
      .select("id, number, client_id, created_at")
      .eq("tenant_id", t.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return bad(error.message);
    return ok({ tenant: t, invoices: data || [] });
  } catch (e) { return bad(e.message); }
}

function ok(b){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}}
function bad(m){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:m})}}
