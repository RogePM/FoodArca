'use client';

import React, { useState, useEffect, useTransition, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { useIsDesktop, isDesktopNow } from '@/lib/first-paint';
import { MobileCheckoutCartView } from './mobile-checkout-cart-view';

import { DistributionDesktopTable } from './distribution-desktop-table';
import { CartSidebar } from './cart-sidebar';
import { CartDrawer } from './cart-drawer';
import { CheckoutModal } from './checkout-modal';

const loadMobile = () =>
  import('./mobile-distribution-flow').then((mod) => ({ default: mod.MobileDistributionFlow || mod.default }));

// On a phone, start downloading the remove flow as soon as this page's code runs, alongside the
// page itself, instead of after the first render.
if (typeof window !== 'undefined' && !isDesktopNow()) loadMobile();

const MobileDistributionFlow = lazy(loadMobile);

const noop = () => {};

// What the remove flow draws first, drawn by the server so the page arrives already laid out (the
// landing fills in from the shared shelf). With items in the cart, a blank page rather than the
// landing, so the landing never flashes before it.
function MobileShell({ cartOpen }) {
  if (cartOpen) return <div className="absolute inset-0 z-50 bg-white" />;
  return (
    <AnimatePresence initial={false}>
      <MobileCheckoutCartView cartItems={[]} onOpenScanner={noop} onOpenVisualGrid={noop} onOpenProduct={noop} />
    </AnimatePresence>
  );
}

const Spinner = ({ className = 'flex' }) => (
  <div className={`${className} h-[100dvh] items-center justify-center bg-gray-50`}>
    <Loader2 className="animate-spin h-8 w-8 text-[#d97757]" />
  </div>
);

// The first screen while the screen size is unknown: the phone layout (hidden on desktop). Drawn by
// the server, and by the page's loading outline (app/dashboard/remove/loading.jsx) while it's on its way.
export function RemoveFirstScreen({ cartOpen = false }) {
  return (
    <>
      <div className="md:hidden"><MobileShell cartOpen={cartOpen} /></div>
      <Spinner className="hidden md:flex" />
    </>
  );
}

export function DistributionModule({ initialInventory = [], cartOpen = false }) {
  const { pantryId, lastInventoryUpdate, isLoading: isPantryLoading } = usePantry();
  const isDesktop = useIsDesktop();

  // Desktop State
  const [inventory, setInventory] = useState(initialInventory);
  const [isLoading, setIsLoading] = useState(initialInventory.length === 0);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sync inventory with backend
  useEffect(() => {
    // Phones use the mobile flow, which reads the shared shelf (lib/use-inventory) instead.
    if (!pantryId || !isDesktop) return;
    let isMounted = true;
    const syncInventory = async () => {
      try {
        const res = await fetch('/api/foods', {
          headers: { 'x-pantry-id': pantryId },
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            startTransition(() => {
              setInventory(json.data || []);
              setIsLoading(false);
            });
          }
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };

    if (inventory.length === 0) syncInventory();
    const interval = setInterval(syncInventory, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pantryId, lastInventoryUpdate, isDesktop]);

  // Desktop helper handlers
  const setGroupCartQty = (group, targetQty) => {
    const groupIds = new Set(group.batches.map((b) => b._id || b.id));
    setCart((prev) => {
      let nextCart = prev.filter((line) => !groupIds.has(line.item._id || line.item.id));
      let remaining = targetQty;
      for (const batch of group.batches) {
        if (remaining <= 0) break;
        const batchQty = Number(batch.quantity || 0);
        const qtyToAdd = Math.min(batchQty, remaining);
        nextCart.push({ item: batch, quantity: qtyToAdd });
        remaining -= qtyToAdd;
      }
      return nextCart;
    });
  };

  const updateCartQty = (itemId, delta) => {
    setCart((prev) =>
      prev.map((line) => {
        const lineId = line.item.id || line.item._id;
        if (lineId === itemId) {
          const currentStock =
            inventory.find((i) => (i.id || i._id) === itemId)?.quantity || line.item.quantity;
          return {
            ...line,
            quantity: Math.max(1, Math.min(line.quantity + delta, currentStock)),
          };
        }
        return line;
      })
    );
  };

  const removeFromCart = (itemId) =>
    setCart((prev) => prev.filter((line) => (line.item.id || line.item._id) !== itemId));

  const handleCheckoutSuccess = () => {
    setCart([]);
    setIsCartOpen(false);
    setShowCheckout(false);
  };

  // Server and hydration: the screen size is unknown.
  if (isDesktop === null) return <RemoveFirstScreen cartOpen={cartOpen} />;

  // Phones go straight in: the remove flow doesn't need the pantry to draw its landing and cart,
  // and fills in as data arrives. Until its code is in, the same shell stays on screen.
  if (!isDesktop) {
    return (
      <Suspense fallback={<MobileShell cartOpen={cartOpen} />}>
        <MobileDistributionFlow onCheckoutSuccess={handleCheckoutSuccess} />
      </Suspense>
    );
  }

  if (isPantryLoading) return <Spinner />;

  // Desktop View
  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden bg-[#fafafa] font-sans">
      <div className="px-0 md:px-5 lg:px-4 pb-0 md:pb-8 pt-0 md:pt-4 max-w-full mx-auto overflow-hidden h-[calc(100vh-64px)] flex flex-col relative">
        <div className="flex-1 flex flex-col lg:flex-row w-full h-full overflow-hidden gap-4">
          <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
            <DistributionDesktopTable
              isLoading={isLoading}
              inventory={inventory}
              cart={cart}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setGroupCartQty={setGroupCartQty}
            />
          </div>

          {/* Desktop Cart Sidebar */}
          <div className="hidden lg:flex flex-col h-full w-[320px] xl:w-[340px] z-20 shrink-0 bg-white border border-gray-200 rounded-[16px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
            <CartSidebar
              cart={cart}
              onUpdateQty={updateCartQty}
              onRemove={removeFromCart}
              onCheckoutSuccess={handleCheckoutSuccess}
            />
          </div>
        </div>

        {/* Drawer for smaller tablet screens */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          onCheckoutSuccess={handleCheckoutSuccess}
        />

        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          cart={cart}
          onSuccess={handleCheckoutSuccess}
        />
      </div>
    </div>
  );
}

export default DistributionModule;