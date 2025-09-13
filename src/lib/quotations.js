import supabase from './supabase';

/**
 * Create a quotation with line items in Supabase
 * Returns: { id, number, client_id, status }
 */
export async function createQuotation(tenant_id, client_id, values) {
  const { items = [], ...quotationData } = values;
  
  // Calculate totals from items
  const subtotal = items.reduce((sum, item) => sum + (item.line_subtotal || 0), 0);
  const discount_amount = items.reduce((sum, item) => sum + (item.line_discount || 0), 0);
  const tax_total = items.reduce((sum, item) => sum + (item.line_tax || 0), 0);
  const total = subtotal - discount_amount + tax_total;
  
  // Get tenant slug for number generation
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', tenant_id)
    .single();
  
  if (tenantError) throw tenantError;
  
  // Generate quotation number
  const { data: quotationNumber, error: numberError } = await supabase
    .rpc('next_quotation_number', { p_tenant_slug: tenant.slug });
    
  if (numberError) throw numberError;
  
  const payload = { 
    tenant_id, 
    client_id, 
    number: quotationNumber,
    status: 'draft',
    valid_until: values.valid_until || getDefaultValidUntil(),
    subtotal,
    discount_amount,
    tax_total,
    total,
    ...quotationData 
  };
  
  // Start transaction
  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .insert(payload)
    .select('id, number, client_id, status')
    .single();
  
  if (quotationError) throw quotationError;
  
  // Insert quotation items if any
  if (items.length > 0) {
    const quotationItems = items.map((item, index) => ({
      quotation_id: quotation.id,
      item_id: item.item_id || null,
      description: item.description || '',
      unit: item.unit || 'each',
      qty: Number(item.qty) || 1,
      unit_price: Number(item.unit_price) || 0,
      tax_rate: Number(item.tax_rate) || 0,
      discount_rate: Number(item.discount_rate) || 0,
      line_subtotal: Number(item.line_subtotal) || 0,
      line_discount: Number(item.line_discount) || 0,
      line_tax: Number(item.line_tax) || 0,
      line_total: Number(item.line_total) || 0,
      position: index + 1
    }));
    
    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(quotationItems);
      
    if (itemsError) throw itemsError;
  }
  
  return quotation;
}

/**
 * List quotations for a tenant with their items
 */
export async function listQuotations(tenant_id) {
  if (!tenant_id) throw new Error("Missing tenant_id");
  
  const { data: quotations, error } = await supabase
    .from('quotations')
    .select(`
      *,
      quotation_items (*)
    `)
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return quotations || [];
}

/**
 * Get a single quotation with items
 */
export async function getQuotation(quotation_id) {
  const { data, error } = await supabase
    .from('quotations')
    .select(`
      *,
      quotation_items (*)
    `)
    .eq('id', quotation_id)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Update quotation status (Draft, Sent, Accepted, Declined, Expired)
 */
export async function updateQuotationStatus(quotation_id, status) {
  const { data, error } = await supabase
    .from('quotations')
    .update({ status })
    .eq('id', quotation_id)
    .select('*')
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Convert quotation to invoice with items
 */
export async function convertQuotationToInvoice(quotation_id) {
  // Get quotation details with items
  const quotation = await getQuotation(quotation_id);
  
  // Create invoice from quotation
  const invoiceData = {
    tenant_id: quotation.tenant_id,
    client_id: quotation.client_id,
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: getDueDateFromIssue(new Date()),
    currency: quotation.currency,
    subtotal: quotation.subtotal,
    tax_total: quotation.tax_total,
    total: quotation.total,
    notes: `Converted from quotation ${quotation.number || quotation.id}`,
    from_quotation_id: quotation.id
  };
  
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select('*')
    .single();
    
  if (invoiceError) throw invoiceError;
  
  // Convert quotation items to invoice items
  if (quotation.quotation_items && quotation.quotation_items.length > 0) {
    const invoiceItems = quotation.quotation_items.map(item => ({
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
  
  // Update quotation status to accepted
  await updateQuotationStatus(quotation_id, 'Accepted');
  
  return { invoice, quotation };
}

/**
 * Calculate line item totals with discount
 */
export function calculateQuotationLineItem(qty, unit_price, tax_rate, discount_rate = 0) {
  const quantity = Number(qty) || 0;
  const price = Number(unit_price) || 0;
  const taxRate = Number(tax_rate) || 0;
  const discountRate = Number(discount_rate) || 0;
  
  const line_subtotal = Math.round((quantity * price) * 100) / 100;
  const line_discount = Math.round((line_subtotal * discountRate / 100) * 100) / 100;
  const discounted_subtotal = line_subtotal - line_discount;
  const line_tax = Math.round((discounted_subtotal * taxRate / 100) * 100) / 100;
  const line_total = Math.round((discounted_subtotal + line_tax) * 100) / 100;
  
  return {
    line_subtotal,
    line_discount,
    line_tax,
    line_total
  };
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
