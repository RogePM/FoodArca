-- "Meat & fish" read oddly as a tile name. Plain "Meat"; the example line lists fish.
update public.categories set name = 'Meat' where name = 'Meat & fish';
