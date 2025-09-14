// Test current RLS state and see what's accessible
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function checkRlsAndAccess() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔐 Checking RLS and table access...\n');

  // Test 1: Check if we can read existing data from tables
  console.log('1. Testing read access to existing data:');
  
  const tables = ['tenants', 'clients', 'client_communications'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: accessible, ${count} rows`);
        if (data && data.length > 0) {
          console.log(`      Sample columns: ${Object.keys(data[0]).slice(0, 5).join(', ')}...`);
        }
      }
    } catch (e) {
      console.log(`   ❌ ${table}: Exception - ${e.message}`);
    }
  }

  // Test 2: Check current authentication state
  console.log('\n2. Authentication state:');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('   ❌ Not authenticated');
    console.log('   ℹ️ This explains the RLS policy violations');
  } else {
    console.log('   ✅ Authenticated as:', user.email);
  }

  // Test 3: Try to understand the database state better
  console.log('\n3. Checking if RLS is actually enabled:');
  
  // The original migration shows RLS was disabled for server-side access
  // Let's see if we can query without RLS issues
  try {
    const { data: tenantCount, error: tenantCountError } = await supabase
      .from('tenants')
      .select('id', { count: 'exact', head: true });
      
    if (tenantCountError) {
      console.log('   ❌ RLS blocking access:', tenantCountError.message);
    } else {
      console.log('   ✅ Can query tenants - RLS might be disabled or bypassed');
    }
  } catch (e) {
    console.log('   ❌ Exception:', e.message);
  }
}

checkRlsAndAccess().catch(console.error);