-- Run this if your portfolio_models table already exists.
alter table public.portfolio_models
  add column if not exists thumbnail_url text;
