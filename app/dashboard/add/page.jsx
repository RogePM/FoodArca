import { cookies } from 'next/headers';
import { CART_HINT } from '@/lib/hint-cookies';
import { AddItemView } from '@/components/pages/add-items/add-item-view';
import { ServerSeed } from '@/components/providers/server-seed';
import { getDashboardContext } from '@/lib/server/dashboard-context';
import { fetchRecentlyAdded } from '@/lib/server/inventory-api';

export const metadata = {
  title: 'Add Items | Food Arca',
};

// "Recently added", drawn on the server so the landing arrives filled in (same query as
// /api/foods/changes/recent?added=8). Who and where come from the layout's dashboard context.
async function recentSeed() {
  const { supabase, organizationId } = await getDashboardContext();
  if (!organizationId) return null;
  try {
    return await fetchRecentlyAdded(supabase, organizationId, 8);
  } catch (err) {
    console.error('Add landing:', err);
    return null;
  }
}

// The cart lives in the browser; a small cookie tells the server whether it has items, so the first
// screen it draws is the right one (lib/hint-cookies). With a cart, the landing isn't shown.
export default async function AddItemPage() {
  const cartOpen = (await cookies()).get(CART_HINT.add)?.value === '1';
  const recentAdded = cartOpen ? null : await recentSeed();
  return (
    <ServerSeed seed={{ recentAdded }}>
      <AddItemView cartOpen={cartOpen} />
    </ServerSeed>
  );
}
