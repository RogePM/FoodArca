'use client';

// Remove cart: the shared FlowCart (components/flow/cart.jsx) in clay, with Check Out,
// Scan / Search, and the reason on each row. An empty cart shows the Remove landing.

import React, { useMemo, useState } from 'react';
import { ScanBarcode, Search } from 'lucide-react';
import { summarizeAmounts } from '@/lib/inventory-format';
import { FlowCart, ConfirmSheet, DoneScreen, CartPhotos, CartSummary, cartPhotos, rowBuilder } from '@/components/flow/cart';
import { REMOVE_REASONS } from './no-barcode-visual-grid-sheet';
import { RemoveLanding } from './remove-landing';

const isWeightUnit = (unit) => /^(lb|lbs|pound|pounds)$/i.test(unit || '');

function formatItemExpiration(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// "Stock: 48 items" / "Stock: 6.5 lb"; a non-default reason rides on the stock line.
const toRow = rowBuilder((item) => {
  const stock = item.availableBatchStock;
  const unitWord = isWeightUnit(item.unit)
    ? 'lb'
    : !item.unit || /^(units?|count|ct|items?)$/i.test(item.unit)
      ? (Number(stock) === 1 ? 'item' : 'items')
      : item.unit;
  const reason = item.reason && item.reason !== 'given_out'
    ? REMOVE_REASONS.find((r) => r.value === item.reason)?.label || item.reason
    : null;
  const exp = formatItemExpiration(item.expirationDate);
  return {
    key: item.id || item.batchId,
    item,
    name: item.name,
    photoUrl: item.photoUrl,
    category: item.category,
    isWeight: isWeightUnit(item.unit),
    quantity: Number(item.quantity || 0),
    max: Number(item.availableBatchStock ?? Infinity),
    details: [
      stock !== undefined && { text: `Stock: ${stock} ${unitWord}`, tone: 'strong', accent: reason },
      exp ? { text: `Exp ${exp}`, tone: 'medium' } : { text: 'No expiration date', tone: 'faint' },
    ].filter(Boolean),
  };
});

export function MobileCheckoutCartView({
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onRestoreItem,
  onClearCart,
  onOpenScanner,
  onOpenVisualGrid,
  onCheckout,
  onOpenProduct,
  isSubmitting = false,
  checkoutError = '',
}) {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [done, setDone] = useState(null); // { total, count, reasons, photos } of the cart that just checked out

  const rows = useMemo(() => cartItems.map(toRow), [cartItems]);
  // Counted items and pounds are totalled apart: "12 items + 4 lb", never "16 items".
  const totals = summarizeAmounts(
    cartItems.map((item) => ({ quantity: Number(item.quantity || 1), trackBy: isWeightUnit(item.unit) ? 'weight' : 'count' }))
  );
  const totalText = totals.text.replace(' · ', ' + ');
  const countText = `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'}`;
  const photos = cartPhotos(cartItems);
  // "Given out", or "Given out · Expired" when the cart mixes reasons.
  const reasonsText = REMOVE_REASONS
    .filter((r) => cartItems.some((l) => (l.reason || 'given_out') === r.value))
    .map((r) => r.label)
    .join(' · ');

  const handleConfirmSubmit = async () => {
    setShowSubmitConfirm(false);
    if (!onCheckout) return;
    // Keep what went out for the Removed screen; the flow clears the cart on success.
    const snapshot = { total: totalText, count: cartItems.length, reasons: reasonsText, photos };
    const ok = await onCheckout();
    if (ok) setDone(snapshot);
  };

  return (
    <FlowCart
      theme="remove"
      rows={rows}
      totals={totals}
      actionLabel="Check Out"
      onAction={() => setShowSubmitConfirm(true)}
      busy={isSubmitting}
      error={checkoutError}
      title="Scanned items"
      clearLabel="Clear checkout cart"
      empty={<RemoveLanding onOpenScanner={onOpenScanner} onOpenVisualGrid={onOpenVisualGrid} onOpenProduct={onOpenProduct} />}
      ways={[
        { label: 'Scan', icon: ScanBarcode, onClick: onOpenScanner },
        { label: 'Search', icon: Search, onClick: () => onOpenVisualGrid('all') },
      ]}
      onQuantity={(item, next) => onUpdateQuantity?.(item.id, next - Number(item.quantity || 0))}
      onRemove={(item) => onRemoveItem?.(item.id)}
      onRestore={(item, index) => onRestoreItem?.(item, index)}
      onClear={onClearCart}
    >
      {done && (
        <DoneScreen
          theme="remove"
          title="Removed from inventory"
          sub={`${done.count} ${done.count === 1 ? 'item is' : 'items are'} off the shelves now.`}
          photos={done.photos}
          rows={[{ label: 'Items', value: done.total, strong: true }, { label: 'Reason', value: done.reasons }]}
          primary="Remove more items"
          onPrimary={() => { setDone(null); onOpenScanner?.(); }}
          secondary="Back to Remove"
          onSecondary={() => setDone(null)}
        />
      )}

      <ConfirmSheet
        theme="remove"
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        id="remove-checkout-title"
        title="Check out these items?"
        body={`${countText} ${cartItems.length === 1 ? 'comes' : 'come'} out of inventory right away.`}
        primary="Yes, check out"
        onPrimary={handleConfirmSubmit}
        secondary="Keep editing"
      >
        <div className="px-4 pt-4 flex flex-col gap-3">
          <CartPhotos photos={photos} />
          <CartSummary rows={[{ label: 'Items', value: totalText, strong: true }, { label: 'Reason', value: reasonsText }]} />
        </div>
      </ConfirmSheet>
    </FlowCart>
  );
}
