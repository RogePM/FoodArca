'use client';

import React, { useState } from 'react';
import { Layers, MapPin, MoreHorizontal, Package, Pencil } from 'lucide-react';
import {
  getCategoryVisual,
  formatDate,
  getExpirationStatus,
  getUrgentStatusStyles,
  formatItemName,
} from './inventory-utils';

/**
 * Calculates subtle typography status styles according to the urgency hierarchy:
 * 1. Expired (diffDays < 0): Red text (text-red-600 font-semibold)
 * 2. Expiring Soon (0 <= diffDays <= 30): Amber text (text-amber-700 font-medium)
 * 3. Low Stock (< 5 units): Amber text - subordinate, never red
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
 * Plain-language expiration line for a tile ("Expires in 3 days", "Expired 2 days ago").
 * amber-700 rather than amber-600 so the text clears 4.5:1 on white.
 */
export function getExpirationLine(displayDate) {
  if (!displayDate) {
    return { text: 'No expiration date', className: 'text-gray-500' };
  }
  const { days, isExpired } = getExpirationStatus(displayDate);
  if (days === null) {
    return { text: 'No expiration date', className: 'text-gray-500' };
  }
  const plural = (n) => (n === 1 ? 'day' : 'days');
  if (isExpired) {
    const ago = Math.abs(days);
    return {
      text: `Expired ${ago} ${plural(ago)} ago`,
      className: 'text-red-600 font-medium',
    };
  }
  if (days === 0) {
    return { text: 'Expires today', className: 'text-amber-700 font-medium' };
  }
  if (days <= 30) {
    return {
      text: `Expires in ${days} ${plural(days)}`,
      className: 'text-amber-700 font-medium',
    };
  }
  return { text: `Expires ${formatDate(displayDate)}`, className: 'text-gray-500' };
}

/** Trims float noise (e.g. 2.5000001) without forcing decimals on whole numbers. */
const formatQty = (n) =>
  Number.isFinite(n) ? String(Math.round(n * 100) / 100) : '0';

/**
 * ProductTile
 * Single grid tile: image, action row (Edit + more), quantity, name, expiry, location.
 * Owns its own broken-photo fallback state, since a real `photoUrl` can 404
 * independently of whether the category icon fallback applies.
 */
function ProductTile({ item, onEdit, onMoreActions }) {
  const [imgError, setImgError] = useState(false);
  const catVisual = getCategoryVisual(item.category);
  const batchCount =
    item.batches && Array.isArray(item.batches)
      ? item.batches.length
      : item.logicalBatchCount || 1;

  const { totalQty, displayDate, isLowStock } = getProductStatusMeta(item);
  const expLine = getExpirationLine(displayDate);
  const showPhoto = Boolean(item.photoUrl) && !imgError;
  const displayName = formatItemName(item.name);

  return (
    <article className="flex flex-col min-w-0 py-4 border-b border-gray-200">
      {/* 1. Image */}
      <div className="relative w-full aspect-[5/4] rounded-xl bg-white overflow-hidden flex items-center justify-center">
        {showPhoto ? (
          <img
            src={item.photoUrl}
            alt={displayName}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={catVisual.imagePath}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-4/5 h-4/5 object-contain mix-blend-multiply"
          />
        )}

        {batchCount > 1 && (
          <div
            className="absolute top-2 right-2 h-[26px] px-2 rounded-full bg-white border border-gray-200 flex items-center gap-1 text-[12px] font-medium text-gray-700"
            aria-label={`${batchCount} batches`}
          >
            <Layers className="w-[13px] h-[13px]" strokeWidth={2} />
            <span>{batchCount}</span>
          </div>
        )}
      </div>

      {/* 2. Action row */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit && onEdit(item)}
          className="h-11 px-[18px] rounded-full border-[1.5px] border-[#d97757] bg-white text-[#b4532f] text-[15px] font-semibold flex items-center gap-1.5 active:scale-[0.97] active:bg-orange-50/60 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#d97757]/40"
        >
          <Pencil className="w-[15px] h-[15px]" strokeWidth={2.25} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onMoreActions && onMoreActions(item)}
          aria-label={`More actions for ${displayName}`}
          className="h-11 w-11 shrink-0 rounded-full border-[1.5px] border-gray-300 bg-white text-gray-700 flex items-center justify-center active:scale-[0.95] active:bg-gray-50 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#d97757]/40"
        >
          <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* 3. Quantity — the tile's one big number */}
      <div
        className={`mt-3 flex items-baseline gap-1 ${
          isLowStock ? 'text-amber-700' : 'text-[#1a1f36]'
        }`}
      >
        <span className="text-[20px] font-semibold tracking-tight leading-none tabular-nums">
          {formatQty(totalQty)}
        </span>
        <span className="text-[13px] font-normal text-gray-500">{item.unit || 'units'}</span>
        {isLowStock && <span className="text-[13px] font-medium">· Low</span>}
      </div>

      {/* 4. Name — one line, so every tile keeps the same rhythm */}
      <h3
        title={displayName}
        className="mt-2 text-[14px] font-medium leading-snug text-[#1a1f36] truncate"
      >
        {displayName}
      </h3>

      {/* 5. Expiration */}
      <p className={`mt-0.5 text-[13px] leading-snug ${expLine.className}`}>
        {expLine.text}
      </p>

      {/* 6. Storage location */}
      {item.storageLocation && (
        <div className="mt-2 flex">
          <span className="inline-flex items-center gap-1 max-w-full px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[12px] font-medium">
            <MapPin className="w-3 h-3 shrink-0" strokeWidth={2.25} />
            <span className="truncate">{item.storageLocation}</span>
          </span>
        </div>
      )}
    </article>
  );
}

/**
 * MobileGridView
 * 2-column grid of product tiles modeled on Sam's Club's Reorder grid:
 * large image, a consistent action row, one big number (quantity), then detail.
 */
export function MobileGridView({
  inventory = [],
  onSelectItem,
  handleSelectProduct,
  onMoreActions,
  title = 'All items',
}) {
  const handleEdit = onSelectItem || handleSelectProduct;

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
    <section>
      <div className="flex items-baseline gap-1.5 pt-2">
        <h2 className="text-[16px] font-medium tracking-[-0.01em] text-gray-900">
          {title}
        </h2>
        <span className="text-[14px] text-gray-500">({inventory.length})</span>
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        {inventory.map((item) => {
          const itemKey =
            item.catalogItemId ||
            item._id ||
            item.id ||
            `${item.name}__${item.category}`;

          return (
            <ProductTile
              key={itemKey}
              item={item}
              onEdit={handleEdit}
              onMoreActions={onMoreActions}
            />
          );
        })}
      </div>
    </section>
  );
}
