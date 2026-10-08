'use client';

// Remove's item sheet: the shared ItemSheet (components/flow/item-sheet.jsx) in clay.
// Tapping an item turns the same sheet into it: "Take from" (oldest first, only with several
// batches), then "How much" + an optional reason, then Add to cart.

import React, { useState, useMemo, useEffect } from 'react';
import { formatDate } from '../inventory/inventory-utils';
import { usePantry } from '@/components/providers/PantryProvider';
import { usePagedList } from '@/lib/use-paged-list';
import { FIRST_PAGE, NEXT_PAGE, FULL_SHELF_LIMIT, queryKey } from '@/lib/inventory-query';
import { fetchInventoryList, inPageOrder } from '../inventory/use-inventory-list';
import {
  ItemSheet, StepItem, StepBody, StepButton, StepCounter, StepLabel, ChoiceList, ChoiceRow, UseFirst, InCart, productKey,
  categoryCounts,
} from '@/components/flow/item-sheet';

// Why it's leaving. "Given out" is the default; the rest are recorded as thrown out.
export const REMOVE_REASONS = [
  { value: 'given_out', label: 'Given out' },
  { value: 'expired', label: 'Expired' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'recalled', label: 'Recalled' },
  { value: 'other', label: 'Other' },
];

const isWeightUnit = (unit) => /^(lb|lbs|pound|pounds)$/i.test(unit || '');

// Oldest expiration first; undated batches last.
function sortBatchesFefo(batches) {
  return [...(batches || [])].sort((a, b) => {
    const ta = a?.expirationDate ? new Date(a.expirationDate).getTime() : NaN;
    const tb = b?.expirationDate ? new Date(b.expirationDate).getTime() : NaN;
    if (isNaN(ta) && isNaN(tb)) return 0;
    if (isNaN(ta)) return 1;
    if (isNaN(tb)) return -1;
    return ta - tb;
  });
}

// A product without batch records is treated as one batch holding its whole stock.
function batchesOf(product) {
  if (product?.batches?.length) return sortBatchesFefo(product.batches);
  return [{
    id: product.catalogItemId || product.id,
    quantity: product.totalQuantity || 1,
    expirationDate: product.expirationDate || null,
    expirationPrecision: 'none',
    sourceType: 'donation',
  }];
}

function amountWithUnit(n, unit) {
  if (isWeightUnit(unit)) return `${n} lb`;
  return `${n} ${Number(n) === 1 ? 'item' : 'items'}`;
}
const bare = (n, unit) => amountWithUnit(n, unit).replace(/ items?$/, '');

const expText = (batch) => {
  const d = formatDate(batch?.expirationDate);
  return d ? `Exp ${d}` : 'No expiration date';
};

/**
 * Group flat inventory batch records into products with aggregated total quantity
 * and FEFO-sorted active batches.
 */
export function groupInventoryByProduct(rawItems = []) {
  const safeItems = Array.isArray(rawItems) ? rawItems : [];
  const groups = new Map();

  for (const item of safeItems) {
    if (!item) continue;
    const qty = Number(item.quantity || 0);
    if (isNaN(qty) || qty <= 0) continue; // Only active inventory batches with positive quantity

    const groupKey = item.catalogItemId || item.barcode || item.name || 'unknown-item';
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        catalogItemId: item.catalogItemId || item.id || item._id || groupKey,
        id: item.catalogItemId || item.id || item._id || groupKey,
        name: item.name || 'Unknown Item',
        category: item.category || 'Other',
        barcode: item.barcode || null,
        photoUrl: item.photoUrl || null,
        unit: item.unit || 'units',
        totalQuantity: 0,
        batches: [],
      });
    }

    const group = groups.get(groupKey);
    group.totalQuantity += qty;

    const expKey = item.expirationDate ? item.expirationDate.split('T')[0] : 'nodate';
    
    const existingBatch = group.batches.find(b => 
      (b.expirationDate ? b.expirationDate.split('T')[0] : 'nodate') === expKey
    );

    if (existingBatch) {
      existingBatch.quantity += qty;
      // Note: we just use the first batch's id for the cart, the backend handles FEFO deduction by catalogItemId anyway
    } else {
      const batchId = item.id || item._id || item.batchId || `batch-${group.batches.length}-${expKey}`;
      group.batches.push({
        id: batchId,
        _id: batchId,
        quantity: qty,
        expirationDate: item.expirationDate || null,
        expirationPrecision: item.expirationPrecision || 'none',
        sourceType: item.sourceType || 'donation',
        receivedDate: item.receivedDate || null,
        donorName: item.donorName || null,
      });
    }
  }

  // Sort batches FEFO within each product and sort products alphabetically
  const result = Array.from(groups.values()).map((product) => {
    product.batches.sort((a, b) => {
      const timeA = a?.expirationDate ? new Date(a.expirationDate).getTime() : NaN;
      const timeB = b?.expirationDate ? new Date(b.expirationDate).getTime() : NaN;
      const hasA = !isNaN(timeA);
      const hasB = !isNaN(timeB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1; // Put null / invalid expiration dates last
      if (!hasB) return -1;
      return timeA - timeB;
    });
    return product;
  });

  result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return result;
}

