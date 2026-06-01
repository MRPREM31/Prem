create table if not exists public.maintenance_settings (
  id integer primary key default 1,
  maintenance_enabled boolean not null default false,
  start_time timestamptz,
  end_time timestamptz,
  message text default '',
  updated_at timestamptz default now(),
  constraint maintenance_settings_single_row check (id = 1)
);

insert into public.maintenance_settings (id, maintenance_enabled)
values (1, false)
on conflict (id) do nothing;

alter table public.maintenance_settings enable row level security;

create policy "Public read maintenance status"
  on public.maintenance_settings
  for select
  using (true);
