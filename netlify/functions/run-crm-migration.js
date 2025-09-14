const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for DDL operations

exports.handler = async (event, context) => {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Missing Supabase credentials',
          details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured'
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250914200000_fix_crm_schema.sql');
    let migrationSql;
    
    try {
      migrationSql = fs.readFileSync(migrationPath, 'utf8');
    } catch (fileError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Could not read migration file',
          details: fileError.message,
          path: migrationPath
        })
      };
    }

    console.log('📄 Running CRM schema fix migration...');
    console.log('🗂️ Migration file size:', migrationSql.length, 'characters');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSql 
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Migration failed',
          details: error.message,
          code: error.code
        })
      };
    }

    console.log('✅ Migration completed successfully');

    // Verify the tables were created correctly
    const { data: tables, error: verifyError } = await supabase
      .from('client_communications')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.warn('⚠️ Migration ran but verification failed:', verifyError.message);
    } else {
      console.log('✅ Verification passed - client_communications table accessible');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'CRM schema fix migration completed successfully',
        migrationSize: migrationSql.length,
        verificationPassed: !verifyError
      })
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Unexpected error during migration',
        details: error.message
      })
    };
  }
};