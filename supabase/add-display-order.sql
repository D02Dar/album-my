-- Add display_order column to photos and bibliography tables
-- Execute in Supabase SQL editor

-- Add display_order to photos table
alter table public.photos
add column if not exists display_order integer default 0;

-- Add display_order to bibliography table
alter table public.bibliography
add column if not exists display_order integer default 0;

-- Create indexes for sorting
create index if not exists photos_display_order_idx on public.photos (display_order desc, created_at desc);
create index if not exists bibliography_display_order_idx on public.bibliography (display_order desc, created_at desc);
