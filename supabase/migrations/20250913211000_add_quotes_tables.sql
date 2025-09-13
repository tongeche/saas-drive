-- Create quotes table
create table if not exists public.quotes (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  number text, -- Optional quote number (can be auto-generated)
  status text default 'Draft' check (status in ('Draft', 'Sent', 'Accepted', 'Declined', 'Expired')),
  valid_until date not null,
  currency text default 'EUR',
  subtotal numeric(10,2) default 0,
  tax_total numeric(10,2) default 0,
  total numeric(10,2) default 0,
  notes text,
  from_quote_id uuid references public.quotes(id) on delete set null, -- For quote revisions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create quote_items table
create table if not exists public.quote_items (
  id uuid default gen_random_uuid() primary key,
  quote_id uuid references public.quotes(id) on delete cascade not null,
  description text not null,
  unit text default 'each',
  qty numeric(10,2) default 1,
  unit_price numeric(10,2) default 0,
  tax_rate numeric(5,2) default 0, -- Tax percentage
  line_subtotal numeric(10,2) default 0,
  line_tax numeric(10,2) default 0,
  line_total numeric(10,2) default 0,
  position integer default 1, -- For ordering items
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

-- RLS policies for quotes
create policy "Users can view quotes for their tenants" on public.quotes
  for select using (
    tenant_id in (
      select tenant_id from public.user_tenants where user_id = auth.uid()
    )
  );

create policy "Users can insert quotes for their tenants" on public.quotes
  for insert with check (
    tenant_id in (
      select tenant_id from public.user_tenants where user_id = auth.uid()
    )
  );

create policy "Users can update quotes for their tenants" on public.quotes
  for update using (
    tenant_id in (
      select tenant_id from public.user_tenants where user_id = auth.uid()
    )
  );

create policy "Users can delete quotes for their tenants" on public.quotes
  for delete using (
    tenant_id in (
      select tenant_id from public.user_tenants where user_id = auth.uid()
    )
  );

-- RLS policies for quote_items
create policy "Users can view quote_items for their quotes" on public.quote_items
  for select using (
    quote_id in (
      select id from public.quotes where tenant_id in (
        select tenant_id from public.user_tenants where user_id = auth.uid()
      )
    )
  );

create policy "Users can insert quote_items for their quotes" on public.quote_items
  for insert with check (
    quote_id in (
      select id from public.quotes where tenant_id in (
        select tenant_id from public.user_tenants where user_id = auth.uid()
      )
    )
  );

create policy "Users can update quote_items for their quotes" on public.quote_items
  for update using (
    quote_id in (
      select id from public.quotes where tenant_id in (
        select tenant_id from public.user_tenants where user_id = auth.uid()
      )
    )
  );

create policy "Users can delete quote_items for their quotes" on public.quote_items
  for delete using (
    quote_id in (
      select id from public.quotes where tenant_id in (
        select tenant_id from public.user_tenants where user_id = auth.uid()
      )
    )
  );

-- Indexes for better performance
create index quotes_tenant_id_idx on public.quotes(tenant_id);
create index quotes_client_id_idx on public.quotes(client_id);
create index quotes_status_idx on public.quotes(status);
create index quotes_created_at_idx on public.quotes(created_at desc);

create index quote_items_quote_id_idx on public.quote_items(quote_id);
create index quote_items_position_idx on public.quote_items(quote_id, position);

-- Create updated_at trigger for quotes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger quotes_updated_at
  before update on public.quotes
  for each row
  execute function public.handle_updated_at();
