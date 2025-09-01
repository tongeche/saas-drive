import supabase from "./supabase";
export async function nextInvoiceNumber(tenantId) {
  const { data, error } = await supabase.rpc("next_invoice_number", { p_tenant: tenantId });
  if (error) throw error;
  return data; // e.g. "INV-000123"
}
