/**
 * FoodArca Mobile Inventory Redesign - Inventory Utilities
 * 
 * Provides pure helper functions for:
 * - Date normalization & formatting (timezone-safe YYYY-MM-DD parsing, leap year handling)
 * - Expiration status calculations & metrics
 * - Strict urgency hierarchy typography styles (Expired: red, Expiring: amber, Low stock < 5: amber)
 * - Deterministic FEFO logical batch grouping, merging, and quantity summation
 * - Category visual configurations, pastel background styling, and asset paths
 */

import { getCategoryName, getCategoryVisual, getCategoryStyle } from '@/lib/constants';

// (Exporting them here too just in case other files import them from inventory-utils)
export { getCategoryName, getCategoryVisual, getCategoryStyle };

/**
 * Normalizes date input to a YYYY-MM-DD string without timezone skew.
 * @param {string|Date|null|undefined} dateInput 
 * @returns {string|null} ISO date string YYYY-MM-DD or null
 */
export const normalizeDateString = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const d = new Date(year, month - 1, day);
      if (isNaN(d.getTime())) return null;
      if (
        d.getFullYear() !== year ||
        d.getMonth() !== month - 1 ||
        d.getDate() !== day
      ) {
        return null;
      }
      const yStr = String(year).padStart(4, '0');
      const mStr = String(month).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      return `${yStr}-${mStr}-${dStr}`;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats an ISO date string into a user-friendly format (e.g. "Sep 15, 2026").
 * @param {string|Date|null|undefined} dateString 
 * @returns {string|null} Formatted date string or null
 */
export const formatDate = (dateString) => {
  if (!dateString) return null;
  const norm = normalizeDateString(dateString);
  if (!norm) return null;

  const [year, month, day] = norm.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return null;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Computes expiration status and metrics.
 * @param {string|Date|null|undefined} dateString 
 * @returns {{ label: string, className: string, color: string, isExpired: boolean, isExpiring: boolean, days: number|null }}
 */
export const getExpirationStatus = (dateString) => {
  if (!dateString) {
    return {
      label: 'No Date',
      className: 'text-gray-400 italic',
      color: 'text-gray-400',
      isExpired: false,
      isExpiring: false,
      days: null,
    };
  }

  const norm = normalizeDateString(dateString);
  if (!norm) {
    return {
      label: 'No Date',
      className: 'text-gray-400 italic',
      color: 'text-gray-400',
      isExpired: false,
      isExpiring: false,
      days: null,
    };
  }

  const [year, month, day] = norm.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      label: `Expired ${Math.abs(days)}d ago`,
      className: 'text-red-600 font-semibold',
      color: 'text-red-600',
      isExpired: true,
      isExpiring: false,
      days,
    };
  }

  if (days === 0) {
    return {
      label: 'Expires Today',
      className: 'text-amber-600 font-medium',
      color: 'text-amber-600',
      isExpired: false,
      isExpiring: true,
      days,
    };
  }

  if (days <= 30) {
    return {
      label: `Exp in ${days} days`,
      className: 'text-amber-600 font-medium',
      color: 'text-amber-600',
      isExpired: false,
      isExpiring: true,
      days,
    };
  }

  return {
    label: 'Good',
    className: 'text-gray-500 font-normal',
    color: 'text-gray-500',
    isExpired: false,
    isExpiring: false,
    days,
  };
};

/**
 * Computes subtle typography style classes according to the strict urgency hierarchy:
 * 1. Expired (days < 0) -> Red text (text-red-600 font-semibold)
 * 2. Expiring Soon (days <= 30) -> Orange/Yellow text (text-amber-600 font-medium)
 * 3. Low Stock (qty < 5) -> Orange/Yellow text (text-amber-600 font-bold) - subordinate to expiration, NEVER red
 * Strictly NO solid background badges.
 * 
 * @param {Object} item Product group or batch item
 * @returns {{
 *   isExpired: boolean,
 *   isExpiring: boolean,
 *   isLowStock: boolean,
 *   daysUntilExpiration: number|null,
 *   expLabel: string,
 *   expColor: string,
 *   expColorClass: string,
 *   stockColor: string,
 *   stockColorClass: string,
 *   className: string,
 *   statusLevel: 'expired' | 'expiring' | 'low_stock' | 'normal' | 'no_date'
 * }}
 */
