import { createClient } from '@supabase/supabase-js';

const ok  = (b) => ({ statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify(b) });
const bad = (m, code=400) => ({ statusCode: code, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ error: m }) });

export async function handler(event) {
  if (process.env.NODE_ENV === 'production') return bad('disabled in production', 403);
  if (event.httpMethod !== 'POST') return bad('Method Not Allowed', 405);

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return bad('Invalid JSON'); }
  const { email, password, slug='test-co', business_name='Test Co Ltd', currency='KES' } = body;
  if (!email || !password) return bad('email and password are required');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return bad('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on server', 500);

  const admin = createClient(url, key);

  // 1) ensure user (v2: no getUserByEmail)
  let user = null;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (cErr) {
    const msg = String(cErr.message || '').toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || cErr.status === 422) {
      const { data: list, error: lErr } = await admin.auth.admin.listUsers();
      if (lErr) return bad(`listUsers failed: ${lErr.message}`);
      user = list?.users?.find(u => (u.email || '').toLowerCase() === email.toLowerCase()) || null;
      if (!user) return bad('user exists but not found via listUsers');
    } else {
      return bad(`createUser failed: ${cErr.message}`);
    }
  } else {
    user = created?.user || null;
  }
  if (!user?.id) return bad('no user resolved');

  // 2) tenant
  const { data: tenant, error: terr } = await admin
    .from('tenants')
    .upsert({ slug, business_name, currency }, { onConflict: 'slug' })
    .select('id, slug')
    .single();
  if (terr) return bad(`tenant upsert failed: ${terr.message}`);

  // 3) membership
  const { error: merr } = await admin
    .from('user_tenants')
    .upsert({ user_id: user.id, tenant_id: tenant.id, role: 'owner' }, { onConflict: 'user_id,tenant_id' });
  if (merr) return bad(`membership upsert failed: ${merr.message}`);

  // 4) clean slate
  await admin.from('invoices').delete().eq('tenant_id', tenant.id);
  await admin.from('clients').delete().eq('tenant_id', tenant.id);

  return ok({ user_id: user.id, tenant_id: tenant.id, slug: tenant.slug });
}
