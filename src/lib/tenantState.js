import supabase from './supabase';

const KEY = 'activeTenant';

export function saveActiveTenant(t) {
  try { localStorage.setItem(KEY, JSON.stringify(t ?? null)); } catch {}
}

export function getActiveTenant() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

export async function loadMyTenants() {
  const { data, error } = await supabase
    .from('user_tenants')
    .select('tenant:tenants(id,slug,business_name,currency)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(r => r.tenant);
}
