-- Gallery Categories Schema
-- Execute in Supabase SQL editor to add category support to photos table

-- Create categories table for gallery
create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists gallery_categories_name_idx on public.gallery_categories (name);

-- Add category_id foreign key to photos table
alter table public.photos
add column if not exists category_id uuid references public.gallery_categories (id) on delete set null;

create index if not exists photos_category_id_idx on public.photos (category_id);

-- Enable RLS
alter table public.gallery_categories enable row level security;

-- RLS Policies for gallery categories
create policy "gallery_categories_select_public"
  on public.gallery_categories
  for select
  to anon, authenticated
  using (true);

create policy "gallery_categories_insert_auth"
  on public.gallery_categories
  for insert
  to authenticated
  with check (true);

-- Insert default gallery categories (optional)
insert into public.gallery_categories (name) 
values 
  ('人物'),
  ('风景'),
  ('建筑'),
  ('静物'),
  ('日常')
on conflict (name) do nothing;
