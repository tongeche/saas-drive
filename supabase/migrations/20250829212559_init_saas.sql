-- safe UUIDs & extensions
create extension if not exists pgcrypto;

-- 1) tenants
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  business_name text not null,
  currency text not null default 'EUR',
  timezone text not null default 'Europe/Lisbon',
  owner_email text,
  owner_refresh_token_encrypted text,  -- for Google Drive user OAuth
  -- carry over Google IDs so you can keep Docs-based PDFs
  folder_id text,
  clients_sheet_id text,
  invoices_sheet_id text,
  settings_sheet_id text,
  exports_folder_id text,
  template_invoice_id text,
  -- invoice numbering
  number_prefix_invoice text not null default 'INV-',
  last_invoice_no integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2) clients (reflects your Clients sheet)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  external_id text,                       -- optional: keep "c1" etc from Sheets
  name text not null,
  email text,
  phone text,
  billing_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.clients(tenant_id);
create unique index if not exists clients_tenant_external_id_uk
  on public.clients(tenant_id, external_id) where external_id is not null;

-- 3) invoices (mirrors your Invoices sheet)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  number text not null,                   -- e.g., INV-000123
  issue_date date not null,
  due_date date,
  currency text not null,
  status text not null default 'draft' check (status in ('draft','sent','paid','void')),
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  from_quote_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, number)
);
create index on public.invoices(tenant_id);
create index on public.invoices(client_id);

-- 4) invoice_items (for LINES)
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  qty numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  position int not null default 1
);
create index on public.invoice_items(invoice_id);

-- 5) payments (optional, for receipts)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  method text,
  amount numeric(12,2) not null,
  currency text not null,
  paid_at timestamptz not null default now(),
  reference text,
  received_by_email text
);
create index on public.payments(tenant_id);
create index on public.payments(invoice_id);

-- 6) atomic invoice numbering: one SQL call, no races
create or replace function public.next_invoice_number(p_tenant_slug text)
returns text
language sql
as $$
  with bumped as (
    update public.tenants t
       set last_invoice_no = t.last_invoice_no + 1
     where t.slug = p_tenant_slug
   returning number_prefix_invoice, last_invoice_no
  )
  select number_prefix_invoice || lpad(last_invoice_no::text, 6, '0')
  from bumped;
$$;

-- (Optional now) RLS prep; leave disabled if you only call from server role
alter table public.tenants       disable row level security;
alter table public.clients       disable row level security;
alter table public.invoices      disable row level security;
alter table public.invoice_items disable row level security;
alter table public.payments      disable row level security;
