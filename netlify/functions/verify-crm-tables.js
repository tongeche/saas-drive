// Verify CRM table structure and test queries
// This function will help us understand what's causing the 400 errors

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

    console.log('🔍 Verifying CRM table structure...');

    const results = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    // Test each CRM table
    const crmTables = [
      'clients',
      'client_communications',
      'client_activities', 
      'client_notes',
      'client_reminders'
    ];

    for (const tableName of crmTables) {
      console.log(`Testing table: ${tableName}`);
      
      try {
        // Test basic select
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          results.tables[tableName] = {
            exists: false,
            error: error.message,
            code: error.code
          };
        } else {
          results.tables[tableName] = {
            exists: true,
            rowCount: data.length,
            structure: data.length > 0 ? Object.keys(data[0]) : 'empty table'
          };
        }
      } catch (err) {
        results.tables[tableName] = {
          exists: false,
          error: err.message,
          exception: true
        };
      }
    }

    // Test the specific failing query from the error
    console.log('🧪 Testing the failing communications query...');
    try {
      const { data: commsData, error: commsError } = await supabase
        .from('client_communications')
        .select(`
          *,
          client:clients(name, email, company)
        `)
        .limit(1);

      results.communicationsQueryTest = {
        success: !commsError,
        error: commsError?.message,
        data: commsData?.length || 0
      };
    } catch (err) {
      results.communicationsQueryTest = {
        success: false,
        error: err.message,
        exception: true
      };
    }

    // Test with a specific tenant ID if provided
    const tenantId = event.queryStringParameters?.tenant_id;
    if (tenantId) {
      console.log(`🎯 Testing with tenant ID: ${tenantId}`);
      try {
        const { data: tenantComms, error: tenantError } = await supabase
          .from('client_communications')
          .select(`
            *,
            client:clients(name, email, company)
          `)
          .eq('tenant_id', tenantId)
          .order('date', { ascending: false })
          .limit(20);

        results.tenantSpecificTest = {
          tenantId,
          success: !tenantError,
          error: tenantError?.message,
          code: tenantError?.code,
          dataCount: tenantComms?.length || 0
        };
      } catch (err) {
        results.tenantSpecificTest = {
          tenantId,
          success: false,
          error: err.message,
          exception: true
        };
      }
    }

    // Check clients table structure specifically
    console.log('📋 Checking clients table structure...');
    try {
      const { data: clientSample, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

      if (!clientError && clientSample.length > 0) {
        results.clientsTableStructure = {
          columns: Object.keys(clientSample[0]),
          hasCrmColumns: {
            status: 'status' in clientSample[0],
            tier: 'tier' in clientSample[0],
            company: 'company' in clientSample[0],
            tags: 'tags' in clientSample[0]
          }
        };
      }
    } catch (err) {
      results.clientsTableStructure = {
        error: err.message
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results, null, 2)
    };

  } catch (error) {
    console.error('❌ Table verification failed:', error);
    
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