// A pantry with more items than FULL_SHELF_LIMIT: the grid asks the server for the matching in-stock
// items a page at a time (/api/inventory, the same rules and filters as the Inventory page), by name,
// instead of drawing and searching the whole shelf on the phone. Smaller pantries filter on the device.
function useRemoveServerList({ query, filter, open, products }) {
  const { pantryId, lastInventoryUpdate } = usePantry();
  const large = products.length > FULL_SHELF_LIMIT;
  const q = { filter, search: query, sort: 'name' };
  const paged = usePagedList({
    scope: pantryId,
    key: queryKey(q),
    query: q,
    load: (args, signal) => fetchInventoryList(pantryId, args, signal),
    version: lastInventoryUpdate,
    enabled: large && open && !!pantryId,
    rowsKey: 'lots',
    first: FIRST_PAGE,
    next: NEXT_PAGE,
  });

  const items = useMemo(
    () => (paged.entry ? inPageOrder(paged.entry, groupInventoryByProduct(paged.entry.lots)) : []),
    [paged.entry]
  );
  const counts = useMemo(() => {
    const sum = paged.summary;
    if (!sum) return null;
    return {
      all: sum.all,
      status: { expired: sum.expired, expiring_soon: sum.expiring, low_stock: sum.low, no_date: sum.noDate, out_of_stock: 0 },
      categories: categoryCounts(Object.entries(sum.categories || {})),
    };
  }, [paged.summary]);

  if (!large) return null;
  return {
    products: items,
    counts,
    loading: !paged.entry,
    pending: paged.pending,
    hasMore: paged.hasMore,
    loadMore: paged.loadMore,
  };
}

