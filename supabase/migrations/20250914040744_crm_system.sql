-- CRM System Database Migration
-- Creates tables for client relationship management, activities, communications, and reminders

-- First, update the existing clients table with CRM fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'standard';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS satisfaction_feedback TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferred_contact VARCHAR(20) DEFAULT 'email';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS annual_revenue DECIMAL(15,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_tier ON clients(tier);
CREATE INDEX IF NOT EXISTS idx_clients_satisfaction ON clients(satisfaction_score);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON clients(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);

-- Client Activities Table
CREATE TABLE IF NOT EXISTS client_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- call, email, meeting, note, task, status_change, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration INTEGER, -- duration in minutes for calls/meetings
    outcome VARCHAR(50), -- positive, negative, neutral, completed, pending
    next_action TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low
    assigned_to VARCHAR(255), -- user who created/is responsible
    completed BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}' -- flexible field for additional data
);

-- Indexes for client_activities
CREATE INDEX IF NOT EXISTS idx_client_activities_tenant ON client_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_client ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_type ON client_activities(type);
CREATE INDEX IF NOT EXISTS idx_client_activities_date ON client_activities(date);
CREATE INDEX IF NOT EXISTS idx_client_activities_outcome ON client_activities(outcome);
CREATE INDEX IF NOT EXISTS idx_client_activities_completed ON client_activities(completed);

-- Client Communications Table
CREATE TABLE IF NOT EXISTS client_communications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- email, phone, sms, whatsapp, letter
    direction VARCHAR(20) NOT NULL, -- inbound, outbound
    subject VARCHAR(255),
    content TEXT,
    sender VARCHAR(255),
    recipient VARCHAR(255),
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read, failed
    external_id VARCHAR(255), -- for tracking emails/messages in external systems
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

-- Indexes for client_communications
CREATE INDEX IF NOT EXISTS idx_client_communications_tenant ON client_communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_client ON client_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_type ON client_communications(type);
CREATE INDEX IF NOT EXISTS idx_client_communications_direction ON client_communications(direction);
CREATE INDEX IF NOT EXISTS idx_client_communications_status ON client_communications(status);

-- Client Reminders Table
CREATE TABLE IF NOT EXISTS client_reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reminder_date TIMESTAMPTZ NOT NULL,
    type VARCHAR(50) DEFAULT 'follow_up', -- follow_up, call, email, meeting, payment, renewal
    priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    assigned_to VARCHAR(255),
    snooze_until TIMESTAMPTZ,
    recurrence VARCHAR(50), -- none, daily, weekly, monthly, yearly
    recurrence_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for client_reminders
CREATE INDEX IF NOT EXISTS idx_client_reminders_tenant ON client_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_client ON client_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_date ON client_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_client_reminders_type ON client_reminders(type);
CREATE INDEX IF NOT EXISTS idx_client_reminders_priority ON client_reminders(priority);
CREATE INDEX IF NOT EXISTS idx_client_reminders_completed ON client_reminders(completed);

-- Client Notes Table (for detailed notes separate from activities)
CREATE TABLE IF NOT EXISTS client_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    tags JSONB DEFAULT '[]',
    is_private BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for client_notes
CREATE INDEX IF NOT EXISTS idx_client_notes_tenant ON client_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_tags ON client_notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_client_notes_private ON client_notes(is_private);

-- Client Relationships Table (for tracking relationships between clients)
CREATE TABLE IF NOT EXISTS client_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    related_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- parent_company, subsidiary, partner, referral, competitor
    description TEXT,
    strength VARCHAR(20) DEFAULT 'medium', -- strong, medium, weak
    metadata JSONB DEFAULT '{}'
);

