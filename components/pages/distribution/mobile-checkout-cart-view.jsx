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
} from 'lucide-react';
import { categories, getCategoryVisual } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';
import { summarizeAmounts } from '@/lib/inventory-format';
import { REMOVE_REASONS } from './no-barcode-visual-grid-sheet';
import { groupInventoryBatches, getUrgentStatusStyles } from '@/components/pages/inventory/inventory-utils';

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
  onClearCart,
  onOpenScanner,
  onOpenVisualGrid,
  onCheckout,
  isSubmitting = false,
  checkoutSuccess = '',
  checkoutError = '',
  onBack,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isVisualGridOpen, setIsVisualGridOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [localInventory, setLocalInventory] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const { pantryId, pantryDetails } = usePantry();
  const [scrolled, setScrolled] = useState(false);
  const [pillOpen, setPillOpen] = useState(false); // circle tapped: show the ways in again
  const [isScrolling, setIsScrolling] = useState(false); // hide the floating control mid-scroll so it never sits on a row
  const scrollIdleTimer = useRef(null);
  useEffect(() => () => clearTimeout(scrollIdleTimer.current), []);
  // Few items and at the top (or the circle was tapped): show the pill. Otherwise the round button.
  const addExpanded = (cartItems.length <= 3 && !scrolled) || pillOpen;

  const handleOpenVisualGrid = (filter = 'all') => {
    setActiveFilter(filter);
    setIsVisualGridOpen(true);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (cartItems.length > 0 || !pantryId) return;
    
    let isMounted = true;
    const fetchInventory = async () => {
      setIsLoadingStats(true);
      try {
        const res = await fetch('/api/foods', { headers: { 'x-pantry-id': pantryId } });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && Array.isArray(data.data)) {
            setLocalInventory(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching inventory stats:', err);
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    };
    fetchInventory();
    return () => { isMounted = false; };
  }, [pantryId, cartItems.length]);

  const inventoryStats = React.useMemo(() => {
    let expired = 0;
    let expiringSoon = 0;
    let lowStock = 0;
    let noDate = 0;

    const allBatchedInventory = groupInventoryBatches(localInventory);

    allBatchedInventory.forEach((item) => {
      const statusStyles = getUrgentStatusStyles(item);
      if (statusStyles.isExpired) expired++;
      if (statusStyles.isExpiring) expiringSoon++;
      if (statusStyles.isLowStock) lowStock++;
      if (!item.expirationDate) noDate++;
    });

    return { expired, expiringSoon, lowStock, noDate };
  }, [localInventory]);

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

  const handleConfirmClear = () => {
    if (onClearCart) onClearCart();
    setShowClearConfirm(false);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitConfirm(false);
    if (onCheckout) onCheckout();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={
        cartItems.length > 0
          ? 'absolute inset-0 z-50 bg-white flex flex-col'
          : 'absolute inset-0 z-50 bg-[#fff7f2] flex flex-col'
      }
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
        className="flex-1 overflow-y-auto w-full pb-[calc(120px+env(safe-area-inset-bottom))]"
      >
        {cartItems.length === 0 ? (
          <>
            {/* ─── HEADER BLOCK ─── */}
            <div className="px-4 pt-safe mt-4">
              {/* Row: back arrow + tiny label */}
              <div className="flex items-center gap-1.5 mb-1">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-0.5 -ml-1.5 text-gray-500 active:text-[#1a1f36] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                )}
                <span className="text-[12px] text-gray-500 font-bold uppercase tracking-wider">Outbound Checkout</span>
              </div>

              {/* Action Name */}
              <h1 className="text-[28px] font-semibold text-[#1a1f36] tracking-tight leading-tight mt-0.5">
                Remove Items
              </h1>

              {/* Subtitle / Pantry Name */}
              <p className="text-[14px] text-gray-500 mt-1.5 flex items-center">
                From:<span className="font-medium text-gray-700 ml-1.5">{pantryDetails?.name || 'Food Arca'}</span>
              </p>
            </div>

            {/* â”€â”€ SEARCH BAR â”€â”€ */}
            <div className="px-4 mt-6 mb-2">
              <div
                className="flex items-center w-full h-[48px] bg-white border border-gray-200 shadow-sm rounded-full px-4 gap-3 cursor-text active:border-gray-300 transition-all"
                onClick={() => onOpenVisualGrid('all')}
              >
                <Search className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={1.8} />
                <span className="text-[15px] text-gray-500 font-normal select-none">
                  Find an item in the pantry
                </span>
              </div>
            </div>

            {/* â”€â”€ SCAN & GO CARD â”€â”€ */}
            <div className="px-4 mt-4">
              <div className="border border-gray-200 rounded-2xl bg-white p-3.5">
                {/* Top section */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col pr-4">
                    <h2 className="text-[21px] font-semibold text-[#1a1f36] tracking-tight leading-snug">
                      Scan to Remove
                    </h2>
                    <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
                      Skip manual entry.{' '}
                      <button
                        onClick={() => setShowHowItWorks(true)}
                        className="underline underline-offset-2 decoration-gray-400 text-[#1a1f36] font-normal"
                      >
                        How it works
                      </button>
                    </p>
                  </div>

                  {/* Phone illustration */}
                  <div className="w-[76px] h-[76px] shrink-0 relative">
                    <img src="/assets/images/scan-barcode-only.jpg" alt="Scan to Remove" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                </div>

                {/* Footer pill */}
                <div className="bg-gray-50 rounded-xl px-4 sm:px-5 py-3 mt-1.5 flex items-center justify-between gap-3 -mx-1.5">
                  <span className="text-[13.5px] text-gray-700 font-medium tracking-tight leading-tight">
                    Uses your device camera
                  </span>
                  <button
                    onClick={onOpenScanner}
                    className="h-[36px] px-4 shrink-0 rounded-full bg-[#d97757] text-white text-[13px] font-medium transition-colors hover:bg-[#c66547] active:scale-95 shadow-sm"
                  >
                    Open Scanner
                  </button>
                </div>
              </div>
            </div>

            {/* â”€â”€ BROWSE ITEMS CARD â”€â”€ */}
            <div className="px-4 mt-4 mb-6">
              <div className="border border-gray-200 rounded-2xl bg-white p-3.5">
                {/* Top section */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col pr-4">
                    <h2 className="text-[21px] font-semibold text-[#1a1f36] tracking-tight leading-snug">
                      Browse Items
                    </h2>
                    <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
                      Select items visually.
                    </p>
                  </div>

                  {/* Grid illustration */}
                  <div className="w-[76px] h-[76px] shrink-0 relative">
                    <img src="/assets/images/browse-shelf.jpg" alt="Browse and Select" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                </div>

                {/* Footer pill */}
                <div className="bg-gray-50 rounded-xl px-4 sm:px-5 py-3 mt-1.5 flex items-center justify-between gap-3 -mx-1.5">
                  <span className="text-[13.5px] text-gray-700 font-medium tracking-tight leading-tight">
                    No barcode needed
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenVisualGrid('all')}
                    className="h-[36px] px-4 shrink-0 rounded-full bg-[#d97757] text-white text-[13px] font-medium transition-colors hover:bg-[#c66547] active:scale-95 shadow-sm"
                  >
                    Open Grid
                  </button>
                </div>
              </div>
            </div>

            {/* â”€â”€ STATS TILES (CAROUSEL) â”€â”€ */}
            <div className="mb-8">
              <div className="px-4 mb-3">
                <h2 className="text-[21px] font-semibold text-[#1a1f36] tracking-tight leading-snug">
                  Inventory Alerts
                </h2>
              </div>
              {/* Carousel Container */}
              <div className="flex gap-3 px-4 overflow-x-auto snap-x scroll-pl-5 scroll-smooth pb-4 -mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden after:content-[''] after:w-1 after:shrink-0">

                {/* Expired Tile */}
                <button
                  type="button"
                  onClick={() => onOpenVisualGrid('expired')}
                  className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-sm flex flex-col items-start justify-between h-[115px] min-w-[145px] shrink-0 snap-start text-left cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                    <span className="text-[13.5px] font-medium text-[#1a1f36] tracking-tight">
                      Expired
                    </span>
                  </div>
                  {isLoadingStats ? (
                    <div className="h-[28px] w-12 bg-gray-100 rounded-md animate-pulse"></div>
                  ) : (
                    <span className="text-[30px] font-bold text-[#1a1f36] leading-none tracking-tight">
                      {inventoryStats.expired}
                    </span>
                  )}
                </button>

                {/* Expiring Soon Tile */}
                <button
                  type="button"
                  onClick={() => onOpenVisualGrid('expiring_soon')}
                  className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-sm flex flex-col items-start justify-between h-[115px] min-w-[145px] shrink-0 snap-start text-left cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="text-[13.5px] font-medium text-[#1a1f36] tracking-tight">
                      Expiring Soon
                    </span>
                  </div>
                  {isLoadingStats ? (
                    <div className="h-[28px] w-12 bg-gray-100 rounded-md animate-pulse"></div>
                  ) : (
                    <span className="text-[30px] font-bold text-[#1a1f36] leading-none tracking-tight">
                      {inventoryStats.expiringSoon}
                    </span>
                  )}
                </button>

                {/* Low Stock Tile */}
                <button
                  type="button"
                  onClick={() => onOpenVisualGrid('low_stock')}
                  className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-sm flex flex-col items-start justify-between h-[115px] min-w-[145px] shrink-0 snap-start text-left cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                    <span className="text-[13.5px] font-medium text-[#1a1f36] tracking-tight">
                      Low Stock
                    </span>
                  </div>
                  {isLoadingStats ? (
                    <div className="h-[28px] w-12 bg-gray-100 rounded-md animate-pulse"></div>
                  ) : (
                    <span className="text-[30px] font-bold text-[#1a1f36] leading-none tracking-tight">
                      {inventoryStats.lowStock}
                    </span>
                  )}
                </button>

                {/* No Date Tile */}
                <button
                  type="button"
                  onClick={() => onOpenVisualGrid('no_date')}
                  className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-sm flex flex-col items-start justify-between h-[115px] min-w-[145px] shrink-0 snap-start text-left cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0"></span>
                    <span className="text-[13.5px] font-medium text-[#1a1f36] tracking-tight">
                      No Date
                    </span>
                  </div>
                  {isLoadingStats ? (
                    <div className="h-[28px] w-12 bg-gray-100 rounded-md animate-pulse"></div>
                  ) : (
                    <span className="text-[30px] font-bold text-[#1a1f36] leading-none tracking-tight">
                      {inventoryStats.noDate}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </>
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
                onClick={() => setShowSubmitConfirm(true)}
                className="h-[44px] px-6 rounded-full bg-white text-[#b5583a] text-[15px] font-semibold shadow-sm active:scale-95 active:bg-[#fbeee9] transition-all"
              >
                Check Out
              </button>
            </div>

            <div className="mx-4 mb-8 bg-white border border-gray-200 rounded-md overflow-hidden shadow-md">
              <div className="mx-4 py-3 border-b border-gray-300 flex items-center bg-white">
                <span className="text-[17px] text-[#1a1f36] font-medium tracking-tight">Scanned items</span>
              </div>
              <div className="flex flex-col bg-white">
                <AnimatePresence initial={false}>
                  {cartItems.map((item, index) => {
                    const catVisual = getCategoryVisual(item.category);
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
                            <div className={`w-[72px] h-[72px] rounded-md flex items-center justify-center shrink-0 border border-gray-100 p-0 overflow-hidden ${catVisual.style.bg}`}>
                              <img src={catVisual.imagePath} alt="" className="w-full h-full object-contain mix-blend-multiply scale-[1.35]" />
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
                                </div>
                              )}

                              {/* Reason, when it isn't a normal give-out */}
                              {item.reason && item.reason !== 'given_out' && (
                                <div className="text-[#b5583a]">
                                  Reason: {REMOVE_REASONS.find((r) => r.value === item.reason)?.label || item.reason}
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
                            onClick={() => onRemoveItem && onRemoveItem(item.id)}
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





      {/* CLEAR CART CONFIRMATION MODAL */}
      {mounted ? createPortal(
        <AnimatePresence>
          {showClearConfirm && (
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center p-3.5"
              style={{ isolation: 'isolate' }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
                onClick={() => setShowClearConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                className="relative bg-white rounded-3xl p-6 w-full max-w-[340px] shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 active:scale-95 transition-all p-1"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
                
                <h3 className="text-[18px] font-semibold text-[#1a1f36] tracking-tight mb-2 pr-6">
                  Clear checkout cart?
                </h3>
                <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
                  This will remove all {cartItems.length}{' '}
                  {cartItems.length === 1 ? 'item' : 'items'} from your cart. This action cannot be undone.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmClear}
                    className="w-full h-[50px] bg-rose-500 text-white font-semibold text-[15px] rounded-xl active:scale-[0.98] transition-all shadow-sm"
                  >
                    Clear cart
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="w-full h-[50px] bg-white border border-gray-200 text-[#1a1f36] font-medium text-[15px] rounded-xl active:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      ) : null}

      {/* SUBMIT CONFIRMATION MODAL */}
      {mounted ? createPortal(
        <AnimatePresence>
          {showSubmitConfirm && (
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center p-3.5"
              style={{ isolation: 'isolate' }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
                onClick={() => setShowSubmitConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                className="relative bg-white rounded-3xl p-6 w-full max-w-[340px] shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="absolute top-5 right-5 text-[#d97757] hover:text-[#c66547] active:scale-95 transition-all p-1"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>

                <h3 className="text-[18px] font-semibold text-[#1a1f36] tracking-tight mb-2 pr-6">
                  Checkout items?
                </h3>
                <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
                  You are about to remove{' '}
                  <span className="font-semibold text-[#1a1f36]">
                    {totalText}
                  </span>{' '}
                  from your pantry inventory.
                </p>

                <div className="w-full flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmSubmit}
                    className="w-full h-[50px] bg-[#d97757] text-white font-semibold text-[15px] rounded-xl active:scale-[0.98] transition-all shadow-sm"
                  >
                    Confirm checkout
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(false)}
                    className="w-full h-[50px] bg-white border border-gray-200 text-[#1a1f36] font-medium text-[15px] rounded-xl active:bg-gray-50 transition-colors"
                  >
                    Go back
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      ) : null}

      {/* HOW CHECKOUT WORKS MODAL */}
      {mounted
        ? createPortal(
            <AnimatePresence>
              {showHowItWorks && (
                <div
                  className="fixed inset-0 z-[9999] flex flex-col justify-end"
                  style={{ isolation: 'isolate' }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
                    onClick={() => setShowHowItWorks(false)}
                  />
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="relative bg-white rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col items-center max-w-lg mx-auto w-full"
                  >
                    <div className="w-10 h-1 bg-gray-200 rounded-full mb-5" />

                    <h2 className="text-[18px] font-semibold text-[#1a1f36] mb-6 text-center">
                      How to checkout items
                    </h2>

                    <div className="w-full space-y-5 mb-8 px-2">
                      <div className="flex gap-3.5 items-start">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#d97757] shrink-0">
                          <Scan className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1f36] text-[15px] mb-0.5">
                            Scan barcode
                          </p>
                          <p className="text-gray-400 text-[14px] leading-snug">
                            Tap the orange scan button to scan items using your camera.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3.5 items-start">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#d97757] shrink-0">
                          <Search className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1f36] text-[15px] mb-0.5">
                            Browse unbarcoded
                          </p>
                          <p className="text-gray-400 text-[14px] leading-snug">
                            Tap the search button to select items directly from inventory.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3.5 items-start">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#d97757] shrink-0">
                          <MinusSquare className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1f36] text-[15px] mb-0.5">
                            Select batch & deduct
                          </p>
                          <p className="text-gray-400 text-[14px] leading-snug">
                            Pick the expiration batch, specify quantity, and deduct from inventory.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowHowItWorks(false)}
                      className="w-full h-[52px] bg-[#d97757] text-white text-[15px] font-semibold rounded-2xl active:scale-[0.97] transition-transform shadow-[0_8px_20px_-4px_rgba(217,119,87,0.45)]"
                    >
                      Got it
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}
    </motion.div>
  );
}

