import { supaAdmin } from "./_supa.js";
export async function handler(event) {
  try {
    const slug = (event.queryStringParameters?.tenant || "").trim();
    if (!slug) return bad("missing tenant ?tenant=acme-co");
    const supa = supaAdmin();

    // find/create tenant
    let { data: t, error: tErr } = await supa
      .from("tenants").select("id,slug,business_name")
      .eq("slug", slug).maybeSingle();
    if (tErr) throw tErr;
    if (!t) {
      const business = slug === "acme-co" ? "Acme Co Ltd"
                    : slug === "blue-cafe" ? "Blue Café"
                    : slug.replace(/[-_]/g," ").replace(/\b\w/g,c=>c.toUpperCase());
      const ins = await supa.from("tenants").insert({ slug, business_name: business })
        .select("id,slug,business_name").single();
      if (ins.error) throw ins.error; t = ins.data;
    }

    // find/create client c1
    let { data: c, error: cErr } = await supa
      .from("clients").select("id,tenant_id,external_id,name,email,billing_address")
      .eq("tenant_id", t.id).eq("external_id", "c1").maybeSingle();
    if (cErr) throw cErr;
    if (!c) {
      const insC = await supa.from("clients").insert({
        tenant_id: t.id,
        external_id: "c1",
        name: "Rosa Maria",
        email: "rosa@example.com",
        phone: "+254700000000",
        billing_address: "Rua Exemplo 123, Lisboa",
        notes: "seeded via seed-demo.js"
      }).select("id,tenant_id,external_id,name,email,billing_address").single();
      if (insC.error) throw insC.error; c = insC.data;
    }

    // list
    const list = await supa.from("clients").select("id,external_id,name,email")
      .eq("tenant_id", t.id).order("created_at", { ascending: true });
    if (list.error) throw list.error;

    return ok({ tenant: t, seeded_client: c, clients: list.data });
  } catch (e) {
    return bad({ message: e?.message || String(e), name: e?.name, cause: e?.cause?.code || e?.cause || null });
  }
}
function ok(b){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}}
function bad(b){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}}
