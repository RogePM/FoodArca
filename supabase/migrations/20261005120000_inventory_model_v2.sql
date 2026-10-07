-- =====================================================================
-- FoodArca inventory model v2  (see INVENTORY_PLAN.md)
--
-- * Wipes catalog_items / inventory_batches / activity_logs (test data only).
-- * Items are "Count them" or "Weigh them" (track_by), chosen once.
-- * Size describes ONE counted item; weight_lbs is derived, NULL = unknown.
-- * deliveries = one drop-off (add cart), visits = one give-out checkout.
-- * Every stock change goes through a function below and writes history
--   in the same transaction. Clients can only SELECT these tables.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Remove the old model
-- ---------------------------------------------------------------------
drop function if exists public.scan_out_item(uuid, uuid, numeric);
drop function if exists public.delete_catalog_item_safe(uuid);

drop table if exists public.activity_logs cascade;
drop table if exists public.inventory_batches cascade;
drop table if exists public.catalog_items cascade;

update public.organizations set current_item_count = 0;

insert into public.categories (name, is_food)
values ('Clothing', false)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- The product. Asked once.
create table public.catalog_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null check (length(trim(name)) > 0),
  category_id     integer not null references public.categories(id) on delete restrict,
  track_by        text not null default 'count' check (track_by in ('count', 'weight')),
  size_amount     numeric check (size_amount > 0),
  size_unit       text check (size_unit in ('oz', 'lb', 'fl_oz', 'gal', 'ct')),
  weight_lbs      numeric generated always as (
                    case size_unit
                      when 'oz'    then size_amount / 16.0
                      when 'lb'    then size_amount
                      when 'fl_oz' then size_amount * 0.0652
                      when 'gal'   then size_amount * 8.34
                      else null
                    end
                  ) stored,
  case_size       integer check (case_size > 1),
  barcode         text,
  photo_url       text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint catalog_items_size_pair check ((size_amount is null) = (size_unit is null)),
  constraint catalog_items_size_counted_only check (track_by = 'count' or (size_amount is null and case_size is null)),
  constraint catalog_items_organization_id_barcode_key unique (organization_id, barcode)
);

create index idx_catalog_items_organization_id on public.catalog_items (organization_id);
create index idx_catalog_items_category_id on public.catalog_items (category_id);
create index idx_catalog_items_name_trgm on public.catalog_items using gin (name gin_trgm_ops);

create trigger trg_enforce_catalog_item_limit
  before insert on public.catalog_items
  for each row execute function public.enforce_catalog_item_limit();
create trigger trg_decrement_catalog_item_count
  after delete on public.catalog_items
  for each row execute function public.decrement_catalog_item_count();

-- One drop-off. Created automatically when the add cart is submitted.
create table public.deliveries (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id     uuid not null references public.locations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  received_at     timestamptz not null default now(),
  source          text check (source in ('donation', 'food_bank', 'usda_tefap', 'food_rescue', 'purchased')),
  donor_name      text,
  is_anonymous    boolean not null default false,
  weighed_lbs     numeric check (weighed_lbs > 0),
  note            text,
  created_at      timestamptz not null default now(),
  constraint deliveries_anonymous_has_no_donor check (not (is_anonymous and donor_name is not null))
);

create index idx_deliveries_org_received on public.deliveries (organization_id, received_at desc);
create index idx_deliveries_location_id on public.deliveries (location_id);
create index idx_deliveries_user_id on public.deliveries (user_id);

-- One give-out checkout. Created automatically at checkout.
create table public.visits (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id     uuid not null references public.locations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  client_name     text,
  weighed_lbs     numeric check (weighed_lbs > 0),
  note            text,
  created_at      timestamptz not null default now()
);

create index idx_visits_org_created on public.visits (organization_id, created_at desc);
create index idx_visits_location_id on public.visits (location_id);
create index idx_visits_user_id on public.visits (user_id);

-- Stock on the shelf ("lots"). Quantity is items for count items, lb for weight items.
create table public.inventory_batches (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  catalog_item_id      uuid not null references public.catalog_items(id) on delete cascade,
  location_id          uuid not null references public.locations(id) on delete cascade,
  quantity             numeric not null check (quantity > 0),
  expiration_date      date,
  expiration_precision text check (expiration_precision in ('day', 'month')),
  storage_location     text,
  source               text check (source in ('donation', 'food_bank', 'usda_tefap', 'food_rescue', 'purchased')),
  received_date        date not null default current_date,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint inventory_batches_expiry_pair check ((expiration_date is null) = (expiration_precision is null))
);

-- One lot per item + location + expiry + storage + source. Empty lots are deleted.
create unique index inventory_batches_lot_key
  on public.inventory_batches (catalog_item_id, location_id, expiration_date, storage_location, source)
  nulls not distinct;
create index idx_inventory_batches_org on public.inventory_batches (organization_id);
create index idx_inventory_batches_location_id on public.inventory_batches (location_id);
create index idx_inventory_batches_item_expiry on public.inventory_batches (catalog_item_id, expiration_date);

