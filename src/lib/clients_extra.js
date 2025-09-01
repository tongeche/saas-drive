import supabase from "./supabase";
import { getActiveTenant } from "./tenantState";

export async function fetchClientsForActiveTenant() {
  const t = getActiveTenant();
  if (!t?.id) throw new Error("No active tenant.");
  const { data, error } = await supabase
    .from("clients")
    .select("id,name,email,phone,billing_address")
    .eq("tenant_id", t.id)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function searchClientsForActiveTenant(term, limit = 20) {
  const t = getActiveTenant();
  if (!t?.id) throw new Error("No active tenant.");
  const q = `%${term}%`;
  const { data, error } = await supabase
    .from("clients")
    .select("id,name,email,phone,billing_address")
    .eq("tenant_id", t.id)
    .or(`name.ilike.${q},email.ilike.${q}`)
    .order("name", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/**
 * Get existing client by (tenant_id, email) if email is provided; otherwise insert new.
 * Avoids the unique constraint error you saw earlier.
 */
export async function getOrCreateClient({ name, email, phone, billing_address }) {
  const t = getActiveTenant();
  if (!t?.id) throw new Error("No active tenant.");

  const payload = {
    tenant_id: t.id,
    name: (name || "").trim() || "Client",
    email: (email || "").trim() || null,
    phone: (phone || "").trim() || null,
    billing_address: billing_address || null,
  };

  if (payload.email) {
    const { data: existing, error: selErr } = await supabase
      .from("clients")
      .select("id")
      .eq("tenant_id", t.id)
      .eq("email", payload.email)
      .limit(1)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing) return existing;
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data;
}
