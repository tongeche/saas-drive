import supabase from './supabase';

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

export async function sendInvoicePdf(tenant_slug, invoice_number) {
  const res = await fetch('/.netlify/functions/invoice-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant: tenant_slug, invoice_number })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'PDF error');
  return json; // { signedUrl, qrLink, number, ... }
}
