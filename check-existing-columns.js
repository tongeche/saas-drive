// Check what columns actually exist in client_communications
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function checkExistingColumns() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Discovering existing table structure...\n');

  // Try to select with various possible columns one by one
  const possibleColumns = [
    'id', 'created_at', 'updated_at', 
    'tenant_id', 'client_id',
    'type', 'direction', 'status',
    'subject', 'content', 'date',
    'sender', 'recipient', 'external_id',
    'attachments', 'metadata'
  ];

  const existingColumns = [];
  const missingColumns = [];

  for (const col of possibleColumns) {
    try {
      const { error } = await supabase
        .from('client_communications')
        .select(col)
        .limit(1);
      
      if (error) {
        missingColumns.push(col);
        console.log(`❌ Missing: ${col}`);
      } else {
        existingColumns.push(col);
        console.log(`✅ Exists: ${col}`);
      }
    } catch (e) {
      missingColumns.push(col);
      console.log(`❌ Error checking ${col}: ${e.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log('✅ Existing columns:', existingColumns.join(', '));
  console.log('❌ Missing columns:', missingColumns.join(', '));

  // Try to get actual data to see the structure
  console.log('\n📋 Sample data structure:');
  const { data, error } = await supabase
    .from('client_communications')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error getting sample data:', error.message);
  } else if (data && data.length > 0) {
    console.log('Available columns from data:', Object.keys(data[0]));
  } else {
    console.log('Table is empty');
  }

  return { existingColumns, missingColumns };
}

checkExistingColumns().catch(console.error);