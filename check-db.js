// Simple Node.js script to check the CRM database structure
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking CRM database structure...\n');

  // Test 1: Check if client_communications table exists and is accessible
  console.log('1. Testing client_communications table access:');
  try {
    const { data, error } = await supabase
      .from('client_communications')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('   ❌ Error:', error.code, '-', error.message);
      if (error.details) console.error('   Details:', error.details);
    } else {
      console.log('   ✅ Table accessible');
      console.log('   📊 Sample data structure:', data.length > 0 ? Object.keys(data[0]) : 'No data yet');
    }
  } catch (e) {
    console.error('   ❌ Exception:', e.message);
  }

  // Test 2: Check clients table
  console.log('\n2. Testing clients table access:');
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, company, tenant_id')
      .limit(1);
    
    if (error) {
      console.error('   ❌ Error:', error.code, '-', error.message);
    } else {
      console.log('   ✅ Table accessible');
      console.log('   📊 Sample data structure:', data.length > 0 ? Object.keys(data[0]) : 'No data yet');
    }
  } catch (e) {
    console.error('   ❌ Exception:', e.message);
  }

  // Test 3: Check tenants table for a valid tenant_id
  console.log('\n3. Getting a sample tenant_id:');
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('   ❌ Error:', error.code, '-', error.message);
      return;
    }
    
    if (data.length === 0) {
      console.log('   ⚠️  No tenants found');
      return;
    }

    const tenantId = data[0].id;
    console.log('   ✅ Found tenant:', tenantId);

    // Test 4: Try the actual CRM query that's failing
    console.log('\n4. Testing the actual CRM query:');
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
        updated_at,
        client:clients(name, email, company)
      `)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(10);

    if (crmError) {
      console.error('   ❌ CRM Query Error:', crmError.code, '-', crmError.message);
      if (crmError.details) console.error('   Details:', crmError.details);
      
      // Try without the join
      console.log('\n5. Testing query without join:');
      const { data: simpleData, error: simpleError } = await supabase
        .from('client_communications')
        .select('*')
        .eq('tenant_id', tenantId)
        .limit(10);
      
      if (simpleError) {
        console.error('   ❌ Simple Query Error:', simpleError.code, '-', simpleError.message);
      } else {
        console.log('   ✅ Simple query works! Data count:', simpleData.length);
        if (simpleData.length > 0) {
          console.log('   📊 Available columns:', Object.keys(simpleData[0]));
        }
      }
    } else {
      console.log('   ✅ CRM query works! Data count:', crmData.length);
    }

  } catch (e) {
    console.error('   ❌ Exception in tenant lookup:', e.message);
  }

  console.log('\n🏁 Database check complete');
}

checkDatabase().catch(console.error);