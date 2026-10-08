import { cookies } from 'next/headers';
import { CART_HINT } from '@/lib/hint-cookies';
import { DistributionModule } from '@/components/pages/distribution';
import { ServerSeed } from '@/components/providers/server-seed';
import { getDashboardContext } from '@/lib/server/dashboard-context';
import { fetchInventoryPage } from '@/lib/server/inventory-api';
import { toRpcArgs } from '@/lib/inventory-query';

export const metadata = {
  title: 'Remove Items | Food Arca',
};

// The landing's data, drawn on the server so it arrives filled in: the shelf counts behind
// "Browse items" and the four soonest-dated items behind "Expiring soon", from the same database
// function as Inventory (public.inventory_page). Who and where come from the dashboard context the
// layout already worked out for this request.
async function landingSeed() {
  const { supabase, locationId } = await getDashboardContext();
  if (!locationId) return null;
  try {
    const page = await fetchInventoryPage(supabase, locationId, toRpcArgs(locationId, { limit: 4, summary: true }));
    return page && { lots: page.lots, summary: page.summary };
  } catch (err) {
    console.error('Remove landing:', err);
    return null;
  }
}

// The cart lives in the browser; a small cookie tells the server whether it has items, so the first
// screen it draws is the right one (lib/hint-cookies). With a cart, the landing isn't shown.
export default async function RemoveItemPage() {
  const cartOpen = (await cookies()).get(CART_HINT.remove)?.value === '1';
  const removeLanding = cartOpen ? null : await landingSeed();
  return (
    <ServerSeed seed={{ removeLanding }}>
      <DistributionModule cartOpen={cartOpen} />
    </ServerSeed>
  );
}
