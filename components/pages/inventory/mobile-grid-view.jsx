'use client';

import React, { useState } from 'react';
import { Layers, MapPin, MoreHorizontal, Package, Pencil } from 'lucide-react';
import {
  formatDate,
  getExpirationStatus,
  getUrgentStatusStyles,
  formatItemName,
  formatUnit,
} from './inventory-utils';
import { CategoryGlyph } from '@/components/ui/category-glyph';

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

/**
 * Status tags for a tile, styled like the reference's "Pickup / Delivery" chips:
 * one shape, small tint, color only when something needs attention.
 */
export function getStatusTags(item, { displayDate, isLowStock }) {
  const tags = [];
  if (displayDate) {
    const { days, isExpired } = getExpirationStatus(displayDate);
    if (isExpired) tags.push({ label: 'Expired', className: 'bg-red-50 text-red-700' });
    else if (days !== null && days <= 30) {
      tags.push({ label: 'Expiring soon', className: 'bg-amber-50 text-amber-800' });
    }
  }
  if (isLowStock) tags.push({ label: 'Low stock', className: 'bg-gray-100 text-gray-700' });
  return tags;
}

/** Trims float noise (e.g. 2.5000001) without forcing decimals on whole numbers. */
const formatQty = (n) =>
  Number.isFinite(n) ? String(Math.round(n * 100) / 100) : '0';

/**
 * ProductTile — mirrors the Sam's Club Reorder tile:
 * image → compact action row → big number → bold title → plain detail line → chips.
 * Owns its own broken-photo fallback state, since a real `photoUrl` can 404
 * independently of whether the category icon fallback applies.
 */
function ProductTile({ item, onEdit, onMoreActions }) {
  const [imgError, setImgError] = useState(false);
  const batchCount =
    item.batches && Array.isArray(item.batches)
      ? item.batches.length
      : item.logicalBatchCount || 1;

  const { totalQty, displayDate, isLowStock } = getProductStatusMeta(item);
  const tags = getStatusTags(item, { displayDate, isLowStock });
  const dateText = displayDate && formatDate(displayDate);
  const showPhoto = Boolean(item.photoUrl) && !imgError;
  const displayName = formatItemName(item.name);

  return (
    <article className="flex flex-col min-w-0 pt-4 pb-5 border-b border-gray-200">
      {/* 1. Image */}
      <div className="relative w-full aspect-[6/5] bg-white overflow-hidden flex items-center justify-start">
        {showPhoto ? (
          <img
            src={item.photoUrl}
            alt={displayName}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain object-left"
          />
        ) : (
          // No photo: the category drawing, kept smaller than a photo so its heavy line art doesn't
          // dominate the tile, standing on the same bottom-left line as the product photos.
          <CategoryGlyph category={item.category} className="self-end w-[72%] h-[62%] object-contain object-left-bottom" />
        )}

        {batchCount > 1 && (
          <div
            className="absolute top-0 right-0 h-7 px-2 rounded-full bg-white border border-gray-200 flex items-center gap-1 text-[12px] font-medium text-gray-700"
            aria-label={`${batchCount} batches`}
          >
            <Layers className="w-[13px] h-[13px]" strokeWidth={2} />
            <span>{batchCount}</span>
          </div>
        )}
      </div>

      {/* 2. Action row — compact pair right under the image, like "+ Add  (⋯)" */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit && onEdit(item)}
          className="h-9 px-5 rounded-full border-[1.5px] border-[#d97757] bg-white text-[#b4532f] text-[15px] font-semibold flex items-center gap-1.5 active:scale-[0.97] active:bg-orange-50/60 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#d97757]/40"
        >
          <Pencil className="w-[14px] h-[14px]" strokeWidth={2.5} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onMoreActions && onMoreActions(item)}
          aria-label={`More actions for ${displayName}`}
          className="h-9 w-9 shrink-0 rounded-full border-[1.5px] border-[#d97757] bg-white text-[#b4532f] flex items-center justify-center active:scale-[0.95] active:bg-orange-50/60 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#d97757]/40"
        >
          <MoreHorizontal className="w-[18px] h-[18px]" strokeWidth={2.25} />
        </button>
      </div>

      {/* 3. Quantity — the "$1.47" slot: biggest, boldest, always black */}
      <p className="mt-3.5 flex items-baseline gap-1 text-gray-900 leading-none">
        <span className="text-[19px] font-medium tracking-[-0.01em] tabular-nums">
          {formatQty(totalQty)}
        </span>
        <span className="text-[14px] font-normal text-gray-500">{formatUnit(item.unit, totalQty)}</span>
      </p>

      {/* 4. Name — the bold "Dole" slot, one line */}
      <h3
        title={displayName}
        className="mt-2 text-[15px] font-semibold leading-snug text-gray-900 truncate"
      >
        {displayName}
      </h3>

      {/* 5. Detail — the plain "Bananas, 3 lbs." slot */}
      <p className="mt-0.5 text-[14px] font-normal leading-snug text-gray-600 truncate">
        {dateText ? `Exp. ${dateText}` : 'No expiration date'}
      </p>

      {/* 6. Chips — the "Pickup / Delivery" slot */}
      {(tags.length > 0 || item.storageLocation) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className={`h-6 px-2 rounded inline-flex items-center text-[13px] ${tag.className}`}
            >
              {tag.label}
            </span>
          ))}
          {item.storageLocation && (
            <span className="h-6 px-2 rounded inline-flex items-center gap-1 max-w-full bg-gray-100 text-gray-700 text-[13px]">
              <MapPin className="w-3 h-3 shrink-0" strokeWidth={2.25} />
              <span className="truncate">{item.storageLocation}</span>
            </span>
          )}
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
  isFiltered = false,
  onClearFilter,
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
      <div className="flex items-baseline gap-1.5 pt-3">
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-gray-900">
          {title}
        </h2>
        <span className="text-[16px] text-gray-500">({inventory.length})</span>
        {isFiltered && onClearFilter && (
          <button
            type="button"
            onClick={onClearFilter}
            className="ml-auto text-[13px] font-semibold text-[#d97757] active:scale-95 transition-transform"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 pb-6">
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
