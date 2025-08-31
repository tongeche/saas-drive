import { supaAdmin } from "./_supa.js";

const bad = (m, code=400, extra=null) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(extra ? { error: m, ...extra } : { error: m })
});

export async function handler(event) {
  try {
    if (event.httpMethod !== "GET") return bad("Method Not Allowed", 405);
    const qs = event.queryStringParameters || {};
    const tenantSlug = (qs.tenant || "").trim();
    const number     = (qs.number || "").trim();
    if (!tenantSlug || !number) return bad("missing tenant or number", 422);

    const supa = supaAdmin();

    // Resolve tenant (validate slug)
    const tQ = await supa.from("tenants").select("id, slug").eq("slug", tenantSlug).limit(1);
    if (tQ.error) return bad(tQ.error.message, 500);
    const tenant = (tQ.data || [])[0];
    if (!tenant) return bad("tenant not found", 404);

    // Build storage path and sign
    const bucket = "invoices";
    const path = `${tenant.slug}/${number}.pdf`;
    const signed = await supa.storage.from(bucket).createSignedUrl(path, 60 * 60 * 72); // 72h
    if (signed.error) return bad("file not found", 404, { path });

    return {
      statusCode: 302,
      headers: {
        Location: signed.data.signedUrl,
        "Cache-Control": "no-store"
      },
      body: ""
    };
  } catch (e) {
    return bad(e.message || "server error", 500);
  }
}
