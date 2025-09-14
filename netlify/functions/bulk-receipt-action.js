import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request, context) {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { tenant, receiptIds, action } = await request.json();

    if (!tenant || !receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0 || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tenant, receiptIds (array), action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tenant information
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('slug', tenant)
      .single();

    if (tenantError || !tenantData) {
      return new Response(
        JSON.stringify({ error: 'Invalid tenant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let results = [];

    switch (action) {
      case 'approve':
        results = await bulkUpdateStatus(tenantData.id, receiptIds, 'approved');
        break;
      
      case 'reject':
        results = await bulkUpdateStatus(tenantData.id, receiptIds, 'rejected');
        break;
      
      case 'export':
        results = await exportReceipts(tenantData.id, receiptIds);
        break;
      
      case 'delete':
        results = await bulkDeleteReceipts(tenantData.id, receiptIds);
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Supported: approve, reject, export, delete' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: action,
        processed: results.length,
        results: results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Bulk action error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function bulkUpdateStatus(tenantId, receiptIds, status) {
  try {
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = 'system';
    } else if (status === 'rejected') {
      updateData.rejected_at = new Date().toISOString();
      updateData.rejected_by = 'system';
    }

    const { data, error } = await supabase
      .from('receipts')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .in('id', receiptIds)
      .select('id, number, status');

    if (error) {
      console.error('Bulk update error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Bulk status update failed:', error);
    return [];
  }
}

async function exportReceipts(tenantId, receiptIds) {
  try {
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select(`
        number,
        vendor_name,
        category,
        description,
        date,
        amount,
        tax_amount,
        total,
        currency,
        status,
        created_at
      `)
      .eq('tenant_id', tenantId)
      .in('id', receiptIds)
      .order('date', { ascending: false });

    if (error) {
      console.error('Export query error:', error);
      throw error;
    }

    // Convert to CSV format
    if (receipts && receipts.length > 0) {
      const headers = [
        'Receipt Number',
        'Vendor',
        'Category', 
        'Description',
        'Date',
        'Amount',
        'Tax',
        'Total',
        'Currency',
        'Status',
        'Created'
      ];

      const csvRows = [
        headers.join(','),
        ...receipts.map(receipt => [
          receipt.number,
          receipt.vendor_name,
          receipt.category,
          receipt.description || '',
          receipt.date,
          receipt.amount,
          receipt.tax_amount || 0,
          receipt.total || receipt.amount,
          receipt.currency,
          receipt.status,
          receipt.created_at
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ];

      return [{
        type: 'csv',
        filename: `receipts_export_${new Date().toISOString().split('T')[0]}.csv`,
        data: csvRows.join('\n'),
        count: receipts.length
      }];
    }

    return [];
  } catch (error) {
    console.error('Export failed:', error);
    return [];
  }
}

async function bulkDeleteReceipts(tenantId, receiptIds) {
  try {
    // First get receipt details for audit
    const { data: receiptsToDelete } = await supabase
      .from('receipts')
      .select('id, number, vendor_name')
      .eq('tenant_id', tenantId)
      .in('id', receiptIds);

    // Delete receipts
    const { data, error } = await supabase
      .from('receipts')
      .delete()
      .eq('tenant_id', tenantId)
      .in('id', receiptIds)
      .select('id, number');

    if (error) {
      console.error('Bulk delete error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Bulk delete failed:', error);
    return [];
  }
}