export const getUrgentStatusStyles = (item) => {
  if (!item) {
    return {
      isExpired: false,
      isExpiring: false,
      isLowStock: false,
      daysUntilExpiration: null,
      expLabel: 'No exp date',
      expColor: 'text-gray-400 italic',
      expColorClass: 'text-gray-400 italic',
      stockColor: 'text-gray-900 font-bold',
      stockColorClass: 'text-gray-900 font-bold',
      className: 'text-gray-400 italic text-gray-900 font-bold',
      statusLevel: 'normal',
    };
  }

  let dateToEvaluate = item.expirationDate;
  if (!dateToEvaluate && Array.isArray(item.batches) && item.batches.length > 0) {
    const primary =
      item.batches.find((b) => b.expirationDate) || item.batches[0];
    dateToEvaluate = primary?.expirationDate;
  }

  const expStatus = getExpirationStatus(dateToEvaluate);
  const rawQty =
    item.totalQuantity !== undefined
      ? item.totalQuantity
      : item.quantity !== undefined
      ? item.quantity
      : 0;
  const qty = parseFloat(rawQty);
  const isLowStock = isNaN(qty) ? false : qty < 5;

  let expColor = 'text-gray-500 font-normal';
  let expLabel = expStatus.label;
  let statusLevel = 'normal';

  if (expStatus.isExpired) {
    expColor = 'text-red-600 font-semibold';
    statusLevel = 'expired';
  } else if (expStatus.isExpiring) {
    expColor = 'text-amber-600 font-medium';
    statusLevel = 'expiring';
  } else if (!dateToEvaluate) {
    expColor = 'text-gray-400 italic';
    expLabel = 'No exp date';
    statusLevel = isLowStock ? 'low_stock' : 'no_date';
  }

  if (isLowStock && statusLevel === 'normal') {
    statusLevel = 'low_stock';
  }

  // Stock typography: Low Stock (< 5) is orange/yellow text (never red)
  const stockColor = isLowStock
    ? 'text-amber-600 font-bold'
    : 'text-gray-900 font-bold';

  return {
    isExpired: expStatus.isExpired,
    isExpiring: expStatus.isExpiring,
    isLowStock,
    daysUntilExpiration: expStatus.days,
    expLabel,
    expColor,
    expColorClass: expColor,
    stockColor,
    stockColorClass: stockColor,
    className: `${expColor} ${stockColor}`,
    statusLevel,
  };
};

/**
 * Pure function to group raw inventory batch records into logical catalog item cards.
 * 
 * Rules:
 * 1. Batches belonging to the same product are grouped by catalogItemId or name + category.
 * 2. Batches with missing / null expiration dates merge into ONE logical batch.
 * 3. Batches with the exact same ISO date (YYYY-MM-DD) merge into ONE logical batch.
 * 4. Batches with differing expiration dates remain separate logical batches.
 * 5. Quantities are accurately summed.
 * 6. Logical batches are sorted FEFO (earliest expiration date first, null dates last).
 * 
 * @param {Array<Object>} rawInventory 
 * @returns {Array<Object>} Array of grouped products with sorted logical batches
 */
