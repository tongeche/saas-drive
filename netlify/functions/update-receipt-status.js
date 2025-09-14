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
    const { tenant, receiptId, status, comment } = await request.json();

    if (!tenant || !receiptId || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tenant, receiptId, status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be: pending, approved, or rejected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tenant information
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenant)
      .single();

    if (tenantError || !tenantData) {
      return new Response(
        JSON.stringify({ error: 'Invalid tenant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update receipt status
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    // Add approval/rejection fields
    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = 'system'; // TODO: Add user authentication
      if (comment) updateData.approval_notes = comment;
    } else if (status === 'rejected') {
      updateData.rejected_at = new Date().toISOString();
      updateData.rejected_by = 'system'; // TODO: Add user authentication
      if (comment) updateData.rejection_reason = comment;
    }

    const { data: receipt, error: updateError } = await supabase
      .from('receipts')
      .update(updateData)
      .eq('id', receiptId)
      .eq('tenant_id', tenantData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update receipt status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!receipt) {
      return new Response(
        JSON.stringify({ error: 'Receipt not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the status change for audit trail
    try {
      await supabase
        .from('receipt_status_logs')
        .insert({
          receipt_id: receiptId,
          tenant_id: tenantData.id,
          old_status: 'pending', // TODO: Get actual old status
          new_status: status,
          comment: comment || null,
          changed_by: 'system', // TODO: Add user authentication
          changed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Audit log error:', logError);
      // Continue despite audit log failure
    }

    return new Response(
      JSON.stringify({
        success: true,
        receipt: {
          id: receipt.id,
          number: receipt.number,
          status: receipt.status,
          vendor_name: receipt.vendor_name,
          amount: receipt.amount,
          currency: receipt.currency,
          updated_at: receipt.updated_at
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
