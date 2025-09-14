-- Migration: Add CRM functionality to existing database
-- File: 20250914150000_add_crm_tables.sql

-- First, let's add missing columns to the existing clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'prospect', 'inactive', 'lead')),
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'standard' CHECK (tier IN ('premium', 'standard', 'basic')),
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS satisfaction_score integer DEFAULT 7 CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
ADD COLUMN IF NOT EXISTS satisfaction_feedback text,
ADD COLUMN IF NOT EXISTS payment_terms integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS preferred_contact text DEFAULT 'email' CHECK (preferred_contact IN ('email', 'phone', 'sms', 'whatsapp')),
ADD COLUMN IF NOT EXISTS last_contact_date timestamptz;

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_communications_tenant_id ON public.client_communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_client_id ON public.client_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_date ON public.client_communications(date DESC);

CREATE INDEX IF NOT EXISTS idx_client_activities_tenant_id ON public.client_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON public.client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_date ON public.client_activities(date DESC);

CREATE INDEX IF NOT EXISTS idx_client_notes_tenant_id ON public.client_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON public.client_notes(client_id);

CREATE INDEX IF NOT EXISTS idx_client_reminders_tenant_id ON public.client_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_client_id ON public.client_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_date ON public.client_reminders(reminder_date);

-- Add indexes to clients table for CRM functionality
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_tier ON public.clients(tier);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING gin(tags);

-- Disable RLS to match existing pattern
ALTER TABLE public.client_communications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_reminders DISABLE ROW LEVEL SECURITY;