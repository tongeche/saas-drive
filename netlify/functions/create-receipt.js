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
    // Parse form data
    const formData = await request.formData();
    
    const tenantSlug = formData.get('tenant');
    const vendorName = formData.get('vendor_name');
    const category = formData.get('category');
    const description = formData.get('description');
    const date = formData.get('date');
    const amount = parseFloat(formData.get('amount'));
    const taxAmount = parseFloat(formData.get('tax_amount')) || 0;
    const currency = formData.get('currency') || 'EUR';
    const notes = formData.get('notes');
    const receiptImage = formData.get('receipt_image');

    // Validate required fields
    if (!tenantSlug || !vendorName || !amount || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tenant, vendor_name, amount, date' }),
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

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(tenant.id);

    // Calculate total
    const total = amount + taxAmount;

    // Handle file upload if present
    let receiptImageUrl = null;
    if (receiptImage && receiptImage.size > 0) {
      try {
        const fileExt = receiptImage.name.split('.').pop();
        const fileName = `${tenant.id}/${receiptNumber}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptImage, {
            contentType: receiptImage.type
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);
          receiptImageUrl = publicUrl;
        }
      } catch (uploadErr) {
        console.error('Upload process error:', uploadErr);
        // Continue without image if upload fails
      }
    }

    // Create receipt record
    const { data: receipt, error: insertError } = await supabase
      .from('receipts')
      .insert({
        tenant_id: tenant.id,
        number: receiptNumber,
        vendor_name: vendorName,
        category: category,
        description: description || null,
        date: date,
        amount: amount,
        tax_amount: taxAmount,
        total: total,
        currency: currency,
        notes: notes || null,
        receipt_image_url: receiptImageUrl,
        status: 'pending', // Default status
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create receipt in database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        receipt: {
          id: receipt.id,
          number: receipt.number,
          vendor_name: receipt.vendor_name,
          category: receipt.category,
          amount: receipt.amount,
          tax_amount: receipt.tax_amount,
          total: receipt.total,
          currency: receipt.currency,
          date: receipt.date,
          status: receipt.status,
          receipt_image_url: receipt.receipt_image_url
        }
      }),
      { 
        status: 201, 
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

// Helper function to generate receipt numbers
async function generateReceiptNumber(tenantId) {
  const currentYear = new Date().getFullYear();
  const prefix = `RCP-${currentYear}`;
  
  try {
    // Get the highest receipt number for this year
    const { data: lastReceipt, error } = await supabase
      .from('receipts')
      .select('number')
      .eq('tenant_id', tenantId)
      .like('number', `${prefix}-%`)
      .order('number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last receipt number:', error);
      // Fallback to timestamp-based number
      return `${prefix}-${Date.now().toString().slice(-6)}`;
    }

    let nextNumber = 1;
    if (lastReceipt && lastReceipt.length > 0) {
      const lastNumber = lastReceipt[0].number;
      const match = lastNumber.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  } catch (err) {
    console.error('Receipt number generation error:', err);
    // Fallback to timestamp-based number
    return `${prefix}-${Date.now().toString().slice(-6)}`;
  }
}
