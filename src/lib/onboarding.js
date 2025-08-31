import supabase from "./supabase";

/** Debounce helper */
export function debounce(fn, wait = 600) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Load the active tenant for the current user (via user_tenants) */
export async function loadActiveTenantOrFirst(getActiveTenant) {
  // prefer persisted selection if you already store a slug
  const persisted = getActiveTenant?.();
  if (persisted?.slug) {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", persisted.slug)
      .maybeSingle();
    if (!error && data) return data;
  }

  const { data: session } = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;
  if (!userId) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("user_tenants")
    .select("tenant:tenants(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data?.[0]?.tenant || null;
}

/** Patch tenant and return the saved row */
export async function saveTenantPatch(id, patch) {
  const { data, error } = await supabase
    .from("tenants")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Compute simple onboarding progress */
export function computeProgress({ tenant, hasClient, hasInvoice }) {
  let steps = 0;
  if (tenant?.business_name && tenant?.currency && tenant?.invoice_prefix) steps++;
  if (tenant?.brand_color || tenant?.logo_url || tenant?.footer_note) steps++;
  if (hasClient) steps++;
  if (hasInvoice) steps++;
  return Math.round((steps / 4) * 100);
}

/** Ensure at least one demo client exists; return the row */
export async function ensureDemoClient(tenantId) {
  const { data: existing } = await supabase
    .from("clients")
    .select("*")
    .eq("tenant_id", tenantId)
    .limit(1);

  if (existing?.length) return existing[0];

  const demo = {
    tenant_id: tenantId,
    external_id: "demo-c1",
    name: "Rosa Maria",
    email: "rosa@example.com",
    phone: "+254700000000",
    billing_address: "Rua Exemplo 123, Lisboa",
    notes: "demo client",
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(demo)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Create a tiny draft invoice (one line), return {invoice, items[]} */
export async function createDraftInvoice(tenant, client, currency = "EUR") {
  const number = await nextInvoiceNumber(tenant.id, tenant.invoice_prefix || "INV");
  const inv = {
    tenant_id: tenant.id,
    client_id: client.id,
    number,
    currency: currency || tenant.currency || "EUR",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
    subtotal: 100,
    tax_total: 23,
    total: 123,
    status: "draft",
    notes: "Onboarding test invoice",
  };

  const { data: invoice, error: e1 } = await supabase
    .from("invoices")
    .insert(inv)
    .select("*")
    .maybeSingle();
  if (e1) throw e1;

  const item = {
    tenant_id: tenant.id,
    invoice_id: invoice.id,
    description: "Service A",
    qty: 1,
    unit_price: 100,
    line_total: 100,
    position: 1,
  };

  const { data: items, error: e2 } = await supabase
    .from("invoice_items")
    .insert(item)
    .select("*");
  if (e2) throw e2;

  return { invoice, items };
}

/** Get next invoice number like PREFIX-000123 */
async function nextInvoiceNumber(tenantId, prefix) {
  const { data, error } = await supabase
    .from("invoices")
    .select("number")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  const last = data?.[0]?.number || `${prefix}-000000`;
  const n = parseInt(last.split("-").pop() || "0", 10) + 1;
  return `${prefix}-${String(n).padStart(6, "0")}`;
}

/** Apply a persona preset to a tenant (safe fields only) */
export async function applyPersona(tenantId, preset) {
  if (!tenantId || !preset) throw new Error("applyPersona: missing args");
  const patch = {
    currency: preset.currency,
    invoice_prefix: preset.invoice_prefix,
    brand_color: preset.brand_color,
    footer_note: preset.footer_note,
  };
  return await saveTenantPatch(tenantId, patch);
}
