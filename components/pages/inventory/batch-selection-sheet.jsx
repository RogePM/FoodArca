'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Pencil } from 'lucide-react';
import {
  getCategoryVisual,
  getCategoryName,
  formatDate,
  getUrgentStatusStyles,
} from './inventory-utils';

/**
 * Slide-up Bottom Sheet for selecting a specific logical batch to modify.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the bottom sheet is open
 * @param {Function} props.onClose - Callback to close the bottom sheet
 * @param {Object|null} props.item - The grouped product item containing logical batches
 * @param {Function} props.onSelectBatch - Callback invoked when a batch is selected for modification
 */
export function InventoryBatchSelectionSheet({
  isOpen,
  onClose,
  item,
  onSelectBatch,
}) {
  // Batches are already sorted FEFO by groupInventoryBatches
  const batches = useMemo(() => {
    if (!item?.batches || !Array.isArray(item.batches)) return [];
    return item.batches;
  }, [item]);

  // Lock background body scroll when open
  useEffect(() => {
    if (isOpen && item && batches.length > 1) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, item, batches.length]);

  if (!item || batches.length <= 1) {
    return null;
  }

  const catVisual = getCategoryVisual(item.category);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10001] flex flex-col justify-end"
          style={{ isolation: 'isolate' }}
        >
          {/* 1. BACKDROP SCRIM */}
          <motion.div
            key="batch-select-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* 2. SLIDE-UP BOTTOM SHEET */}
          <motion.div
            key="batch-select-sheet"
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
                <h2 className="text-[17px] font-semibold text-[#1a1f36] tracking-tight">
                  Select Batch
                </h2>
                <span className="bg-orange-50 text-[#d97757] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#d97757]" />
                  {batches.length} Batches
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
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${catVisual.style.border} ${catVisual.style.bg} p-1`}
                  >
                    <img
                      src={catVisual.imagePath}
                      alt=""
                      className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-[#1a1f36] truncate">
                    {item.name}
                  </h3>
                  <p className="text-[12px] font-normal text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <span>{getCategoryName(item.category)}</span>
                    <span>•</span>
                    <span className="font-semibold text-gray-700">
                      {item.totalQuantity} {item.unit || 'units'} total
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Logical Batches List */}
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2.5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              {batches.map((batch, idx) => {
                const statusStyles = getUrgentStatusStyles(batch);
                const formattedExp = formatDate(batch.expirationDate);
                const mergedCount = batch.rawBatchIds?.length || 1;

                return (
                  <div
                    key={batch.id || `batch-${idx}`}
                    onClick={() => {
                      if (onSelectBatch) onSelectBatch(batch);
                      if (onClose) onClose();
                    }}
                    className="bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 rounded-2xl p-4 transition-all shadow-sm flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    {/* Batch Details */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[15px] font-bold text-gray-900 tabular-nums">
                          {batch.quantity} <span className="font-medium text-gray-500 text-[13px]">{item.unit || 'units'}</span>
                        </span>
                        {mergedCount > 1 && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            {mergedCount} merged
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[13px] font-medium ${statusStyles.isExpired || statusStyles.isExpiring ? statusStyles.expColorClass : 'text-gray-500'}`}
                        >
                          {formattedExp
                            ? `Expires ${formattedExp}`
                            : 'No expiration date'}
                        </span>
                        {batch.storageLocation && (
                          <span className="text-[12px] text-gray-400 truncate">
                            • {batch.storageLocation}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#d97757] group-hover:text-white transition-colors shrink-0">
                      <Pencil className="w-4 h-4" strokeWidth={2.5} />
                    </div>
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
