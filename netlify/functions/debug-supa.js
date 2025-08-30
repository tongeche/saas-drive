import { supaAdmin } from "./_supa.js";
export async function handler() {
  try {
    const supa = supaAdmin();
    const { data: tenants, error } = await supa
      .from("tenants").select("id,slug,business_name").order("created_at",{ascending:true});
    if (error) throw error;
    const url = process.env.SUPABASE_URL || "";
    const ref = (url.match(/^https:\/\/([^.]+)\.supabase\.co/i)||[])[1] || "unknown";
    return { statusCode:200, body: JSON.stringify({ projectRef: ref, tenants }) };
  } catch (e) {
    return { statusCode:400, body: JSON.stringify({ error: e.message }) };
  }
}
