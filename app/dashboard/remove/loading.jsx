'use client';

import { RemoveFirstScreen } from '@/components/pages/distribution';
import { useCartHint } from '@/lib/first-paint';
import { CART_HINT } from '@/lib/hint-cookies';

// Shown the moment Remove is tapped, while the server draws the page: the same first screen the page
// itself starts with (the landing, or a blank page when the cart has items), so it lands without a jump.
export default function RemoveLoading() {
  return <RemoveFirstScreen cartOpen={useCartHint(CART_HINT.remove)} />;
}
