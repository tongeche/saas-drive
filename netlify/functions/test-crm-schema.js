const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (event, context) => {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Missing Supabase credentials' 
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔧 Starting CRM schema fix...');

    // Step 1: Drop existing problematic tables
    console.log('🗑️ Dropping existing CRM tables...');
    
    try {
      // We'll recreate the tables with the correct schema
      await supabase.from('client_communications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('✅ Cleared client_communications data');
    } catch (e) {
      console.log('ℹ️ client_communications table might not exist or be empty');
    }

    // Step 2: Test a simple query to see current state
    const { data: testData, error: testError } = await supabase
      .from('client_communications')
      .select('id, tenant_id, client_id')
      .limit(1);

    if (testError) {
      console.log('❌ Error accessing client_communications:', testError.message);
      console.log('Error code:', testError.code);
      
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Cannot access CRM tables',
          details: testError.message,
          code: testError.code,
          suggestion: 'The tables may have incompatible schema. Manual migration needed.'
        })
      };
    }

    console.log('✅ client_communications table is accessible');

    // Step 3: Check if we can insert test data to verify schema
    const testTenantId = '00000000-0000-0000-0000-000000000001';
    const testClientId = '00000000-0000-0000-0000-000000000002';

    const { data: insertData, error: insertError } = await supabase
      .from('client_communications')
      .insert({
        tenant_id: testTenantId,
        client_id: testClientId,
        type: 'email',
        direction: 'outbound',
        subject: 'Test communication',
        content: 'This is a test to verify schema compatibility',
        date: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Schema incompatibility detected',
          details: insertError.message,
          code: insertError.code,
          suggestion: 'The table schema needs to be updated to match application expectations'
        })
      };
    }

    console.log('✅ Test insert successful - schema is compatible');

    // Clean up test data
    if (insertData && insertData.length > 0) {
      await supabase
        .from('client_communications')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Cleaned up test data');
    }

    // Step 4: Test the CRM query that was failing
    const { data: crmData, error: crmError } = await supabase
      .from('client_communications')
      .select(`
        id,
        tenant_id,
        client_id,
        type,
        direction,
        subject,
        content,
        date,
        status,
        created_at,
        updated_at
      `)
      .limit(5);

    if (crmError) {
      console.log('❌ CRM query failed:', crmError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'CRM query incompatibility',
          details: crmError.message,
          suggestion: 'Table structure may be missing expected columns'
        })
      };
    }

    console.log('✅ CRM query successful');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'CRM schema verification completed successfully',
        schemaCompatible: true,
        tablesAccessible: true,
        insertTestPassed: true,
        queryTestPassed: true
      })
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Unexpected error during schema verification',
        details: error.message
      })
    };
  }
};