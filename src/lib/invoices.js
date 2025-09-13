import supabase from './supabase';

/**
 * Create an invoice row in Supabase
 * Returns: { id, number, client_id }
 */
export async function createInvoice(tenant_id, client_id, values) {
  const payload = { tenant_id, client_id, ...values };
  const { data, error } = await supabase
    .from('invoices')
    .insert(payload)
    .select('id, number, client_id')
    .single();
  if (error) throw error;
  return data; // { id, number, client_id }
}

/**
 * Ask the Netlify function to generate the PDF and return { signedUrl, qrLink, number, ... }
 * This version is robust against non-JSON / empty responses.
 */
export async function sendInvoicePdf(tenant_slug, invoice_number, opts = {}) {
  const res = await fetch('/.netlify/functions/invoice-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: JSON.stringify({ tenant: tenant_slug, invoice_number }),
  });

  // Read as text first, then try to parse JSON so we can show helpful errors
  const raw = await res.text();
  let json;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch (e) {
    // Function returned HTML or an empty body; surface that in an actionable error
    const snippet = (raw || '').slice(0, 400);
    throw new Error(`PDF function returned non-JSON (HTTP ${res.status}). Body: ${snippet}`);
  }

  if (!res.ok) {
    // The function returned JSON with an error message
    throw new Error(json?.error || `PDF error (HTTP ${res.status})`);
  }

  return json; // { signedUrl, qrLink, number, ... }
}

/**
 * Optional convenience if you want to call by invoice_id instead of number.
 */
export async function sendInvoicePdfById(tenant_slug, invoice_id, opts = {}) {
  const res = await fetch('/.netlify/functions/invoice-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: JSON.stringify({ tenant: tenant_slug, invoice_id }),
  });

  const raw = await res.text();
  let json;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch (e) {
    const snippet = (raw || '').slice(0, 400);
    throw new Error(`PDF function returned non-JSON (HTTP ${res.status}). Body: ${snippet}`);
  }
  if (!res.ok) throw new Error(json?.error || `PDF error (HTTP ${res.status})`);
  return json;
}

/**
 * Determine invoice status based on due date and payments
 */
export function statusOf(inv) {
  const due = inv?.due_date ? new Date(inv.due_date) : null;
  if (!due) return "Issued";
  const today = new Date(); 
  today.setHours(0,0,0,0);
  const diff = (due - today) / 86400000;
  if (diff < 0) return "Overdue";
  if (diff <= 7) return "Due Soon";
  return "Issued";
}

/**
 * Get status badge configuration for invoice status
 */
export function statusBadge(status) {
  switch (status) {
    case "Overdue": return { text: "Overdue", cls: "text-rose-700 bg-rose-50" };
    case "Due Soon": return { text: "Due Soon", cls: "text-amber-700 bg-amber-50" };
    case "Paid": return { text: "Paid", cls: "text-emerald-700 bg-emerald-50" };
    default: return { text: "Issued", cls: "text-sky-700 bg-sky-50" };
  }
}
