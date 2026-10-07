'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Package,
  Layers,
  Loader2,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { categories, getCategoryName, getCategoryVisual } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';
import { formatDate } from '../inventory/inventory-utils';

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

function matchesCategoryFilter(productCategory, selectedCategoryValue) {
  if (!selectedCategoryValue || selectedCategoryValue === 'all') return true;
  const prodCat = String(productCategory || 'other').toLowerCase();
  const selected = String(selectedCategoryValue || 'all').toLowerCase();
  const catObj = categories.find((c) => c.value === selected);
  const catName = catObj?.name.toLowerCase();
  return (
    prodCat === selected ||
    (catName && prodCat === catName) ||
    prodCat.replace(/[\s&_-]/g, '') === selected.replace(/[\s&_-]/g, '')
  );
}

/**
 * Helper to inspect item / batch expiration data
 */
function getProductExpirationMeta(product) {
  let earliestDate = null;
  let hasAnyDate = false;

  if (product?.batches && product.batches.length > 0) {
    for (const batch of product.batches) {
      if (batch?.expirationDate) {
        const d = new Date(batch.expirationDate);
        if (!isNaN(d.getTime())) {
          hasAnyDate = true;
          if (!earliestDate || d < earliestDate) {
            earliestDate = d;
          }
        }
      }
    }
  } else if (product?.expirationDate) {
    const d = new Date(product.expirationDate);
    if (!isNaN(d.getTime())) {
      hasAnyDate = true;
      earliestDate = d;
    }
  }

  let isExpiringSoon = false;
  let isExpired = false;
  if (earliestDate) {
    const target = new Date(earliestDate.getTime());
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      isExpired = true;
    } else if (diffDays <= 30) {
      isExpiringSoon = true;
    }
  }

  return {
    hasDate: hasAnyDate,
    isExpiringSoon,
    isExpired,
    earliestDate,
  };
}

function ItemThumb({ product, size = 'w-14 h-14' }) {
  const catVisual = getCategoryVisual(product.category);
  return product.photoUrl ? (
    <img src={product.photoUrl} alt="" className={`${size} rounded-lg object-cover border border-gray-100 shrink-0 bg-gray-50`} />
  ) : (
    <div className={`${size} rounded-lg flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden ${catVisual.style.bg}`}>
      <img src={catVisual.imagePath} alt="" className="w-full h-full object-contain mix-blend-multiply scale-[1.35]" />
    </div>
  );
}

const expText = (batch) => {
  const d = formatDate(batch?.expirationDate);
  return d ? `Exp ${d}` : 'No expiration date';
};