-- Indexes for client_relationships
CREATE INDEX IF NOT EXISTS idx_client_relationships_tenant ON client_relationships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_client ON client_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_related ON client_relationships(related_client_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_type ON client_relationships(relationship_type);

-- Client Interaction History (summary view for quick access)
CREATE OR REPLACE VIEW client_interaction_summary AS
SELECT 
    c.id as client_id,
    c.tenant_id,
    c.name as client_name,
    c.email,
    c.status,
    c.tier,
    c.satisfaction_score,
    c.last_contact_date,
    COUNT(DISTINCT ca.id) as total_activities,
    COUNT(DISTINCT cc.id) as total_communications,
    COUNT(DISTINCT cr.id) as pending_reminders,
    COUNT(DISTINCT CASE WHEN ca.type = 'call' THEN ca.id END) as total_calls,
    COUNT(DISTINCT CASE WHEN ca.type = 'email' THEN ca.id END) as total_emails,
    COUNT(DISTINCT CASE WHEN ca.type = 'meeting' THEN ca.id END) as total_meetings,
    MAX(ca.date) as last_activity_date,
    MAX(cc.created_at) as last_communication_date
FROM clients c
LEFT JOIN client_activities ca ON c.id = ca.client_id
LEFT JOIN client_communications cc ON c.id = cc.client_id
LEFT JOIN client_reminders cr ON c.id = cr.client_id AND cr.completed = FALSE
GROUP BY c.id, c.tenant_id, c.name, c.email, c.status, c.tier, c.satisfaction_score, c.last_contact_date;

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Row Level Security Policies
ALTER TABLE client_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_relationships ENABLE ROW LEVEL SECURITY;

-- Policies for client_activities
DROP POLICY IF EXISTS "Tenants can view their client activities" ON client_activities;
CREATE POLICY "Users can view client activities from their tenant" ON client_activities
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Tenants can insert their client activities" ON client_activities;
CREATE POLICY "Users can insert client activities for their tenant" ON client_activities
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Tenants can update their client activities" ON client_activities;
CREATE POLICY "Users can update client activities from their tenant" ON client_activities
    FOR UPDATE USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Tenants can delete their client activities" ON client_activities;
CREATE POLICY "Users can delete client activities from their tenant" ON client_activities
    FOR DELETE USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

-- Similar policies for other tables
-- client_communications
DROP POLICY IF EXISTS "Tenants can manage their client communications" ON client_communications;
CREATE POLICY "Users can manage client communications from their tenant" ON client_communications
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

-- client_reminders
DROP POLICY IF EXISTS "Tenants can manage their client reminders" ON client_reminders;
CREATE POLICY "Users can manage client reminders from their tenant" ON client_reminders
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

-- client_notes
DROP POLICY IF EXISTS "Tenants can manage their client notes" ON client_notes;
CREATE POLICY "Users can manage client notes from their tenant" ON client_notes
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

-- client_relationships
DROP POLICY IF EXISTS "Tenants can manage their client relationships" ON client_relationships;
CREATE POLICY "Users can manage client relationships from their tenant" ON client_relationships
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

-- Function to get client statistics
CREATE OR REPLACE FUNCTION get_client_stats(p_tenant_id UUID)
RETURNS TABLE (
    total_clients BIGINT,
    active_clients BIGINT,
    prospect_clients BIGINT,
    inactive_clients BIGINT,
    total_revenue DECIMAL,
    avg_satisfaction DECIMAL,
    activities_this_month BIGINT,
    communications_this_month BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_clients,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END)::BIGINT as active_clients,
        COUNT(CASE WHEN c.status = 'prospect' THEN 1 END)::BIGINT as prospect_clients,
        COUNT(CASE WHEN c.status = 'inactive' THEN 1 END)::BIGINT as inactive_clients,
        COALESCE(SUM(i.total), 0) as total_revenue,
        ROUND(AVG(c.satisfaction_score), 2) as avg_satisfaction,
        COUNT(DISTINCT CASE WHEN ca.created_at >= date_trunc('month', CURRENT_DATE) THEN ca.id END)::BIGINT as activities_this_month,
        COUNT(DISTINCT CASE WHEN cc.created_at >= date_trunc('month', CURRENT_DATE) THEN cc.id END)::BIGINT as communications_this_month
    FROM clients c
    LEFT JOIN invoices i ON c.id = i.client_id AND i.tenant_id = p_tenant_id
    LEFT JOIN client_activities ca ON c.id = ca.client_id
    LEFT JOIN client_communications cc ON c.id = cc.client_id
    WHERE c.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update client last contact date when activity is added
CREATE OR REPLACE FUNCTION update_client_last_contact()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE clients 
    SET last_contact_date = NEW.date
    WHERE id = NEW.client_id 
    AND (last_contact_date IS NULL OR last_contact_date < NEW.date);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last contact date
DROP TRIGGER IF EXISTS trigger_update_client_last_contact ON client_activities;
CREATE TRIGGER trigger_update_client_last_contact
    AFTER INSERT ON client_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_client_last_contact();

-- Create CRM dashboard view
CREATE OR REPLACE VIEW crm_dashboard AS
SELECT 
    t.id as tenant_id,
    t.slug as tenant_slug,
    t.business_name,
    (SELECT COUNT(*) FROM clients WHERE tenant_id = t.id) as total_clients,
    (SELECT COUNT(*) FROM clients WHERE tenant_id = t.id AND status = 'active') as active_clients,
    (SELECT COUNT(*) FROM clients WHERE tenant_id = t.id AND status = 'prospect') as prospect_clients,
    (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE tenant_id = t.id) as total_revenue,
    (SELECT ROUND(AVG(satisfaction_score), 2) FROM clients WHERE tenant_id = t.id AND satisfaction_score IS NOT NULL) as avg_satisfaction,
    (SELECT COUNT(*) FROM client_activities WHERE tenant_id = t.id AND created_at >= date_trunc('month', CURRENT_DATE)) as activities_this_month,
    (SELECT COUNT(*) FROM client_reminders WHERE tenant_id = t.id AND completed = FALSE AND reminder_date <= CURRENT_DATE + INTERVAL '7 days') as upcoming_reminders
FROM tenants t;