export const groupInventoryBatches = (rawInventory = []) => {
  if (!Array.isArray(rawInventory) || rawInventory.length === 0) return [];

  // Deduplicate identical raw records if identical _id or id is provided (B9.5)
  const seenRawIds = new Set();
  const filteredRaw = [];
  for (const raw of rawInventory) {
    if (!raw) continue;
    const rawId = raw._id || raw.id;
    if (rawId) {
      if (seenRawIds.has(rawId)) continue;
      seenRawIds.add(rawId);
    }
    filteredRaw.push(raw);
  }

  const itemMap = new Map();

  for (const rawItem of filteredRaw) {
    const nameKey = (rawItem.name || '').trim().toLowerCase();
    const catKey = (rawItem.category || 'other').trim().toLowerCase();
    const barcodeKey = rawItem.barcode ? String(rawItem.barcode).trim() : '';

    let groupKey = '';
    if (rawItem.catalogItemId) {
      groupKey = `catalog_${rawItem.catalogItemId}`;
    } else if (barcodeKey) {
      groupKey = `prod_${nameKey}__${catKey}__${barcodeKey}`;
    } else {
      groupKey = `prod_${nameKey}__${catKey}`;
    }

    if (!itemMap.has(groupKey)) {
      itemMap.set(groupKey, {
        catalogItemId:
          rawItem.catalogItemId || rawItem._id || rawItem.id || groupKey,
        id: rawItem.catalogItemId || rawItem._id || rawItem.id || groupKey,
        _id: rawItem.catalogItemId || rawItem._id || rawItem.id || groupKey,
        name: rawItem.name || 'Unknown Item',
        category: rawItem.category || 'other',
        unit: rawItem.unit || 'units',
        barcode: rawItem.barcode || null,
        photoUrl: rawItem.photoUrl || null,
        storageLocation: rawItem.storageLocation || null,
        notes: rawItem.notes || null,
        totalQuantity: 0,
        rawBatches: [],
      });
    }

    const group = itemMap.get(groupKey);
    const qty = parseFloat(rawItem.quantity) || 0;
    group.totalQuantity += qty;
    group.rawBatches.push(rawItem);

    if (!group.barcode && rawItem.barcode) group.barcode = rawItem.barcode;
    if (!group.photoUrl && rawItem.photoUrl) group.photoUrl = rawItem.photoUrl;
    if (!group.storageLocation && rawItem.storageLocation)
      group.storageLocation = rawItem.storageLocation;
    if (!group.notes && rawItem.notes) group.notes = rawItem.notes;
  }

  return Array.from(itemMap.values()).map((product) => {
    const logicalBatchMap = new Map();

    for (const rawBatch of product.rawBatches) {
      const normDate = normalizeDateString(rawBatch.expirationDate);
      const expKey = normDate || 'none';
      const rawQty = parseFloat(rawBatch.quantity) || 0;

      if (!logicalBatchMap.has(expKey)) {
        logicalBatchMap.set(expKey, {
          id: rawBatch.id || rawBatch._id || `${product.id}-${expKey}`,
          _id: rawBatch.id || rawBatch._id || `${product.id}-${expKey}`,
          rawBatchIds:
            rawBatch.id || rawBatch._id
              ? [rawBatch.id || rawBatch._id]
              : [],
          catalogItemId: product.catalogItemId,
          name: product.name,
          category: product.category,
          unit: product.unit,
          barcode: product.barcode,
          photoUrl: product.photoUrl,
          quantity: rawQty,
          expirationDate: normDate, // YYYY-MM-DD or null
          expirationPrecision:
            rawBatch.expirationPrecision || (normDate ? 'day' : 'none'),
          sourceType: rawBatch.sourceType || 'donation',
          donorName: rawBatch.donorName || null,
          storageLocation:
            rawBatch.storageLocation || product.storageLocation || null,
          notes: rawBatch.notes || product.notes || null,
          rawBatches: [rawBatch],
        });
      } else {
        const existing = logicalBatchMap.get(expKey);
        existing.quantity += rawQty;
        const batchId = rawBatch.id || rawBatch._id;
        if (batchId && !existing.rawBatchIds.includes(batchId)) {
          existing.rawBatchIds.push(batchId);
        }
        existing.rawBatches.push(rawBatch);
      }
    }

    // Sort logical batches FEFO (earliest date first, null dates last)
    const sortedLogicalBatches = Array.from(logicalBatchMap.values()).sort(
      (a, b) => {
        if (!a.expirationDate && !b.expirationDate) return 0;
        if (!a.expirationDate) return 1; // null dates placed at the end
        if (!b.expirationDate) return -1;
        return a.expirationDate.localeCompare(b.expirationDate);
      }
    );

    // Clean floating point math on batch quantities
    sortedLogicalBatches.forEach((b) => {
      b.quantity = Math.round((b.quantity + Number.EPSILON) * 1000) / 1000;
    });

    const roundedTotal =
      Math.round((product.totalQuantity + Number.EPSILON) * 1000) / 1000;

    // Primary expiration date is the earliest non-null expiration date, or null if all lack dates
    const primaryBatch =
      sortedLogicalBatches.find((b) => b.expirationDate) ||
      sortedLogicalBatches[0];
    const oldestExpirationDate = primaryBatch
      ? primaryBatch.expirationDate
      : null;

    return {
      ...product,
      totalQuantity: roundedTotal,
      quantity: roundedTotal,
      expirationDate: oldestExpirationDate,
      oldestExpirationDate,
      batches: sortedLogicalBatches,
      logicalBatchCount: sortedLogicalBatches.length,
      mainItem: {
        ...product,
        totalQuantity: roundedTotal,
        quantity: roundedTotal,
        expirationDate: oldestExpirationDate,
      },
    };
  });
};

/**
 * Resolves tap routing action for an inventory item.
 * - Multi-batch item (> 1 logical batch) -> OPEN_BATCH_SHEET
 * - Single-batch item (=== 1 logical batch) -> DIRECT_MODIFY
 * @param {Object} product Grouped product item
 * @returns {{ action: 'OPEN_BATCH_SHEET' | 'DIRECT_MODIFY', batch?: Object, product?: Object }}
 */
export const resolveItemTapAction = (product) => {
  if (!product) return { action: 'DIRECT_MODIFY', batch: null };
  const batches = product.batches || [];
  if (batches.length > 1) {
    return { action: 'OPEN_BATCH_SHEET', product };
  }
  const batch = batches[0] || product;
  return { action: 'DIRECT_MODIFY', batch };
};

/**
 * Filters inventory items against search query across name, barcode, and category.
 * @param {Array<Object>} inventory 
 * @param {string} query 
 * @returns {Array<Object>} Filtered inventory array
 */
export const filterInventory = (inventory = [], query = '') => {
  if (!Array.isArray(inventory)) return [];
  const q = (query || '').trim().toLowerCase();
  if (!q) return inventory;
  return inventory.filter((item) => {
    if (!item) return false;
    const nameMatch = item.name && item.name.toLowerCase().includes(q);
    const barcodeMatch =
      item.barcode && String(item.barcode).toLowerCase().includes(q);
    const catMatch = item.category && item.category.toLowerCase().includes(q);
    const batchBarcodeMatch =
      item.batches &&
      item.batches.some(
        (b) => b.barcode && String(b.barcode).toLowerCase().includes(q)
      );
    return nameMatch || barcodeMatch || catMatch || batchBarcodeMatch;
  });
};
