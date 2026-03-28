-- 当前使用的单表结构（与 Node /api/photos、上传一致）
-- 在 Supabase SQL Editor 中执行；Storage 桶 gallery_images 见文末。

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text,
  uploaded_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists photos_created_at_idx on public.photos (created_at desc);

alter table public.photos enable row level security;

-- GET /api/photos uses the anon client; allow world-readable gallery rows.
create policy "photos_select_public"
  on public.photos
  for select
  to anon, authenticated
  using (true);

-- Optional: allow authenticated users to insert their own rows if you ever call Supabase from the browser.
-- The Node server uses the service role for inserts and bypasses RLS.
--
-- Storage: in Dashboard → Storage, create a bucket named "gallery_images".
-- Mark it public if you use getPublicUrl() for gallery images.
--
-- create policy "photos_insert_own"
--   on public.photos
--   for insert
--   to authenticated
--   with check (auth.uid() = uploaded_by);
