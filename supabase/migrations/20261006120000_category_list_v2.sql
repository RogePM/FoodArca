-- New category list (see the "Pick a category" board on the add-flow canvas).
-- Broad groups by what the thing is and how it's stored; the item name carries the specifics.
-- Existing rows are renamed in place, so every item keeps its category id.

update public.categories set name = 'Canned & jarred'      where name = 'Canned Goods';
update public.categories set name = 'Dry goods'            where name = 'Dry Goods / Grains';
update public.categories set name = 'Dairy & eggs'         where name = 'Dairy';
update public.categories set name = 'Meat & fish'          where name = 'Meat / Protein';
update public.categories set name = 'Bread & bakery'       where name = 'Bakery';
update public.categories set name = 'Drinks'               where name = 'Beverages';
update public.categories set name = 'Baby food & formula'  where name = 'Baby Food';
update public.categories set name = 'Other / not sure'     where name = 'Assorted Salvage';
update public.categories set name = 'Diapers & baby care'  where name = 'Diapers & Baby Supplies';
-- Produce, Frozen, Hygiene, Household keep their names.

-- New: snacks, and pet food (asked for an expiry like food).
insert into public.categories (name, is_food) values ('Snacks', true), ('Pet food', true)
on conflict (name) do nothing;

-- Clothing isn't part of the list. Anything still filed there moves to Other / not sure first.
update public.catalog_items
set category_id = (select id from public.categories where name = 'Other / not sure')
where category_id = (select id from public.categories where name = 'Clothing');
delete from public.categories where name = 'Clothing';
