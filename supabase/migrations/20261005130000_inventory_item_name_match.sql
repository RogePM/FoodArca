-- A new item typed by hand that matches an existing item (same name, tracking and size)
-- reuses it instead of creating a duplicate. A scanned barcode is attached to it if it had none.
create or replace function public._inv_create_item(p_org uuid, p jsonb, p_location_id uuid)
returns public.catalog_items language plpgsql security definer set search_path = public as $$
declare v catalog_items; v_track text := coalesce(nullif(p->>'track_by', ''), 'count'); v_size record;
        v_barcode text := nullif(trim(p->>'barcode'), '');
begin
  if v_barcode is not null then
    select * into v from catalog_items
    where organization_id = p_org and barcode = v_barcode for update;
    if found then return _inv_unarchive(v); end if;
  end if;
  if nullif(trim(p->>'name'), '') is null then raise exception 'Item name is required'; end if;
  if nullif(p->>'category_id', '') is null then raise exception 'Category is required'; end if;

  select * into v_size from _inv_norm_size(nullif(p->>'size_amount', '')::numeric, p->>'size_unit');
  if v_track <> 'count' then
    select null::numeric as o_amount, null::text as o_unit into v_size;
  end if;

  select * into v from catalog_items
  where organization_id = p_org and archived_at is null
    and lower(name) = lower(trim(p->>'name'))
    and track_by = v_track
    and size_amount is not distinct from v_size.o_amount
    and size_unit is not distinct from v_size.o_unit
  order by created_at
  limit 1
  for update;
  if found then
    if v_barcode is not null and v.barcode is null then
      update catalog_items set barcode = v_barcode, updated_at = now() where id = v.id returning * into v;
    end if;
    return v;
  end if;

  insert into catalog_items (organization_id, name, category_id, track_by, size_amount, size_unit,
                             case_size, barcode, photo_url)
  values (p_org, trim(p->>'name'), (p->>'category_id')::int, v_track,
          v_size.o_amount, v_size.o_unit,
          case when v_track = 'count' then nullif(p->>'case_size', '')::int end,
          v_barcode, nullif(p->>'photo_url', ''))
  returning * into v;

  perform _inv_log(v, p_location_id, 'edited', 0, null, null, null, null, null,
                   null, null, null, null, jsonb_build_object('created', true));
  return v;
end $$;

revoke all on function public._inv_create_item(uuid, jsonb, uuid) from public, anon, authenticated;
