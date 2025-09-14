// Check actual table schemas
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemas() {
  console.log('🔍 Checking actual table schemas...\n');

  // Get table information from information_schema
  const { data: tables, error } = await supabase
    .rpc('get_table_columns', {});

  if (error) {
    console.error('❌ Could not fetch schema info:', error.message);
    
    // Try alternative approach - use raw SQL
    console.log('\n🔄 Trying alternative approach...');
    
    const { data: tenantCols, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .limit(0); // Get structure without data

    if (tenantError) {
      console.error('❌ Error getting tenant structure:', tenantError.message);
    } else {
      console.log('✅ Could get tenant table metadata');
    }

    // Let's try to infer the structure by attempting various inserts
    console.log('\n🧪 Testing column existence:');
    
    const testColumns = ['id', 'name', 'email', 'created_at', 'updated_at', 'status', 'user_id'];
    
    for (const col of testColumns) {
      try {
        const { error: testError } = await supabase
          .from('tenants')
          .insert({ [col]: col === 'id' ? 'test-id' : 'test-value' })
          .select();
        
        if (testError) {
          if (testError.message.includes(`Could not find the '${col}' column`)) {
            console.log(`   ❌ Column '${col}' does not exist`);
          } else if (testError.message.includes('duplicate key') || testError.message.includes('violates')) {
            console.log(`   ✅ Column '${col}' exists (but insert failed for other reasons)`);
          } else {
            console.log(`   ❓ Column '${col}' - unclear: ${testError.message}`);
          }
        } else {
          console.log(`   ✅ Column '${col}' exists and insert worked`);
          // Clean up the test insert
          await supabase.from('tenants').delete().eq(col, col === 'id' ? 'test-id' : 'test-value');
        }
      } catch (e) {
        console.log(`   ❌ Exception testing '${col}': ${e.message}`);
      }
    }
    
    return;
  }

  console.log('✅ Successfully fetched schema information');
  console.log(tables);
}

checkSchemas().catch(console.error);