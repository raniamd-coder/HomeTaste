-- HomeTaste - Add recipe category
-- Run this in Supabase SQL Editor if your table already exists

alter table public.recipes
  add column if not exists category text not null default 'autre';

create index if not exists recipes_category_idx on public.recipes(category);
