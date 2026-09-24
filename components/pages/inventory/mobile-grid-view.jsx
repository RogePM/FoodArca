'use client';

import React, { useState } from 'react';
import { Layers, Package, Pencil } from 'lucide-react';
import {
  getCategoryName,
  getCategoryVisual,
  formatDate,
  getUrgentStatusStyles,
} from './inventory-utils';

/**
 * Calculates subtle typography status styles according to the urgency hierarchy:
 * 1. Expired (diffDays < 0): Red text (text-red-600 font-semibold)
 * 2. Expiring Soon (0 <= diffDays <= 30): Amber text (text-amber-600 font-medium)
 * 3. Low Stock (< 5 units): Amber text (text-amber-600 font-bold) - subordinate, never red
 *
 * @param {Object} item - Product group item with batches and totalQuantity
 * @returns {Object} { totalQty, displayDate, isExpired, isExpiring, isLowStock, expColorClass, stockColorClass }
 */
export function getProductStatusMeta(item) {
  const styles = getUrgentStatusStyles(item);
  const totalQty =
    item.totalQuantity !== undefined
      ? parseFloat(item.totalQuantity)
      : parseFloat(item.quantity) || 0;

  // Resolve primary expiration date from earliest batch or top-level date
  let displayDate = null;
  if (item.batches && Array.isArray(item.batches) && item.batches.length > 0) {
    const batchWithDate = item.batches.find((b) => b.expirationDate);
    displayDate = batchWithDate
      ? batchWithDate.expirationDate
      : item.batches[0].expirationDate;
  } else if (item.expirationDate) {
    displayDate = item.expirationDate;
  }

  return {
    totalQty,
    displayDate,
    isExpired: styles.isExpired,
    isExpiring: styles.isExpiring,
    isLowStock: styles.isLowStock,
    stockColorClass: styles.stockColorClass,
    expColorClass: styles.expColorClass,
  };
}

/**
 * ProductTile
 * Single grid tile. Owns its own broken-photo fallback state, since a real
 * `photoUrl` can 404 independently of whether the category icon fallback applies.
 */
function ProductTile({ item, handleSelect }) {
  const [imgError, setImgError] = useState(false);
  const catVisual = getCategoryVisual(item.category);
  const batchCount =
    item.batches && Array.isArray(item.batches)
      ? item.batches.length
      : item.logicalBatchCount || 1;

  const { totalQty, displayDate, isExpired, isExpiring } =
    getProductStatusMeta(item);

  const showPhoto = Boolean(item.photoUrl) && !imgError;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => handleSelect && handleSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect && handleSelect(item);
        }
      }}
      className="flex flex-col text-left transition-all active:scale-[0.98] group relative cursor-pointer border-b border-gray-200 pb-3.5 pt-3"
    >
      {/* 1. Image Area */}
      <div
        className={`w-full aspect-square flex items-center justify-center relative overflow-hidden rounded-md mb-1.5 border border-gray-100 ${catVisual.style.bg}`}
      >
        {showPhoto ? (
          <img
            src={item.photoUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3">
            <img
              src={catVisual.imagePath}
              alt={catVisual.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300 mix-blend-multiply"
            />
          </div>
        )}

        {/* Multi-Batch Count Overlay Badge (Top-Right) — dark scrim so it reads on light/white photos too */}
        {batchCount > 1 && (
          <div className="absolute top-2 right-2 bg-black/45 backdrop-blur-[3px] text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <Layers className="w-3 h-3 text-white" />
            <span>{batchCount}</span>
          </div>
        )}

      </div>

      {/* 2. Product Name — single line to keep the card compact; full name still readable via title tooltip */}
      <h4
        title={item.name}
        className="text-[13px] font-medium text-[#1a1f36] leading-snug truncate mb-1 px-0.5 tracking-tight"
      >
        {item.name}
      </h4>

      {/* 3. Metadata Cluster */}
      <div className="flex flex-col gap-1 text-[12px] font-normal text-gray-500 px-0.5 mb-1 mt-auto">
        {/* Category & Stock */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-gray-600 truncate min-w-0">
            {getCategoryName(item.category)}
          </span>
          <span className="text-gray-300 shrink-0">|</span>
          <span className="text-gray-600 shrink-0 whitespace-nowrap">
            Stock: {totalQty}
          </span>
        </div>

        {/* Expiration Date + Edit Affordance */}
        <div className="flex items-center justify-between gap-1.5">
          {displayDate ? (
            <div className={`font-medium ${
              isExpired ? 'text-red-600' : isExpiring ? 'text-amber-600' : 'text-gray-500'
            }`}>
              Exp: {formatDate(displayDate)}
            </div>
          ) : (
            <div className="text-gray-400">
              No exp date
            </div>
          )}
          <Pencil
            className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#d97757] transition-colors shrink-0"
            strokeWidth={2}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * MobileGridView
 * Renders a 2-column responsive CSS grid of product cards inspired by Sam's Club.
 * Large image area, clean product name, minimal metadata.
 * Uses plain divs (no framer-motion).
 */
export function MobileGridView({
  inventory = [],
  onSelectItem,
  handleSelectProduct,
}) {
  const handleSelect = onSelectItem || handleSelectProduct;

  if (!inventory || inventory.length === 0) {
    return (
      <div className="mt-4 pb-24">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-[#d97757] mb-3.5 shadow-xs">
            <Package className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <h3 className="text-[16px] font-semibold text-gray-900 mb-1">
            No items found
          </h3>
          <p className="text-[13px] font-normal text-gray-400 max-w-xs">
            No inventory items match your search or filter criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,173px)] gap-x-3 gap-y-1">
      {inventory.map((item) => {
        const itemKey =
          item.catalogItemId ||
          item._id ||
          item.id ||
          `${item.name}__${item.category}`;

        return (
          <ProductTile key={itemKey} item={item} handleSelect={handleSelect} />
        );
      })}
    </div>
  );
}
