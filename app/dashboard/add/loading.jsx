'use client';

import { AddFirstScreen } from '@/components/pages/add-items/add-item-view';
import { useCartHint } from '@/lib/first-paint';
import { CART_HINT } from '@/lib/hint-cookies';

// Shown the moment Add is tapped, while the server draws the page: the same first screen the page
// itself starts with (the landing, or a blank page when the cart has items), so it lands without a jump.
export default function AddLoading() {
  return <AddFirstScreen cartOpen={useCartHint(CART_HINT.add)} />;
}
