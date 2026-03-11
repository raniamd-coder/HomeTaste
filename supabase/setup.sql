-- HomeTaste - Supabase setup
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  ingredients text not null default '',
  category text not null default 'autre',
  image_url text,
  created_at timestamptz not null default now()
);

-- In case the table already existed (create table if not exists won't add new columns)
alter table public.recipes add column if not exists category text not null default 'autre';

create index if not exists recipes_user_id_idx on public.recipes(user_id);
create index if not exists recipes_created_at_idx on public.recipes(created_at desc);
create index if not exists recipes_category_idx on public.recipes(category);

alter table public.recipes enable row level security;

drop policy if exists "Select own recipes" on public.recipes;
create policy "Select own recipes"
on public.recipes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Insert own recipes" on public.recipes;
create policy "Insert own recipes"
on public.recipes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Update own recipes" on public.recipes;
create policy "Update own recipes"
on public.recipes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Delete own recipes" on public.recipes;
create policy "Delete own recipes"
on public.recipes
for delete
to authenticated
using (auth.uid() = user_id);
