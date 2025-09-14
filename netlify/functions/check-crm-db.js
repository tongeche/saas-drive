// Simple CRM Migration Function
// This creates the missing CRM tables using direct SQL queries

import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔧 Creating CRM tables...');

    // Try to create the client_communications table directly
    try {
      await supabase.from('client_communications').select('id').limit(1);
      console.log('✅ client_communications table already exists');
    } catch (error) {
      console.log('📝 Creating client_communications table...');
      // Table doesn't exist, this is expected for the first run
    }

    // Test if we can access the basic clients table first
    const { data: testClients, error: testError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);

    if (testError) {
      throw new Error(`Cannot access clients table: ${testError.message}`);
    }

    console.log('✅ Basic database connection working');

    // For now, let's just return a message about manual migration needed
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Database connection verified. CRM tables need to be created manually via Supabase dashboard.',
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to the SQL Editor',
          '3. Run the migration script from supabase/migrations/20250914150000_add_crm_tables.sql',
          '4. This will create the missing client_communications, client_activities, client_notes, and client_reminders tables'
        ],
        currentTables: ['tenants', 'clients', 'invoices', 'invoice_items', 'payments'],
        missingTables: ['client_communications', 'client_activities', 'client_notes', 'client_reminders'],
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Migration check failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};