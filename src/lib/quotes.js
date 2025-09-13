import supabase from './supabase';

/**
 * Create a quote row with line items in Supabase
 * Returns: { id, number, client_id, status }
 */
export async function createQuote(tenant_id, client_id, values) {
  const { items = [], ...quoteData } = values;
  
  // Calculate totals from items
  const subtotal = items.reduce((sum, item) => sum + (item.line_subtotal || 0), 0);
  const tax_total = items.reduce((sum, item) => sum + (item.line_tax || 0), 0);
  const total = subtotal + tax_total;
  
  const payload = { 
    tenant_id, 
    client_id, 
    status: 'Draft',
    valid_until: values.valid_until || getDefaultValidUntil(),
    subtotal,
    tax_total,
    total,
    ...quoteData 
  };
  
  // Start transaction
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert(payload)
    .select('id, number, client_id, status')
    .single();
  
  if (quoteError) throw quoteError;
  
  // Insert quote items if any
  if (items.length > 0) {
    const quoteItems = items.map((item, index) => ({
      quote_id: quote.id,
      description: item.description || '',
      unit: item.unit || 'each',
      qty: Number(item.qty) || 1,
      unit_price: Number(item.unit_price) || 0,
      tax_rate: Number(item.tax_rate) || 0,
      line_subtotal: Number(item.line_subtotal) || 0,
      line_tax: Number(item.line_tax) || 0,
      line_total: Number(item.line_total) || 0,
      position: index + 1
    }));
    
    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(quoteItems);
      
    if (itemsError) throw itemsError;
  }
  
  return quote;
}

/**
 * List quotes for a tenant with their items
 */
export async function listQuotes(tenant_id) {
  if (!tenant_id) throw new Error("Missing tenant_id");
  
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(`
      *,
      quote_items (*)
    `)
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return quotes || [];
}

/**
 * Get a single quote with items
 */
export async function getQuote(quote_id) {
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      *,
      quote_items (*)
    `)
    .eq('id', quote_id)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Update quote status (Draft, Sent, Accepted, Declined, Expired)
 */
export async function updateQuoteStatus(quote_id, status) {
  const { data, error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('id', quote_id)
    .select('*')
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Convert quote to invoice with items
 */
export async function convertQuoteToInvoice(quote_id) {
  // Get quote details with items
  const quote = await getQuote(quote_id);
  
  // Create invoice from quote
  const invoiceData = {
    tenant_id: quote.tenant_id,
    client_id: quote.client_id,
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: getDueDateFromIssue(new Date()),
    currency: quote.currency,
    subtotal: quote.subtotal,
    tax_total: quote.tax_total,
    total: quote.total,
    notes: `Converted from quote ${quote.number || quote.id}`,
    from_quote_id: quote.id
  };
  
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select('*')
    .single();
    
  if (invoiceError) throw invoiceError;
  
  // Convert quote items to invoice items
  if (quote.quote_items && quote.quote_items.length > 0) {
    const invoiceItems = quote.quote_items.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      qty: item.qty,
      unit_price: item.unit_price,
      line_total: item.line_total,
      position: item.position
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);
      
    if (itemsError) throw itemsError;
  }
  
  // Update quote status to accepted
  await updateQuoteStatus(quote_id, 'Accepted');
  
  return { invoice, quote };
}

/**
 * Calculate line item totals
 */
export function calculateLineItem(qty, unit_price, tax_rate) {
  const quantity = Number(qty) || 0;
  const price = Number(unit_price) || 0;
  const taxRate = Number(tax_rate) || 0;
  
  const line_subtotal = Math.round((quantity * price) * 100) / 100;
  const line_tax = Math.round((line_subtotal * taxRate / 100) * 100) / 100;
  const line_total = Math.round((line_subtotal + line_tax) * 100) / 100;
  
  return {
    line_subtotal,
    line_tax,
    line_total
  };
}

/**
 * Generate PDF URL for a quote
 */
export async function generateQuotePDF(tenant_slug, quote_id, opts = {}) {
  // Determine the correct base URL for Netlify functions
  const isDev = window.location.hostname === 'localhost';
  const functionsBaseUrl = isDev ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions';
  
  const res = await fetch(`${functionsBaseUrl}/quote-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: JSON.stringify({ tenant: tenant_slug, quote_id }),
  });

  const raw = await res.text();
  let json;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch (e) {
    const snippet = (raw || '').slice(0, 400);
    throw new Error(`PDF function returned non-JSON (HTTP ${res.status}). Body: ${snippet}`);
  }

  if (!res.ok) {
    throw new Error(json?.error || `PDF error (HTTP ${res.status})`);
  }

  // Convert base64 to blob URL for download
  if (json.pdfData) {
    const pdfBytes = Uint8Array.from(atob(json.pdfData), c => c.charCodeAt(0));
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    return {
      ...json,
      downloadUrl: url,
      signedUrl: url // For compatibility
    };
  }

  return json; // { signedUrl, downloadUrl, ... }
}

// Helper functions
function getDefaultValidUntil() {
  const date = new Date();
  date.setDate(date.getDate() + 30); // Valid for 30 days
  return date.toISOString().slice(0, 10);
}

function getDueDateFromIssue(issueDate) {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + 14); // 14 days from issue
  return date.toISOString().slice(0, 10);
}
