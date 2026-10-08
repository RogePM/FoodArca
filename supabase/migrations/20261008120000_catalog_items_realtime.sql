-- Push item changes (new item, rename, photo, category, archive) to every open screen, like stock
-- changes already are, so a teammate's new item shows up in Search without a reload.
-- Realtime still applies RLS: members only receive rows from their own organizations.
alter table public.catalog_items replica identity full;
alter publication supabase_realtime add table public.catalog_items;
