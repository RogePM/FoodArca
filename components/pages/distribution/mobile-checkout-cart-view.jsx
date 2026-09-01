'use client';

import React, { useState, useEffect } from 'react';
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
  Barcode,
  Search,
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
import { groupInventoryBatches, getUrgentStatusStyles } from '@/components/pages/inventory/inventory-utils';

function formatItemExpiration(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MobileCheckoutCartView({
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenScanner,
  onOpenVisualGrid,
  onSelectProduct,
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

  const totalItemCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0
  );

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
        className="flex-1 overflow-y-auto w-full pb-[calc(120px+env(safe-area-inset-bottom))]"
      >
        {cartItems.length === 0 ? (
          <>
            {/* â”€â”€ HEADER BLOCK â”€â”€ */}
            <div className="px-5 pt-safe mt-4">
              {/* Row: back arrow + tiny label */}
              <div className="flex items-center gap-1.5 mb-1.5">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-0.5 -ml-1.5 text-gray-500 active:text-[#1a1f36] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" strokeWidth={2} />
                  </button>
                )}
                <span className="text-[13px] text-gray-500 font-normal">Your Pantry</span>
              </div>

              {/* Pantry name */}
              <h1 className="text-[28px] font-semibold text-[#1a1f36] tracking-tight leading-tight mt-0.5">
                {pantryDetails?.name || 'Food Arca'}
              </h1>

              {/* Status line */}
              <p className="text-[14px] text-gray-500 mt-1.5">
                Active<span className="mx-1.5 text-gray-300">|</span>
                <button className="text-[#d97757] font-medium active:underline">Manage</button>
              </p>
            </div>

            {/* â”€â”€ SEARCH BAR â”€â”€ */}
            <div className="px-5 mt-6 mb-2">
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
            <div className="px-5 mt-4">
              <div className="border border-gray-200 rounded-2xl bg-white p-4">
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
                <div className="bg-gray-50 rounded-xl px-4 sm:px-5 py-3 mt-4 flex items-center justify-between gap-3 -mx-1.5">
                  <span className="text-[13.5px] text-gray-700 font-medium tracking-tight leading-tight">
                    Uses your device camera
                  </span>
                  <button
                    onClick={onOpenScanner}
                    className="h-[36px] px-5 shrink-0 rounded-full bg-[#d97757] text-white text-[13px] font-medium transition-colors hover:bg-[#c66547] active:scale-95 shadow-sm"
                  >
                    Open Scanner
                  </button>
                </div>
              </div>
            </div>

            {/* â”€â”€ BROWSE ITEMS CARD â”€â”€ */}
            <div className="px-5 mt-4 mb-6">
              <div className="border border-gray-200 rounded-2xl bg-white p-4">
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
                <div className="bg-gray-50 rounded-xl px-4 sm:px-5 py-3 mt-4 flex items-center justify-between gap-3 -mx-1.5">
                  <span className="text-[13.5px] text-gray-700 font-medium tracking-tight leading-tight">
                    No barcode needed
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenVisualGrid('all')}
                    className="h-[36px] px-5 shrink-0 rounded-full bg-[#d97757] text-white text-[13px] font-medium transition-colors hover:bg-[#c66547] active:scale-95 shadow-sm"
                  >
                    Open Grid
                  </button>
                </div>
              </div>
            </div>

            {/* â”€â”€ STATS TILES (CAROUSEL) â”€â”€ */}
            <div className="mb-8">
              <div className="px-5 mb-3">
                <h2 className="text-[21px] font-semibold text-[#1a1f36] tracking-tight leading-snug">
                  Inventory Alerts
                </h2>
              </div>
              {/* Carousel Container */}
              <div className="flex gap-3 px-5 overflow-x-auto snap-x scroll-pl-5 scroll-smooth pb-4 -mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden after:content-[''] after:w-1 after:shrink-0">

                {/* Expired Tile */}
                <button
                  type="button"
                  onClick={() => onOpenVisualGrid('expired')}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col items-start justify-between h-[115px] min-w-[145px] shrink-0 snap-start text-left cursor-pointer active:scale-[0.98] transition-transform"
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
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col items-start justify-between h-[115px] min-w-[145px] shrink-0 snap-start text-left cursor-pointer active:scale-[0.98] transition-transform"
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
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col items-start justify-between h-[115px] min-w-[145px] shrink-0 snap-start text-left cursor-pointer active:scale-[0.98] transition-transform"
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
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col items-start justify-between h-[115px] min-w-[145px] shrink-0 snap-start text-left cursor-pointer active:scale-[0.98] transition-transform"
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
            {/* ── SEARCH BAR (FILLED STATE) ── */}
            <div className="bg-[#d97757] px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-4 w-full relative z-10 shadow-sm">
              <div className="flex items-center gap-3">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-1 -ml-1 text-white/90 active:text-white transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                  </button>
                )}
                <div
                  className="flex-1 flex items-center h-[48px] bg-white border-none shadow-sm rounded-full px-4 gap-3 cursor-text active:bg-gray-50 transition-all"
                  onClick={() => onOpenVisualGrid('all')}
                >
                  <Search className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={1.8} />
                  <span className="text-[15px] text-gray-500 font-normal select-none">
                    Find an item in the pantry
                  </span>
                </div>
              </div>
            </div>

            {/* ── TOP CHECKOUT ROW ── */}
            <div className="px-5 py-4 mb-2 flex items-center justify-between bg-white">
              <span className="text-[18px] text-[#1a1f36] font-semibold tracking-tight">
                Total: {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="h-[44px] px-6 rounded-full bg-[#d97757] text-white text-[15px] font-bold shadow-sm active:scale-95 transition-all"
              >
                Check Out
              </button>
            </div>

            <div className="mx-5 mb-8 bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <div className="mx-4 py-3 border-b border-gray-200 flex items-center bg-white">
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
                        <div className="p-4 flex flex-col gap-3">
                        {/* Top Row: Image & Info */}
                        <div className="flex gap-4 items-start">
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

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              {/* Name with Size Descriptor appended if applicable */}
                              <h4 className="font-medium text-gray-900 text-[15px] leading-snug">
                                {item.name}
                                {item.unit && !['units', 'count'].includes(item.unit.toLowerCase()) && (
                                  <span className="text-gray-500 font-normal"> ({item.unit})</span>
                                )}
                              </h4>
                              
                              {item.availableBatchStock !== undefined && (
                                <span className="text-emerald-600 font-medium bg-emerald-50/50 px-1.5 py-0.5 rounded text-[12.5px] whitespace-nowrap shrink-0 mt-[2px]">
                                  Stock: {item.availableBatchStock}
                                </span>
                              )}
                            </div>
                            
                            {/* Metadata Cluster */}
                            <div className="flex flex-col gap-1 mt-1 text-[12.5px] text-gray-500 font-normal">
                              {/* Category */}
                              <div>
                                <span>{item.categoryName || catVisual.name}</span>
                              </div>

                              {/* Expiration Date */}
                              {expLabel ? (
                                <div className="text-gray-400 font-medium">
                                  Exp {expLabel}
                                </div>
                              ) : (
                                <div className="text-gray-400/80">
                                  No expiration date
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Actions */}
                        <div className="flex items-center justify-between mt-1">
                          <button
                            onClick={() => onRemoveItem && onRemoveItem(item.id)}
                            className="text-[14px] font-normal text-[#1a1f36] underline underline-offset-4 decoration-gray-400 hover:text-red-600 hover:decoration-red-300 transition-colors"
                          >
                            Remove
                          </button>

                          <div className="flex items-center rounded-full border border-[#d97757] h-[34px] bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, -1)}
                              className="h-full w-10 flex items-center justify-center text-[#d97757] active:bg-[#fff7f2] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <span className="w-8 text-center text-[14px] font-medium text-[#d97757]">
                              {item.quantity}
                            </span>
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
                        </div>
                        </div>
                        {!isLast && <div className="mx-4 border-b border-gray-200" />}
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

      {/* FLOATING ACTION BUTTONS (FABs) */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute right-4 bottom-[calc(120px+env(safe-area-inset-bottom))] flex flex-col gap-4 z-40"
          >

            <button
              type="button"
              onClick={onOpenScanner}
              className="w-14 h-14 rounded-full bg-[#d97757] text-white shadow-[0_4px_14px_rgba(217,119,87,0.25)] flex items-center justify-center active:scale-95 transition-all"
              aria-label="Scan Barcode"
              title="Scan Barcode"
            >
              <Scan className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>





      {/* CLEAR CART CONFIRMATION MODAL */}
      <AnimatePresence>
        {showClearConfirm && (
          <div
            className="fixed inset-0 z-[10001] flex items-end justify-center"
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
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative bg-white rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] w-full max-w-lg"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h3 className="text-[18px] font-semibold text-center text-[#1a1f36] tracking-tight mb-2">
                Clear checkout cart?
              </h3>
              <p className="text-center text-gray-400 text-[14px] leading-relaxed mb-6">
                This removes all {cartItems.length}{' '}
                {cartItems.length === 1 ? 'item' : 'items'}. You can't undo this.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 h-[52px] bg-gray-100 text-[#1a1f36] font-semibold text-[15px] rounded-2xl active:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="flex-1 h-[52px] bg-rose-500 text-white font-semibold text-[15px] rounded-2xl active:bg-rose-600 transition-colors"
                >
                  Clear cart
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBMIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <div
            className="fixed inset-0 z-[10001] flex items-end justify-center"
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
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative bg-white rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] w-full max-w-lg flex flex-col items-center"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

              <h3 className="text-[18px] font-semibold text-center text-[#1a1f36] tracking-tight mb-2">
                Deduct from inventory?
              </h3>
              <p className="text-center text-gray-400 text-[15px] leading-relaxed mb-8">
                You're about to deduct{' '}
                <span className="font-semibold text-[#1a1f36]">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>{' '}
                from your inventory.
              </p>

              <div className="w-full flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="w-full h-[52px] bg-[#d97757] text-white font-semibold text-[15px] rounded-2xl active:bg-[#c66547] transition-colors shadow-[0_8px_20px_-4px_rgba(217,119,87,0.45)]"
                >
                  Deduct from inventory
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="w-full h-[52px] bg-transparent text-gray-400 font-medium text-[15px] rounded-2xl active:bg-gray-50 transition-colors"
                >
                  Go back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                      <div className="flex gap-4 items-start">
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

                      <div className="flex gap-4 items-start">
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

                      <div className="flex gap-4 items-start">
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

