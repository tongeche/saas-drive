import { supaAdmin } from "./_supa.js";
const clean = (s) => (s ?? "").toString().trim();

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const b = JSON.parse(event.body || "{}");

    const slug   = clean(b.slug).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const name   = clean(b.business_name);
    const curr   = clean(b.currency || "EUR");

    const email_from = clean(b.email_from);
    const phone  = clean(b.phone);
    const website= clean(b.website);
    const address= clean(b.address);
    const tax_id = clean(b.tax_id);
    const whatsapp_country_code = clean(b.whatsapp_country_code);
    const invoice_prefix = clean(b.invoice_prefix);
    const brand_color    = clean(b.brand_color);
    const brand_accent   = clean(b.brand_accent);
    const pdf_footer     = clean(b.pdf_footer);
    const logo_path = clean(b.logo_path);
    const logo_url  = clean(b.logo_url);

    if (!slug) return bad("slug is required");
    if (!name) return bad("business_name is required");

    const supa = supaAdmin();
    const { data, error } = await supa
      .from("tenants")
      .upsert({
        slug, business_name: name, currency: curr,
        email_from: email_from || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
        tax_id: tax_id || null,
        whatsapp_country_code: whatsapp_country_code || null,
        invoice_prefix: invoice_prefix || null,
        brand_color: brand_color || null,
        brand_accent: brand_accent || null,
        pdf_footer: pdf_footer || null,
        logo_path: logo_path || null,
        logo_url: logo_url || null
      }, { onConflict: "slug" })
      .select("id, slug, business_name, currency, logo_url")
      .single();

    if (error) return bad(error.message);
    return ok(data);
  } catch (e) { return bad(e.message || "error"); }
}
function ok(b){return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}}
function bad(m){return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:m})}}
