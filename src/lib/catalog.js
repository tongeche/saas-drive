import supabase from "./supabase";
import { getActiveTenant } from "./tenantState";

/**
 * Fetch all active catalog items for the active tenant (used to prefill the wizard).
 */
export async function fetchCatalogForActiveTenant() {
  const t = getActiveTenant();
  if (!t?.id) throw new Error("No active tenant.");

  const { data, error } = await supabase
    .from("catalog_items")
    .select("id,name,description,unit_price,unit,active")
    .eq("tenant_id", t.id)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Search catalog items by name or description (ILIKE), tenant-scoped.
 */
export async function searchCatalogForActiveTenant(term, limit = 20) {
  const t = getActiveTenant();
  if (!t?.id) throw new Error("No active tenant.");

  const q = `%${term}%`;
  const { data, error } = await supabase
    .from("catalog_items")
    .select("id,name,description,unit_price,unit,active")
    .eq("tenant_id", t.id)
    .eq("active", true)
    .or(`name.ilike.${q},description.ilike.${q}`)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
