-- One page of a pantry's item list (every catalog item of the location's organization, with its
-- stock at that location), worked out in the database so Add's Restock sheet never needs the whole
-- list on the device for a large pantry: item ids matching a filter/search, by name, plus the total,
-- each item's stock, and optionally the counts behind the filter pills.
--
-- The rules mirror the Restock sheet's own (components/flow/item-sheet.jsx), keep them in step:
--   stock     = the sum of the item's lots at this location (0 when none)
--   low stock = stock above 0 and under 5      out of stock = stock 0 or less
--   category  = the category's name, 'other' when missing (same match as public.inventory_page)
--   order     = lower(name), then id ("C" collation: plain code-point order)
--
-- security invoker: runs as the signed-in user, so RLS decides what they can see. Returns null when
-- the location isn't visible to them.
create or replace function public.catalog_page(
  p_location_id   uuid,
  p_search        text    default null,
  p_status        text    default null, -- LOW | OUT
  p_category      text    default null, -- a category value or name
  p_category_name text    default null, -- and its display name
  p_limit         int     default 24,
  p_offset        int     default 0,
  p_summary       boolean default false
) returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare
  v_org uuid;
  v_q   text;
  v_out jsonb;
begin
  select l.organization_id into v_org from locations l where l.id = p_location_id;
  if not found then return null; end if;

  if nullif(trim(p_search), '') is not null then
    v_q := '%' || replace(replace(replace(trim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  with stock as (
    select b.catalog_item_id as id, sum(b.quantity) as total
    from inventory_batches b
    where b.location_id = p_location_id
    group by b.catalog_item_id
  ), rows as (
    select ci.id, ci.name, ci.barcode, coalesce(s.total, 0) as total, coalesce(c.name, 'other') as category
    from catalog_items ci
    left join stock s on s.id = ci.id
    left join categories c on c.id = ci.category_id
    where ci.organization_id = v_org and ci.archived_at is null
  ), matched as (
    select r.*
    from rows r
    where (v_q is null
           or r.name ilike v_q escape '\'
           or coalesce(r.barcode, '') ilike v_q escape '\'
           or r.category ilike v_q escape '\')
      and (p_category is null
           or lower(r.category) = lower(p_category)
           or lower(r.category) = lower(coalesce(p_category_name, ''))
           or regexp_replace(lower(r.category), '[\s&_-]', '', 'g') = regexp_replace(lower(p_category), '[\s&_-]', '', 'g'))
      and case upper(coalesce(p_status, ''))
            when 'LOW' then r.total > 0 and r.total < 5
            when 'OUT' then r.total <= 0
            else true
          end
  ), page as (
    select m.id, m.total, row_number() over (order by lower(m.name) collate "C", m.id) as n
    from matched m
    order by n
    limit greatest(p_limit, 0) offset greatest(p_offset, 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from matched),
    'ids', coalesce((select jsonb_agg(p.id order by p.n) from page p), '[]'::jsonb),
    'stock', coalesce((select jsonb_object_agg(p.id, p.total) from page p), '{}'::jsonb),
    'summary', case when p_summary then (
      select jsonb_build_object(
        'all', count(*),
        'low', count(*) filter (where r.total > 0 and r.total < 5),
        'out', count(*) filter (where r.total <= 0),
        'categories', coalesce((
          select jsonb_object_agg(x.category, x.n)
          from (select r2.category, count(*) as n from rows r2 group by r2.category) x
        ), '{}'::jsonb)
      ) from rows r
    ) end
  ) into v_out;

  return v_out;
end $$;
