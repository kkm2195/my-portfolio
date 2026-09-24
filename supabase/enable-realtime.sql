-- Enable realtime so the website updates when you add/delete models.
-- Run once in Supabase → SQL Editor.

alter publication supabase_realtime add table public.portfolio_models;
