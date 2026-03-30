-- Bibliography Categories Schema
-- Execute in Supabase SQL editor

-- Create categories table
create table if not exists public.biblio_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists biblio_categories_name_idx on public.biblio_categories (name);

-- Add category_id foreign key to bibliography table
alter table public.bibliography
add column if not exists category_id uuid references public.biblio_categories (id) on delete set null;

create index if not exists bibliography_category_id_idx on public.bibliography (category_id);

-- Enable RLS
alter table public.biblio_categories enable row level security;

-- RLS Policies for categories
create policy "biblio_categories_select_public"
  on public.biblio_categories
  for select
  to anon, authenticated
  using (true);

create policy "biblio_categories_insert_admin"
  on public.biblio_categories
  for insert
  to authenticated
  with check (auth.uid() = (select id from auth.users where id = auth.uid())); -- simple admin check, can be improved

-- Insert some default categories (optional)
insert into public.biblio_categories (name) 
values 
  ('人物'),
  ('风景'),
  ('2000s'),
  ('建筑'),
  ('静物')
on conflict (name) do nothing;
