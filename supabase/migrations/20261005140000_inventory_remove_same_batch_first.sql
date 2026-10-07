-- Removing stock: the lot the volunteer picked first, then lots with the SAME expiry and storage
-- (the same physical batch, just a different source), then soonest-expiring (FEFO).
create or replace function public._inv_remove(p_item public.catalog_items, p_location_id uuid, p_qty numeric,
  p_batch_id uuid, p_action text, p_reason text, p_visit_id uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare v_left numeric := p_qty; v_lot inventory_batches; v_take numeric; v_pick inventory_batches;
begin
  perform _inv_check_qty(p_item, p_qty);
  if p_batch_id is not null then
    select * into v_pick from inventory_batches where id = p_batch_id and catalog_item_id = p_item.id;
  end if;

  for v_lot in
    select * from inventory_batches
    where catalog_item_id = p_item.id and location_id = p_location_id
    order by (id = p_batch_id) desc nulls last,
             (v_pick.id is not null
              and expiration_date is not distinct from v_pick.expiration_date
              and storage_location is not distinct from v_pick.storage_location) desc,
             expiration_date asc nulls last,
             created_at asc
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

revoke all on function public._inv_remove(public.catalog_items, uuid, numeric, uuid, text, text, uuid, text) from public, anon, authenticated;
