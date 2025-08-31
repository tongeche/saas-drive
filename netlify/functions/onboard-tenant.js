import { createClient } from '@supabase/supabase-js';

const ok  = (b)=>({ statusCode:200, headers:{'Content-Type':'application/json'}, body:JSON.stringify(b) });
const bad = (c,m)=>({ statusCode:c,   headers:{'Content-Type':'application/json'}, body:JSON.stringify({error:m}) });

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "tenant";
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 200 };
    if (event.httpMethod !== "POST") return bad(405, "Method Not Allowed");

    const URL = process.env.SUPABASE_URL;
    const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!URL || !SRV) return bad(500, "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

    // Get caller (user) from Authorization: Bearer <jwt>
    const auth = event.headers.authorization || event.headers.Authorization || "";
    const jwt  = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!jwt) return bad(401, "Not authenticated");

    const body = JSON.parse(event.body || "{}");
    const business_name = (body.business_name || body.company || "").trim();
    const currency = (body.currency || "KES").trim().toUpperCase();
    let   slug     = (body.slug || "").trim().toLowerCase();

    if (!business_name) return bad(400, "business_name required");

    // derive slug if not provided
    if (!slug) slug = slugify(business_name);

    // user-scoped client just to read who the caller is
    const supaUser = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: ures, error: uerr } = await supaUser.auth.getUser();
    if (uerr || !ures?.user?.id) return bad(401, "Invalid user token");
    const user = ures.user;

    // service client for privileged writes
    const supa = createClient(URL, SRV);

    // ensure unique slug (up to 5 tries)
    let finalSlug = slug;
    for (let i = 0; i < 5; i++) {
      const { data: exists, error: e1 } = await supa
        .from("tenants")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle();
      if (e1) return bad(500, e1.message);
      if (!exists) break;
      finalSlug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    }

    // insert tenant
    const { data: tIns, error: e2 } = await supa
      .from("tenants")
      .insert({
        slug: finalSlug,
        business_name,
        currency,
        email_from: user.email || null
      })
      .select("id, slug, business_name, currency, email_from, created_at")
      .single();
    if (e2) return bad(400, e2.message);

    // link caller as OWNER (idempotent)
    const { error: e3 } = await supa
      .from("user_tenants")
      .upsert({ user_id: user.id, tenant_id: tIns.id, role: "owner" }, { onConflict: "user_id,tenant_id" });
    if (e3) return bad(400, e3.message);

    // (optional) ensure a profile row exists
    await supa
      .from("profiles")
      .upsert({ user_id: user.id, full_name: body.name || user.email }, { onConflict: "user_id" });

    return ok({ tenant: tIns });
  } catch (e) {
    return bad(500, e?.message || "error");
  }
}
