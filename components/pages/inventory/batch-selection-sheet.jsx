'use client';

// Picking which batch of an item to edit. Same look as the first step of the add flow's
// known-item sheet (one row per date and spot); a row opens the item edit flow for that batch.

import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { formatAmountWithUnit, formatExpiry, formatStorage } from '@/lib/inventory-format';
import { BottomSheet, ItemThumb } from '@/components/pages/add-items/intake-fields';

const CIRCLE_BTN = 'w-11 h-11 shrink-0 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-[#1a1f36] active:bg-gray-200';

function isExpired(date) {
  return !!date && date < new Date().toISOString().slice(0, 10);
}

/**
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object|null} props.item - grouped item; its batches are already sorted soonest-expiring first
 * @param {Function} props.onSelectBatch - called with the batch to edit
 */
export function InventoryBatchSelectionSheet({ isOpen, onClose, item, onSelectBatch }) {
  const batches = Array.isArray(item?.batches) ? item.batches : [];
  if (!item || batches.length <= 1) return <BottomSheet open={false} onClose={onClose} />;

  const first = batches[0] || {};
  const trackBy = item.trackBy || first.trackBy || 'count';
  const isFood = item.isFood ?? first.isFood ?? true;
  const total = batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
  const amountOf = (n) => (trackBy === 'weight' ? formatAmountWithUnit(n, 'weight') : String(n));

  return (
    <BottomSheet open={isOpen} onClose={onClose} labelledBy="batch-pick-title">
      <div className="flex flex-col overflow-hidden rounded-t-[32px] text-[#1a1f36]">
        <div className="flex justify-center pt-2.5 shrink-0"><span className="w-10 h-[5px] rounded-full bg-gray-200" /></div>

        {/* Header */}
        <div className="shrink-0 px-4 pt-3.5 pb-4 flex items-center gap-3">
          <ItemThumb photoUrl={item.photoUrl || first.photoUrl} categoryName={item.category || first.category} size={44} />
          <div className="flex-1 min-w-0">
            <h2 id="batch-pick-title" className="truncate text-[17px] font-semibold tracking-[-0.01em]">{item.name}</h2>
            <p className="truncate text-[13px] text-gray-500">{formatAmountWithUnit(total, trackBy)} in stock</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={CIRCLE_BTN}>
            <X className="w-[18px] h-[18px]" strokeWidth={2.4} />
          </button>
        </div>

        {/* Which batch */}
        <div className="flex-1 overflow-y-auto px-4 pb-[calc(28px+env(safe-area-inset-bottom))] flex flex-col gap-2">
          <span className="text-[13px] font-medium text-gray-500">Edit</span>
          <div className="rounded-2xl border border-gray-200 px-3.5">
            {batches.map((b, i) => (
              <button
                key={b.id || `batch-${i}`}
                type="button"
                onClick={() => {
                  onSelectBatch?.(b);
                  onClose?.();
                }}
                className={`w-full min-h-16 py-2.5 flex items-center gap-3 text-left ${i < batches.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[15px] font-medium">
                    {isFood ? (b.expirationDate ? formatExpiry(b.expirationDate, b.expirationPrecision) : 'No date') : 'Current stock'}
                    {isFood && isExpired(b.expirationDate) && <span className="ml-1.5 text-[12.5px] font-normal text-red-600">· Expired</span>}
                  </span>
                  <span className="truncate text-[13px] text-gray-500">{formatStorage(b.storageLocation) || 'No spot set'}</span>
                </span>
                <span className="text-[15px] font-medium text-[#4b5263]">{amountOf(b.quantity)}</span>
                <ChevronRight className="w-[18px] h-[18px] shrink-0 text-gray-400" strokeWidth={2.2} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
