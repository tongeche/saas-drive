import { supaAdmin } from "./_supa.js";

export async function handler(event) {
  try {
    const slug = (event.queryStringParameters?.tenant || "").trim();
    if (!slug) return bad("missing tenant");
    const supa = supaAdmin();

    const t = await supa.from("tenants")
      .select("id, slug").eq("slug", slug).limit(1).single();
    if (t.error || !t.data) return bad("tenant not found");

    const q = await supa.from("clients")
      .select("id, name, email, phone")
      .eq("tenant_id", t.data.id)
      .order("created_at", { ascending: true });
    if (q.error) return bad(q.error.message);

    return ok(q.data || []);
  } catch (e) {
    return bad(e.message || "error");
  }
}

function ok(body){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}}
function bad(msg){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:msg})}}
