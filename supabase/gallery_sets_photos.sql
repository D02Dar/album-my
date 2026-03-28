-- （可选）多影集/缩略图 URL 拆分 — 当前项目只需执行 photos.sql 单表即可。
-- 若未来需要影集维度，再启用本文件。

/*
create table if not exists public.gallery_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.gallery_sets (id) on delete cascade,
  full_url text not null,
  thumb_url text not null,
  alt text,
  created_at timestamptz not null default now()
);
...
*/
