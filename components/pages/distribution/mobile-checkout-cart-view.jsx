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
  Search,
  Minus,
  Plus,
  MinusSquare,
  Calendar,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { categories, getCategoryVisual } from '@/lib/constants';

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
  onCheckout,
  isSubmitting = false,
  checkoutSuccess = '',
  checkoutError = '',
  onBack,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          ? 'fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex flex-col'
          : 'flex-1 w-full relative bg-white flex flex-col min-h-full pb-[calc(90px+env(safe-area-inset-bottom))]'
      }
    >
      {/* HEADER */}
      <div className="px-6 pt-safe pb-3 bg-white border-b border-gray-100 shrink-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 mt-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 text-gray-500 hover:text-gray-800 active:scale-95 transition-transform"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-[17px] font-semibold text-[#1a1f36] tracking-tight">
            {cartItems.length > 0 ? 'Ready to checkout' : 'Checkout Cart'}
          </h1>
        </div>
        {cartItems.length > 0 && (
          <span className="text-[13px] font-semibold text-[#d97757] mt-2">
            {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* ITEM LIST / EMPTY STATE */}
      <div
        className={`flex-1 overflow-y-auto px-6 space-y-4 relative pt-6 ${
          cartItems.length > 0 ? 'pb-[240px]' : 'pb-16'
        }`}
      >
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-16 pt-8">
            {/* Clean Empty Illustration */}
            <div className="w-36 h-36 mb-8 flex items-center justify-center relative">
              {/* Outer soft ring */}
              <div className="absolute w-36 h-36 rounded-full border-2 border-dashed border-gray-200" />
              {/* Inner soft ring */}
              <div className="absolute w-24 h-24 rounded-full bg-orange-50/70" />
              {/* Icon */}
              <ShoppingCart
                className="w-10 h-10 text-[#d97757] relative z-10"
                strokeWidth={1.5}
              />
            </div>

            <h2 className="text-[20px] font-semibold text-[#1a1f36] mb-2 tracking-tight text-center">
              Your checkout cart is empty
            </h2>
            <p className="text-gray-400 text-[15px] text-center px-8 leading-relaxed mb-6">
              Scan a barcode or browse inventory to deduct items.
            </p>

            <button
              onClick={() => setShowHowItWorks(true)}
              className="text-[#d97757] text-[14px] font-semibold active:opacity-70 transition-opacity"
            >
              How checkout works →
            </button>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {cartItems.map((item) => {
                const catVisual = getCategoryVisual(item.category);
                const expLabel = formatItemExpiration(item.expirationDate);
                const maxStock = Number(item.availableBatchStock ?? 9999);
                const isMaxReached = item.quantity >= maxStock;

                return (
                  <motion.div
                    key={item.id || item.batchId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white border-2 border-gray-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] mb-3"
                  >
                    {/* Top Row: Image & Info */}
                    <div className="flex gap-4 items-start">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt=""
                          className="w-[72px] h-[72px] rounded-xl object-cover border border-gray-100 shrink-0 bg-gray-50"
                        />
                      ) : (
                        <div className={`w-[72px] h-[72px] rounded-xl flex items-center justify-center shrink-0 border border-gray-100 p-0 overflow-hidden ${catVisual.style.bg}`}>
                          <img src={catVisual.imagePath} alt="" className="w-full h-full object-contain mix-blend-multiply scale-[1.35]" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Name with Size Descriptor appended if applicable */}
                        <h4 className="font-medium text-gray-900 text-[15px] leading-snug">
                          {item.name}
                          {item.unit && !['units', 'count'].includes(item.unit.toLowerCase()) && (
                            <span className="text-gray-500 font-normal"> ({item.unit})</span>
                          )}
                        </h4>
                        
                        {/* Metadata Cluster */}
                        <div className="flex flex-col gap-1 mt-1.5 text-[12.5px] text-gray-500 font-normal">
                          {/* Top Row: Always parallel (Category, Stock) */}
                          <div className="flex flex-wrap items-center gap-x-1.5">
                            <span>{item.categoryName || catVisual.name}</span>

                            
                            {item.availableBatchStock !== undefined && (
                              <><span className="text-gray-300">·</span><span className="text-emerald-600 font-medium bg-emerald-50/50 px-1.5 rounded">Stock: {item.availableBatchStock}</span></>
                            )}
                          </div>

                          {/* Bottom Row: Expiration Date */}
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
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100/60">
                      <button
                        onClick={() => onRemoveItem && onRemoveItem(item.id)}
                        className="text-[14px] font-medium text-gray-700 underline underline-offset-4 decoration-gray-300 hover:text-red-600 hover:decoration-red-300 transition-colors"
                      >
                        Remove
                      </button>

                      <div className="flex items-center rounded-full border border-orange-700 h-9 bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, -1)}
                          className="h-full w-10 flex items-center justify-center text-orange-700 active:bg-orange-50 rounded-l-full transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                        <span className="w-8 text-center text-[15px] font-bold text-orange-700">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isMaxReached}
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, 1)}
                          className="h-full w-10 flex items-center justify-center text-orange-700 active:bg-orange-50 rounded-r-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-6 py-2.5 rounded-full border-2 border-gray-100 text-gray-500 text-[14px] font-semibold bg-white active:bg-gray-50 transition-colors"
              >
                Clear checkout cart
              </button>
            </div>
          </>
        )}
      </div>

      {/* FLOATING ACTION BUTTONS (FABs) */}
      <div
        className={`absolute right-4 flex flex-col gap-4 z-40 transition-all duration-300 ${
          cartItems.length > 0
            ? 'bottom-[calc(120px+env(safe-area-inset-bottom))]'
            : 'bottom-[calc(42px+env(safe-area-inset-bottom))]'
        }`}
      >
        <button
          type="button"
          onClick={onOpenVisualGrid}
          className="w-14 h-14 rounded-full bg-white text-[#1a1f36] shadow-[0_4px_14px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-all border border-gray-200"
          aria-label="Browse Inventory"
          title="Browse Inventory (No Barcode)"
        >
          <Search className="w-6 h-6" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onOpenScanner}
          className="w-14 h-14 rounded-full bg-[#d97757] text-white shadow-[0_4px_14px_rgba(217,119,87,0.25)] flex items-center justify-center active:scale-95 transition-all"
          aria-label="Scan Barcode"
          title="Scan Barcode"
        >
          <Scan className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* STICKY FOOTER BUTTON (ONLY VISIBLE IF ITEMS IN CART) */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[10000] bg-white px-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
          >
            {checkoutError && (
              <p className="text-rose-600 text-[13px] text-center mb-3 font-medium bg-rose-50 py-2 rounded-xl border border-rose-100">
                {checkoutError}
              </p>
            )}

            <button
              type="button"
              disabled={
                (cartItems.length === 0 && !checkoutSuccess) || isSubmitting
              }
              onClick={
                checkoutSuccess ? undefined : () => setShowSubmitConfirm(true)
              }
              className={`w-full h-[56px] rounded-2xl text-[16px] font-bold transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-2 ${
                checkoutSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#d97757] text-white shadow-[0_8px_20px_-4px_rgba(217,119,87,0.45)]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Deducting…
                </>
              ) : checkoutSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />{' '}
                  {checkoutSuccess}
                </>
              ) : (
                <>
                  <MinusSquare className="h-5 w-5" strokeWidth={2.5} /> Deduct from inventory
                </>
              )}
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
