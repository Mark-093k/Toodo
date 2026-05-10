create table if not exists public.toodo_meta (
  user_id uuid primary key references auth.users(id) on delete cascade,
  meta jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.toodo_yearly_workspaces (
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null check (year between 1900 and 2999),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, year)
);

alter table public.toodo_meta enable row level security;
alter table public.toodo_yearly_workspaces enable row level security;

drop policy if exists "users manage own toodo meta" on public.toodo_meta;
create policy "users manage own toodo meta"
on public.toodo_meta
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own toodo yearly workspaces" on public.toodo_yearly_workspaces;
create policy "users manage own toodo yearly workspaces"
on public.toodo_yearly_workspaces
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists toodo_yearly_workspaces_user_year_idx
on public.toodo_yearly_workspaces (user_id, year);
