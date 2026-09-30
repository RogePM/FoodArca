'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import { getCategoryVisual, formatItemName } from './inventory-utils';
import { getExpirationLine } from './mobile-grid-view';

const formatQty = (n) =>
  Number.isFinite(Number(n)) ? String(Math.round(Number(n) * 100) / 100) : '0';

/**
 * Bottom sheet opened from a grid tile's "more" button.
 * Step 1 ('actions'): Add to cart / Remove from inventory.
 * Step 2 ('confirm'): Remove from inventory? confirmation.
 *
 * @param {Object} props
 * @param {Object|null} props.item - Grouped product item; null closes the sheet
 * @param {Function} props.onClose
 * @param {Function} props.onAddToCart - (item) => void
 * @param {Function} props.onRemove - async (item) => void; sheet closes when it resolves
 */
export function InventoryItemActionsSheet({ item, onClose, onAddToCart, onRemove }) {
  const [step, setStep] = useState('actions');
  const [isRemoving, setIsRemoving] = useState(false);
  const isOpen = Boolean(item);

  // Reset to the first step each time a new item opens the sheet
  useEffect(() => {
    if (item) {
      setStep('actions');
      setIsRemoving(false);
    }
  }, [item]);

  // Lock background body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isRemoving) onClose();
  };

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(item);
    } finally {
      setIsRemoving(false);
    }
  };

  let summary = '';
  let removeCaption = '';
  let confirmBody = '';
  let catVisual = null;
  const displayName = formatItemName(item?.name);
  if (item) {
    const qty = formatQty(item.totalQuantity ?? item.quantity);
    const unit = item.unit || 'units';
    const batchCount = item.batches?.length || 1;
    catVisual = getCategoryVisual(item.category);
    summary = `${qty} ${unit} · ${getExpirationLine(item.expirationDate).text}`;
    removeCaption =
      batchCount > 1 ? `Removes all ${batchCount} batches` : `Removes all ${qty} ${unit}`;
    confirmBody = `All ${qty} ${unit} of ${displayName} will be removed.`;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10001] flex flex-col justify-end"
          style={{ isolation: 'isolate' }}
        >
          <motion.div
            key="item-actions-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          <motion.div
            key="item-actions-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={step === 'confirm' ? 'Remove from inventory?' : `Actions for ${displayName}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-white rounded-t-[32px] w-full pb-[calc(24px+env(safe-area-inset-bottom))]"
          >
            <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-3" />

            {step === 'actions' ? (
              <div className="px-4 flex flex-col gap-1">
                {/* Item summary */}
                <div className="flex items-center gap-3 px-1 pb-3.5 border-b border-gray-100">
                  <div className="w-[52px] h-[52px] rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={catVisual.imagePath}
                        alt=""
                        className="w-[42px] h-[42px] object-contain mix-blend-multiply"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[#1a1f36] truncate">
                      {displayName}
                    </p>
                    <p className="text-[13px] text-gray-500 mt-0.5 truncate">{summary}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddToCart(item)}
                  className="min-h-16 flex items-center gap-3.5 px-1 py-2 text-left rounded-xl active:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#d97757]/40"
                >
                  <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-[19px] h-[19px]" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[15px] font-medium text-gray-900">Add to cart</span>
                    <span className="text-[13px] text-gray-500">Stage it for checkout</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  className="min-h-16 flex items-center gap-3.5 px-1 py-2 text-left rounded-xl active:bg-red-50/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <span className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-[19px] h-[19px]" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[15px] font-medium text-red-600">
                      Remove from inventory
                    </span>
                    <span className="text-[13px] text-gray-500">{removeCaption}</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-2.5 h-12 rounded-2xl border border-gray-200 bg-white text-gray-700 text-[15px] font-medium active:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="px-6 pt-3 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                  <Trash2 className="w-[22px] h-[22px]" strokeWidth={2} />
                </div>
                <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.01em] text-[#1a1f36]">
                  Remove from inventory?
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-500 max-w-[290px]">
                  {confirmBody}
                </p>
                <button
                  type="button"
                  onClick={handleConfirmRemove}
                  disabled={isRemoving}
                  className="mt-6 w-full h-[50px] rounded-full bg-red-600 text-white text-[16px] font-semibold flex items-center justify-center gap-2 active:bg-red-700 disabled:opacity-70 transition-colors"
                >
                  {isRemoving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Remove from inventory
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isRemoving}
                  className="mt-2.5 w-full h-[50px] rounded-2xl border border-gray-200 bg-white text-gray-700 text-[16px] font-medium active:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
