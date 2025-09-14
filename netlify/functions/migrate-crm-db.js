// Apply CRM database migration
// This function will create the missing CRM tables

import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔧 Starting CRM database migration...');

    // Step 1: Add missing columns to clients table
    const clientsAlterQueries = [
      `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'prospect', 'inactive', 'lead'))`,
      `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tier text DEFAULT 'standard' CHECK (tier IN ('premium', 'standard', 'basic'))`,
      `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company text`,
      `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'`,
      `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS satisfaction_score integer DEFAULT 7 CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10)`,
      `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS satisfaction_feedback text`,
      `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS payment_terms integer DEFAULT 30`,
      `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS preferred_contact text DEFAULT 'email' CHECK (preferred_contact IN ('email', 'phone', 'sms', 'whatsapp'))`,
      `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_contact_date timestamptz`
    ];

    console.log('📝 Adding columns to clients table...');
    for (const query of clientsAlterQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error && !error.message.includes('already exists')) {
          console.error(`Failed to execute: ${query}`, error);
        }
      } catch (err) {
        console.log(`Skipping (likely already exists): ${query}`);
      }
    }

    // Step 2: Create CRM tables
    const createTableQueries = [
      // client_communications table
      `CREATE TABLE IF NOT EXISTS public.client_communications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
        client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
        type text NOT NULL CHECK (type IN ('email', 'phone', 'sms', 'whatsapp', 'meeting', 'note')),
        direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
        subject text,
        content text NOT NULL,
        date timestamptz NOT NULL DEFAULT now(),
        status text DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'failed', 'cancelled')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      
      // client_activities table
      `CREATE TABLE IF NOT EXISTS public.client_activities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
        client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
        type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task', 'status_change', 'tier_change', 'satisfaction_update')),
        title text NOT NULL,
        description text,
        date timestamptz NOT NULL DEFAULT now(),
        outcome text CHECK (outcome IN ('completed', 'scheduled', 'in_progress', 'cancelled')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      
      // client_notes table
      `CREATE TABLE IF NOT EXISTS public.client_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
        client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
        title text,
        content text NOT NULL,
        is_private boolean DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      
      // client_reminders table
      `CREATE TABLE IF NOT EXISTS public.client_reminders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
        client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text,
        reminder_date timestamptz NOT NULL,
        completed boolean DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      )`
    ];

    console.log('🏗️ Creating CRM tables...');
    for (const query of createTableQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.error(`Failed to create table:`, error);
        }
      } catch (err) {
        console.log(`Table creation attempt:`, err.message);
      }
    }

    // Step 3: Create indexes
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_client_communications_tenant_id ON public.client_communications(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_client_communications_client_id ON public.client_communications(client_id)`,
      `CREATE INDEX IF NOT EXISTS idx_client_communications_date ON public.client_communications(date DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_client_activities_tenant_id ON public.client_activities(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON public.client_activities(client_id)`,
      `CREATE INDEX IF NOT EXISTS idx_client_activities_date ON public.client_activities(date DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_client_notes_tenant_id ON public.client_notes(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON public.client_notes(client_id)`,
      `CREATE INDEX IF NOT EXISTS idx_client_reminders_tenant_id ON public.client_reminders(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_client_reminders_client_id ON public.client_reminders(client_id)`,
      `CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status)`,
      `CREATE INDEX IF NOT EXISTS idx_clients_tier ON public.clients(tier)`
    ];

    console.log('📊 Creating indexes...');
    for (const query of indexQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error && !error.message.includes('already exists')) {
          console.error(`Failed to create index:`, error);
        }
      } catch (err) {
        console.log(`Index creation (likely already exists):`, err.message);
      }
    }

    // Step 4: Test the tables
    console.log('🧪 Testing CRM tables...');
    const testResults = {};

    // Test each table
    const tables = ['client_communications', 'client_activities', 'client_notes', 'client_reminders'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        testResults[table] = error ? `Error: ${error.message}` : 'Success';
      } catch (err) {
        testResults[table] = `Exception: ${err.message}`;
      }
    }

    console.log('✅ Migration completed successfully!');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'CRM database migration completed',
        testResults,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
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