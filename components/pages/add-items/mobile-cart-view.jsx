'use client';

// The cart = one drop-off, reviewed before it goes into stock (modeled on Scan & Go, no prices).
//   orange header (Exit = leave for now, "Add to stock" on the right) · From strip · item list
// The floating add control is the way back to the scanner: a Scan / Search / Type pill while the
// cart is short and you're at the top; once it grows or you scroll it folds into a round button,
// and tapping that opens the pill again (scrolling folds it back).

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, ChevronRight, Loader2, Check, ScanBarcode, Search, Keyboard } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { formatSize, formatExpiry, formatStorage, formatAmount, summarizeAmounts, SOURCE_LABELS } from '@/lib/inventory-format';
import { ItemThumb, BottomSheet } from './intake-fields';
import { DeliveryPage } from './delivery-sheet';
import { EmptyCartLanding } from './empty-cart-landing';
import { EMPTY_DELIVERY, toApiLine, toApiDelivery } from './cart-lines';

const CARD_LIFT = 'shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]';
const TEXT_LINK = 'py-1.5 text-[13px] text-[#4b5263] underline underline-offset-4 decoration-gray-300';

function deliverySummary(d) {
  const parts = [];
  if (d.source) parts.push(SOURCE_LABELS[d.source]);
  if (d.isAnonymous) parts.push('Anonymous');
  else if (d.donorName?.trim()) parts.push(d.donorName.trim());
  if (Number(d.weighedLbs) > 0) parts.push(`${Number(d.weighedLbs)} ${d.weighedUnit || 'lb'} on scale`);
  return parts.join(' · ');
}

const MAX_PHOTOS = 6;
// The cart's own photos, overlapped. Lines without a photo are skipped; nothing is drawn in their place.
function CartPhotos({ photos }) {
  if (!photos?.length) return null;
  return (
    <div className="flex pl-2" aria-hidden="true">
      {photos.map((p) => (
        <img key={p.id} src={p.url} alt="" referrerPolicy="no-referrer" className="-ml-2 w-10 h-10 shrink-0 rounded-full border-2 border-white bg-gray-50 object-cover" />
      ))}
    </div>
  );
}

// Items + From, the same two rows on Confirm and Added.
function CartSummary({ total, from }) {
  return (
    <div className="rounded-2xl border border-gray-200 px-3.5 divide-y divide-gray-100 text-[14px] text-left">
      <div className="min-h-[52px] flex items-center justify-between gap-3">
        <span className="shrink-0 text-gray-500">Items</span>
        <span className="text-[15px] font-semibold">{total}</span>
      </div>
      <div className="min-h-[52px] flex items-center justify-between gap-3">
        <span className="shrink-0 text-gray-500">From</span>
        <span className={`min-w-0 truncate text-right ${from ? 'font-medium text-[#1a1f36]' : 'text-gray-400'}`}>{from || 'Not recorded'}</span>
      </div>
    </div>
  );
}

// Bottom sheet with the cart's confirm layout: title, one line, then filled + outlined buttons.
function ConfirmSheet({ open, onClose, id, title, body, children, primary, primaryClass, onPrimary, secondary }) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy={id}>
      <div className="flex justify-center pt-2.5"><span className="w-10 h-[5px] rounded-full bg-gray-200" /></div>
      <h2 id={id} className="px-4 pt-3.5 text-[17px] font-semibold tracking-[-0.01em] text-[#1a1f36]">{title}</h2>
      {body && <p className="px-4 pt-0.5 text-[13px] text-gray-500">{body}</p>}
      {children}
      <div className="px-4 pt-5 pb-[calc(28px+env(safe-area-inset-bottom))] flex flex-col gap-2">
        <button type="button" onClick={onPrimary} className={`w-full h-[52px] rounded-full text-white text-[16px] font-semibold ${primaryClass}`}>
          {primary}
        </button>
        <button type="button" onClick={onClose} className="w-full h-[52px] rounded-2xl border border-gray-300 bg-white text-[16px] font-semibold text-[#1a1f36] active:bg-gray-50">
          {secondary}
        </button>
      </div>
    </BottomSheet>
  );
}

