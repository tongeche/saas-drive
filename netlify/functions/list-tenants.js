import { supaAdmin } from "./_supa.js";

export async function handler() {
  try {
    const supa = supaAdmin();
    const q = await supa
      .from("tenants")
      .select("id, slug, business_name")
      .order("created_at", { ascending: true });
    if (q.error) return bad(q.error.message);
    return ok(q.data || []);
  } catch (e) {
    return bad(e.message || "error");
  }
}

function ok(b){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}}
function bad(m){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:m})}}