// The sheet's item view: "Take from" (batch list) or "How much" (amount + optional reason).
function ItemStep({
  step, picked, availableIn, onPickBatch,
  isWeight, available, qty, setQty, weightDraft, setWeightDraft,
  reason, setReason, canStage, onStage,
}) {
  const { product, batch } = picked;
  const batches = batchesOf(product);
  const [countDraft, setCountDraft] = useState(null); // typed text while the count box is focused
  const unit = product.unit;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pt-1 pb-6">
        {/* Item */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
          <ItemThumb product={product} />
          <div className="min-w-0">
            <h3 className="text-[16px] font-medium text-[#1a1f36] leading-snug truncate">{product.name}</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {amountWithUnit(product.totalQuantity ?? batches.reduce((s, b) => s + Number(b.quantity || 0), 0), unit)} in stock
            </p>
          </div>
        </div>

        {step === 'batch' ? (
          <>
            <p className="text-[13px] text-gray-500 mt-4 mb-2.5">
              {batches.length} batches · oldest first
            </p>
            <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
              {batches.map((b, i) => {
                const free = availableIn(product, b);
                const empty = free <= 0;
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={empty}
                    onClick={() => onPickBatch(b)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] text-[#1a1f36]">{expText(b)}</span>
                        {i === 0 && !empty && (
                          <span className="text-[11px] font-medium text-[#b5583a] bg-[#fbeee9] px-2 py-0.5 rounded-full">Use first</span>
                        )}
                      </div>
                      <span className="text-[13px] text-gray-500">
                        {empty ? 'All in cart' : `${amountWithUnit(free, unit)} available`}
                      </span>
                    </div>
                    {!empty && <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Which batch */}
            <div className="mt-4 flex items-center justify-between text-[13px]">
              <span className="text-gray-600">{expText(batch)}</span>
              <span className="text-gray-500">{amountWithUnit(available, unit)} available</span>
            </div>

            {/* Amount */}
            <p className="text-[15px] font-medium text-[#1a1f36] mt-6 mb-3">
              {isWeight ? 'How much weight?' : 'How many?'}
            </p>
            {available <= 0 ? (
              <p className="text-[14px] text-gray-500">All of this batch is already in the cart.</p>
            ) : isWeight ? (
              <label className="flex items-center justify-center gap-1.5 h-[52px] rounded-full border border-gray-300 focus-within:border-[#d97757] cursor-text transition-colors">
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
              <div className="flex items-center justify-between h-[52px] rounded-full border border-gray-300 px-1.5">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[#1a1f36] active:bg-gray-100 disabled:opacity-30"
                  aria-label="Fewer"
                >
                  <Minus className="w-5 h-5" strokeWidth={2} />
                </button>
                {/* Type the number directly; 20px text so no phone zooms in on focus (iOS zooms under 16px). */}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={countDraft ?? String(Math.min(qty, available))}
                  onFocus={(e) => { setCountDraft(String(Math.min(qty, available))); e.target.select(); }}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setCountDraft(digits);
                    const n = parseInt(digits, 10);
                    if (n > 0) setQty(Math.min(available, n));
                  }}
                  onBlur={() => setCountDraft(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  aria-label="How many to take out"
                  className="w-20 text-center bg-transparent outline-none text-[20px] font-medium text-[#1a1f36] tabular-nums rounded-md focus:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(available, q + 1))}
                  disabled={qty >= available}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[#1a1f36] active:bg-gray-100 disabled:opacity-30"
                  aria-label="More"
                >
                  <Plus className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            )}
            {isWeight && Number(weightDraft) > available && (
              <p className="text-[12.5px] text-gray-500 mt-2 text-center">Only {available} lb available; {available} lb will be taken.</p>
            )}

            {/* Reason (optional) */}
            <p className="text-[15px] font-medium text-[#1a1f36] mt-7 mb-3">
              Reason <span className="font-normal text-gray-400">(optional)</span>
            </p>
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
                        ? 'bg-[#fbeee9] border-[#d97757] text-[#b5583a] font-medium'
                        : 'bg-white border-gray-200 text-gray-600 active:bg-gray-50'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {step === 'amount' && (
        <div className="shrink-0 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-100 bg-white">
          <button
            type="button"
            onClick={onStage}
            disabled={!canStage}
            className="w-full h-[50px] rounded-full bg-[#d97757] text-white text-[15px] font-semibold active:bg-[#c66547] active:scale-[0.99] disabled:opacity-40 transition-all"
          >
            Add to cart
          </button>
        </div>
      )}
    </>
  );
}

export function NoBarcodeVisualGridSheet({
  isOpen,
  onClose,
  products = [],
  onStageItem,
  stagedCart = [],
  initialCategory = 'all',
  startProduct = null, // set when a scan opens the sheet on one item
}) {
  const { pantryId } = usePantry();
  const [searchQuery, setSearchQuery] = useState('');
  // Tapping an item turns this same sheet into the item: pick a batch (if there are several), then how much + why.
  const [picked, setPicked] = useState(null); // { product, batch | null }
  const [qty, setQty] = useState(1); // count lines
  const [weightDraft, setWeightDraft] = useState(''); // weighed lines, typed
  const [reason, setReason] = useState('given_out');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [dictionaryItems, setDictionaryItems] = useState([]);
  const [isLoadingDictionary, setIsLoadingDictionary] = useState(false);

  // 1. Fetch local inventory dictionary on mount
  useEffect(() => {
    let isMounted = true;
    const fetchDictionary = async () => {
      try {
        setIsLoadingDictionary(true);
        const headers = pantryId ? { 'x-pantry-id': pantryId } : {};
        const res = await fetch('/api/foods/dictionary', { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.dictionary)) {
            setDictionaryItems(data.dictionary);
          }
        }
      } catch (err) {
        console.error('Error fetching inventory dictionary:', err);
      } finally {
        if (isMounted) {
          setIsLoadingDictionary(false);
        }
      }
    };

    fetchDictionary();
    return () => {
      isMounted = false;
    };
  }, [pantryId]);

  // Reset search and filters when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(initialCategory);
    } else {
      setSearchQuery('');
      setSelectedCategory('all');
      setPicked(null);
    }
  }, [isOpen, initialCategory]);

  // How much of a batch is still free (minus what's already in the cart).
  const availableIn = (product, batch) => {
    const inCart = stagedCart
      .filter((l) => l && (l.batchId === batch.id || l.id === `${product.catalogItemId || product.id}-${batch.id}`))
      .reduce((s, l) => s + (Number(l.quantity) || 0), 0);
    return Math.max(0, Math.round((Number(batch.quantity || 0) - inCart) * 100) / 100);
  };

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

  const step = !picked ? 'grid' : picked.batch ? 'amount' : 'batch';
  const pickedIsWeight = picked ? isWeightUnit(picked.product.unit) : false;
  const pickedAvailable = picked?.batch ? availableIn(picked.product, picked.batch) : 0;
  const chosenAmount = pickedIsWeight
    ? Math.min(pickedAvailable, Math.round((parseFloat(weightDraft) || 0) * 100) / 100)
    : Math.min(pickedAvailable, qty);
  const canStage = chosenAmount > 0;

  const handleStage = () => {
    if (!picked?.batch || !canStage) return;
    const { product, batch } = picked;
    onStageItem?.({
      id: `${product.catalogItemId || product.id}-${batch.id}`,
      batchId: batch.id,
      catalogItemId: product.catalogItemId || product.id,
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

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 2. Base item collection: prioritize passed active inventory products or fallback to dictionary
  const combinedProducts = useMemo(() => {
    let list = [];
    if (products && products.length > 0) {
      list = products;
    } else if (dictionaryItems && dictionaryItems.length > 0) {
      list = dictionaryItems.map((item) => ({
        catalogItemId: item.barcode || item.id,
        id: item.barcode || item.id,
        name: item.name || 'Unknown Item',
        category: item.category || 'other',
        barcode: item.barcode || null,
        photoUrl: item.photoUrl || null,
        unit: 'units',
        totalQuantity: item.totalQuantity || 1,
        batches: item.batches || [
          {
            id: item.id || `batch-${item.name}`,
            quantity: 1,
            expirationDate: item.expirationDate || null,
            expirationPrecision: 'none',
            sourceType: 'donation',
          },
        ],
      }));
    }
    // Default to alphabetical order by item name
    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [products, dictionaryItems]);

  // 3. Filter pills list: "All", "Expired", "Expiring Soon", "Low Stock", "No Date", and available categories
  const filterPillList = useMemo(() => {
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let noDateCount = 0;
    let lowStockCount = 0;

    combinedProducts.forEach((p) => {
      const meta = getProductExpirationMeta(p);
      const totalQty = p.totalQuantity !== undefined ? p.totalQuantity : 0;
      
      if (meta.isExpired) expiredCount++;
      if (meta.isExpiringSoon) expiringSoonCount++;
      if (!meta.hasDate) noDateCount++;
      if (totalQty > 0 && totalQty < 5) lowStockCount++;
    });

    const list = [
      { id: 'all', name: 'All', count: combinedProducts.length },
      { id: 'expired', name: 'Expired', count: expiredCount },
      { id: 'expiring_soon', name: 'Expiring Soon', count: expiringSoonCount },
      { id: 'low_stock', name: 'Low Stock', count: lowStockCount },
      { id: 'no_date', name: 'No Date', count: noDateCount },
    ];

    categories.forEach((cat) => {
      const count = combinedProducts.filter((product) =>
        matchesCategoryFilter(product.category, cat.value)
      ).length;

      if (count > 0) {
        list.push({
          id: cat.value,
          name: cat.name,
          count,
        });
      }
    });

    return list;
  }, [combinedProducts]);

  // 4. Filtered and searched products
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return combinedProducts.filter((product) => {
      // Expiration / Category filter match
      if (selectedCategory === 'expired') {
        const meta = getProductExpirationMeta(product);
        if (!meta.isExpired) return false;
      } else if (selectedCategory === 'expiring_soon') {
        const meta = getProductExpirationMeta(product);
        if (!meta.isExpiringSoon) return false;
      } else if (selectedCategory === 'low_stock') {
        const totalQty = product.totalQuantity !== undefined ? product.totalQuantity : 0;
        if (totalQty <= 0 || totalQty >= 5) return false;
      } else if (selectedCategory === 'no_date') {
        const meta = getProductExpirationMeta(product);
        if (meta.hasDate) return false;
      } else if (selectedCategory !== 'all') {
        if (!matchesCategoryFilter(product.category, selectedCategory)) {
          return false;
        }
      }

      // Query match (name, category, barcode)
      if (query) {
        const nameMatch = product.name?.toLowerCase().includes(query);
        const catMatch = product.category?.toLowerCase().includes(query) || getCategoryName(product.category).toLowerCase().includes(query);
        const barcodeMatch = product.barcode?.toLowerCase().includes(query);
        return nameMatch || catMatch || barcodeMatch;
      }

      return true;
    });
  }, [combinedProducts, searchQuery, selectedCategory]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col justify-end"
          style={{ isolation: 'isolate' }}
        >
          {/* 1. BACKDROP SCRIM */}
          <motion.div
            key="grid-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* 2. SLIDE-UP MODAL SHEET */}
          <motion.div
            key="grid-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[92dvh] h-[88dvh] w-full overflow-hidden"
          >
            {/* Header */}
            <div className="relative flex items-center justify-center pt-4 pb-3.5 shrink-0">
              {step !== 'grid' && (
                <button
                  type="button"
                  onClick={goBack}
                  className="absolute left-4 p-1 text-gray-500 active:text-[#1a1f36] transition-colors"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                </button>
              )}
              <h2 className="text-[17px] font-medium text-[#1a1f36] tracking-tight">
                {step === 'grid' ? 'Inventory' : step === 'batch' ? 'Take from' : 'How much'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-5 text-[#d97757] hover:text-[#c66547] active:scale-95 transition-all p-1"
                aria-label="Close"
              >
                <X className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>

            {step === 'grid' && startProduct ? null : step === 'grid' ? (
            <>
            {/* Search Input */}
            <div className="px-5 pt-1 pb-2 shrink-0">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find an item in the pantry"
                  className="w-full h-[42px] pl-11 pr-10 bg-white border border-gray-300 rounded-full text-[16px] font-normal text-[#1a1f36] placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Pills (All, Expiring Soon, No Date, Categories) */}
            <div className="shrink-0 border-b border-gray-100 pb-3">
              <div className="flex gap-2.5 overflow-x-auto px-6 pt-1 scroll-smooth touch-pan-x overscroll-x-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Hide empty filters; "All" and the active one always stay. */}
                {filterPillList.filter((pill) => pill.count > 0 || pill.id === 'all' || pill.id === selectedCategory).map((pill) => {
                  const isActive = selectedCategory === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setSelectedCategory(pill.id)}
                      className={`px-4 py-1.5 border rounded-full text-[13px] font-medium tracking-tight whitespace-nowrap shrink-0 transition-all ${
                        isActive
                          ? 'bg-orange-50 border-orange-300 text-[#c66547] shadow-sm'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pill.name}
                      <span
                        className={`ml-1.5 text-[11px] font-medium ${
                          isActive ? 'text-[#c66547]/80' : 'text-gray-400'
                        }`}
                      >
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2-Column Product Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
              {isLoadingDictionary && filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 className="w-8 h-8 text-[#d97757] animate-spin mb-3" />
                  <p className="text-[13px] font-normal text-gray-400">Loading inventory items...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-[100px] h-[100px] shrink-0 relative mb-4">
                    <img src="/assets/images/empty-search.jpg" alt="No matches" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <h3 className="text-[16px] font-medium text-[#1a1f36] mb-1">
                    No matching items found
                  </h3>
                  <p className="text-[13px] font-normal text-gray-400 max-w-xs mb-5">
                    {searchQuery || selectedCategory !== 'all'
                      ? 'Try adjusting your search query or category filter.'
                      : 'Your inventory has no items in stock available for distribution.'}
                  </p>
                  {(searchQuery || selectedCategory !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="px-4 py-2 rounded-full bg-gray-100 text-[#1a1f36] text-[13px] font-medium hover:bg-gray-200 active:scale-95 transition-all"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {filteredProducts.map((product) => {
                    const catVisual = getCategoryVisual(product.category);
                    const batchCount = product.batches?.length || 1;

                    return (
                      <div
                        key={product.catalogItemId || product.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handlePickProduct(product)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handlePickProduct(product);
                          }
                        }}
                        className="bg-white border border-gray-200 hover:border-orange-300 active:border-[#d97757] rounded-lg p-3 flex flex-col text-center transition-all active:scale-[0.98] shadow-sm group relative cursor-pointer"
                      >
                        {/* Image / Icon Box */}
                        <div className={`aspect-[4/3] w-full rounded-md flex items-center justify-center relative overflow-hidden mb-2 border border-gray-100/60 ${product.photoUrl ? 'bg-gray-50' : catVisual.style.bg}`}>
                          {product.photoUrl ? (
                            <img
                              src={product.photoUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center p-1">
                              <img 
                                src={catVisual.imagePath} 
                                alt={catVisual.name} 
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300 mix-blend-multiply"
                              />
                            </div>
                          )}

                          {/* Batch Count Badge (Top-Left) - only if batches > 1 */}
                          {batchCount > 1 && (
                            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md text-[#1a1f36] text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-100 shadow-xs flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5 text-[#d97757]" />
                              <span>
                                {batchCount} Batches
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Product Name */}
                        <h4 className="text-[14px] font-medium text-[#1a1f36] text-center leading-snug line-clamp-2 mt-0.5 mb-2.5 flex-1">
                          {product.name}
                        </h4>

                        {/* Take out: opens the item in this sheet (batch, then amount) */}
                        <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePickProduct(product);
                              }}
                              className="w-full flex items-center justify-center py-2.5 rounded-md bg-[#d97757] text-white text-[13px] font-semibold hover:bg-[#c66547] transition-all active:scale-95 shadow-sm mt-auto"
                            >
                              Take out
                            </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </>
            ) : (
              <ItemStep
                step={step}
                picked={picked}
                availableIn={availableIn}
                onPickBatch={(batch) => openAmount(picked.product, batch)}
                isWeight={pickedIsWeight}
                available={pickedAvailable}
                qty={qty}
                setQty={setQty}
                weightDraft={weightDraft}
                setWeightDraft={setWeightDraft}
                reason={reason}
                setReason={setReason}
                canStage={canStage}
                onStage={handleStage}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
