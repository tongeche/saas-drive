import supabase from './supabase';

export async function listClients(tenant_id) {
  const { data, error } = await supabase
    .from('clients')
    .select('id,name,email,phone')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createClient(tenant_id, payload) {
  const row = { ...payload, tenant_id };
  const { data, error } = await supabase
    .from('clients')
    .insert(row)
    .select('id,name,email,phone')
    .single();
  if (error) throw error;
  return data;
}
