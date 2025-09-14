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

  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(request.url);
    const tenantSlug = url.searchParams.get('tenant');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const status = url.searchParams.get('status'); // approved, pending, rejected
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    if (!tenantSlug) {
      return new Response(
        JSON.stringify({ error: 'Tenant parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant lookup error:', tenantError);
      return new Response(
        JSON.stringify({ error: 'Invalid tenant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query
    let query = supabase
      .from('receipts')
      .select(`
        id,
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
        notes,
        receipt_image_url,
        created_at,
        updated_at
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      // Search in vendor name, number, and description
      query = query.or(`vendor_name.ilike.%${search}%,number.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: receipts, error: receiptsError } = await query;

    if (receiptsError) {
      console.error('Receipts fetch error:', receiptsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch receipts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total count for pagination
    let totalCount = 0;
    try {
      let countQuery = supabase
        .from('receipts')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);

      if (status) {
        countQuery = countQuery.eq('status', status);
      }
      if (category) {
        countQuery = countQuery.eq('category', category);
      }
      if (search) {
        countQuery = countQuery.or(`vendor_name.ilike.%${search}%,number.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { count } = await countQuery;
      totalCount = count || 0;
    } catch (countError) {
      console.error('Count query error:', countError);
      // Continue without count
    }

    // Calculate analytics
    const analytics = await calculateReceiptAnalytics(tenant.id);

    // Return receipts with metadata
    return new Response(
      JSON.stringify({
        receipts: receipts || [],
        pagination: {
          total: totalCount,
          limit: limit,
          offset: offset,
          hasMore: totalCount > (offset + (receipts?.length || 0))
        },
        analytics: analytics,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenantSlug
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

// Calculate receipt analytics
async function calculateReceiptAnalytics(tenantId) {
  try {
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('amount, tax_amount, total, status, currency')
      .eq('tenant_id', tenantId);

    if (error || !receipts) {
      console.error('Analytics fetch error:', error);
      return {
        totalReceipts: 0,
        totalAmount: 0,
        approvedAmount: 0,
        pendingAmount: 0,
        rejectedAmount: 0,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        currency: 'EUR'
      };
    }

    const analytics = {
      totalReceipts: receipts.length,
      totalAmount: 0,
      approvedAmount: 0,
      pendingAmount: 0,
      rejectedAmount: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      currency: receipts[0]?.currency || 'EUR'
    };

    receipts.forEach(receipt => {
      const amount = receipt.total || receipt.amount || 0;
      analytics.totalAmount += amount;
      
      switch (receipt.status) {
        case 'approved':
          analytics.approvedAmount += amount;
          analytics.approvedCount++;
          break;
        case 'pending':
          analytics.pendingAmount += amount;
          analytics.pendingCount++;
          break;
        case 'rejected':
          analytics.rejectedAmount += amount;
          analytics.rejectedCount++;
          break;
      }
    });

    return analytics;
  } catch (err) {
    console.error('Analytics calculation error:', err);
    return {
      totalReceipts: 0,
      totalAmount: 0,
      approvedAmount: 0,
      pendingAmount: 0,
      rejectedAmount: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      currency: 'EUR'
    };
  }
}
