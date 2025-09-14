// Database Structure Test
// This will help us verify what tables exist and their structure

import supabase from './src/lib/supabase.js';

async function testDatabaseStructure() {
  console.log('🔍 Testing Database Structure...');
  
  try {
    // Test 1: Check if clients table works
    console.log('\n1. Testing clients table...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.error('❌ Clients table error:', clientsError);
    } else {
      console.log('✅ Clients table accessible');
      if (clients && clients.length > 0) {
        console.log('📋 Sample client structure:', Object.keys(clients[0]));
      }
    }

    // Test 2: Check if client_communications table exists
    console.log('\n2. Testing client_communications table...');
    const { data: comms, error: commsError } = await supabase
      .from('client_communications')
      .select('*')
      .limit(1);
    
    if (commsError) {
      console.error('❌ Client communications table error:', commsError);
      console.log('🔧 This table likely needs to be created');
    } else {
      console.log('✅ Client communications table accessible');
      if (comms && comms.length > 0) {
        console.log('📋 Sample communication structure:', Object.keys(comms[0]));
      }
    }

    // Test 3: Check if client_activities table exists
    console.log('\n3. Testing client_activities table...');
    const { data: activities, error: activitiesError } = await supabase
      .from('client_activities')
      .select('*')
      .limit(1);
    
    if (activitiesError) {
      console.error('❌ Client activities table error:', activitiesError);
      console.log('🔧 This table likely needs to be created');
    } else {
      console.log('✅ Client activities table accessible');
      if (activities && activities.length > 0) {
        console.log('📋 Sample activity structure:', Object.keys(activities[0]));
      }
    }

    // Test 4: Check all available tables
    console.log('\n4. Checking available tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list');
    
    if (tablesError) {
      console.log('ℹ️ Cannot get table list via RPC, trying direct query...');
      // Alternative approach - this might not work in browser but helps in server context
    } else {
      console.log('📋 Available tables:', tables);
    }

    // Test 5: Test the specific query that's failing
    console.log('\n5. Testing the failing query...');
    const { data: recentComms, error: recentCommsError } = await supabase
      .from('client_communications')
      .select(`
        *,
        client:clients(name, email, company)
      `)
      .eq('tenant_id', '6d34271a-4cfc-4024-853a-8dc934aee446')
      .order('date', { ascending: false })
      .limit(20);
    
    if (recentCommsError) {
      console.error('❌ Recent communications query failed:', recentCommsError);
      console.log('🔧 This is the query causing the 400 error');
    } else {
      console.log('✅ Recent communications query succeeded');
      console.log('📋 Results:', recentComms);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDatabaseStructure().then(() => {
  console.log('\n🏁 Database structure test complete');
});

export { testDatabaseStructure };