-- Run ALL of this in Supabase → SQL Editor → Run
-- Public can VIEW models. Only logged-in admin can UPLOAD / DELETE.

-- 1) Models metadata table
create table if not exists public.portfolio_models (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text default 'Hard Surface',
  year int default extract(year from now())::int,
  poly_count text default 'GLB',
  software text default 'Blender',
  description text default '',
  color text default '#c45c2a',
  accent text default '#f3d7c4',
  shape text default 'tool',
  material text default 'baked',
  target_size float default 2.6,
  file_url text not null,
  thumbnail_url text,
  created_at timestamptz default now()
);

-- For existing projects that already created the table:
alter table public.portfolio_models
  add column if not exists thumbnail_url text;

alter table public.portfolio_models enable row level security;

-- Remove old open policies if they exist
drop policy if exists "Public read models" on public.portfolio_models;
drop policy if exists "Public insert models" on public.portfolio_models;
drop policy if exists "Public delete models" on public.portfolio_models;
drop policy if exists "Admin insert models" on public.portfolio_models;
drop policy if exists "Admin update models" on public.portfolio_models;
drop policy if exists "Admin delete models" on public.portfolio_models;

-- Anyone can view
create policy "Public read models"
  on public.portfolio_models for select
  using (true);

-- Only authenticated admin session can write
create policy "Admin insert models"
  on public.portfolio_models for insert
  to authenticated
  with check (true);

create policy "Admin update models"
  on public.portfolio_models for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin delete models"
  on public.portfolio_models for delete
  to authenticated
  using (true);

-- 2) Storage bucket (public READ for viewers)
insert into storage.buckets (id, name, public, file_size_limit)
values ('portfolio-models', 'portfolio-models', true, 52428800)
on conflict (id) do update
set public = true,
    file_size_limit = 52428800;

drop policy if exists "Public read portfolio models" on storage.objects;
drop policy if exists "Public upload portfolio models" on storage.objects;
drop policy if exists "Public update portfolio models" on storage.objects;
drop policy if exists "Public delete portfolio models" on storage.objects;
drop policy if exists "Admin upload portfolio models" on storage.objects;
drop policy if exists "Admin update portfolio models" on storage.objects;
drop policy if exists "Admin delete portfolio models" on storage.objects;

create policy "Public read portfolio models"
  on storage.objects for select
  using (bucket_id = 'portfolio-models');

create policy "Admin upload portfolio models"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio-models');

create policy "Admin update portfolio models"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio-models');

create policy "Admin delete portfolio models"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio-models');
