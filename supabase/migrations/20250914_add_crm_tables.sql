-- Migration to add CRM tables
-- This will create the missing CRM tables needed for the application

-- Add missing columns to the clients table if they don't exist
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='status') THEN
        ALTER TABLE public.clients ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'prospect', 'inactive', 'lead'));
    END IF;
    
    -- Add tier column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='tier') THEN
        ALTER TABLE public.clients ADD COLUMN tier text DEFAULT 'standard' CHECK (tier IN ('premium', 'standard', 'basic'));
    END IF;
    
    -- Add company column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='company') THEN
        ALTER TABLE public.clients ADD COLUMN company text;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='tags') THEN
        ALTER TABLE public.clients ADD COLUMN tags text[] DEFAULT '{}';
    END IF;
    
    -- Add satisfaction_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='satisfaction_score') THEN
        ALTER TABLE public.clients ADD COLUMN satisfaction_score integer DEFAULT 7 CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10);
    END IF;
    
    -- Add satisfaction_feedback column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='satisfaction_feedback') THEN
        ALTER TABLE public.clients ADD COLUMN satisfaction_feedback text;
    END IF;
    
    -- Add payment_terms column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='payment_terms') THEN
        ALTER TABLE public.clients ADD COLUMN payment_terms integer DEFAULT 30;
    END IF;
    
    -- Add preferred_contact column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='preferred_contact') THEN
        ALTER TABLE public.clients ADD COLUMN preferred_contact text DEFAULT 'email' CHECK (preferred_contact IN ('email', 'phone', 'sms', 'whatsapp'));
    END IF;
    
    -- Add last_contact_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='last_contact_date') THEN
        ALTER TABLE public.clients ADD COLUMN last_contact_date timestamptz;
    END IF;
END $$;

-- Create client_communications table
CREATE TABLE IF NOT EXISTS public.client_communications (
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
);

-- Create client_activities table
CREATE TABLE IF NOT EXISTS public.client_activities (
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
);

-- Create client_notes table
CREATE TABLE IF NOT EXISTS public.client_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title text,
    content text NOT NULL,
    is_private boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create client_reminders table
CREATE TABLE IF NOT EXISTS public.client_reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    reminder_date timestamptz NOT NULL,
    completed boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_communications_tenant_id ON public.client_communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_client_id ON public.client_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_date ON public.client_communications(date DESC);
CREATE INDEX IF NOT EXISTS idx_client_communications_type ON public.client_communications(type);

CREATE INDEX IF NOT EXISTS idx_client_activities_tenant_id ON public.client_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON public.client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_date ON public.client_activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_client_activities_type ON public.client_activities(type);

CREATE INDEX IF NOT EXISTS idx_client_notes_tenant_id ON public.client_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON public.client_notes(client_id);

CREATE INDEX IF NOT EXISTS idx_client_reminders_tenant_id ON public.client_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_client_id ON public.client_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_date ON public.client_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_client_reminders_completed ON public.client_reminders(completed);

-- Add indexes to clients table for CRM functionality
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_tier ON public.clients(tier);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING gin(tags);

-- Enable RLS (if needed)
ALTER TABLE public.client_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (optional - can be disabled for server-side access)
-- These are commented out since the current app uses server-side access
/*
CREATE POLICY "Users can access their tenant's client communications" ON public.client_communications
    FOR ALL USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_email = auth.email()));

CREATE POLICY "Users can access their tenant's client activities" ON public.client_activities
    FOR ALL USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_email = auth.email()));

CREATE POLICY "Users can access their tenant's client notes" ON public.client_notes
    FOR ALL USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_email = auth.email()));

CREATE POLICY "Users can access their tenant's client reminders" ON public.client_reminders
    FOR ALL USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_email = auth.email()));
*/

-- For now, disable RLS to match existing pattern
ALTER TABLE public.client_communications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_reminders DISABLE ROW LEVEL SECURITY;