export function NoBarcodeVisualGridSheet({
  isOpen,
  onClose,
  products = [],
  loading = false, // the shared shelf hasn't arrived yet
  onStageItem,
  stagedCart = [],
  initialCategory = 'all',
  startProduct = null, // set when a scan opens the sheet on one item
}) {
  const [picked, setPicked] = useState(null); // { product, batch | null }
  const [qty, setQty] = useState(1); // count lines
  const [weightDraft, setWeightDraft] = useState(''); // weighed lines, typed
  const [reason, setReason] = useState('given_out');

  useEffect(() => { if (!isOpen) setPicked(null); }, [isOpen]);

  // How much of a batch is already in the cart; with no batch, the whole item.
  const inCartFor = (product, batch) => {
    if (!batch) return Math.round(batchesOf(product).reduce((s, b) => s + inCartFor(product, b), 0) * 100) / 100;
    return stagedCart
      .filter((l) => l && (l.batchId === batch.id || l.id === `${productKey(product)}-${batch.id}`))
      .reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  };

  // How much of a batch is still free (minus what's already in the cart).
  const availableIn = (product, batch) =>
    Math.max(0, Math.round((Number(batch.quantity || 0) - inCartFor(product, batch)) * 100) / 100);

  const openAmount = (product, batch) => {
    setPicked({ product, batch });
    setQty(1);
    setWeightDraft('');
    setReason('given_out');
  };

  const handlePickProduct = (product) => {
    const batches = batchesOf(product);
    if (batches.length > 1) setPicked({ product, batch: null });
    else openAmount(product, batches[0]);
  };

  const goBack = () => {
    if (picked?.batch && batchesOf(picked.product).length > 1) setPicked({ product: picked.product, batch: null });
    else if (startProduct) onClose?.(); // opened from a scan: there's no grid behind it
    else setPicked(null);
  };

  // Opened from a scan: go straight to that item's steps.
  useEffect(() => {
    if (isOpen && startProduct) handlePickProduct(startProduct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, startProduct]);

  const list = useMemo(() => [...products].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [products]);

  const step = !picked ? null : picked.batch ? 'amount' : 'batch';
  const isWeight = picked ? isWeightUnit(picked.product.unit) : false;
  const available = picked?.batch ? availableIn(picked.product, picked.batch) : 0;
  const chosenAmount = isWeight
    ? Math.min(available, Math.round((parseFloat(weightDraft) || 0) * 100) / 100)
    : Math.min(available, qty);
  const canStage = chosenAmount > 0;

  const handleStage = () => {
    if (!picked?.batch || !canStage) return;
    const { product, batch } = picked;
    onStageItem?.({
      id: `${productKey(product)}-${batch.id}`,
      batchId: batch.id,
      catalogItemId: productKey(product),
      name: product.name,
      category: product.category,
      categoryName: product.category,
      unit: product.unit || 'units',
      quantity: chosenAmount,
      reason,
      expirationDate: batch.expirationDate || null,
      expirationPrecision: batch.expirationPrecision || 'none',
      availableBatchStock: Number(batch.quantity || product.totalQuantity || 1),
      photoUrl: product.photoUrl || null,
      barcode: product.barcode || null,
      donorName: batch.donorName || null,
      sourceType: batch.sourceType || null,
    });
  };

  let content = null;
  if (picked) {
    const { product, batch } = picked;
    const batches = batchesOf(product);
    const unit = product.unit;
    const item = (
      <StepItem photoUrl={product.photoUrl} category={product.category} name={product.name}>
        {amountWithUnit(product.totalQuantity ?? batches.reduce((s, b) => s + Number(b.quantity || 0), 0), unit)} in stock
        {inCartFor(product) > 0 && <InCart> · {bare(inCartFor(product), unit)} in cart</InCart>}
      </StepItem>
    );

    content = step === 'batch' ? (
      <StepBody>
        {item}
        <p className="text-[13px] text-gray-500 mt-4 mb-2.5">{batches.length} batches · oldest first</p>
        <ChoiceList>
          {batches.map((b, i) => {
            const free = availableIn(product, b);
            const empty = free <= 0;
            return (
              <ChoiceRow
                key={b.id}
                disabled={empty}
                onClick={() => openAmount(product, b)}
                title={expText(b)}
                badge={i === 0 && !empty && <UseFirst />}
                sub={
                  <>
                    {empty ? 'All in cart' : `${amountWithUnit(free, unit)} available`}
                    {!empty && inCartFor(product, b) > 0 && <InCart> · {bare(inCartFor(product, b), unit)} in cart</InCart>}
                  </>
                }
              />
            );
          })}
        </ChoiceList>
      </StepBody>
    ) : (
      <StepBody
        footer={
          <StepButton onClick={handleStage} disabled={!canStage}>
            {inCartFor(product, batch) > 0 ? 'Add more to cart' : 'Add to cart'}
          </StepButton>
        }
      >
        {item}
        {/* Which batch */}
        <div className="mt-4 flex items-center justify-between text-[13px]">
          <span className="text-gray-600">{expText(batch)}</span>
          <span className="text-gray-500">
            {amountWithUnit(available, unit)} available
            {inCartFor(product, batch) > 0 && <InCart> · {bare(inCartFor(product, batch), unit)} in cart</InCart>}
          </span>
        </div>

        <StepLabel>{isWeight ? 'How much weight?' : 'How many?'}</StepLabel>
        {available <= 0 ? (
          <p className="text-[14px] text-gray-500">All of this batch is already in the cart.</p>
        ) : isWeight ? (
          <label className="flex items-center justify-center gap-1.5 h-[52px] rounded-full border border-gray-300 focus-within:border-[color:var(--accent)] cursor-text transition-colors">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={weightDraft}
              onChange={(e) => setWeightDraft(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.0"
              aria-label="Weight to take out, in pounds"
              className="w-20 text-right bg-transparent outline-none text-[20px] font-medium text-[#1a1f36] placeholder-gray-300 tabular-nums"
            />
            <span className="text-[16px] text-gray-500">lb</span>
          </label>
        ) : (
          <StepCounter value={qty} onChange={setQty} max={available} label="How many to take out" />
        )}
        {isWeight && Number(weightDraft) > available && (
          <p className="text-[12.5px] text-gray-500 mt-2 text-center">Only {available} lb available; {available} lb will be taken.</p>
        )}

        {/* Reason (optional) */}
        <StepLabel className="mt-7">
          Reason <span className="font-normal text-gray-400">(optional)</span>
        </StepLabel>
        <div className="flex flex-wrap gap-2">
          {REMOVE_REASONS.map((r) => {
            const active = reason === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                aria-pressed={active}
                className={`px-4 py-2 rounded-full border text-[13.5px] transition-colors ${
                  active
                    ? 'bg-[color:var(--accent-tint)] border-[color:var(--accent)] text-[color:var(--accent-strong)] font-medium'
                    : 'bg-white border-gray-200 text-gray-600 active:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </StepBody>
    );
  }

  return (
    <ItemSheet
      theme="remove"
      isOpen={isOpen}
      onClose={onClose}
      title="Inventory"
      products={list}
      loading={loading}
      actionLabel="Take out"
      onPick={handlePickProduct}
      inCart={(p) => (inCartFor(p) > 0 ? `${bare(inCartFor(p), p.unit)} in cart` : null)}
      datePills
      initialFilter={initialCategory}
      emptyText="Your inventory has no items in stock to take out."
      hideGrid={!!startProduct}
      step={picked ? { title: step === 'batch' ? 'Take from' : 'How much', onBack: goBack, content } : null}
      useServerList={useRemoveServerList}
    />
  );
}
