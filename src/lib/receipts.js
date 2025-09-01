import supabase from "./supabase";

/** Create a tenant-scoped receipt and a cash IN entry */
export async function createReceipt(tenantId, invoiceId, { date, amount, method, reference, notes }) {
  if (!tenantId) throw new Error("Missing tenantId");
  if (!invoiceId) throw new Error("Missing invoiceId");

  const payload = {
    tenant_id: tenantId,
    invoice_id: invoiceId,
    date: date || new Date().toISOString().slice(0,10),
    amount: Number(amount || 0),
    method: method || "Cash",
    reference: reference || null,
    notes: notes || null,
  };

  const { data: rec, error: rErr } = await supabase
    .from("receipts")
    .insert(payload)
    .select("*")
    .maybeSingle();
  if (rErr) throw rErr;

  const { data: inv, error: iErr } = await supabase
    .from("invoices")
    .select("id, tenant_id, number, total, currency, issue_date")
    .eq("id", invoiceId)
    .maybeSingle();
  if (iErr) throw iErr;

  const { data: recs, error: sErr } = await supabase
    .from("receipts")
    .select("amount")
    .eq("invoice_id", invoiceId);
  if (sErr) throw sErr;
  const totalReceipts = (recs || []).reduce((a, r) => a + Number(r.amount || 0), 0);

  try {
    await supabase.from("cash_entries").insert({
      tenant_id: tenantId,
      kind: "IN",
      category: "Sales",
      date: payload.date,
      amount: payload.amount,
      memo: notes || `Receipt for invoice ${inv?.number || invoiceId}`,
      source: `invoice:${invoiceId}`,
    });
  } catch { /* ignore if table missing */ }

  return { receipt: rec, invoice: inv, totalReceipts };
}