-- History. Append-only; mistakes are fixed with an opposite row (reverses_id).
create table public.activity_logs (
  id                            uuid primary key default gen_random_uuid(),
  organization_id               uuid not null references public.organizations(id) on delete cascade,
  location_id                   uuid references public.locations(id) on delete cascade,
  user_id                       uuid references auth.users(id) on delete set null,
  action_type                   text not null check (action_type in ('received', 'given_out', 'thrown_out', 'corrected', 'edited')),
  quantity_changed              numeric not null default 0,
  unit                          text check (unit in ('items', 'lb')),
  weight_lbs_changed            numeric,
  reason                        text check (reason in ('expired', 'damaged', 'recalled', 'other')),
  catalog_item_id               uuid references public.catalog_items(id) on delete set null,
  batch_id                      uuid,  -- no FK: lots are deleted when empty, history keeps the id
  delivery_id                   uuid references public.deliveries(id) on delete set null,
  visit_id                      uuid references public.visits(id) on delete set null,
  snapshot_item_name            text,
  snapshot_category             text,
  snapshot_source               text,
  snapshot_expiration_date      date,
  snapshot_expiration_precision text,
  snapshot_storage_location     text,
  details                       jsonb,
  reverses_id                   uuid references public.activity_logs(id) on delete set null,
  note                          text,
  created_at                    timestamptz not null default now()
);

create index idx_activity_logs_org_created on public.activity_logs (organization_id, created_at desc);
create index idx_activity_logs_location_id on public.activity_logs (location_id);
create index idx_activity_logs_user_id on public.activity_logs (user_id);
create index idx_activity_logs_catalog_item_id on public.activity_logs (catalog_item_id);
create index idx_activity_logs_batch_id on public.activity_logs (batch_id);
create index idx_activity_logs_delivery_id on public.activity_logs (delivery_id);
create index idx_activity_logs_visit_id on public.activity_logs (visit_id);
create unique index activity_logs_reverses_id_key on public.activity_logs (reverses_id);

-- ---------------------------------------------------------------------
-- 2. Row level security: members can read; all writes go through functions
-- ---------------------------------------------------------------------
alter table public.catalog_items     enable row level security;
alter table public.deliveries        enable row level security;
alter table public.visits            enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.activity_logs     enable row level security;

create policy "members can view catalog items in their orgs" on public.catalog_items
  for select using (organization_id in (select public.get_managed_org_ids((select auth.uid()))));
create policy "members can view deliveries in their orgs" on public.deliveries
  for select using (organization_id in (select public.get_managed_org_ids((select auth.uid()))));
create policy "members can view visits in their orgs" on public.visits
  for select using (organization_id in (select public.get_managed_org_ids((select auth.uid()))));
create policy "members can view batches in their orgs" on public.inventory_batches
  for select using (organization_id in (select public.get_managed_org_ids((select auth.uid()))));
create policy "members can view their org's activity log" on public.activity_logs
  for select using (organization_id in (select public.get_managed_org_ids((select auth.uid()))));

revoke all on public.catalog_items, public.deliveries, public.visits,
              public.inventory_batches, public.activity_logs from anon;
revoke insert, update, delete, truncate on public.catalog_items, public.deliveries, public.visits,
              public.inventory_batches, public.activity_logs from authenticated;

-- Realtime (dropping the tables removed them from the publication)
alter table public.inventory_batches replica identity full;
alter publication supabase_realtime add table public.inventory_batches, public.activity_logs;

-- ---------------------------------------------------------------------
-- 3. Internal helpers (not callable by clients)
-- ---------------------------------------------------------------------

-- Caller must belong to the location's org. Returns the org id.
create or replace function public._inv_ctx(p_location_id uuid)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_org uuid;
begin
  select organization_id into v_org from locations where id = p_location_id;
  if v_org is null then raise exception 'Location not found'; end if;
  perform _inv_assert_org(v_org);
  return v_org;
end $$;

create or replace function public._inv_assert_org(p_org uuid, p_staff boolean default false)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null
     or not exists (select 1 from get_managed_org_ids(auth.uid()) g(id) where g.id = p_org) then
    raise exception 'Access denied';
  end if;
  if p_staff and not exists (
    select 1 from user_organizations
    where user_id = auth.uid() and organization_id = p_org and status = 'active'
      and role in ('owner', 'admin', 'staff')
  ) then
    raise exception 'Only staff can do this';
  end if;
end $$;

create or replace function public._inv_norm_storage(p text)
returns text language sql immutable as $$ select nullif(lower(trim(p)), '') $$;

-- Month precision is stored as the last day of that month ("best by Mar 2027").
create or replace function public._inv_norm_expiry(p_date date, p_precision text,
  out o_date date, out o_precision text)
language plpgsql immutable as $$
begin
  if p_date is null then
    o_date := null; o_precision := null;
  elsif p_precision = 'month' then
    o_date := (date_trunc('month', p_date) + interval '1 month - 1 day')::date; o_precision := 'month';
  else
    o_date := p_date; o_precision := 'day';
  end if;
end $$;

-- Label size → one of oz / lb / fl_oz / gal / ct. Metric is converted.
create or replace function public._inv_norm_size(p_amount numeric, p_unit text,
  out o_amount numeric, out o_unit text)
