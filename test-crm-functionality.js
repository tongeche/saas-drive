// Test the CRM functionality with the current schema
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function testCrmWithCurrentSchema() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🧪 Testing CRM with current schema...\n');

  // Test 1: Create a test tenant
  console.log('1. Creating test tenant:');
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      slug: 'test-crm-' + Date.now(),
      business_name: 'Test CRM Business',
      currency: 'EUR',
      timezone: 'Europe/Lisbon'
    })
    .select()
    .single();

  if (tenantError) {
    console.error('   ❌ Failed to create tenant:', tenantError.message);
    return;
  }
  console.log('   ✅ Created tenant:', tenant.id);

  // Test 2: Create a test client
  console.log('\n2. Creating test client:');
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      tenant_id: tenant.id,
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1234567890'
    })
    .select()
    .single();

  if (clientError) {
    console.error('   ❌ Failed to create client:', clientError.message);
  } else {
    console.log('   ✅ Created client:', client.id);
  }

  // Test 3: Test the CRM query (our simplified version)
  console.log('\n3. Testing CRM communications query:');
  const { data: communications, error: commError } = await supabase
    .from('client_communications')
    .select(`
      id,
      tenant_id,
      client_id,
      type,
      direction,
      subject,
      content,
      created_at,
      status
    `)
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (commError) {
    console.error('   ❌ CRM query failed:', commError.message);
  } else {
    console.log('   ✅ CRM query successful (found', communications.length, 'records)');
  }

  // Test 4: Create a test communication
  console.log('\n4. Creating test communication:');
  if (client) {
    const { data: newComm, error: commCreateError } = await supabase
      .from('client_communications')
      .insert({
        tenant_id: tenant.id,
        client_id: client.id,
        type: 'email',
        direction: 'outbound',
        subject: 'Welcome to our CRM',
        content: 'This is a test communication from our CRM system.'
      })
      .select()
      .single();

    if (commCreateError) {
      console.error('   ❌ Failed to create communication:', commCreateError.message);
    } else {
      console.log('   ✅ Created communication:', newComm.id);

      // Test 5: Query the communication back
      console.log('\n5. Querying communication back:');
      const { data: queriedComm, error: queryError } = await supabase
        .from('client_communications')
        .select(`
          id,
          tenant_id,
          client_id,
          type,
          direction,
          subject,
          content,
          created_at,
          status
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (queryError) {
        console.error('   ❌ Query failed:', queryError.message);
      } else {
        console.log('   ✅ Found', queriedComm.length, 'communications');
        if (queriedComm.length > 0) {
          console.log('   📝 Sample communication:', {
            subject: queriedComm[0].subject,
            type: queriedComm[0].type,
            direction: queriedComm[0].direction
          });
        }
      }
    }
  }

  // Clean up
  console.log('\n🧹 Cleaning up test data...');
  if (client) {
    await supabase.from('client_communications').delete().eq('client_id', client.id);
    await supabase.from('clients').delete().eq('id', client.id);
  }
  await supabase.from('tenants').delete().eq('id', tenant.id);
  console.log('   ✅ Test data cleaned up');

  console.log('\n🎉 CRM functionality test completed!');
}

testCrmWithCurrentSchema().catch(console.error);