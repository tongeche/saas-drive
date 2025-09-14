-- Migration to fix CRM table schema mismatches
-- This corrects the ID type mismatches between existing tables and application expectations

-- First, drop existing CRM tables to recreate them with correct schema
DROP TABLE IF EXISTS client_relationships CASCADE;
DROP TABLE IF EXISTS client_notes CASCADE;
DROP TABLE IF EXISTS client_reminders CASCADE;
DROP TABLE IF EXISTS client_communications CASCADE;
DROP TABLE IF EXISTS client_activities CASCADE;

-- Drop the view that depends on these tables
DROP VIEW IF EXISTS client_interaction_summary CASCADE;
DROP VIEW IF EXISTS crm_dashboard CASCADE;

-- Drop the function that depends on these tables
DROP FUNCTION IF EXISTS get_client_stats CASCADE;
DROP FUNCTION IF EXISTS update_client_last_contact CASCADE;

-- Recreate client_communications with UUID foreign keys to match existing schema
CREATE TABLE client_communications (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    client_id uuid not null references clients(id) on delete cascade,
    type varchar(50) not null, -- email, phone, sms, whatsapp, letter
    direction varchar(20) not null, -- inbound, outbound
    subject varchar(255),
    content text,
    date timestamptz not null default now(),
    status varchar(50) default 'sent', -- sent, delivered, read, failed
    sender varchar(255),
    recipient varchar(255),
    external_id varchar(255),
    attachments jsonb default '[]'::jsonb,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create indexes for client_communications
CREATE INDEX idx_client_communications_tenant ON client_communications(tenant_id);
CREATE INDEX idx_client_communications_client ON client_communications(client_id);
CREATE INDEX idx_client_communications_type ON client_communications(type);
CREATE INDEX idx_client_communications_direction ON client_communications(direction);
CREATE INDEX idx_client_communications_status ON client_communications(status);
CREATE INDEX idx_client_communications_date ON client_communications(date);

-- Create client_activities with UUID foreign keys
CREATE TABLE client_activities (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    client_id uuid not null references clients(id) on delete cascade,
    type varchar(50) not null, -- call, email, meeting, note, task, status_change
    title varchar(255) not null,
    description text,
    date timestamptz not null default now(),
    duration integer, -- duration in minutes for calls/meetings
    outcome varchar(50), -- positive, negative, neutral, completed, pending
    next_action text,
    priority varchar(20) default 'medium', -- high, medium, low
    assigned_to varchar(255),
    completed boolean default false,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create indexes for client_activities
CREATE INDEX idx_client_activities_tenant ON client_activities(tenant_id);
CREATE INDEX idx_client_activities_client ON client_activities(client_id);
CREATE INDEX idx_client_activities_type ON client_activities(type);
CREATE INDEX idx_client_activities_date ON client_activities(date);
CREATE INDEX idx_client_activities_outcome ON client_activities(outcome);
CREATE INDEX idx_client_activities_completed ON client_activities(completed);

-- Create client_reminders with UUID foreign keys
CREATE TABLE client_reminders (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    client_id uuid not null references clients(id) on delete cascade,
    title varchar(255) not null,
    description text,
    reminder_date timestamptz not null,
    type varchar(50) default 'follow_up', -- follow_up, call, email, meeting, payment, renewal
    priority varchar(20) default 'medium', -- high, medium, low
    completed boolean default false,
    completed_at timestamptz,
    assigned_to varchar(255),
    snooze_until timestamptz,
    recurrence varchar(50), -- none, daily, weekly, monthly, yearly
    recurrence_end timestamptz,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create indexes for client_reminders
CREATE INDEX idx_client_reminders_tenant ON client_reminders(tenant_id);
CREATE INDEX idx_client_reminders_client ON client_reminders(client_id);
CREATE INDEX idx_client_reminders_date ON client_reminders(reminder_date);
CREATE INDEX idx_client_reminders_type ON client_reminders(type);
CREATE INDEX idx_client_reminders_priority ON client_reminders(priority);
CREATE INDEX idx_client_reminders_completed ON client_reminders(completed);

-- Create client_notes with UUID foreign keys
CREATE TABLE client_notes (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    client_id uuid not null references clients(id) on delete cascade,
    title varchar(255),
    content text not null,
    tags jsonb default '[]'::jsonb,
    is_private boolean default false,
    created_by varchar(255),
    updated_by varchar(255),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create indexes for client_notes
CREATE INDEX idx_client_notes_tenant ON client_notes(tenant_id);
CREATE INDEX idx_client_notes_client ON client_notes(client_id);
CREATE INDEX idx_client_notes_tags ON client_notes USING GIN(tags);
CREATE INDEX idx_client_notes_private ON client_notes(is_private);

-- Add missing columns to clients table if they don't exist
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company varchar(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status varchar(20) default 'active';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tier varchar(20) default 'standard';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS satisfaction_score integer;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS satisfaction_feedback text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_terms integer default 30;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferred_contact varchar(20) default 'email';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags jsonb default '[]'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contact_date timestamptz;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website varchar(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry varchar(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS employee_count integer;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS annual_revenue decimal(15,2);

-- Create indexes for the new client columns
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_tier ON clients(tier);
CREATE INDEX IF NOT EXISTS idx_clients_satisfaction ON clients(satisfaction_score);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON clients(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_client_activities_updated_at ON client_activities;
CREATE TRIGGER update_client_activities_updated_at
    BEFORE UPDATE ON client_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_reminders_updated_at ON client_reminders;
CREATE TRIGGER update_client_reminders_updated_at
    BEFORE UPDATE ON client_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_notes_updated_at ON client_notes;
CREATE TRIGGER update_client_notes_updated_at
    BEFORE UPDATE ON client_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_communications_updated_at ON client_communications;
CREATE TRIGGER update_client_communications_updated_at
    BEFORE UPDATE ON client_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for server-side access (matching the original schema)
ALTER TABLE client_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_communications DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes DISABLE ROW LEVEL SECURITY;

-- Function to get client statistics (recreated with correct types)
CREATE OR REPLACE FUNCTION get_client_stats(p_tenant_id uuid)
RETURNS TABLE (
    total_clients bigint,
    active_clients bigint,
    prospect_clients bigint,
    inactive_clients bigint,
    total_revenue numeric,
    avg_satisfaction numeric,
    activities_this_month bigint,
    communications_this_month bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint as total_clients,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END)::bigint as active_clients,
        COUNT(CASE WHEN c.status = 'prospect' THEN 1 END)::bigint as prospect_clients,
        COUNT(CASE WHEN c.status = 'inactive' THEN 1 END)::bigint as inactive_clients,
        COALESCE(SUM(i.total), 0)::numeric as total_revenue,
        ROUND(AVG(c.satisfaction_score), 2)::numeric as avg_satisfaction,
        COUNT(DISTINCT CASE WHEN ca.created_at >= date_trunc('month', CURRENT_DATE) THEN ca.id END)::bigint as activities_this_month,
        COUNT(DISTINCT CASE WHEN cc.created_at >= date_trunc('month', CURRENT_DATE) THEN cc.id END)::bigint as communications_this_month
    FROM clients c
    LEFT JOIN invoices i ON c.id = i.client_id AND i.tenant_id = p_tenant_id
    LEFT JOIN client_activities ca ON c.id = ca.client_id
    LEFT JOIN client_communications cc ON c.id = cc.client_id
    WHERE c.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;