language plpgsql immutable as $$
declare u text := lower(replace(trim(coalesce(p_unit, '')), ' ', '_'));
begin
  o_amount := p_amount; o_unit := null;
  if p_amount is null or p_amount <= 0 or u = '' then o_amount := null; return; end if;
  case u
    when 'oz', 'ounce', 'ounces' then o_unit := 'oz';
    when 'lb', 'lbs', 'pound', 'pounds' then o_unit := 'lb';
    when 'fl_oz', 'floz', 'fl.oz' then o_unit := 'fl_oz';
    when 'gal', 'gallon', 'gallons' then o_unit := 'gal';
    when 'ct', 'count' then o_unit := 'ct';
    when 'g' then o_amount := round(p_amount / 28.3495, 2); o_unit := 'oz';
    when 'kg' then o_amount := round(p_amount * 2.20462, 2); o_unit := 'lb';
    when 'ml' then o_amount := round(p_amount / 29.5735, 1); o_unit := 'fl_oz';
    when 'l' then o_amount := round(p_amount * 33.814, 1); o_unit := 'fl_oz';
    else raise exception 'Unknown size unit: %', p_unit;
  end case;
end $$;

-- Pounds for a quantity of this item. NULL when unknown.
create or replace function public._inv_weight(p_item public.catalog_items, p_qty numeric)
returns numeric language sql immutable as $$
  select round(case when p_item.track_by = 'weight' then p_qty else p_qty * p_item.weight_lbs end, 3)
$$;

create or replace function public._inv_item(p_item_id uuid, p_org uuid)
returns public.catalog_items language plpgsql security definer set search_path = public as $$
declare v catalog_items;
begin
  select * into v from catalog_items where id = p_item_id and organization_id = p_org for update;
  if not found then raise exception 'Item not found'; end if;
  return v;
end $$;

create or replace function public._inv_unarchive(p_item public.catalog_items)
returns public.catalog_items language plpgsql security definer set search_path = public as $$
declare v catalog_items := p_item;
begin
  if p_item.archived_at is not null then
    update catalog_items set archived_at = null, updated_at = now() where id = p_item.id returning * into v;
  end if;
  return v;
end $$;

create or replace function public._inv_check_qty(p_item public.catalog_items, p_qty numeric)
returns void language plpgsql immutable as $$
begin
  if p_qty is null or p_qty <= 0 then raise exception 'Amount must be more than 0'; end if;
  if p_item.track_by = 'count' and p_qty <> trunc(p_qty) then
    raise exception '% is counted in whole items', p_item.name;
  end if;
end $$;

