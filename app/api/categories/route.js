import { NextResponse } from 'next/server';
import { handle, getContext, categorySlug } from '@/lib/server/inventory-api';

// GET: the category list the add form should show (shared across pantries).
export const GET = handle(async (req) => {
  const { supabase } = await getContext(req);
  const { data, error } = await supabase.from('categories').select('id, name, is_food').order('id');
  if (error) throw error;
  return NextResponse.json({
    categories: (data || []).map((c) => ({ id: c.id, name: c.name, isFood: c.is_food, slug: categorySlug(c.name) })),
  });
});
