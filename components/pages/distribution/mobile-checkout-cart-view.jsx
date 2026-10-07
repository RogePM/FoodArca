'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Trash2,
  ShoppingCart,
  ShoppingBasket,
  Loader2,
  CheckCircle2,
  Scan,
  ScanBarcode,
  Barcode,
  Search,
  X,
  Minus,
  Plus,
  MinusSquare,
  Calendar,
  Package,
  Layers,
  Sparkles,
  PlusCircle,
  Smartphone,
  AlertTriangle,
  Clock,
  TrendingDown,
  Check,
} from 'lucide-react';
import { categories, getCategoryVisual } from '@/lib/constants';
import { CategoryGlyph } from '@/components/ui/category-glyph';
import { summarizeAmounts } from '@/lib/inventory-format';
import { REMOVE_REASONS } from './no-barcode-visual-grid-sheet';
import { BottomSheet } from '@/components/pages/add-items/intake-fields';
import { RemoveLanding } from './remove-landing';

const MAX_PHOTOS = 6;
// The cart's own photos, overlapped (same as the Add cart). Lines without a photo are skipped.
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

// Items + Reason, the same two rows on Confirm and Removed.
function CartSummary({ total, reasons }) {
  return (
    <div className="rounded-2xl border border-gray-200 px-3.5 divide-y divide-gray-100 text-[14px] text-left">
      <div className="min-h-[52px] flex items-center justify-between gap-3">
        <span className="shrink-0 text-gray-500">Items</span>
        <span className="text-[15px] font-semibold">{total}</span>
      </div>
      <div className="min-h-[52px] flex items-center justify-between gap-3">
        <span className="shrink-0 text-gray-500">Reason</span>
        <span className="min-w-0 truncate text-right font-medium text-[#1a1f36]">{reasons}</span>
      </div>
    </div>
  );
}

// Bottom sheet with the Add cart's confirm layout: title, one line, then filled + outlined buttons.
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