export function MobileCartView({
  cartItems = [],
  setCartItems,
  delivery = EMPTY_DELIVERY,
  setDelivery,
  onBack,
  onEdit,
}) {
  const { pantryDetails } = usePantry();
  const [sheet, setSheet] = useState(null); // 'add' | 'clear' | 'leave'
  const [showDelivery, setShowDelivery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartError, setCartError] = useState('');
  const [done, setDone] = useState(null); // { total, count, from, photos } of the cart that was just added
  const [removed, setRemoved] = useState(null); // { line, index } for Undo
  const undoTimer = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [pillOpen, setPillOpen] = useState(false); // circle tapped: show the three ways again

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const hasLines = cartItems.length > 0;
  const summary = summarizeAmounts(cartItems);
  const totalText = summary.text.replace(' · ', ' + ');
  // List header: units + pounds (the row count is already visible in the list).
  const listTotal = [
    summary.items > 0 ? `${summary.items} ${summary.items === 1 ? 'unit' : 'units'}` : null,
    summary.lbs > 0 ? formatAmount(Math.round(summary.lbs * 100) / 100, 'weight') : null,
  ].filter(Boolean).join(' + ');
  const fromText = deliverySummary(delivery);
  const countText = `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'}`;
  const photos = cartItems.filter((l) => l.photoUrl).slice(0, MAX_PHOTOS).map((l) => ({ id: l.id, url: l.photoUrl }));
  // Few items and at the top (or the circle was tapped): show all three ways in. Otherwise the round button.
  const addExpanded = (cartItems.length <= 3 && !scrolled) || pillOpen;

  const removeLine = (id) => {
    const index = cartItems.findIndex((i) => i.id === id);
    if (index < 0) return;
    setRemoved({ line: cartItems[index], index });
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), 5000);
  };

  const undoRemove = () => {
    if (!removed) return;
    setCartItems((prev) => {
      const next = prev.slice();
      next.splice(Math.min(removed.index, next.length), 0, removed.line);
      return next;
    });
    setRemoved(null);
  };

  // Counted lines only — weighed lines change their pounds through Edit.
  const updateItemQty = (id, delta) => {
    setRemoved(null);
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.trackBy !== 'weight'
          ? { ...item, quantity: Math.max(1, (Number(item.quantity) || 1) + delta) }
          : item
      )
    );
  };

  const clearBatch = () => {
    setCartItems([]);
    setDelivery?.(EMPTY_DELIVERY);
    setRemoved(null);
    setSheet(null);
  };

  // An empty cart has nothing to lose, so it leaves straight away.
  const handleBack = () => (hasLines ? setSheet('leave') : onBack?.());

  const submitBatch = async () => {
    if (!hasLines) return;
    setSheet(null);
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
      setRemoved(null);
      setCartItems([]);
      setDelivery?.(EMPTY_DELIVERY);
    } catch (err) {
      setCartError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty cart keeps the Add landing page (search, Scan to Add, other ways in, Recently Added).
  if (!hasLines && !done) return <EmptyCartLanding onBack={onBack} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      // Covers the global bottom nav (z-[100]) like the scanner screen does; sheets and the edit form sit above.
      className="fixed inset-0 z-[105] bg-white flex flex-col text-[#1a1f36]"
    >
      {/* Header: orange bar, Exit on the left (leaves the add flow), white "Add to stock" on the right */}
      <div className="shrink-0 bg-[#e27f2c] text-white pt-[env(safe-area-inset-top)]">
        <div className="h-14 px-4 flex items-center justify-between gap-3">
          <h1 className="sr-only">Cart</h1>
          <button
            type="button"
            onClick={handleBack}
            className="-ml-2 h-11 px-2 rounded-full flex items-center gap-1.5 text-[15px] font-medium tracking-[-0.01em] active:bg-white/15"
          >
            <X className="w-5 h-5" strokeWidth={2.6} />
            Exit
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => { setRemoved(null); setSheet('add'); }}
            className={`h-10 px-[18px] shrink-0 rounded-full bg-white text-[#e27f2c] text-[15px] font-semibold tracking-[-0.01em] whitespace-nowrap flex items-center gap-1.5 active:bg-[#fff0eb] disabled:opacity-60 ${CARD_LIFT}`}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Add to stock
          </button>
        </div>
      </div>

      {/* From strip: stays put while the list scrolls. Text and chevron line up with the list rows (16 + 1 + 12px). */}
      {hasLines && (
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setShowDelivery(true)}
            className="w-full h-[52px] px-[29px] flex items-center gap-3 bg-gray-100 text-left active:bg-gray-200/70"
          >
            <span className="flex-1 min-w-0 truncate text-[15px]">
              <span className="text-gray-500">From · </span>
              <span className={fromText ? 'font-medium text-[#1a1f36]' : 'text-gray-500'}>{fromText || 'Add source'}</span>
            </span>
            <ChevronRight className="w-[18px] h-[18px] shrink-0 text-gray-500" strokeWidth={2.2} />
          </button>
        </div>
      )}

      <div
        onScroll={(e) => { setScrolled(e.currentTarget.scrollTop > 24); setPillOpen(false); }}
        className="flex-1 overflow-y-auto px-4 pt-5 pb-[calc(112px+env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cartError && (
          <div role="alert" className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
            {cartError}
          </div>
        )}

        {hasLines && (
          <div className="flex flex-col gap-2">
            {/* The cart list card is the one 6px card (sharper, receipt-like); see DESIGN.md → Cart. */}
            <div className={`rounded-md border border-gray-300/70 px-3 ${CARD_LIFT}`}>
              <div className="min-h-[52px] flex items-center justify-between border-b border-gray-100">
                <span className="text-[14px] text-gray-500">Total</span>
                <span className="text-[15px] font-semibold tracking-[-0.01em]">{listTotal}</span>
              </div>
              <div className="divide-y divide-gray-100">
                <AnimatePresence initial={false}>
                  {cartItems.map((item) => {
                    const isWeight = item.trackBy === 'weight';
                    const sizeLabel = formatSize(item.sizeAmount, item.sizeUnit);
                    const expLabel = formatExpiry(item.expirationDate, item.expirationPrecision);
                    const details = [expLabel ? `Exp ${expLabel}` : null, formatStorage(item.storageLocation) || null]
                      .filter(Boolean)
                      .join(' · ');

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3.5 pb-2.5 flex items-start gap-3">
                          <ItemThumb photoUrl={item.photoUrl} categoryName={item.categoryName} size={48} rounded="rounded-lg" />
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className="text-[14.5px] font-medium leading-[1.35]">
                              {item.name}
                              {sizeLabel && ` · ${sizeLabel}`}
                            </span>
                            {details && <span className="text-[12px] text-gray-500">{details}</span>}
                            <span className="mt-2 flex items-center gap-5">
                              <button type="button" onClick={() => onEdit?.(item)} className={TEXT_LINK}>Edit</button>
                              <button type="button" onClick={() => removeLine(item.id)} className={TEXT_LINK}>Remove</button>
                            </span>
                          </div>
                          {isWeight ? (
                            <span className="shrink-0 text-[14px] font-semibold whitespace-nowrap">
                              {formatAmount(item.quantity, 'weight')}
                            </span>
                          ) : (
                            <div className="h-9 shrink-0 flex items-center rounded-full border border-gray-200 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.id, -1)}
                                aria-label="One less"
                                className="w-[34px] h-full flex items-center justify-center active:bg-gray-50"
                              >
                                <Minus className="w-3.5 h-3.5" strokeWidth={2.4} />
                              </button>
                              <span className="min-w-[26px] text-center text-[14px] font-semibold">{formatAmount(item.quantity, 'count')}</span>
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.id, 1)}
                                aria-label="One more"
                                className="w-[34px] h-full flex items-center justify-center active:bg-gray-50"
                              >
                                <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setRemoved(null); setSheet('clear'); }}
              className="self-center p-3 text-[14px] font-medium underline underline-offset-4 decoration-gray-400"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>

      {/* Floating add control: the three ways in, or the round scan button */}
      <AnimatePresence initial={false} mode="popLayout">
        {hasLines && addExpanded && (
          <motion.div
            key="add-pill"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 bottom-[calc(24px+env(safe-area-inset-bottom))] flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto h-14 p-1 flex items-center gap-1 rounded-full bg-white border border-gray-200 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.18)]">
              <button
                type="button"
                onClick={() => onBack?.('CAMERA')}
                className="h-full px-4 rounded-full bg-[#fff0eb] text-[#b5541a] flex items-center gap-2 text-[14px] font-semibold active:bg-[#ffe3d6]"
              >
                <ScanBarcode className="w-5 h-5" strokeWidth={2.2} />
                Scan
              </button>
              <button
                type="button"
                onClick={() => onBack?.('SEARCH')}
                className="h-full px-3.5 rounded-full text-[#1a1f36] flex items-center gap-2 text-[14px] font-medium active:bg-gray-100"
              >
                <Search className="w-[18px] h-[18px] text-[#4b5263]" strokeWidth={2.2} />
                Search
              </button>
              <button
                type="button"
                onClick={() => onBack?.('MANUAL_ENTRY')}
                className="h-full px-3.5 rounded-full text-[#1a1f36] flex items-center gap-2 text-[14px] font-medium active:bg-gray-100"
              >
                <Keyboard className="w-[18px] h-[18px] text-[#4b5263]" strokeWidth={2.2} />
                Type
              </button>
            </div>
          </motion.div>
        )}
        {hasLines && !addExpanded && (
          <motion.button
            key="add-circle"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            onClick={() => setPillOpen(true)}
            aria-label="Add more items"
            aria-expanded={false}
            // Same shell as the pill (white, gray border, soft shadow, 56px) with the "+" in the Scan chip's tint.
            className="absolute right-4 bottom-[calc(24px+env(safe-area-inset-bottom))] w-14 h-14 p-1 rounded-full border border-gray-200 bg-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.18)] active:scale-95"
          >
            <span className="w-full h-full rounded-full bg-[#fff0eb] text-[#b5541a] flex items-center justify-center">
              <Plus className="w-5 h-5" strokeWidth={2.4} />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Undo after Remove */}
      <AnimatePresence>
        {removed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            role="status"
            className={`absolute left-4 h-[52px] ${addExpanded ? 'right-4 bottom-[calc(92px+env(safe-area-inset-bottom))]' : 'right-[88px] bottom-[calc(28px+env(safe-area-inset-bottom))]'} rounded-2xl bg-[#1a1f36] text-white flex items-center gap-3 pl-4 pr-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]`}
          >
            <span className="flex-1 min-w-0 truncate text-[14px]">Removed {removed.line.name}</span>
            <button type="button" onClick={undoRemove} className="h-10 px-3.5 rounded-xl text-[14px] font-semibold underline underline-offset-[3px]">
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Added: the cart went into stock */}
      {done && (
        <div className="absolute inset-0 z-10 bg-white flex flex-col">
          <div className="flex-1 flex flex-col justify-center gap-6 px-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="w-16 h-16 rounded-full bg-[#fff0eb] text-[#e27f2c] flex items-center justify-center">
                <Check className="w-[30px] h-[30px]" strokeWidth={2.6} />
              </span>
              <h2 className="text-[20px] font-semibold tracking-[-0.01em]">Added to inventory</h2>
              <p className="-mt-1.5 text-[14px] text-gray-500">
                {done.count} {done.count === 1 ? 'item is' : 'items are'} on the shelves now.
              </p>
            </div>
            {done.photos.length > 0 && (
              <div className="flex justify-center"><CartPhotos photos={done.photos} /></div>
            )}
            <CartSummary total={done.total} from={done.from} />
          </div>
          <div className="px-4 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setDone(null); onBack?.('CAMERA'); }}
              className="w-full h-[52px] rounded-full bg-[#e27f2c] hover:bg-[#cf6f20] text-white text-[16px] font-semibold"
            >
              Add another drop-off
            </button>
            <button
              type="button"
              onClick={() => { setDone(null); onBack?.(); }}
              className="w-full h-[52px] rounded-2xl border border-gray-300 bg-white text-[16px] font-semibold active:bg-gray-50"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}

      <ConfirmSheet
        open={sheet === 'add'}
        onClose={() => setSheet(null)}
        id="cart-add-title"
        title="Add to stock?"
        body={`${countText} ${cartItems.length === 1 ? 'goes' : 'go'} on the shelves right away.`}
        primary="Yes, add them"
        primaryClass="bg-[#e27f2c] active:bg-[#cf6f20]"
        onPrimary={submitBatch}
        secondary="Keep editing"
      >
        <div className="px-4 pt-4 flex flex-col gap-3">
          <CartPhotos photos={photos} />
          <CartSummary total={totalText} from={fromText} />
        </div>
      </ConfirmSheet>

      <ConfirmSheet
        open={sheet === 'clear'}
        onClose={() => setSheet(null)}
        id="cart-clear-title"
        title="Clear the cart?"
        body={`All ${countText} come out of the cart. Nothing in inventory changes.`}
        primary="Clear cart"
        primaryClass="bg-[#dc2626] active:bg-red-700"
        onPrimary={clearBatch}
        secondary="Keep them"
      />

      <ConfirmSheet
        open={sheet === 'leave'}
        onClose={() => setSheet(null)}
        id="cart-leave-title"
        title="Leave for now?"
        body="Your cart is saved, so you can finish it later."
        primary="Leave"
        primaryClass="bg-[#1a1f36] active:bg-black"
        onPrimary={() => { setSheet(null); onBack?.(); }}
        secondary="Keep adding"
      />

      <DeliveryPage
        open={showDelivery}
        delivery={delivery}
        onClose={(d) => { setDelivery?.(d); setShowDelivery(false); }}
      />
    </motion.div>
  );
}