create or replace function public._inv_log(
  p_item public.catalog_items, p_location_id uuid, p_action text, p_qty numeric,
  p_batch_id uuid, p_expiry date, p_precision text, p_storage text, p_source text,
  p_reason text default null, p_delivery_id uuid default null, p_visit_id uuid default null,
  p_note text default null, p_details jsonb default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_cat text;
begin
  select name into v_cat from categories where id = p_item.category_id;
  insert into activity_logs (
    organization_id, location_id, user_id, action_type, quantity_changed, unit, weight_lbs_changed, reason,
    catalog_item_id, batch_id, delivery_id, visit_id,
    snapshot_item_name, snapshot_category, snapshot_source,
    snapshot_expiration_date, snapshot_expiration_precision, snapshot_storage_location,
    details, note)
  values (
    p_item.organization_id, p_location_id, auth.uid(), p_action, coalesce(p_qty, 0),
    case when coalesce(p_qty, 0) <> 0 then case p_item.track_by when 'weight' then 'lb' else 'items' end end,
    case when coalesce(p_qty, 0) <> 0 then _inv_weight(p_item, p_qty) end,
    p_reason, p_item.id, p_batch_id, p_delivery_id, p_visit_id,
    p_item.name, v_cat, p_source, p_expiry, p_precision, p_storage,
    p_details, p_note)
  returning id into v_id;
  return v_id;
end $$;

-- Add to the matching lot, or create it. Returns the lot id.
create or replace function public._inv_add(p_item public.catalog_items, p_location_id uuid, p_qty numeric,
  p_expiry date, p_precision text, p_storage text, p_source text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform _inv_check_qty(p_item, p_qty);
  insert into inventory_batches (organization_id, catalog_item_id, location_id, quantity,
                                 expiration_date, expiration_precision, storage_location, source)
  values (p_item.organization_id, p_item.id, p_location_id, p_qty, p_expiry, p_precision, p_storage, p_source)
  on conflict (catalog_item_id, location_id, expiration_date, storage_location, source)
  do update set quantity = inventory_batches.quantity + excluded.quantity, updated_at = now()
  returning id into v_id;
  return v_id;
end $$;

-- Take an amount out of one lot; deletes the lot when it reaches 0.
create or replace function public._inv_take(p_lot public.inventory_batches, p_qty numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_qty >= p_lot.quantity then
    delete from inventory_batches where id = p_lot.id;
  else
    update inventory_batches set quantity = quantity - p_qty, updated_at = now() where id = p_lot.id;
  end if;
end $$;

-- Remove stock: chosen lot first, then soonest-expiring (FEFO). One history row per lot touched.
create or replace function public._inv_remove(p_item public.catalog_items, p_location_id uuid, p_qty numeric,
  p_batch_id uuid, p_action text, p_reason text, p_visit_id uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare v_left numeric := p_qty; v_lot inventory_batches; v_take numeric;
begin
  perform _inv_check_qty(p_item, p_qty);
  for v_lot in
    select * from inventory_batches
    where catalog_item_id = p_item.id and location_id = p_location_id
    order by (id = p_batch_id) desc nulls last, expiration_date asc nulls last, created_at asc
    for update
  loop
    exit when v_left <= 0;
    v_take := least(v_left, v_lot.quantity);
    perform _inv_log(p_item, p_location_id, p_action, -v_take, v_lot.id,
                     v_lot.expiration_date, v_lot.expiration_precision, v_lot.storage_location, v_lot.source,
                     p_reason, null, p_visit_id, p_note);
    perform _inv_take(v_lot, v_take);
    v_left := v_left - v_take;
  end loop;
  if v_left > 0 then
    raise exception 'Only % left of %', p_qty - v_left, p_item.name;
  end if;
end $$;

-- Change a lot's expiry / storage / source, merging into an existing lot if one matches.
create or replace function public._inv_move_lot(p_lot public.inventory_batches,
  p_expiry date, p_precision text, p_storage text, p_source text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_other uuid;
begin
  select id into v_other from inventory_batches
  where catalog_item_id = p_lot.catalog_item_id and location_id = p_lot.location_id
    and expiration_date is not distinct from p_expiry
    and storage_location is not distinct from p_storage
    and source is not distinct from p_source
    and id <> p_lot.id
  for update;
  if v_other is not null then
    update inventory_batches set quantity = quantity + p_lot.quantity, updated_at = now() where id = v_other;
    delete from inventory_batches where id = p_lot.id;
    return v_other;
  end if;
  update inventory_batches
  set expiration_date = p_expiry, expiration_precision = p_precision,
      storage_location = p_storage, source = p_source, updated_at = now()
  where id = p_lot.id;
  return p_lot.id;
end $$;

-- Create an item (or return the existing one with the same barcode).
create or replace function public._inv_create_item(p_org uuid, p jsonb, p_location_id uuid)
returns public.catalog_items language plpgsql security definer set search_path = public as $$
declare v catalog_items; v_track text := coalesce(nullif(p->>'track_by', ''), 'count'); v_size record;
begin
  if nullif(trim(p->>'barcode'), '') is not null then
    select * into v from catalog_items
    where organization_id = p_org and barcode = trim(p->>'barcode') for update;
    if found then return _inv_unarchive(v); end if;
  end if;
  if nullif(trim(p->>'name'), '') is null then raise exception 'Item name is required'; end if;
  if nullif(p->>'category_id', '') is null then raise exception 'Category is required'; end if;

  select * into v_size from _inv_norm_size(nullif(p->>'size_amount', '')::numeric, p->>'size_unit');

  insert into catalog_items (organization_id, name, category_id, track_by, size_amount, size_unit,
                             case_size, barcode, photo_url)
  values (p_org, trim(p->>'name'), (p->>'category_id')::int, v_track,
          case when v_track = 'count' then v_size.o_amount end,
          case when v_track = 'count' then v_size.o_unit end,
          case when v_track = 'count' then nullif(p->>'case_size', '')::int end,
          nullif(trim(p->>'barcode'), ''), nullif(p->>'photo_url', ''))
  returning * into v;

  perform _inv_log(v, p_location_id, 'edited', 0, null, null, null, null, null,
                   null, null, null, null, jsonb_build_object('created', true));
  return v;
end $$;

-- ---------------------------------------------------------------------
-- 4. Public functions (called from the API routes)
-- ---------------------------------------------------------------------

-- Create an item without adding stock.
create or replace function public.create_item(p_location_id uuid, p_item jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid := _inv_ctx(p_location_id); v catalog_items;
begin
  v := _inv_create_item(v_org, p_item, p_location_id);
  return to_jsonb(v);
end $$;

-- Add cart submit. p_delivery: {source, donor_name, is_anonymous, weighed_lbs, note}
-- p_lines: [{item_id | item:{...}, quantity, expiration_date, expiration_precision, storage_location, note}]
create or replace function public.receive_delivery(p_location_id uuid, p_delivery jsonb default '{}', p_lines jsonb default '[]')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := _inv_ctx(p_location_id);
  v_anon boolean := coalesce((p_delivery->>'is_anonymous')::boolean, false);
  v_delivery deliveries; v_line jsonb; v_item catalog_items; v_exp record;
  v_storage text; v_qty numeric; v_batch uuid; v_out jsonb := '[]'::jsonb;
begin
  p_lines := coalesce(p_lines, '[]'::jsonb);
  if jsonb_array_length(p_lines) = 0 and nullif(p_delivery->>'weighed_lbs', '') is null then
    raise exception 'Add at least one item or a total weight';
  end if;

  insert into deliveries (organization_id, location_id, user_id, source, donor_name, is_anonymous, weighed_lbs, note)
  values (v_org, p_location_id, auth.uid(), nullif(p_delivery->>'source', ''),
          case when v_anon then null else nullif(trim(p_delivery->>'donor_name'), '') end,
          v_anon, nullif(p_delivery->>'weighed_lbs', '')::numeric, nullif(trim(p_delivery->>'note'), ''))
  returning * into v_delivery;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    if nullif(v_line->>'item_id', '') is not null then
      v_item := _inv_unarchive(_inv_item((v_line->>'item_id')::uuid, v_org));
    elsif jsonb_typeof(v_line->'item') = 'object' then
      v_item := _inv_create_item(v_org, v_line->'item', p_location_id);
    else
      raise exception 'Each line needs an item';
    end if;

    v_qty := nullif(v_line->>'quantity', '')::numeric;
    select * into v_exp from _inv_norm_expiry(nullif(v_line->>'expiration_date', '')::date, v_line->>'expiration_precision');
    v_storage := _inv_norm_storage(v_line->>'storage_location');

    v_batch := _inv_add(v_item, p_location_id, v_qty, v_exp.o_date, v_exp.o_precision, v_storage, v_delivery.source);
    perform _inv_log(v_item, p_location_id, 'received', v_qty, v_batch,
                     v_exp.o_date, v_exp.o_precision, v_storage, v_delivery.source,
                     null, v_delivery.id, null, nullif(trim(v_line->>'note'), ''));
    v_out := v_out || jsonb_build_object('item_id', v_item.id, 'batch_id', v_batch);
  end loop;

  return jsonb_build_object('delivery_id', v_delivery.id, 'lines', v_out);
end $$;

-- Give-out checkout. p_visit: {client_name, weighed_lbs, note}
-- p_lines: [{item_id, quantity, batch_id?}]  (batch_id = lot the volunteer picked; else FEFO)
create or replace function public.give_out(p_location_id uuid, p_visit jsonb default '{}', p_lines jsonb default '[]')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid := _inv_ctx(p_location_id); v_visit uuid; v_line jsonb; v_item catalog_items;
begin
  if jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) = 0 then raise exception 'Nothing to give out'; end if;

  insert into visits (organization_id, location_id, user_id, client_name, weighed_lbs, note)
  values (v_org, p_location_id, auth.uid(), nullif(trim(p_visit->>'client_name'), ''),
          nullif(p_visit->>'weighed_lbs', '')::numeric, nullif(trim(p_visit->>'note'), ''))
  returning id into v_visit;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_item := _inv_item((v_line->>'item_id')::uuid, v_org);
    perform _inv_remove(v_item, p_location_id, nullif(v_line->>'quantity', '')::numeric,
                        nullif(v_line->>'batch_id', '')::uuid, 'given_out', null, v_visit, null);
  end loop;

  return jsonb_build_object('visit_id', v_visit);
end $$;

-- Throw-out cart. p_reason: expired | damaged | recalled | other
create or replace function public.throw_out(p_location_id uuid, p_reason text, p_lines jsonb, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid := _inv_ctx(p_location_id); v_line jsonb; v_item catalog_items; v_count int := 0;
begin
  if p_reason is null or p_reason not in ('expired', 'damaged', 'recalled', 'other') then
    raise exception 'Pick a reason';
  end if;
  if jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) = 0 then raise exception 'Nothing to throw out'; end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_item := _inv_item((v_line->>'item_id')::uuid, v_org);
    perform _inv_remove(v_item, p_location_id, nullif(v_line->>'quantity', '')::numeric,
                        nullif(v_line->>'batch_id', '')::uuid, 'thrown_out', p_reason, null, nullif(trim(p_note), ''));
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('lines', v_count);
end $$;

-- "Update amount" / "All gone" (p_new_quantity = 0) on one lot.
-- p_why: given_out | thrown_out | corrected. An increase is always 'corrected'.
create or replace function public.update_amount(p_batch_id uuid, p_new_quantity numeric,
  p_why text default 'corrected', p_reason text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_lot inventory_batches; v_org uuid; v_item catalog_items; v_delta numeric;
begin
  select * into v_lot from inventory_batches where id = p_batch_id for update;
  if not found then raise exception 'This stock entry no longer exists'; end if;
  v_org := _inv_ctx(v_lot.location_id);
  v_item := _inv_item(v_lot.catalog_item_id, v_org);

  if p_new_quantity is null or p_new_quantity < 0 then raise exception 'Amount can''t be negative'; end if;
  if p_new_quantity > 0 then perform _inv_check_qty(v_item, p_new_quantity); end if;

  v_delta := p_new_quantity - v_lot.quantity;
  if v_delta = 0 then return jsonb_build_object('changed', false, 'quantity', v_lot.quantity); end if;
  if v_delta > 0 then p_why := 'corrected'; end if;
  if p_why is null or p_why not in ('given_out', 'thrown_out', 'corrected') then
    raise exception 'Why is it different?';
  end if;

  perform _inv_log(v_item, v_lot.location_id, p_why, v_delta, v_lot.id,
                   v_lot.expiration_date, v_lot.expiration_precision, v_lot.storage_location, v_lot.source,
                   case when p_why = 'thrown_out' then coalesce(p_reason, 'other') end,
                   null, null, nullif(trim(p_note), ''));

  if p_new_quantity = 0 then
    delete from inventory_batches where id = v_lot.id;
  else
    update inventory_batches set quantity = p_new_quantity, updated_at = now() where id = v_lot.id;
  end if;

  return jsonb_build_object('changed', true, 'quantity', p_new_quantity);
end $$;

-- Edit item facts. Keys present in p_changes are applied (null clears optional ones).
-- Allowed: name, category_id, size_amount, size_unit, case_size, photo_url, barcode.
create or replace function public.edit_item(p_item_id uuid, p_changes jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_old catalog_items; v_new catalog_items; v_size record;
        v_o jsonb; v_n jsonb; v_k text; v_details jsonb := '{}'::jsonb;
begin
  select organization_id into v_org from catalog_items where id = p_item_id;
  if v_org is null then raise exception 'Item not found'; end if;
  perform _inv_assert_org(v_org, true);
  v_old := _inv_item(p_item_id, v_org);

  if p_changes ? 'track_by' and p_changes->>'track_by' is distinct from v_old.track_by then
    raise exception 'Use convert_item to switch between Count them and Weigh them';
  end if;

  if p_changes ? 'size_amount' or p_changes ? 'size_unit' then
    select * into v_size from _inv_norm_size(
      case when p_changes ? 'size_amount' then nullif(p_changes->>'size_amount', '')::numeric else v_old.size_amount end,
      case when p_changes ? 'size_unit' then p_changes->>'size_unit' else v_old.size_unit end);
  else
    select v_old.size_amount as o_amount, v_old.size_unit as o_unit into v_size;
  end if;

  update catalog_items set
    name        = case when p_changes ? 'name' then coalesce(nullif(trim(p_changes->>'name'), ''), name) else name end,
    category_id = case when p_changes ? 'category_id' then coalesce(nullif(p_changes->>'category_id', '')::int, category_id) else category_id end,
    size_amount = case when track_by = 'count' then v_size.o_amount end,
    size_unit   = case when track_by = 'count' then v_size.o_unit end,
    case_size   = case when track_by <> 'count' then null
                       when p_changes ? 'case_size' then nullif(p_changes->>'case_size', '')::int
                       else case_size end,
    photo_url   = case when p_changes ? 'photo_url' then nullif(p_changes->>'photo_url', '') else photo_url end,
    barcode     = case when p_changes ? 'barcode' then nullif(trim(p_changes->>'barcode'), '') else barcode end,
    updated_at  = now()
  where id = p_item_id
  returning * into v_new;

  v_o := to_jsonb(v_old); v_n := to_jsonb(v_new);
  foreach v_k in array array['name', 'category_id', 'size_amount', 'size_unit', 'case_size', 'photo_url', 'barcode'] loop
    if v_o->v_k is distinct from v_n->v_k then
      v_details := v_details || jsonb_build_object(v_k, jsonb_build_array(v_o->v_k, v_n->v_k));
    end if;
  end loop;

  if v_details <> '{}'::jsonb then
    perform _inv_log(v_new, null, 'edited', 0, null, null, null, null, null,
                     null, null, null, null, v_details);
  end if;
  return to_jsonb(v_new);
end $$;

-- Switch Count them <-> Weigh them. If there is stock, p_new_total is the amount in the new unit;
-- lots are rescaled proportionally.
create or replace function public.convert_item(p_item_id uuid, p_track_by text, p_new_total numeric default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_item catalog_items; v_old_total numeric; v_assigned numeric := 0;
        v_lot inventory_batches; v_n int; v_i int := 0; v_new numeric;
begin
  select organization_id into v_org from catalog_items where id = p_item_id;
  if v_org is null then raise exception 'Item not found'; end if;
  perform _inv_assert_org(v_org, true);
  v_item := _inv_item(p_item_id, v_org);

  if p_track_by not in ('count', 'weight') then raise exception 'Choose Count them or Weigh them'; end if;
  if p_track_by = v_item.track_by then return to_jsonb(v_item); end if;

  select coalesce(sum(quantity), 0), count(*) into v_old_total, v_n
  from inventory_batches where catalog_item_id = p_item_id;

  if v_old_total > 0 then
    if p_new_total is null or p_new_total <= 0 then raise exception 'How much is there in the new unit?'; end if;
    if p_track_by = 'count' and p_new_total <> trunc(p_new_total) then raise exception 'Count must be whole items'; end if;

    for v_lot in
      select * from inventory_batches where catalog_item_id = p_item_id
      order by expiration_date asc nulls last, created_at asc for update
    loop
      v_i := v_i + 1;
      if v_i = v_n then
        v_new := p_new_total - v_assigned;
      else
        v_new := v_lot.quantity * p_new_total / v_old_total;
        v_new := case when p_track_by = 'count' then round(v_new) else round(v_new, 2) end;
        v_new := least(v_new, p_new_total - v_assigned);
      end if;
      if v_new <= 0 then
        delete from inventory_batches where id = v_lot.id;
      else
        update inventory_batches set quantity = v_new, updated_at = now() where id = v_lot.id;
        v_assigned := v_assigned + v_new;
      end if;
    end loop;
  end if;

  update catalog_items set
    track_by    = p_track_by,
    size_amount = case when p_track_by = 'weight' then null else size_amount end,
    size_unit   = case when p_track_by = 'weight' then null else size_unit end,
    case_size   = case when p_track_by = 'weight' then null else case_size end,
    updated_at  = now()
  where id = p_item_id
  returning * into v_item;

  perform _inv_log(v_item, null, 'edited', 0, null, null, null, null, null, null, null, null, null,
    jsonb_build_object(
      'track_by', jsonb_build_array(case p_track_by when 'count' then 'weight' else 'count' end, p_track_by),
      'total_quantity', jsonb_build_array(v_old_total, coalesce(p_new_total, 0))));
  return to_jsonb(v_item);
end $$;

-- Edit a lot's expiry and/or storage. Keys present in p_changes are applied.
create or replace function public.edit_lot(p_batch_id uuid, p_changes jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_lot inventory_batches; v_org uuid; v_item catalog_items; v_exp record;
        v_storage text; v_target uuid; v_details jsonb := '{}'::jsonb;
begin
  select * into v_lot from inventory_batches where id = p_batch_id for update;
  if not found then raise exception 'This stock entry no longer exists'; end if;
  v_org := _inv_ctx(v_lot.location_id);
  v_item := _inv_item(v_lot.catalog_item_id, v_org);

  if p_changes ? 'expiration_date' then
    select * into v_exp from _inv_norm_expiry(nullif(p_changes->>'expiration_date', '')::date, p_changes->>'expiration_precision');
  else
    select v_lot.expiration_date as o_date, v_lot.expiration_precision as o_precision into v_exp;
  end if;
  v_storage := case when p_changes ? 'storage_location' then _inv_norm_storage(p_changes->>'storage_location')
                    else v_lot.storage_location end;

  if v_exp.o_date is distinct from v_lot.expiration_date or v_exp.o_precision is distinct from v_lot.expiration_precision then
    v_details := v_details || jsonb_build_object('expiration',
      jsonb_build_array(jsonb_build_object('date', v_lot.expiration_date, 'precision', v_lot.expiration_precision),
                        jsonb_build_object('date', v_exp.o_date, 'precision', v_exp.o_precision)));
  end if;
  if v_storage is distinct from v_lot.storage_location then
    v_details := v_details || jsonb_build_object('storage_location', jsonb_build_array(v_lot.storage_location, v_storage));
  end if;
  if v_details = '{}'::jsonb then return jsonb_build_object('batch_id', v_lot.id, 'changed', false); end if;

  v_target := _inv_move_lot(v_lot, v_exp.o_date, v_exp.o_precision, v_storage, v_lot.source);
  perform _inv_log(v_item, v_lot.location_id, 'edited', 0, v_target,
                   v_exp.o_date, v_exp.o_precision, v_storage, v_lot.source,
                   null, null, null, null, v_details);
  return jsonb_build_object('batch_id', v_target, 'changed', true);
end $$;

-- Delete a product = archive it. Remaining stock must leave with a reason.
create or replace function public.archive_item(p_item_id uuid, p_why text default null, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_item catalog_items; v_lot inventory_batches;
begin
  select organization_id into v_org from catalog_items where id = p_item_id;
  if v_org is null then raise exception 'Item not found'; end if;
  perform _inv_assert_org(v_org, true);
  v_item := _inv_item(p_item_id, v_org);

  for v_lot in select * from inventory_batches where catalog_item_id = p_item_id for update loop
    if p_why is null or p_why not in ('given_out', 'thrown_out', 'corrected') then
      raise exception 'There is still stock. Why is it leaving?';
    end if;
    perform _inv_log(v_item, v_lot.location_id, p_why, -v_lot.quantity, v_lot.id,
                     v_lot.expiration_date, v_lot.expiration_precision, v_lot.storage_location, v_lot.source,
                     case when p_why = 'thrown_out' then coalesce(p_reason, 'other') end);
    delete from inventory_batches where id = v_lot.id;
  end loop;

  update catalog_items set archived_at = now(), updated_at = now() where id = p_item_id returning * into v_item;
  perform _inv_log(v_item, null, 'edited', 0, null, null, null, null, null, null, null, null, null,
                   jsonb_build_object('archived', jsonb_build_array(false, true)));
  return to_jsonb(v_item);
end $$;

-- Undo one stock change by writing the opposite row (same type, opposite sign).
-- Own entries within 24 h; staff can undo any.
create or replace function public.undo_entry(p_log_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_log activity_logs; v_item catalog_items; v_lot inventory_batches; v_batch uuid; v_id uuid;
begin
  select * into v_log from activity_logs where id = p_log_id for update;
  if not found then raise exception 'Entry not found'; end if;
  perform _inv_assert_org(v_log.organization_id);
  if v_log.user_id is distinct from auth.uid() or v_log.created_at < now() - interval '24 hours' then
    perform _inv_assert_org(v_log.organization_id, true);
  end if;

  if v_log.action_type not in ('received', 'given_out', 'thrown_out', 'corrected') or v_log.quantity_changed = 0
     or v_log.catalog_item_id is null then
    raise exception 'This change can''t be undone';
  end if;
  if v_log.reverses_id is not null then raise exception 'This is already an undo'; end if;
  if exists (select 1 from activity_logs where reverses_id = v_log.id) then raise exception 'Already undone'; end if;

  v_item := _inv_item(v_log.catalog_item_id, v_log.organization_id);
  if v_log.unit is distinct from (case v_item.track_by when 'weight' then 'lb' else 'items' end) then
    raise exception 'This item was switched between Count and Weigh since then. Use Update amount instead.';
  end if;

  if v_log.quantity_changed > 0 then
    select * into v_lot from inventory_batches where id = v_log.batch_id for update;
    if not found or v_lot.quantity < v_log.quantity_changed then
      raise exception 'Some of this was already given out or moved. Use Update amount instead.';
    end if;
    perform _inv_take(v_lot, v_log.quantity_changed);
    v_batch := v_lot.id;
  else
    v_item := _inv_unarchive(v_item);
    v_batch := _inv_add(v_item, v_log.location_id, -v_log.quantity_changed,
                        v_log.snapshot_expiration_date, v_log.snapshot_expiration_precision,
                        v_log.snapshot_storage_location, v_log.snapshot_source);
  end if;

  insert into activity_logs (
    organization_id, location_id, user_id, action_type, quantity_changed, unit, weight_lbs_changed, reason,
    catalog_item_id, batch_id, delivery_id, visit_id,
    snapshot_item_name, snapshot_category, snapshot_source,
    snapshot_expiration_date, snapshot_expiration_precision, snapshot_storage_location,
    reverses_id, note)
  values (
    v_log.organization_id, v_log.location_id, auth.uid(), v_log.action_type, -v_log.quantity_changed,
    v_log.unit, -v_log.weight_lbs_changed, v_log.reason,
    v_log.catalog_item_id, v_batch, v_log.delivery_id, v_log.visit_id,
    v_log.snapshot_item_name, v_log.snapshot_category, v_log.snapshot_source,
    v_log.snapshot_expiration_date, v_log.snapshot_expiration_precision, v_log.snapshot_storage_location,
    v_log.id, 'Undo')
  returning id into v_id;

  return jsonb_build_object('undo_id', v_id);
end $$;

-- Fix a past drop-off's source / donor / weight. Keys present in p_changes are applied.
-- Received rows and lots that came only from this drop-off follow the new source.
create or replace function public.update_delivery(p_delivery_id uuid, p_changes jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_old deliveries; v_new deliveries; v_lot inventory_batches; v_anon boolean; v_details jsonb := '{}'::jsonb;
begin
  select * into v_old from deliveries where id = p_delivery_id for update;
  if not found then raise exception 'Drop-off not found'; end if;
  perform _inv_ctx(v_old.location_id);

  v_anon := case when p_changes ? 'is_anonymous' then coalesce((p_changes->>'is_anonymous')::boolean, false)
                 else v_old.is_anonymous end;

  update deliveries set
    source       = case when p_changes ? 'source' then nullif(p_changes->>'source', '') else source end,
    is_anonymous = v_anon,
    donor_name   = case when v_anon then null
                        when p_changes ? 'donor_name' then nullif(trim(p_changes->>'donor_name'), '')
                        else donor_name end,
    weighed_lbs  = case when p_changes ? 'weighed_lbs' then nullif(p_changes->>'weighed_lbs', '')::numeric else weighed_lbs end,
    note         = case when p_changes ? 'note' then nullif(trim(p_changes->>'note'), '') else note end
  where id = p_delivery_id
  returning * into v_new;

  if v_new.source is distinct from v_old.source then
    v_details := v_details || jsonb_build_object('source', jsonb_build_array(v_old.source, v_new.source));
    update activity_logs set snapshot_source = v_new.source
    where delivery_id = p_delivery_id and action_type = 'received';

    -- Everything that already happened to lots that came only from this drop-off
    -- (given out, thrown out, corrected) follows the new source too, so USDA in/out stays accurate.
    update activity_logs set snapshot_source = v_new.source
    where batch_id in (
      select l.batch_id from activity_logs l
      where l.delivery_id = p_delivery_id and l.action_type = 'received' and l.batch_id is not null
        and not exists (select 1 from activity_logs o
                        where o.batch_id = l.batch_id and o.action_type = 'received'
                          and o.delivery_id is distinct from p_delivery_id));

    for v_lot in
      select b.* from inventory_batches b
      where b.id in (select batch_id from activity_logs where delivery_id = p_delivery_id and action_type = 'received')
        and not exists (select 1 from activity_logs l
                        where l.batch_id = b.id and l.action_type = 'received'
                          and l.delivery_id is distinct from p_delivery_id)
      for update
    loop
      perform _inv_move_lot(v_lot, v_lot.expiration_date, v_lot.expiration_precision, v_lot.storage_location, v_new.source);
    end loop;
  end if;
  if v_new.donor_name is distinct from v_old.donor_name then
    v_details := v_details || jsonb_build_object('donor_name', jsonb_build_array(v_old.donor_name, v_new.donor_name));
  end if;
  if v_new.is_anonymous is distinct from v_old.is_anonymous then
    v_details := v_details || jsonb_build_object('is_anonymous', jsonb_build_array(v_old.is_anonymous, v_new.is_anonymous));
  end if;
  if v_new.weighed_lbs is distinct from v_old.weighed_lbs then
    v_details := v_details || jsonb_build_object('weighed_lbs', jsonb_build_array(v_old.weighed_lbs, v_new.weighed_lbs));
  end if;

  if v_details <> '{}'::jsonb then
    insert into activity_logs (organization_id, location_id, user_id, action_type, delivery_id, details)
    values (v_new.organization_id, v_new.location_id, auth.uid(), 'edited', p_delivery_id, v_details);
  end if;
  return to_jsonb(v_new);
end $$;

-- ---------------------------------------------------------------------
-- 5. Execute permissions
-- ---------------------------------------------------------------------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and (p.proname like '\_inv\_%' or p.proname in (
        'create_item', 'receive_delivery', 'give_out', 'throw_out', 'update_amount',
        'edit_item', 'convert_item', 'edit_lot', 'archive_item', 'undo_entry', 'update_delivery'))
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    if f.proname not like '\_inv\_%' then
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;

-- Pure helpers: pin search_path too (Supabase linter 0011)
alter function public._inv_norm_storage(text) set search_path = public;
alter function public._inv_norm_expiry(date, text) set search_path = public;
alter function public._inv_norm_size(numeric, text) set search_path = public;
alter function public._inv_weight(public.catalog_items, numeric) set search_path = public;
alter function public._inv_check_qty(public.catalog_items, numeric) set search_path = public;
