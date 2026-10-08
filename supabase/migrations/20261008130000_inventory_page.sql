-- One page of the Inventory screen, worked out in the database so the app never needs the whole
-- shelf to draw it: items (lots grouped by catalog item) matching a filter/search, sorted, as one
-- page of item ids plus the total, and optionally the counts behind the filter pills.
--
-- The rules mirror components/pages/inventory/inventory-utils.js (keep them in step):
--   an item's date   = its earliest expiration among lots with stock (any lot's, if none have stock)
--   expired          = date before today          expiring = today .. today + 30 days
--   low stock        = total quantity under 5      no date  = no lot has a date
--   category         = the category's name, 'other' when missing
--   sort ties        = lower(name), then id ("C" collation: plain code-point order, as the app does)
-- "Today" is the location's own date (its timezone).
--
-- security invoker: runs as the signed-in user, so RLS decides what they can see. Returns null when
-- the location isn't visible to them.
create or replace function public.inventory_page(
  p_location_id   uuid,
  p_search        text    default null,
  p_status        text    default null,             -- EXPIRED | EXPIRING | LOW | NO_DATE
  p_category      text    default null,             -- a category value from lib/constants
  p_category_name text    default null,             -- and its display name
  p_item_id       uuid    default null,             -- one item, by its catalog id or one of its lot ids
  p_sort          text    default 'expirationDate', -- expirationDate | name | quantity
  p_desc          boolean default false,
  p_limit         int     default 24,
  p_offset        int     default 0,
  p_summary       boolean default false
) returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare
  v_tz    text;
  v_today date;
  v_q     text;
  v_out   jsonb;
begin
  select l.timezone into v_tz from locations l where l.id = p_location_id;
  if not found then return null; end if;
  begin
    v_today := (now() at time zone coalesce(nullif(v_tz, ''), 'America/New_York'))::date;
  exception when others then
    v_today := (now() at time zone 'America/New_York')::date;
  end;

  if nullif(trim(p_search), '') is not null then
    v_q := '%' || replace(replace(replace(trim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  with items as (
    select b.catalog_item_id as id,
           sum(b.quantity) as total,
           coalesce(min(b.expiration_date) filter (where b.quantity > 0), min(b.expiration_date)) as exp,
           coalesce(bool_or(b.id = p_item_id), false) as has_lot
    from inventory_batches b
    where b.location_id = p_location_id
    group by b.catalog_item_id
  ), rows as (
    select i.id, i.total, i.exp, i.has_lot, ci.name, ci.barcode, coalesce(c.name, 'other') as category
    from items i
    join catalog_items ci on ci.id = i.id
    left join categories c on c.id = ci.category_id
  ), matched as (
    select r.*
    from rows r
    where (p_item_id is null or r.id = p_item_id or r.has_lot)
      and (v_q is null
           or r.name ilike v_q escape '\'
           or coalesce(r.barcode, '') ilike v_q escape '\'
           or r.category ilike v_q escape '\')
      and (p_category is null
           or lower(r.category) = lower(p_category)
           or lower(r.category) = lower(coalesce(p_category_name, ''))
           or regexp_replace(lower(r.category), '[\s&_-]', '', 'g') = regexp_replace(lower(p_category), '[\s&_-]', '', 'g'))
      and case upper(coalesce(p_status, ''))
            when 'EXPIRED'  then r.exp < v_today
            when 'EXPIRING' then r.exp between v_today and v_today + 30
            when 'LOW'      then r.total < 5
            when 'NO_DATE'  then r.exp is null
            else true
          end
  ), ordered as (
    select m.id, row_number() over (
      order by
        case when p_sort = 'name'     and not p_desc then lower(m.name) collate "C" end asc,
        case when p_sort = 'name'     and p_desc     then lower(m.name) collate "C" end desc,
        case when p_sort = 'quantity' and not p_desc then m.total end asc,
        case when p_sort = 'quantity' and p_desc     then m.total end desc,
        case when p_sort not in ('name', 'quantity') and not p_desc then m.exp end asc nulls last,
        case when p_sort not in ('name', 'quantity') and p_desc     then m.exp end desc nulls first,
        lower(m.name) collate "C", m.id
    ) as n
    from matched m
  )
  select jsonb_build_object(
    'total', (select count(*) from matched),
    'ids', coalesce((
      select jsonb_agg(o.id order by o.n) from ordered o
      where o.n > greatest(p_offset, 0) and o.n <= greatest(p_offset, 0) + greatest(p_limit, 0)
    ), '[]'::jsonb),
    'summary', case when p_summary then (
      select jsonb_build_object(
        'all',      count(*),
        'expired',  count(*) filter (where r.exp < v_today),
        'expiring', count(*) filter (where r.exp between v_today and v_today + 30),
        'low',      count(*) filter (where r.total < 5),
        'noDate',   count(*) filter (where r.exp is null),
        'categories', coalesce((
          select jsonb_object_agg(x.category, x.n)
          from (select r2.category, count(*) as n from rows r2 group by r2.category) x
        ), '{}'::jsonb)
      ) from rows r
    ) end
  ) into v_out;

  return v_out;
end $$;