function formatItemExpiration(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const isWeightUnit = (unit) => /^(lb|lbs|pound|pounds)$/i.test(unit || '');

// Weighed lines: type what the scale says instead of stepping by 1. Capped at stock;
// an empty or zero entry snaps back to the previous amount.
function WeightQuantityField({ value, max, onCommit }) {
  const [draft, setDraft] = useState(null); // null while not editing

  const commit = () => {
    const n = parseFloat(draft);
    if (draft !== null && n > 0) {
      const next = Math.min(max, Math.round(n * 100) / 100);
      if (next !== Number(value)) onCommit(next);
    }
    setDraft(null);
  };

  return (
    <label className="flex items-center justify-center gap-1 w-[112px] h-[34px] rounded-full border border-[#d97757] bg-white cursor-text focus-within:ring-2 focus-within:ring-[#d97757]/20 transition-shadow">
      <input
        type="text"
        inputMode="decimal"
        value={draft ?? String(value)}
        onFocus={(e) => { setDraft(String(value)); e.target.select(); }}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        aria-label="Weight to remove, in pounds"
        className="w-12 text-right bg-transparent outline-none text-[16px] font-medium text-[#d97757] tabular-nums"
      />
      <span className="text-[14px] text-[#d97757]/80">lb</span>
    </label>
  );
}

// The number between − and +: tap to type it. 16px so no phone zooms in on focus.
function CountInput({ value, max, onCommit }) {
  const [draft, setDraft] = useState(null); // null while not editing

  const commit = () => {
    const n = parseInt(draft, 10);
    if (draft !== null && n > 0) {
      const next = Math.min(max, n);
      if (next !== Number(value)) onCommit(next);
    }
    setDraft(null);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft ?? String(value)}
      onFocus={(e) => { setDraft(String(value)); e.target.select(); }}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      aria-label="Quantity"
      className="w-8 h-full text-center bg-transparent outline-none text-[16px] font-medium text-[#d97757] tabular-nums focus:bg-[#fff7f2]"
    />
  );
}

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
  checkoutSuccess = '',
  checkoutError = '',
  onBack,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pillOpen, setPillOpen] = useState(false); // circle tapped: show the ways in again
  const [isScrolling, setIsScrolling] = useState(false); // hide the floating control mid-scroll so it never sits on a row
  const scrollIdleTimer = useRef(null);
  useEffect(() => () => clearTimeout(scrollIdleTimer.current), []);
  // Few items and at the top (or the circle was tapped): show the pill. Otherwise the round button.
  const addExpanded = (cartItems.length <= 3 && !scrolled) || pillOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Counted items and pounds are totalled apart: "12 items + 4 lb", never "16 items".
  const totals = summarizeAmounts(
    cartItems.map((item) => ({
      quantity: Number(item.quantity || 1),
      trackBy: isWeightUnit(item.unit) ? 'weight' : 'count',
    }))
  );
  const totalParts = [
    totals.items > 0 || totals.lbs === 0 ? { n: totals.items, label: totals.items === 1 ? 'item' : 'items' } : null,
    totals.lbs > 0 ? { n: Math.round(totals.lbs * 100) / 100, label: 'lb' } : null,
  ].filter(Boolean);
  const totalText = totals.text.replace(' · ', ' + ');
  const countText = `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'}`;
  const photos = cartItems.filter((l) => l.photoUrl).slice(0, MAX_PHOTOS).map((l) => ({ id: l.id || l.batchId, url: l.photoUrl }));
  // "Given out", or "Given out · Expired" when the cart mixes reasons.
  const reasonsText = REMOVE_REASONS
    .filter((r) => cartItems.some((l) => (l.reason || 'given_out') === r.value))
    .map((r) => r.label)
    .join(' · ');
  const [done, setDone] = useState(null); // { total, count, reasons, photos } of the cart that just checked out
  const [removed, setRemoved] = useState(null); // { line, index } for Undo
  const undoTimer = useRef(null);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const removeLine = (line) => {
    const index = cartItems.indexOf(line);
    setRemoved({ line, index });
    onRemoveItem?.(line.id);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), 5000);
  };

  const undoRemove = () => {
    if (!removed) return;
    onRestoreItem?.(removed.line, removed.index);
    clearTimeout(undoTimer.current);
    setRemoved(null);
  };

  const handleConfirmClear = () => {
    setRemoved(null);
    if (onClearCart) onClearCart();
    setShowClearConfirm(false);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitConfirm(false);
    if (!onCheckout) return;
    // Keep what went out for the Removed screen; the flow clears the cart on success.
    const snapshot = { total: totalText, count: cartItems.length, reasons: reasonsText, photos };
    const ok = await onCheckout();
    if (ok) setDone(snapshot);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 bg-white flex flex-col"
    >
      {/* ── SCROLLABLE CONTENT (HEADER + CARDS ALL SCROLL TOGETHER) ── */}
      <div
        onScroll={(e) => {
          setScrolled(e.currentTarget.scrollTop > 24);
          setPillOpen(false);
          setIsScrolling(true);
          clearTimeout(scrollIdleTimer.current);
          // Fallback for browsers without scrollend.
          scrollIdleTimer.current = setTimeout(() => setIsScrolling(false), 120);
        }}
        onScrollEnd={() => {
          clearTimeout(scrollIdleTimer.current);
          setIsScrolling(false);
        }}
        className={`flex-1 overflow-y-auto w-full ${cartItems.length > 0 ? 'pb-[calc(120px+env(safe-area-inset-bottom))]' : 'pb-[calc(clamp(72px,13dvh,104px)+env(safe-area-inset-bottom))]'}`}
      >
        {cartItems.length === 0 ? (
          <RemoveLanding
            onOpenScanner={onOpenScanner}
            onOpenVisualGrid={onOpenVisualGrid}
            onOpenProduct={onOpenProduct}
          />
        ) : (
          <>
            {/* ── TOP CHECKOUT ROW ── */}
            <div className="px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-3.5 mb-3 flex items-center justify-between bg-[#d97757] relative z-20 shadow-sm">
              <div className="flex flex-col antialiased">
                <span className="text-[11px] font-semibold text-white/75 uppercase tracking-[0.08em] leading-none">
                  Total
                </span>
                <span className="mt-1 flex items-baseline gap-1 leading-none text-white">
                  {totalParts.map((part, i) => (
                    <React.Fragment key={part.label}>
                      {i > 0 && <span className="mx-1 text-[13px] font-normal text-white/55">+</span>}
                      <span className="text-[19px] font-semibold tracking-tight tabular-nums">{part.n}</span>
                      <span className="text-[13px] font-normal text-white/80">{part.label}</span>
                    </React.Fragment>
                  ))}
                </span>
              </div>
              <button
                disabled={isSubmitting}
                onClick={() => setShowSubmitConfirm(true)}
                className="h-[44px] px-6 rounded-full bg-white text-[#b5583a] text-[15px] font-semibold shadow-sm flex items-center gap-1.5 active:scale-95 active:bg-[#fbeee9] disabled:opacity-60 transition-all"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Check Out
              </button>
            </div>

            {checkoutError && (
              <div role="alert" className="mx-4 mb-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
                {checkoutError}
              </div>
            )}

            <div className="mx-4 mb-8 bg-white border border-gray-200 rounded-md overflow-hidden shadow-md">
              <div className="mx-4 py-3 border-b border-gray-300 flex items-center bg-white">
                <span className="text-[17px] text-[#1a1f36] font-medium tracking-tight">Scanned items</span>
              </div>
              <div className="flex flex-col bg-white">
                <AnimatePresence initial={false}>
                  {cartItems.map((item, index) => {
                    const expLabel = formatItemExpiration(item.expirationDate);
                    const maxStock = Number(item.availableBatchStock ?? 9999);
                    const isMaxReached = item.quantity >= maxStock;
                    const isLast = index === cartItems.length - 1;

                    return (
                      <motion.div
                        key={item.id || item.batchId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="bg-white"
                      >
                        <div className="p-3.5 flex flex-col gap-2">
                        {/* Top Row: Image & Info */}
                        <div className="flex gap-3.5 items-start">
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt=""
                              className="w-[72px] h-[72px] rounded-md object-cover border border-gray-100 shrink-0 bg-gray-50"
                            />
                          ) : (
                            <div className="w-[72px] h-[72px] rounded-md flex items-center justify-center shrink-0 border border-gray-200 bg-gray-50">
                              <CategoryGlyph category={item.category} className="w-11 h-11" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0 py-1">
                            <h4 className="font-normal text-gray-900 text-[15.5px] leading-snug mb-2">
                              {item.name}
                            </h4>

                            {/* Metadata Cluster */}
                            <div className="flex flex-col gap-1.5 text-[13px] text-gray-500 font-normal">
                              {/* Stock, with its unit: "Stock: 48 items" / "Stock: 6.5 lb" */}
                              {item.availableBatchStock !== undefined && (
                                <div className="text-gray-600">
                                  Stock: {item.availableBatchStock}{' '}
                                  {isWeightUnit(item.unit)
                                    ? 'lb'
                                    : !item.unit || /^(units?|count|ct|items?)$/i.test(item.unit)
                                      ? (Number(item.availableBatchStock) === 1 ? 'item' : 'items')
                                      : item.unit}
                                  {/* Reason rides on the stock line so it never adds a row */}
                                  {item.reason && item.reason !== 'given_out' && (
                                    <span className="text-[#b5583a]">
                                      {' · '}{REMOVE_REASONS.find((r) => r.value === item.reason)?.label || item.reason}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Expiration Date */}
                              {expLabel ? (
                                <div className="text-gray-500 font-medium">
                                  Exp {expLabel}
                                </div>
                              ) : (
                                <div className="text-gray-400">
                                  No expiration date
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Actions */}
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => removeLine(item)}
                            className="text-[14px] font-normal text-[#1a1f36] underline underline-offset-4 decoration-gray-400 hover:text-red-600 hover:decoration-red-300 transition-colors"
                          >
                            Remove
                          </button>

                          {isWeightUnit(item.unit) ? (
                            <WeightQuantityField
                              value={item.quantity}
                              max={maxStock}
                              onCommit={(next) => onUpdateQuantity && onUpdateQuantity(item.id, next - Number(item.quantity || 0))}
                            />
                          ) : (
                          <div className="flex items-center rounded-full border border-[#d97757] h-[34px] bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, -1)}
                              className="h-full w-10 flex items-center justify-center text-[#d97757] active:bg-[#fff7f2] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <CountInput
                              value={item.quantity}
                              max={maxStock}
                              onCommit={(next) => onUpdateQuantity && onUpdateQuantity(item.id, next - Number(item.quantity || 0))}
                            />
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, 1)}
                              disabled={isMaxReached}
                              className="h-full w-10 flex items-center justify-center text-[#d97757] active:bg-[#fff7f2] disabled:opacity-30 disabled:active:bg-transparent transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>
                          )}
                        </div>
                        </div>
                        {!isLast && <div className="mx-4 border-b border-gray-300" />}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex justify-center pt-4 pb-2">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-[14px] font-normal text-[#1a1f36] underline underline-offset-4 decoration-gray-400 hover:text-red-600 hover:decoration-red-300 transition-colors"
              >
                Clear checkout cart
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating add control: the ways in, or the round "+" button (same as the Add cart) */}
      <AnimatePresence initial={false} mode="popLayout">
        {cartItems.length > 0 && !isScrolling && addExpanded && (
          <motion.div
            key="add-pill"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] flex justify-center pointer-events-none z-40"
          >
            <div className="pointer-events-auto h-14 p-1 flex items-center gap-1 rounded-full bg-white border border-gray-200 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.18)]">
              <button
                type="button"
                onClick={onOpenScanner}
                className="h-full px-4 rounded-full bg-[#fbeee9] text-[#b5583a] flex items-center gap-2 text-[14px] font-semibold active:bg-[#f6ddd3]"
              >
                <ScanBarcode className="w-5 h-5" strokeWidth={2.2} />
                Scan
              </button>
              <button
                type="button"
                onClick={() => onOpenVisualGrid('all')}
                className="h-full px-3.5 rounded-full text-[#1a1f36] flex items-center gap-2 text-[14px] font-medium active:bg-gray-100"
              >
                <Search className="w-[18px] h-[18px] text-[#4b5263]" strokeWidth={2.2} />
                Search
              </button>
            </div>
          </motion.div>
        )}
        {cartItems.length > 0 && !isScrolling && !addExpanded && (
          <motion.button
            key="add-circle"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            onClick={() => setPillOpen(true)}
            aria-label="Add more items"
            aria-expanded={false}
            // Solid clay so it reads at a glance over the white list.
            className="absolute right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-40 w-12 h-12 rounded-full bg-[#d97757] text-white flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(181,88,58,0.55)] active:bg-[#c66547] active:scale-95 transition-colors"
          >
            <Plus className="w-5 h-5" strokeWidth={2.4} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Undo after Remove (same toast as the Add cart) */}
      <AnimatePresence>
        {removed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            role="status"
            className={`absolute left-4 z-40 h-[52px] ${
              cartItems.length > 0 && !isScrolling && !addExpanded
                ? 'right-[76px] bottom-[calc(78px+env(safe-area-inset-bottom))]'
                : cartItems.length > 0 && !isScrolling
                  ? 'right-4 bottom-[calc(144px+env(safe-area-inset-bottom))]'
                  : 'right-4 bottom-[calc(80px+env(safe-area-inset-bottom))]'
            } rounded-2xl bg-[#1a1f36] text-white flex items-center gap-3 pl-4 pr-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]`}
          >
            <span className="flex-1 min-w-0 truncate text-[14px]">Removed {removed.line.name}</span>
            <button type="button" onClick={undoRemove} className="h-10 px-3.5 rounded-xl text-[14px] font-semibold underline underline-offset-[3px]">
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>




      {/* Removed: the cart came out of inventory (same screen as the Add cart's Added) */}
      {done && mounted && createPortal(
        <div className="fixed inset-0 z-[105] bg-white flex flex-col text-[#1a1f36]">
          <div className="flex-1 flex flex-col justify-center gap-6 px-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="w-16 h-16 rounded-full bg-[#fbeee9] text-[#d97757] flex items-center justify-center">
                <Check className="w-[30px] h-[30px]" strokeWidth={2.6} />
              </span>
              <h2 className="text-[20px] font-semibold tracking-[-0.01em]">Removed from inventory</h2>
              <p className="-mt-1.5 text-[14px] text-gray-500">
                {done.count} {done.count === 1 ? 'item is' : 'items are'} off the shelves now.
              </p>
            </div>
            {done.photos.length > 0 && (
              <div className="flex justify-center"><CartPhotos photos={done.photos} /></div>
            )}
            <CartSummary total={done.total} reasons={done.reasons} />
          </div>
          <div className="px-4 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setDone(null); onOpenScanner?.(); }}
              className="w-full h-[52px] rounded-full bg-[#d97757] active:bg-[#c66547] text-white text-[16px] font-semibold"
            >
              Remove more items
            </button>
            <button
              type="button"
              onClick={() => setDone(null)}
              className="w-full h-[52px] rounded-2xl border border-gray-300 bg-white text-[16px] font-semibold active:bg-gray-50"
            >
              Back to Remove
            </button>
          </div>
        </div>,
        document.body
      )}

      <ConfirmSheet
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        id="remove-checkout-title"
        title="Check out these items?"
        body={`${countText} ${cartItems.length === 1 ? 'comes' : 'come'} out of inventory right away.`}
        primary="Yes, check out"
        primaryClass="bg-[#d97757] active:bg-[#c66547]"
        onPrimary={handleConfirmSubmit}
        secondary="Keep editing"
      >
        <div className="px-4 pt-4 flex flex-col gap-3">
          <CartPhotos photos={photos} />
          <CartSummary total={totalText} reasons={reasonsText} />
        </div>
      </ConfirmSheet>

      <ConfirmSheet
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        id="remove-clear-title"
        title="Clear the cart?"
        body={`All ${countText} come out of the cart. Nothing in inventory changes.`}
        primary="Clear cart"
        primaryClass="bg-[#dc2626] active:bg-red-700"
        onPrimary={handleConfirmClear}
        secondary="Keep them"
      />

    </motion.div>
  );
}

