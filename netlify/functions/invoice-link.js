import { supaAdmin } from "./_supa.js";

function redirect302(url){ return { statusCode:302, headers:{ Location:url } }; }
function json(code, body){ return { statusCode:code, headers:{ "Content-Type":"application/json" }, body:JSON.stringify(body) }; }

export async function handler(event){
  try{
    const slug   = (event.queryStringParameters?.tenant || "").trim();
    const number = (event.queryStringParameters?.number || "").trim();
    if(!slug || !number) return json(400, { error:"missing tenant or number" });

    const supa = supaAdmin();

    // tenant
    const t = await supa.from("tenants").select("id,slug").eq("slug", slug).limit(1).single();
    if (t.error || !t.data) return json(404, { error: "tenant not found" });

    // invoice (ensure it exists for this tenant)
    const inv = await supa.from("invoices").select("id,number").eq("tenant_id", t.data.id).eq("number", number).limit(1).single();
    if (inv.error || !inv.data) return json(404, { error: "invoice not found" });

    const path = `${slug}/${number}.pdf`;

    // try to sign existing object
    let signed = await supa.storage.from("invoices").createSignedUrl(path, 60*60);
    if (!signed.error && signed.data?.signedUrl) return redirect302(signed.data.signedUrl);

    // if not present yet, build it on the fly then redirect
    const base = process.env.PUBLIC_BASE_URL || process.env.URL || process.env.DEPLOY_URL || "http://localhost:8888";
    const res = await fetch(`${base}/.netlify/functions/invoice-pdf`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ tenant: slug, invoice_number: number })
    });
    if (!res.ok) return json(500, { error:"failed to generate invoice" });
    const data = await res.json().catch(()=>({}));
    if (!data?.signedUrl) return json(500, { error:"no signed url" });
    return redirect302(data.signedUrl);
  } catch(e){
    return json(500, { error: e?.message || "error" });
  }
}
