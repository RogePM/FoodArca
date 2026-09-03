'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Scan,
  ScanBarcode,
} from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { getCategoryVisual, formatDate } from '@/components/pages/inventory/inventory-utils';

export function MobileCartView({
  cartItems = [],
  setCartItems,
  onBack,
  onEdit,
}) {
  const { pantryDetails } = usePantry();
  const [mounted, setMounted] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState('');
  const [cartError, setCartError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearBatch = () => {
    setCartItems([]);
    try {
      sessionStorage.removeItem('foodarca_staged_batch');
    } catch (_) {}
    setShowClearConfirm(false);
  };

  const removeFromBatch = (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItemQty = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = Math.max(1, parseInt(item.quantity || '1') + delta);
            return { ...item, quantity: String(nextQty) };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const submitBatch = async () => {
    if (cartItems.length === 0) return;
    setIsSubmittingCart(true);
    setCartError('');
    setCartSuccess('');

    try {
      const response = await fetch('/api/foods/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cartItems }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || data.error || 'Failed to submit batch');

      setCartSuccess('Batch successfully added!');
      setCartItems([]);
      try {
        sessionStorage.removeItem('foodarca_staged_batch');
      } catch (_) {}

      setTimeout(() => {
        setCartSuccess('');
        if (onBack) onBack();
      }, 1500);
    } catch (err) {
      setCartError(err.message);
    } finally {
      setIsSubmittingCart(false);
    }
  };

  const totalItemCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={
        cartItems.length > 0
          ? 'absolute inset-0 z-50 bg-white flex flex-col'
          : 'absolute inset-0 z-50 bg-[#fdf8ed] flex flex-col'
      }
    >
      {/* ─── SCROLLABLE CONTENT (HEADER + CARDS ALL SCROLL TOGETHER) ─── */}
      <div className="flex-1 overflow-y-auto w-full pb-[calc(110px+env(safe-area-inset-bottom))]">
        {cartItems.length === 0 ? (
          /* EMPTY STATE: REMOVE-PAGE STYLE ACTION CARDS */
          <>
            {/* ─── HEADER BLOCK ─── */}
            <div className="px-5 pt-safe mt-4">
              <div className="mb-1">
                <span className="text-[13px] text-gray-500 font-normal">Your Pantry</span>
              </div>

              <h1 className="text-[28px] font-semibold text-[#1a1f36] tracking-tight leading-tight mt-0.5">
                {pantryDetails?.name || 'Food Arca'}
              </h1>

              <p className="text-[14px] text-gray-500 mt-1.5">
                Stock Intake<span className="mx-1.5 text-gray-300">|</span>
                <span className="text-[#e27f2c] font-medium">Ready</span>
              </p>
            </div>

            {/* ─── CARD 1: SCAN TO ADD ─── */}
            <div className="px-5 mt-4">
              <div className="border border-gray-200 rounded-2xl bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col pr-4">
                    <h2 className="text-[21px] font-semibold text-[#1a1f36] tracking-tight leading-snug">
                      Scan to Add
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

                  <div className="w-[76px] h-[76px] shrink-0 relative">
                    <img
                      src="/assets/images/add-scan-amber.jpg?v=4"
                      alt="Scan to Add"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl px-4 sm:px-5 py-3 mt-4 flex items-center justify-between gap-3 -mx-1.5">
                  <span className="text-[13.5px] text-gray-700 font-medium tracking-tight leading-tight">
                    Uses your device camera
                  </span>
                  <button
                    onClick={() => onBack && onBack('CAMERA')}
                    className="h-[36px] px-5 shrink-0 rounded-full bg-[#e27f2c] text-white text-[13px] font-medium transition-colors hover:bg-[#cf6f20] active:scale-95 shadow-sm"
                  >
                    Open Scanner
                  </button>
                </div>
              </div>
            </div>

            {/* ─── CARD 2: SEARCH TO RESTOCK ─── */}
            <div className="px-5 mt-4">
              <div className="border border-gray-200 rounded-2xl bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col pr-4">
                    <h2 className="text-[21px] font-semibold text-[#1a1f36] tracking-tight leading-snug">
                      Search to Restock
                    </h2>
                    <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
                      Add stock to existing items.
                    </p>
                  </div>

                  <div className="w-[76px] h-[76px] shrink-0 relative">
                    <img
                      src="/assets/images/add-restock-amber.jpg?v=2"
                      alt="Search to Restock"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl px-4 sm:px-5 py-3 mt-4 flex items-center justify-between gap-3 -mx-1.5">
                  <span className="text-[13.5px] text-gray-700 font-medium tracking-tight leading-tight">
                    Existing inventory items
                  </span>
                  <button
                    type="button"
                    onClick={() => onBack && onBack('SEARCH')}
                    className="h-[36px] px-5 shrink-0 rounded-full bg-[#e27f2c] text-white text-[13px] font-medium transition-colors hover:bg-[#cf6f20] active:scale-95 shadow-sm"
                  >
                    Find Items
                  </button>
                </div>
              </div>
            </div>

            {/* ─── CARD 3: MANUAL ENTRY ─── */}
            <div className="px-5 mt-4 mb-6">
              <div className="border border-gray-200 rounded-2xl bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col pr-4">
                    <h2 className="text-[21px] font-semibold text-[#1a1f36] tracking-tight leading-snug">
                      Manual Entry
                    </h2>
                    <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
                      Create items without barcodes.
                    </p>
                  </div>

                  <div className="w-[76px] h-[76px] shrink-0 relative">
                    <img
                      src="/assets/images/add-manual-amber.jpg?v=2"
                      alt="Manual Entry"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl px-4 sm:px-5 py-3 mt-4 flex items-center justify-between gap-3 -mx-1.5">
                  <span className="text-[13.5px] text-gray-700 font-medium tracking-tight leading-tight">
                    Custom item form
                  </span>
                  <button
                    type="button"
                    onClick={() => onBack && onBack('MANUAL_ENTRY')}
                    className="h-[36px] px-5 shrink-0 rounded-full bg-[#e27f2c] text-white text-[13px] font-medium transition-colors hover:bg-[#cf6f20] active:scale-95 shadow-sm"
                  >
                    New Item
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* FILLED CART ITEMS LIST */
          <div className="flex flex-col">
            {/* TOP BAR: Header & Clear button */}
            <div className="px-5 pt-safe pt-4 pb-3 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <h1 className="text-[20px] font-semibold text-[#1a1f36] tracking-tight">
                  Inbound Batch
                </h1>
                <p className="text-[13px] font-normal text-gray-500">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} ready to add
                </p>
              </div>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-[13.5px] font-normal text-gray-500 hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* CART ITEMS ROWS */}
            <div className="flex flex-col divide-y divide-gray-100">
              <AnimatePresence initial={false}>
                {cartItems.map((item) => {
                  const catVisual = getCategoryVisual(item.category);
                  const expLabel = formatDate(item.expirationDate);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="p-4 flex flex-col gap-3 bg-white"
                    >
                      {/* Item Info Row */}
                      <div className="flex gap-3.5 items-start">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt=""
                            className="w-[72px] h-[72px] rounded-md object-cover border border-gray-100 shrink-0 bg-gray-50"
                          />
                        ) : (
                          <div
                            className={`w-[72px] h-[72px] rounded-md flex items-center justify-center shrink-0 border border-gray-100 p-0 overflow-hidden ${catVisual.style.bg}`}
                          >
                            <img
                              src={catVisual.imagePath}
                              alt=""
                              className="w-full h-full object-contain mix-blend-multiply scale-[1.35]"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 py-0.5">
                          <h4 className="font-normal text-[#1a1f36] text-[15px] leading-snug mb-1 truncate">
                            {item.name}
                          </h4>

                          {/* Metadata */}
                          <div className="flex flex-col gap-1 text-[13px] text-gray-500 font-normal">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-600">
                                {item.categoryName || catVisual.name}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="text-gray-600">
                                Qty: {item.quantity} {item.unit || 'units'}
                              </span>
                            </div>

                            {expLabel ? (
                              <div className="text-gray-500 font-normal">
                                Exp: {expLabel}
                              </div>
                            ) : (
                              <div className="text-gray-400">
                                No expiration date
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => onEdit && onEdit(item)}
                            className="text-[13.5px] font-normal text-[#1a1f36] underline underline-offset-4 decoration-gray-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeFromBatch(item.id)}
                            className="text-[13.5px] font-normal text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center rounded-full border border-[#e27f2c] h-[34px] bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.id, -1)}
                            className="h-full w-9 flex items-center justify-center text-[#e27f2c] active:bg-[#fff7f2] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <span className="w-8 text-center text-[14px] font-semibold text-[#1a1f36] select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.id, 1)}
                            className="h-full w-9 flex items-center justify-center text-[#e27f2c] active:bg-[#fff7f2] transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Bottom Add-More / Submit Bar */}
            <div className="p-4 flex flex-col gap-3 mt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => onBack && onBack('CAMERA')}
                  className="flex-1 h-[44px] rounded-xl bg-white border border-gray-200 text-[#1a1f36] text-[13.5px] font-normal active:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Scan className="w-4 h-4 text-gray-500" strokeWidth={2} />
                  Scan More
                </button>
                <button
                  onClick={() => onBack && onBack('MANUAL_ENTRY')}
                  className="flex-1 h-[44px] rounded-xl bg-white border border-gray-200 text-[#1a1f36] text-[13.5px] font-normal active:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ScanBarcode className="w-4 h-4 text-gray-500" strokeWidth={2} />
                  Manual Entry
                </button>
              </div>

              <button
                disabled={isSubmittingCart}
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full h-[48px] rounded-xl bg-[#e27f2c] text-white text-[15px] font-semibold shadow-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmittingCart ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : cartSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Added!
                  </>
                ) : (
                  'Add to inventory'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. CENTERED MODAL: CLEAR CART CONFIRMATION */}
      {mounted &&
        showClearConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[340px] bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 z-10 flex flex-col items-center text-center"
            >
              {/* Close 'X' Button */}
              <button
                onClick={() => setShowClearConfirm(false)}
                className="absolute top-4 right-4 p-1.5 text-[#e27f2c] hover:opacity-80 active:scale-95 transition-transform"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>

              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-3 mt-1">
                <X className="w-6 h-6" strokeWidth={2.5} />
              </div>

              <h3 className="text-[18px] font-semibold text-[#1a1f36] tracking-tight mb-1">
                Empty your batch?
              </h3>
              <p className="text-[13.5px] font-normal text-gray-500 leading-relaxed mb-6">
                This will remove all {totalItemCount}{' '}
                {totalItemCount === 1 ? 'item' : 'items'} from your staged batch.
              </p>

              <div className="flex gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 h-[42px] rounded-xl border border-gray-200 bg-white text-[#1a1f36] text-[14px] font-normal active:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={clearBatch}
                  className="flex-1 h-[42px] rounded-xl bg-red-600 text-white text-[14px] font-semibold active:bg-red-700 transition-colors shadow-sm"
                >
                  Clear all
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {/* 2. CENTERED MODAL: SUBMIT BATCH CONFIRMATION */}
      {mounted &&
        showSubmitConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSubmitConfirm(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[340px] bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 z-10 flex flex-col items-center text-center"
            >
              {/* Close 'X' Button */}
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="absolute top-4 right-4 p-1.5 text-[#e27f2c] hover:opacity-80 active:scale-95 transition-transform"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>

              <div className="w-12 h-12 rounded-full bg-[#fff0eb] flex items-center justify-center text-[#e27f2c] mb-3 mt-1">
                <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
              </div>

              <h3 className="text-[18px] font-semibold text-[#1a1f36] tracking-tight mb-1">
                Confirm stock intake
              </h3>
              <p className="text-[13.5px] font-normal text-gray-500 leading-relaxed mb-6">
                You are adding{' '}
                <span className="font-semibold text-[#1a1f36]">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>{' '}
                to your live inventory.
              </p>

              <div className="flex gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 h-[42px] rounded-xl border border-gray-200 bg-white text-[#1a1f36] text-[14px] font-normal active:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    submitBatch();
                  }}
                  className="flex-1 h-[42px] rounded-xl bg-[#e27f2c] text-white text-[14px] font-semibold active:bg-[#cf6f20] transition-colors shadow-sm"
                >
                  Confirm add
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {/* 3. CENTERED MODAL: HOW IT WORKS */}
      {mounted &&
        showHowItWorks &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowHowItWorks(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[340px] bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 z-10 flex flex-col items-center"
            >
              {/* Close 'X' Button */}
              <button
                onClick={() => setShowHowItWorks(false)}
                className="absolute top-4 right-4 p-1.5 text-[#e27f2c] hover:opacity-80 active:scale-95 transition-transform"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>

              <h2 className="text-[18px] font-semibold text-[#1a1f36] mb-5 text-center mt-1">
                How to add items
              </h2>

              <div className="w-full space-y-4 mb-6 px-1 text-left">
                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#e27f2c] shrink-0">
                    <Scan className="w-4.5 h-4.5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1f36] text-[14px] mb-0.5">
                      1. Scan or search
                    </p>
                    <p className="text-gray-500 font-normal text-[13px] leading-snug">
                      Tap the scanner button or search items from your inventory.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#e27f2c] shrink-0">
                    <Plus className="w-4.5 h-4.5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1f36] text-[14px] mb-0.5">
                      2. Set quantity & exp date
                    </p>
                    <p className="text-gray-500 font-normal text-[13px] leading-snug">
                      Adjust counts and set optional expiration dates.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#e27f2c] shrink-0">
                    <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1f36] text-[14px] mb-0.5">
                      3. Stock your pantry
                    </p>
                    <p className="text-gray-500 font-normal text-[13px] leading-snug">
                      Confirm your inbound batch to instantly update stock levels.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                className="w-full h-[44px] bg-[#e27f2c] text-white text-[14px] font-semibold rounded-xl active:bg-[#d67828] transition-colors shadow-sm"
              >
                Got it
              </button>
            </motion.div>
          </div>,
          document.body
        )}
    </motion.div>
  );
}
