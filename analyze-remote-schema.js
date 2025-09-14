// Comprehensive Supabase schema analyzer
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function analyzeRemoteSchema() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 COMPREHENSIVE REMOTE SUPABASE SCHEMA ANALYSIS');
  console.log('==================================================\n');

  // Step 1: Get all tables in the public schema
  console.log('1️⃣ DISCOVERING ALL TABLES IN PUBLIC SCHEMA\n');
  
  const allTables = [
    'tenants', 'clients', 'invoices', 'invoice_items', 'payments',
    'client_communications', 'client_activities', 'client_notes', 'client_reminders',
    'quotes', 'quote_items', 'receipts', 'items', 'cashflow',
    'user_tenants' // Check if this exists too
  ];

  const existingTables = [];
  const missingTables = [];

  for (const table of allTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(0); // Just get metadata, no actual data

      if (error) {
        missingTables.push(table);
        console.log(`❌ ${table} - NOT FOUND (${error.message})`);
      } else {
        existingTables.push(table);
        console.log(`✅ ${table} - EXISTS (${count} rows)`);
      }
    } catch (e) {
      missingTables.push(table);
      console.log(`❌ ${table} - ERROR (${e.message})`);
    }
  }

  console.log(`\n📊 SUMMARY: ${existingTables.length} tables exist, ${missingTables.length} missing\n`);

  // Step 2: Analyze CRM tables in detail
  console.log('2️⃣ DETAILED CRM TABLES ANALYSIS\n');
  
  const crmTables = ['client_communications', 'client_activities', 'client_notes', 'client_reminders'];
  const crmTableAnalysis = {};

  for (const table of crmTables) {
    if (existingTables.includes(table)) {
      console.log(`📋 ANALYZING: ${table.toUpperCase()}`);
      console.log('-'.repeat(50));

      // Test all possible columns
      const possibleColumns = [
        'id', 'created_at', 'updated_at',
        'tenant_id', 'client_id',
        'type', 'direction', 'status',
        'title', 'subject', 'content', 'description',
        'date', 'reminder_date',
        'outcome', 'completed', 'is_private',
        'sender', 'recipient', 'external_id',
        'attachments', 'metadata', 'tags'
      ];

      const tableColumns = {
        existing: [],
        missing: []
      };

      for (const col of possibleColumns) {
        try {
          const { error } = await supabase
            .from(table)
            .select(col)
            .limit(1);
          
          if (error) {
            if (error.message.includes('does not exist')) {
              tableColumns.missing.push(col);
            }
          } else {
            tableColumns.existing.push(col);
          }
        } catch (e) {
          if (e.message.includes('does not exist')) {
            tableColumns.missing.push(col);
          }
        }
      }

      console.log(`   ✅ EXISTING COLUMNS (${tableColumns.existing.length}):`);
      console.log(`      ${tableColumns.existing.join(', ')}`);
      
      if (tableColumns.missing.length > 0) {
        console.log(`   ❌ MISSING COLUMNS (${tableColumns.missing.length}):`);
        console.log(`      ${tableColumns.missing.join(', ')}`);
      }

      // Get sample data to understand structure
      try {
        const { data: sampleData } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (sampleData && sampleData.length > 0) {
          console.log(`   📄 SAMPLE DATA STRUCTURE:`);
          const sample = sampleData[0];
          Object.keys(sample).forEach(key => {
            const value = sample[key];
            const type = value === null ? 'null' : typeof value;
            console.log(`      ${key}: ${type}`);
          });
        } else {
          console.log(`   📄 TABLE IS EMPTY`);
        }
      } catch (e) {
        console.log(`   ❌ Could not get sample data: ${e.message}`);
      }

      crmTableAnalysis[table] = tableColumns;
      console.log('');
    } else {
      console.log(`❌ ${table.toUpperCase()} - TABLE DOES NOT EXIST\n`);
      crmTableAnalysis[table] = { existing: [], missing: ['TABLE_MISSING'] };
    }
  }

  // Step 3: Check clients table for CRM extensions
  console.log('3️⃣ CLIENTS TABLE CRM EXTENSIONS\n');
  
  if (existingTables.includes('clients')) {
    console.log('📋 ANALYZING: CLIENTS TABLE CRM COLUMNS');
    console.log('-'.repeat(50));

    const clientsCrmColumns = [
      'status', 'tier', 'company', 'tags', 
      'satisfaction_score', 'satisfaction_feedback',
      'payment_terms', 'preferred_contact', 'last_contact_date'
    ];

    const clientsAnalysis = { existing: [], missing: [] };

    for (const col of clientsCrmColumns) {
      try {
        const { error } = await supabase
          .from('clients')
          .select(col)
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          clientsAnalysis.missing.push(col);
        } else {
          clientsAnalysis.existing.push(col);
        }
      } catch (e) {
        if (e.message.includes('does not exist')) {
          clientsAnalysis.missing.push(col);
        }
      }
    }

    console.log(`   ✅ EXISTING CRM COLUMNS (${clientsAnalysis.existing.length}):`);
    console.log(`      ${clientsAnalysis.existing.join(', ') || 'None'}`);
    
    console.log(`   ❌ MISSING CRM COLUMNS (${clientsAnalysis.missing.length}):`);
    console.log(`      ${clientsAnalysis.missing.join(', ') || 'None'}`);

    crmTableAnalysis['clients_crm'] = clientsAnalysis;
  }

  // Step 4: Generate migration analysis
  console.log('\n4️⃣ MIGRATION REQUIREMENTS ANALYSIS\n');
  console.log('📋 WHAT NEEDS TO BE CREATED/FIXED:');
  console.log('-'.repeat(50));

  let requiresMigration = false;

  // Check each CRM table
  for (const [table, analysis] of Object.entries(crmTableAnalysis)) {
    if (analysis.missing.includes('TABLE_MISSING')) {
      console.log(`❌ CREATE TABLE: ${table}`);
      requiresMigration = true;
    } else if (analysis.missing.length > 0) {
      console.log(`⚠️  ADD COLUMNS TO ${table}: ${analysis.missing.join(', ')}`);
      requiresMigration = true;
    } else {
      console.log(`✅ ${table}: Complete`);
    }
  }

  if (!requiresMigration) {
    console.log('🎉 ALL CRM TABLES AND COLUMNS EXIST!');
  }

  // Step 5: Test actual CRM queries
  console.log('\n5️⃣ TESTING ACTUAL CRM QUERIES\n');
  
  if (existingTables.includes('client_communications')) {
    console.log('🧪 Testing getRecentCommunications query...');
    
    try {
      // Get a real tenant ID if any exist
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);

      const testTenantId = tenants && tenants.length > 0 
        ? tenants[0].id 
        : '00000000-0000-0000-0000-000000000000'; // Dummy ID

      const { data: commData, error: commError } = await supabase
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
        .eq('tenant_id', testTenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (commError) {
        console.log(`   ❌ Query failed: ${commError.message}`);
      } else {
        console.log(`   ✅ Query successful: Found ${commData.length} records`);
      }
    } catch (e) {
      console.log(`   ❌ Query exception: ${e.message}`);
    }
  }

  console.log('\n🏁 ANALYSIS COMPLETE');
  console.log('===================');
  
  return {
    existingTables,
    missingTables,
    crmTableAnalysis,
    requiresMigration
  };
}

analyzeRemoteSchema().catch(console.error);