'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Layers,
} from 'lucide-react';
import { categories, getCategoryVisual } from '@/lib/constants';
import { formatDate } from '../inventory/inventory-utils';

export function QuickActionSheet({
  isOpen,
  onClose,
  product,
  onStageItem,
  stagedCart = [],
}) {
  // 1. FEFO Sorted Batches
  const sortedBatches = useMemo(() => {
    if (!product?.batches || !Array.isArray(product.batches) || product.batches.length === 0) return [];
    return [...product.batches].sort((a, b) => {
      const timeA = a?.expirationDate ? new Date(a.expirationDate).getTime() : NaN;
      const timeB = b?.expirationDate ? new Date(b.expirationDate).getTime() : NaN;
      const hasA = !isNaN(timeA);
      const hasB = !isNaN(timeB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1; // Null / invalid expiration dates placed last
      if (!hasB) return -1;
      return timeA - timeB;
    });
  }, [product]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen && product && sortedBatches.length > 1) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product, sortedBatches.length]);

  // Calculate cart usage for a batch
  const getBatchCartUsage = (batchId) => {
    if (!Array.isArray(stagedCart)) return 0;
    const stagedLine = stagedCart.find(
      (c) =>
        c &&
        (c.batchId === batchId ||
          c.id === `${product?.catalogItemId || product?.id}-${batchId}`)
    );
    const qty = stagedLine ? Number(stagedLine.quantity || 0) : 0;
    return isNaN(qty) ? 0 : qty;
  };

  // Submit Handler for a specific batch
  const handleStageBatch = (batch) => {
    if (!product || !batch) return;

    const inCart = getBatchCartUsage(batch.id);
    const rawQty = Number(batch.quantity || 0);
    const batchQty = isNaN(rawQty) ? 0 : rawQty;
    const availableStock = Math.max(0, batchQty - inCart);
    if (availableStock <= 0) return;

    const stagedItem = {
      id: `${product.catalogItemId || product.id}-${batch.id}`,
      batchId: batch.id,
      catalogItemId: product.catalogItemId || product.id,
      name: product.name,
      category: product.category,
      categoryName: product.category,
      unit: product.unit || 'units',
      quantity: 1,
      expirationDate: batch.expirationDate || null,
      expirationPrecision: batch.expirationPrecision || 'none',
      availableBatchStock: batchQty,
      photoUrl: product.photoUrl || null,
      barcode: product.barcode || null,
      donorName: batch.donorName || null,
      sourceType: batch.sourceType || null,
    };

    if (onStageItem) onStageItem(stagedItem);
    if (onClose) onClose();
  };

  // Only mount/appear if the selected item has more than 1 batch
  if (!product || sortedBatches.length <= 1) {
    return null;
  }

  const catVisual = getCategoryVisual(product.category);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10001] flex flex-col justify-end"
          style={{ isolation: 'isolate' }}
        >
          {/* 1. BACKDROP SCRIM */}
          <motion.div
            key="quick-action-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* 2. SLIDE-UP QUICK ACTION SHEET */}
          <motion.div
            key="quick-action-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[85dvh] w-full overflow-hidden"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* Header */}
            <div className="px-6 pt-2 pb-3 flex items-center justify-between border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[17px] font-medium text-[#1a1f36] tracking-tight">
                  Select Batch
                </h2>
                <span className="bg-orange-50 text-[#d97757] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#d97757]" />
                  {sortedBatches.length} Batches
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 active:bg-gray-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Product Summary */}
            <div className="px-6 pt-3.5 pb-2 shrink-0">
              <div className="flex items-center gap-3 bg-gray-50/70 border border-gray-100 rounded-2xl p-2.5">
                {product.photoUrl ? (
                  <img
                    src={product.photoUrl}
                    alt={product.name}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${catVisual.style.border} ${catVisual.style.bg} p-1`}>
                    <img 
                      src={catVisual.imagePath} 
                      alt="" 
                      className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" 
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-medium text-[#1a1f36] truncate">
                    {product.name}
                  </h3>
                  <p className="text-[12px] font-normal text-gray-400 mt-0.5">
                    {product.totalQuantity} {product.unit || 'units'} total in stock
                  </p>
                </div>
              </div>
            </div>

            {/* Clean Multi-Batch List */}
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2.5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              {sortedBatches.map((batch) => {
                const formattedExp = formatDate(batch.expirationDate);
                const inCart = getBatchCartUsage(batch.id);
                const remainingStock = Math.max(0, Number(batch.quantity) - inCart);
                const isOutOfStock = remainingStock <= 0;

                return (
                  <div
                    key={batch.id}
                    className={`rounded-2xl p-3.5 transition-all border flex items-center justify-between gap-3 ${
                      isOutOfStock
                        ? 'opacity-40 bg-gray-50/50 border-gray-200'
                        : 'bg-white border-gray-200/80 hover:border-orange-200 shadow-xs'
                    }`}
                  >
                    {/* Batch Details: Expiration Date and Available Stock Count */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-medium text-[#1a1f36] leading-tight">
                        {formattedExp ? `Exp: ${formattedExp}` : 'No expiration date'}
                      </span>
                      <span className="text-[12px] font-normal text-gray-500 mt-1">
                        {remainingStock} {product.unit || 'units'} available
                      </span>
                    </div>

                    {/* Simple Add to Cart action */}
                    {isOutOfStock ? (
                      <span className="text-[12px] font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl shrink-0">
                        In Cart
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStageBatch(batch)}
                        className="px-3.5 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86849] active:scale-95 text-white text-[13px] font-medium transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Add to Cart</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
