'use client';

// The cart = one drop-off, reviewed before it goes into stock. Same screen as the Remove cart
// (the shared FlowCart in components/flow/cart.jsx), in Add orange:
//   header (Total + "Add to stock") · From strip · Items (Edit / Remove, typeable amounts)
//   floating Scan / Search / Type pill that folds into "+". An empty cart shows the Add landing.

import React, { useMemo, useState } from 'react';
import { ChevronRight, ScanBarcode, Search, Keyboard } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { formatSize, formatExpiry, formatStorage, summarizeAmounts, SOURCE_LABELS } from '@/lib/inventory-format';
import { FlowCart, ConfirmSheet, DoneScreen, CartPhotos, CartSummary, cartPhotos, rowBuilder } from '@/components/flow/cart';
import { DeliveryPage } from './delivery-sheet';
import { EmptyCartLanding } from './empty-cart-landing';
import { EMPTY_DELIVERY, toApiLine, toApiDelivery } from './cart-lines';

function deliverySummary(d) {
  const parts = [];
  if (d.source) parts.push(SOURCE_LABELS[d.source]);
  if (d.isAnonymous) parts.push('Anonymous');
  else if (d.donorName?.trim()) parts.push(d.donorName.trim());
  if (Number(d.weighedLbs) > 0) parts.push(`${Number(d.weighedLbs)} ${d.weighedUnit || 'lb'} on scale`);
  return parts.join(' · ');
}

// "Canned beans · 15 oz", then where it goes and the date.
const toRow = rowBuilder((item) => {
  const size = formatSize(item.sizeAmount, item.sizeUnit);
  const spot = formatStorage(item.storageLocation);
  const exp = formatExpiry(item.expirationDate, item.expirationPrecision);
  return {
    key: item.id,
    item,
    name: size ? `${item.name} · ${size}` : item.name,
    photoUrl: item.photoUrl,
    category: item.categoryName,
    isWeight: item.trackBy === 'weight',
    quantity: Number(item.quantity) || 0,
    max: Infinity,
    details: [
      spot && { text: spot, tone: 'strong' },
      exp ? { text: `Exp ${exp}`, tone: 'medium' } : { text: 'No expiration date', tone: 'faint' },
    ].filter(Boolean),
  };
});

export function MobileCartView({
  cartItems = [],
  setCartItems,
  delivery = EMPTY_DELIVERY,
  setDelivery,
  onBack,
  onEdit,
}) {
  const { pantryDetails } = usePantry();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartError, setCartError] = useState('');
  const [done, setDone] = useState(null); // { total, count, from, photos } of the cart that was just added

  const rows = useMemo(() => cartItems.map(toRow), [cartItems]);
  const totals = summarizeAmounts(cartItems);
  const totalText = totals.text.replace(' · ', ' + ');
  const fromText = deliverySummary(delivery);
  const countText = `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'}`;
  const photos = cartPhotos(cartItems);

  const submitBatch = async () => {
    if (cartItems.length === 0) return;
    setShowConfirm(false);
    setIsSubmitting(true);
    setCartError('');
    try {
      const response = await fetch('/api/foods/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pantry-id': pantryDetails?.id || '' },
        body: JSON.stringify({ delivery: toApiDelivery(delivery), lines: cartItems.map(toApiLine) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Could not add your cart. Please try again.');
      // Keep what went in, for the Added screen (the cart itself is cleared below).
      setDone({ total: totalText, count: cartItems.length, from: fromText, photos });
      setCartItems([]);
      setDelivery?.(EMPTY_DELIVERY);
    } catch (err) {
      setCartError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const doneScreen = done && (
    <DoneScreen
      theme="add"
      title="Added to inventory"
      sub={`${done.count} ${done.count === 1 ? 'item is' : 'items are'} on the shelves now.`}
      photos={done.photos}
      rows={[{ label: 'Items', value: done.total, strong: true }, { label: 'From', value: done.from, placeholder: 'Not recorded' }]}
      primary="Add another drop-off"
      onPrimary={() => { setDone(null); onBack?.('CAMERA'); }}
      secondary="Back to Add"
      onSecondary={() => setDone(null)}
    />
  );

  // Empty cart keeps the Add landing page (search, Scan to Add, other ways in, Recently Added).
  if (cartItems.length === 0) {
    return (
      <>
        <EmptyCartLanding onBack={onBack} />
        {doneScreen}
      </>
    );
  }

  return (
    <FlowCart
      theme="add"
      rows={rows}
      totals={totals}
      actionLabel="Add to stock"
      onAction={() => setShowConfirm(true)}
      busy={isSubmitting}
      error={cartError}
      title="Items"
      strip={
        // Where this drop-off came from; same gray strip as before, under the header.
        <button
          type="button"
          onClick={() => setShowDelivery(true)}
          className="w-full h-[52px] px-4 flex items-center gap-3 bg-gray-100 text-left active:bg-gray-200/70"
        >
          <span className="flex-1 min-w-0 truncate text-[15px]">
            <span className="text-gray-500">From · </span>
            <span className={fromText ? 'font-medium text-[#1a1f36]' : 'text-gray-500'}>{fromText || 'Add source'}</span>
          </span>
          <ChevronRight className="w-[18px] h-[18px] shrink-0 text-gray-500" strokeWidth={2.2} />
        </button>
      }
      ways={[
        { label: 'Scan', icon: ScanBarcode, onClick: () => onBack?.('CAMERA') },
        { label: 'Search', icon: Search, onClick: () => onBack?.('SEARCH') },
        { label: 'Type', icon: Keyboard, onClick: () => onBack?.('MANUAL_ENTRY') },
      ]}
      onQuantity={(item, next) =>
        setCartItems((prev) => prev.map((l) => (l.id === item.id ? { ...l, quantity: next } : l)))
      }
      onRemove={(item) => setCartItems((prev) => prev.filter((l) => l.id !== item.id))}
      onRestore={(item, index) =>
        setCartItems((prev) => {
          const next = prev.slice();
          next.splice(Math.min(index, next.length), 0, item);
          return next;
        })
      }
      onEdit={onEdit}
      onClear={() => { setCartItems([]); setDelivery?.(EMPTY_DELIVERY); }}
    >
      {doneScreen}

      <ConfirmSheet
        theme="add"
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        id="cart-add-title"
        title="Add to stock?"
        body={`${countText} ${cartItems.length === 1 ? 'goes' : 'go'} on the shelves right away.`}
        primary="Yes, add them"
        onPrimary={submitBatch}
        secondary="Keep editing"
      >
        <div className="px-4 pt-4 flex flex-col gap-3">
          <CartPhotos photos={photos} />
          <CartSummary rows={[{ label: 'Items', value: totalText, strong: true }, { label: 'From', value: fromText, placeholder: 'Not recorded' }]} />
        </div>
      </ConfirmSheet>

      <DeliveryPage
        open={showDelivery}
        delivery={delivery}
        onClose={(d) => { setDelivery?.(d); setShowDelivery(false); }}
      />
    </FlowCart>
  );
}
