-- Add user-tenant relationship table for RLS policies
CREATE TABLE IF NOT EXISTS public.user_tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Create indexes
CREATE INDEX idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);

-- Enable RLS
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_tenants
CREATE POLICY "Users can view their tenant relationships" ON public.user_tenants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their tenant relationships" ON public.user_tenants
  FOR ALL USING (user_id = auth.uid());

-- Add a function to automatically create owner relationship when tenant is created
CREATE OR REPLACE FUNCTION public.create_tenant_owner_relationship()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the owner relationship for the user who created the tenant
  INSERT INTO public.user_tenants (user_id, tenant_id, role)
  VALUES (auth.uid(), NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create owner relationship
CREATE TRIGGER create_tenant_owner_trigger
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.create_tenant_owner_relationship();
