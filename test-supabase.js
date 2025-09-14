// Quick Supabase connection test
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mjneiqrfrlatcefuwfyt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qbmVpcXJmcmxhdGNlZnV3Znl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTkxOTQsImV4cCI6MjA3MjA3NTE5NH0.rsXYwlS_j42vyNDOLJUZoVXdfK_c2lEdArzzCvvwtY4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test tenants table
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug, business_name')
      .limit(1);
    
    if (tenantError) {
      console.error('Tenants table error:', tenantError);
    } else {
      console.log('✅ Tenants table accessible:', tenants);
    }

    // Test receipts table
    const { data: receipts, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .limit(1);
    
    if (receiptError) {
      console.error('❌ Receipts table error:', receiptError);
      console.log('This might be the issue - receipts table may not exist or have wrong schema');
    } else {
      console.log('✅ Receipts table accessible:', receipts);
    }

    // Test clients table
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientError) {
      console.error('❌ Clients table error:', clientError);
    } else {
      console.log('✅ Clients table accessible:', clients);
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();
