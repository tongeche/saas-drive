create table if not exists public.landing_highlights (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  value numeric(18,2) not null default 0,
  value_prefix text default '',
  value_suffix text default '',
  value_display text,
  value_decimals smallint not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.landing_highlights disable row level security;

insert into public.landing_highlights (
  slug,
  title,
  description,
  value,
  value_prefix,
  value_suffix,
  value_display,
  value_decimals,
  sort_order
) values
  (
    'startups-served',
    'Startups Served',
    'Empowering founders across borders with intuitive financial tools.',
    10,
    '',
    '+',
    null,
    0,
    1
  ),
  (
    'total-invoiced',
    'Total Invoiced',
    'Helping startups secure crucial funding to fuel their big ideas.',
    10000,
    '$',
    '',
    '10K+',
    0,
    2
  ),
  (
    'time-saved',
    'Time Saved',
    'Automating busy work, giving founders more time to innovate and grow.',
    30,
    '',
    '%',
    null,
    0,
    3
  ),
  (
    'client-reviews',
    'Client Reviews',
    'A dedicated team building the future of startup finance.',
    15,
    '',
    '+',
    null,
    0,
    4
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  value = excluded.value,
  value_prefix = excluded.value_prefix,
  value_suffix = excluded.value_suffix,
  value_display = excluded.value_display,
  value_decimals = excluded.value_decimals,
  sort_order = excluded.sort_order;
