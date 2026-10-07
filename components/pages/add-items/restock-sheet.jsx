'use client';

// "Search to Restock": pick an item the pantry already has, then the known-item sheet
// asks how much came in. Stock with the same expiry and storage is merged automatically,
// so there is no "pick a batch" step.

import React, { useMemo, useState, useEffect } from 'react';
import { Search, X, Package, Loader2 } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { formatAmountWithUnit, formatSize } from '@/lib/inventory-format';
import { BottomSheet, ItemThumb, usePantryItems } from './intake-fields';

export function RestockSheet({ isOpen, onClose, onPickItem }) {
  const { pantryId } = usePantry();
  const { items, loading } = usePantryItems(pantryId, { withStock: true, enabled: isOpen });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { if (isOpen) setSearchQuery(''); }, [isOpen]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.categoryName?.toLowerCase().includes(q) || p.barcode?.includes(q)
    );
  }, [items, searchQuery]);

  return (
    <BottomSheet open={isOpen} onClose={onClose} labelledBy="restock-title" zIndex={10000} maxHeight="92dvh">
      <div className="flex flex-col h-[88dvh]">
        <div className="relative flex items-center justify-center pt-4 pb-2 shrink-0">
          <h2 id="restock-title" className="text-[16px] font-medium text-[#1a1f36] tracking-tight">Restock an item</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-5 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-[#4f566b] active:bg-gray-200"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 pt-1 pb-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find an item to restock"
              style={{ fontSize: '16px' }}
              className="w-full h-[40px] pl-11 pr-11 bg-white border border-gray-300 rounded-full text-[#1a1f36] placeholder-gray-500 focus:outline-none focus:border-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2 h-7 w-7 flex items-center justify-center text-gray-500 bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4" strokeWidth={2.25} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))] border-t border-gray-100">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="w-7 h-7 text-[#e27f2c] animate-spin mb-3" />
              <p className="text-[13px] text-gray-400">Loading your items…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-[#a3acb9]" />
              </div>
              <h3 className="text-[15px] font-medium text-[#1a1f36] mb-0.5">No matching items</h3>
              <p className="text-[13px] text-[#a3acb9] max-w-[220px]">
                {searchQuery ? 'Try a different search.' : 'Items you add will show up here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <button
                  key={p.catalogItemId}
                  type="button"
                  onClick={() => onPickItem(p)}
                  className="w-full flex items-center gap-3.5 py-3 -mx-2 px-2 rounded-xl active:bg-gray-50 text-left"
                >
                  <ItemThumb photoUrl={p.photoUrl} categoryName={p.categoryName} size={52} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-medium text-[#1a1f36] leading-snug truncate">{p.name}</p>
                    <p className="text-[12.5px] text-gray-500 truncate">
                      {[p.categoryName, formatSize(p.sizeAmount, p.sizeUnit)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="text-[12.5px] text-gray-500 shrink-0">
                    {p.totalQuantity > 0 ? `${formatAmountWithUnit(p.totalQuantity, p.trackBy)}` : 'Out of stock'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
