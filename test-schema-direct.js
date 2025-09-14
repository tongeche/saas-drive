// Direct schema test without Netlify functions
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function testSchema() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔧 Testing CRM schema compatibility...\n');

  // Test 1: Basic table access
  console.log('1. Testing client_communications table access:');
  const { data: testData, error: testError } = await supabase
    .from('client_communications')
    .select('id, tenant_id, client_id')
    .limit(1);

  if (testError) {
    console.error('   ❌ Error:', testError.message);
    console.error('   Code:', testError.code);
    return;
  }
  console.log('   ✅ Table accessible');

  // Test 2: Check column compatibility  
  console.log('\n2. Testing column structure:');
  const { data: columnTest, error: columnError } = await supabase
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
    .limit(1);

  if (columnError) {
    console.error('   ❌ Column error:', columnError.message);
    
    // Try to identify which columns are missing
    const basicColumns = ['id', 'tenant_id', 'client_id', 'type', 'direction'];
    for (const col of basicColumns) {
      const { error: colError } = await supabase
        .from('client_communications')
        .select(col)
        .limit(1);
      
      if (colError) {
        console.error(`   ❌ Missing column: ${col}`);
      } else {
        console.log(`   ✅ Column exists: ${col}`);
      }
    }
    return;
  }
  console.log('   ✅ All expected columns exist');

  // Test 3: Test data types with a safe insert/delete
  console.log('\n3. Testing data type compatibility:');
  
  // Use a realistic UUID (this won't actually reference anything)
  const testTenantId = '01234567-89ab-cdef-0123-456789abcdef';
  const testClientId = '11234567-89ab-cdef-0123-456789abcdef';

  const { data: insertData, error: insertError } = await supabase
    .from('client_communications')
    .insert({
      tenant_id: testTenantId,
      client_id: testClientId,
      type: 'email',
      direction: 'outbound',
      subject: 'Schema test',
      content: 'Testing schema compatibility',
      date: new Date().toISOString()
    })
    .select();

  if (insertError) {
    console.error('   ❌ Insert failed:', insertError.message);
    console.error('   Code:', insertError.code);
    
    if (insertError.code === '23503') {
      console.log('   ℹ️ Foreign key constraint error - this is expected since test IDs don\'t exist');
      console.log('   ✅ But data types are compatible!');
    } else {
      return;
    }
  } else {
    console.log('   ✅ Insert successful');
    
    // Clean up
    if (insertData && insertData.length > 0) {
      await supabase
        .from('client_communications')
        .delete()
        .eq('id', insertData[0].id);
      console.log('   🧹 Test data cleaned up');
    }
  }

  // Test 4: Test the actual query our app uses
  console.log('\n4. Testing application query with real tenant:');
  
  // Get a real tenant first
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  if (tenantError || !tenants || tenants.length === 0) {
    console.log('   ⚠️ No tenants found - need to create test data first');
    
    // Try to create a test tenant
    const { data: newTenant, error: createError } = await supabase
      .from('tenants')
      .insert({
        slug: 'test-tenant-' + Date.now(),
        business_name: 'Test Business',
        currency: 'EUR',
        timezone: 'Europe/Lisbon'
      })
      .select()
      .single();

    if (createError) {
      console.error('   ❌ Cannot create test tenant:', createError.message);
      return;
    }
    
    console.log('   ✅ Created test tenant:', newTenant.id);
    
    // Test with the new tenant
    const { data: appData, error: appError } = await supabase
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
      .eq('tenant_id', newTenant.id)
      .limit(10);

    if (appError) {
      console.error('   ❌ Application query failed:', appError.message);
    } else {
      console.log('   ✅ Application query successful (found', appData.length, 'records)');
    }

    // Clean up test tenant
    await supabase.from('tenants').delete().eq('id', newTenant.id);
    console.log('   🧹 Test tenant cleaned up');
    
  } else {
    const tenantId = tenants[0].id;
    console.log('   🔍 Testing with tenant:', tenantId);
    
    const { data: appData, error: appError } = await supabase
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
      .eq('tenant_id', tenantId)
      .limit(10);

    if (appError) {
      console.error('   ❌ Application query failed:', appError.message);
    } else {
      console.log('   ✅ Application query successful (found', appData.length, 'records)');
    }
  }

  console.log('\n🎉 Schema compatibility test completed!');
}

testSchema().catch(console.error);