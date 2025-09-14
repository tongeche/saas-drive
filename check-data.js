// Check what data exists and user context
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking what data exists in the database...\n');

  // Check all tables for data
  const tables = ['tenants', 'clients', 'client_communications', 'client_activities', 'client_notes', 'client_reminders'];
  
  for (const table of tables) {
    console.log(`📊 Checking ${table}:`);
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Found ${count} rows`);
        if (data && data.length > 0) {
          console.log(`   📋 Columns: ${Object.keys(data[0]).join(', ')}`);
          console.log(`   📝 Sample data:`, data[0]);
        }
      }
    } catch (e) {
      console.error(`   ❌ Exception: ${e.message}`);
    }
    console.log('');
  }

  // Check current user
  console.log('👤 Checking current user session:');
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('   ❌ No authenticated user:', userError.message);
  } else {
    console.log('   ✅ User:', user.user?.email || 'Anonymous');
    console.log('   🆔 User ID:', user.user?.id || 'None');
  }

  // Test RLS policies by trying to insert a test tenant
  console.log('\n🧪 Testing tenant creation:');
  try {
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Test Tenant',
        email: 'test@example.com',
        status: 'active'
      })
      .select()
      .single();

    if (tenantError) {
      console.error('   ❌ Cannot create tenant:', tenantError.message);
      console.error('   Code:', tenantError.code);
      if (tenantError.details) console.error('   Details:', tenantError.details);
    } else {
      console.log('   ✅ Created test tenant:', newTenant.id);
      
      // Clean up - delete the test tenant
      await supabase.from('tenants').delete().eq('id', newTenant.id);
      console.log('   🧹 Cleaned up test tenant');
    }
  } catch (e) {
    console.error('   ❌ Exception:', e.message);
  }
}

checkData().catch(console.error);