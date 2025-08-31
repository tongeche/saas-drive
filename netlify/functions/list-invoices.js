import { supaAdmin } from "./_supa.js";
export async function handler(event){
  try{
    const slug=(event.queryStringParameters?.tenant||"").trim();
    const limit=Number(event.queryStringParameters?.limit||"10");
    if(!slug) return bad("missing tenant");
    const supa=supaAdmin();
    const t=await supa.from("tenants").select("id,slug").eq("slug",slug).limit(1).single();
    if (t.error || !t.data) return bad("tenant not found");
    const q=await supa.from("invoices")
      .select("id, number, created_at")
      .eq("tenant_id", t.data.id)
      .order("created_at", { ascending:false })
      .limit(limit);
    if (q.error) return bad(q.error.message);
    return ok(q.data || []);
  }catch(e){return bad(e.message || "error");}
}
function ok(b){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}}
function bad(m){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:m})}}
