'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Package,
  Loader2,
  Plus,
  Minus,
  Calendar,
  ChevronLeft,
  RotateCcw,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { categories, getCategoryName, getCategoryVisual } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';

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

function formatExpDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBatchExpDate(dateStr) {
  if (!dateStr) return 'No expiration';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'No expiration';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d.getTime());
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

  const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (diffDays < 0) return `Expired · ${formatted}`;
  if (diffDays <= 7) return `Expires soon · ${formatted}`;
  return formatted;
}

function getBatchStatusColor(dateStr) {
  if (!dateStr) return 'text-gray-400';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'text-gray-400';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d.getTime());
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-red-500';
  if (diffDays <= 7) return 'text-amber-500';
  return 'text-[#1a1f36]';
}

/**
 * RestockSheet — Three-mode slide-up sheet for restocking inventory.
 *
 * Mode 1: BROWSE      — searchable grid of existing inventory items
 * Mode 2: BATCH_SELECT — shows existing batches + "New Batch" option
 * Mode 3: RESTOCK      — compact qty stepper + optional expiration date
 *
 * Props:
 *   isOpen          — controls visibility
 *   onClose         — called when user dismisses the sheet
 *   onRestockItem   — (item) => void — called when user confirms a restock
 */
export function RestockSheet({ isOpen, onClose, onRestockItem }) {
  const { pantryId } = usePantry();

  // ---------- Internal mode state ----------
  const [mode, setMode] = useState('BROWSE'); // 'BROWSE' | 'BATCH_SELECT' | 'RESTOCK'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null); // null = new batch
  const [isNewBatch, setIsNewBatch] = useState(true);

  // ---------- BROWSE state ----------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dictionaryItems, setDictionaryItems] = useState([]);
  const [isLoadingDictionary, setIsLoadingDictionary] = useState(false);

  // ---------- RESTOCK state ----------
  const [restockQty, setRestockQty] = useState(1);
  const [restockExpDate, setRestockExpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch local inventory dictionary on mount
  useEffect(() => {
    let isMounted = true;
    const fetchDictionary = async () => {
      try {
        setIsLoadingDictionary(true);
        const headers = pantryId ? { 'x-pantry-id': pantryId } : {};
        
        // Fetch both the full dictionary and current active batches
        const [dictRes, invRes] = await Promise.all([
          fetch('/api/foods/dictionary', { headers }),
          fetch('/api/foods', { headers })
        ]);

        if (dictRes.ok) {
          const dictData = await dictRes.json();
          let invData = { data: [] };
          if (invRes.ok) {
            invData = await invRes.json();
          }

          if (isMounted && Array.isArray(dictData.dictionary)) {
            // Group active batches by barcode (or catalogItemId)
            const activeBatches = Array.isArray(invData.data) ? invData.data : [];
            const batchesById = {};

            activeBatches.forEach(batch => {
              const matchId = batch.barcode || batch.catalogItemId;
              if (matchId) {
                if (!batchesById[matchId]) batchesById[matchId] = [];
                batchesById[matchId].push({
                  id: batch.id,
                  quantity: batch.quantity || 1,
                  expirationDate: batch.expirationDate,
                });
              }
            });

            // Merge batches into dictionary items
            const merged = dictData.dictionary.map(item => {
              const matchId = item.barcode || item.id;
              const itemBatches = batchesById[matchId] || [];
              return {
                ...item,
                totalQuantity: itemBatches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0),
                batches: itemBatches
              };
            });

            setDictionaryItems(merged);
          }
        }
      } catch (err) {
        console.error('Error fetching inventory dictionary:', err);
      } finally {
        if (isMounted) setIsLoadingDictionary(false);
      }
    };
    fetchDictionary();
    return () => { isMounted = false; };
  }, [pantryId]);

  // Reset everything when sheet opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode('BROWSE');
      setSelectedItem(null);
      setSelectedBatch(null);
      setIsNewBatch(true);
      setSearchQuery('');
      setSelectedCategory('all');
      setRestockQty(1);
      setRestockExpDate('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Lock background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ---------- Data transforms ----------
  const combinedProducts = useMemo(() => {
    let list = [];
    if (dictionaryItems && dictionaryItems.length > 0) {
      list = dictionaryItems.map((item) => ({
        catalogItemId: item.barcode || item.id,
        id: item.barcode || item.id,
        name: item.name || 'Unknown Item',
        category: item.category || 'other',
        barcode: item.barcode || null,
        photoUrl: item.photoUrl || null,
        unit: item.unit || 'units',
        weightPerUnit: item.weightPerUnit || 0,
        totalQuantity: item.totalQuantity || 0,
        batches: item.batches || [],
      }));
    }
    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [dictionaryItems]);

  const filterPillList = useMemo(() => {
    const list = [{ id: 'all', name: 'All', count: combinedProducts.length }];
    categories.forEach((cat) => {
      const count = combinedProducts.filter((p) => matchesCategoryFilter(p.category, cat.value)).length;
      if (count > 0) list.push({ id: cat.value, name: cat.name, count });
    });
    return list;
  }, [combinedProducts]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return combinedProducts.filter((product) => {
      if (selectedCategory !== 'all' && !matchesCategoryFilter(product.category, selectedCategory)) return false;
      if (query) {
        const nameMatch = product.name?.toLowerCase().includes(query);
        const catMatch = product.category?.toLowerCase().includes(query) || getCategoryName(product.category).toLowerCase().includes(query);
        const barcodeMatch = product.barcode?.toLowerCase().includes(query);
        return nameMatch || catMatch || barcodeMatch;
      }
      return true;
    });
  }, [combinedProducts, searchQuery, selectedCategory]);

  // ---------- Handlers ----------
  const handleSelectItem = (product) => {
    setSelectedItem(product);
    setRestockQty(1);
    setRestockExpDate('');
    setIsSubmitting(false);

    const hasBatches = product.batches && product.batches.length > 0;
    if (hasBatches) {
      // Has existing batches — show batch selection
      setMode('BATCH_SELECT');
    } else {
      // No batches — go straight to restock as new batch
      setIsNewBatch(true);
      setSelectedBatch(null);
      setMode('RESTOCK');
    }
  };

  const handleSelectBatch = (batch) => {
    setSelectedBatch(batch);
    setIsNewBatch(false);
    setRestockQty(1);
    // Pre-fill expiration from existing batch (read-only)
    setRestockExpDate(batch?.expirationDate ? new Date(batch.expirationDate).toISOString().split('T')[0] : '');
    setMode('RESTOCK');
  };

  const handleSelectNewBatch = () => {
    setSelectedBatch(null);
    setIsNewBatch(true);
    setRestockQty(1);
    setRestockExpDate('');
    setMode('RESTOCK');
  };

  const handleBackToBrowse = () => {
    setMode('BROWSE');
    setSelectedItem(null);
    setSelectedBatch(null);
  };

  const handleBackToBatchSelect = () => {
    setMode('BATCH_SELECT');
    setSelectedBatch(null);
    setRestockQty(1);
    setRestockExpDate('');
  };

  const handleConfirmRestock = () => {
    if (!selectedItem || restockQty < 1 || isSubmitting) return;
    setIsSubmitting(true);

    const restockedItem = {
      id: crypto.randomUUID(),
      barcode: selectedItem.barcode || '',
      name: selectedItem.name || 'Unknown Item',
      category: selectedItem.category || 'other',
      quantity: restockQty,
      totalWeightLbs: (selectedItem.weightPerUnit || 0) * restockQty,
      unit: selectedItem.unit || 'units',
      expirationDate: restockExpDate || null,
      expirationPrecision: restockExpDate ? 'day' : 'none',
      photoUrl: selectedItem.photoUrl || null,
      weightPerUnit: selectedItem.weightPerUnit || 0,
      isNewBatch,
      existingBatchId: selectedBatch?.id || null,
    };

    if (onRestockItem) onRestockItem(restockedItem);

    // Brief success flash, then back to browse
    setTimeout(() => {
      setIsSubmitting(false);
      handleBackToBrowse();
    }, 600);
  };

  // ---------- Shared sub-components ----------
  const ItemIdentity = ({ item, subtitle }) => {
    const catVisual = getCategoryVisual(item?.category);
    return (
      <div className="flex flex-col items-center">
        {item?.photoUrl ? (
          <img src={item.photoUrl} alt={item.name} className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shadow-sm mb-3" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-[#fff0eb] border border-[#d97757]/10 flex items-center justify-center mb-3">
            <img src={catVisual.imagePath} alt={catVisual.name} className="w-14 h-14 object-contain mix-blend-multiply" />
          </div>
        )}
        <h3 className="text-[18px] font-semibold text-[#1a1f36] text-center leading-tight tracking-tight">{item?.name}</h3>
        <p className="text-[13px] font-normal text-[#8792a2] mt-0.5">{subtitle}</p>
      </div>
    );
  };

  // ---------- Render ----------
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex flex-col justify-end" style={{ isolation: 'isolate' }}>
          {/* BACKDROP SCRIM */}
          <motion.div
            key="restock-scrim"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* SLIDE-UP SHEET */}
          <motion.div
            key="restock-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[92dvh] h-[88dvh] w-full overflow-hidden"
          >
            <AnimatePresence mode="wait">

              {/* ============================================================ */}
              {/* MODE 1: BROWSE — Searchable inventory grid                    */}
              {/* ============================================================ */}
              {mode === 'BROWSE' && (
                <motion.div
                  key="browse"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="relative flex items-center justify-center pt-4 pb-3 shrink-0">
                    <h2 className="text-[17px] font-semibold text-[#1a1f36] tracking-tight">Restock Inventory</h2>
                    <button type="button" onClick={onClose} className="absolute right-5 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[#8792a2] active:bg-gray-200 transition-colors" aria-label="Close">
                      <X className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Search Input - Matching Remove sheet */}
                  <div className="px-5 pt-1 pb-2 shrink-0">
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find an item to restock"
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

                  {/* Quick Filter Pills - Matching Remove sheet */}
                  <div className="shrink-0 border-b border-gray-100 pb-3">
                    <div className="flex gap-2.5 overflow-x-auto px-6 pt-1 scroll-smooth touch-pan-x overscroll-x-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {filterPillList.map((pill) => {
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

                  {/* Product grid */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                    {isLoadingDictionary && filteredProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 className="w-7 h-7 text-[#d97757] animate-spin mb-3" />
                        <p className="text-[13px] font-normal text-gray-400">Loading inventory...</p>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                          <Package className="h-6 w-6 text-[#a3acb9]" />
                        </div>
                        <h3 className="text-[15px] font-semibold text-[#1a1f36] mb-0.5">No matching items</h3>
                        <p className="text-[13px] font-normal text-[#a3acb9] max-w-[220px]">
                          {searchQuery || selectedCategory !== 'all' ? 'Try adjusting your search or filter.' : 'Your inventory is empty.'}
                        </p>
                        {(searchQuery || selectedCategory !== 'all') && (
                          <button type="button" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                            className="mt-4 px-4 py-2 rounded-full bg-gray-100 text-[#1a1f36] text-[13px] font-medium active:scale-95 transition-all">
                            Reset filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3.5">
                        {filteredProducts.map((product) => {
                          const catVisual = getCategoryVisual(product.category);
                          const batchCount = product.batches?.length || 0;
                          return (
                            <button key={product.catalogItemId || product.id} type="button" onClick={() => handleSelectItem(product)}
                              className="bg-white border border-gray-200 hover:border-orange-300 active:border-[#e27f2c] rounded-2xl p-3 flex flex-col items-center text-center transition-all active:scale-[0.98] shadow-sm group cursor-pointer text-left"
                            >
                              {/* Image */}
                              <div className={`aspect-[4/3] w-full rounded-xl flex items-center justify-center relative overflow-hidden mb-2.5 border border-gray-100/60 ${product.photoUrl ? 'bg-gray-50' : catVisual.style.bg}`}>
                                {product.photoUrl ? (
                                  <img src={product.photoUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center p-2">
                                    <img src={catVisual.imagePath} alt={catVisual.name} loading="lazy" decoding="async" className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" />
                                  </div>
                                )}

                                {/* Batches Badge on the LEFT side if multiple batches */}
                                {batchCount > 1 && (
                                  <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md text-[#1a1f36] text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-100 shadow-xs flex items-center gap-1">
                                    <Layers className="w-2.5 h-2.5 text-[#e27f2c]" />
                                    <span>{batchCount} Batches</span>
                                  </div>
                                )}

                                {/* Quantity Badge on the RIGHT side */}
                                {product.totalQuantity > 0 && (
                                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-md text-[#1a1f36] text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-100 shadow-xs">
                                    {product.totalQuantity} in stock
                                  </div>
                                )}
                              </div>
                              {/* Name */}
                              <h4 className="text-[13px] font-medium text-[#1a1f36] text-center leading-snug line-clamp-2 mb-2 flex-1 w-full">{product.name}</h4>
                              {/* Orange-Yellowish Restock CTA */}
                              <div className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#fff7ed] text-[#e27f2c] border border-[#e27f2c]/20 hover:bg-[#ffedd5] text-[13px] font-semibold transition-all active:scale-95 shadow-xs mt-auto">
                                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
                                Restock
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* MODE 2: BATCH_SELECT — Choose existing batch or create new    */}
              {/* ============================================================ */}
              {mode === 'BATCH_SELECT' && selectedItem && (
                <motion.div
                  key="batch-select"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="relative flex items-center pt-4 pb-3 px-5 shrink-0 border-b border-gray-100">
                    <button type="button" onClick={handleBackToBrowse} className="flex items-center gap-0.5 text-[#d97757] active:scale-95 transition-all -ml-1">
                      <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                      <span className="text-[14px] font-medium">Items</span>
                    </button>
                    <button type="button" onClick={onClose} className="absolute right-5 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[#8792a2] active:bg-gray-200 transition-colors" aria-label="Close">
                      <X className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                    {/* Item identity */}
                    <ItemIdentity
                      item={selectedItem}
                      subtitle={`${getCategoryName(selectedItem.category)}${selectedItem.totalQuantity > 0 ? ` · ${selectedItem.totalQuantity} total in stock` : ''}`}
                    />

                    {/* New batch option */}
                    <div className="mt-8 mb-3">
                      <span className="text-[11px] font-bold text-[#8792a2] uppercase tracking-wider">Add as</span>
                    </div>

                    <button type="button" onClick={handleSelectNewBatch}
                      className="w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 border-dashed border-[#d97757]/30 bg-[#fff0eb] active:scale-[0.99] transition-all mb-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#d97757] flex items-center justify-center shrink-0 shadow-sm">
                        <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="text-[14px] font-semibold text-[#1a1f36] leading-tight">New Batch</h4>
                        <p className="text-[12px] font-normal text-[#8792a2] mt-0.5">Set a new expiration date</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#a3acb9] shrink-0" />
                    </button>

                    {/* Existing batches */}
                    {selectedItem.batches && selectedItem.batches.length > 0 && (
                      <>
                        <div className="mb-3 mt-2">
                          <span className="text-[11px] font-bold text-[#8792a2] uppercase tracking-wider">
                            Existing Batches
                            <span className="ml-1.5 text-[#a3acb9] font-medium normal-case">{selectedItem.batches.length}</span>
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {selectedItem.batches.map((batch, idx) => {
                            const expColor = getBatchStatusColor(batch?.expirationDate);
                            const batchQty = batch?.quantity || 0;

                            return (
                              <button key={batch?.id || idx} type="button" onClick={() => handleSelectBatch(batch)}
                                className="w-full flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#d97757]/30 active:scale-[0.99] transition-all group"
                              >
                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                                  <Calendar className="w-4.5 h-4.5 text-[#8792a2]" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <h4 className={`text-[14px] font-semibold leading-tight ${expColor}`}>
                                    {formatBatchExpDate(batch?.expirationDate)}
                                  </h4>
                                  <p className="text-[12px] font-normal text-[#a3acb9] mt-0.5">
                                    {batchQty} {batchQty === 1 ? (selectedItem.unit || 'unit').replace(/s$/, '') : (selectedItem.unit || 'units')} in stock
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#a3acb9] shrink-0 group-hover:text-[#d97757] transition-colors" />
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* MODE 3: RESTOCK — Quantity stepper + optional expiration      */}
              {/* ============================================================ */}
              {mode === 'RESTOCK' && selectedItem && (
                <motion.div
                  key="restock"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="relative flex items-center pt-4 pb-3 px-5 shrink-0 border-b border-gray-100">
                    <button type="button"
                      onClick={selectedItem?.batches?.length > 0 ? handleBackToBatchSelect : handleBackToBrowse}
                      className="flex items-center gap-0.5 text-[#d97757] active:scale-95 transition-all -ml-1"
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                      <span className="text-[14px] font-medium">{selectedItem?.batches?.length > 0 ? 'Batches' : 'Items'}</span>
                    </button>
                    <button type="button" onClick={onClose} className="absolute right-5 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[#8792a2] active:bg-gray-200 transition-colors" aria-label="Close">
                      <X className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="flex-1 flex flex-col px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto">
                    {/* Item identity */}
                    <ItemIdentity
                      item={selectedItem}
                      subtitle={isNewBatch ? 'New batch' : `Adding to existing batch`}
                    />

                    {/* Batch info pill (existing batch) */}
                    {!isNewBatch && selectedBatch && (
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[12px] font-medium text-[#8792a2]">
                          <Calendar className="w-3 h-3" />
                          {formatBatchExpDate(selectedBatch?.expirationDate)}
                          <span className="text-gray-300 mx-0.5">·</span>
                          {selectedBatch?.quantity || 0} in stock
                        </div>
                      </div>
                    )}

                    {/* Quantity stepper */}
                    <div className="mt-8 w-full">
                      <span className="text-[11px] font-bold text-[#8792a2] uppercase tracking-wider mb-2 block text-center">
                        How many to add?
                      </span>
                      <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200/80 h-[48px] max-w-[200px] mx-auto min-w-0">
                        <button type="button" onClick={() => setRestockQty(Math.max(1, restockQty - 1))} disabled={restockQty <= 1}
                          className="h-full w-11 shrink-0 flex items-center justify-center text-[#4f566b] active:bg-gray-100 rounded-l-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={restockQty}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            const num = parseInt(val, 10);
                            if (!isNaN(num) && num >= 1) setRestockQty(num);
                            else if (val === '') setRestockQty(1);
                          }}
                          className="w-0 flex-1 min-w-0 text-center text-[18px] font-black text-[#1a1f36] bg-transparent outline-none h-full [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                        <button type="button" onClick={() => setRestockQty(restockQty + 1)}
                          className="h-full w-11 shrink-0 flex items-center justify-center text-[#d97757] active:bg-gray-100 rounded-r-xl transition-colors"
                        >
                          <Plus className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </div>
                      {selectedItem.unit && selectedItem.unit !== 'units' && (
                        <p className="text-[12px] text-[#a3acb9] text-center mt-1.5">
                          {restockQty} {restockQty === 1 ? selectedItem.unit.replace(/s$/, '') : selectedItem.unit}
                        </p>
                      )}
                    </div>

                    {/* Expiration date — only editable for new batches */}
                    {isNewBatch && (
                      <div className="mt-6 w-full">
                        <span className="text-[11px] font-bold text-[#8792a2] uppercase tracking-wider mb-1.5 block">
                          Expiration Date
                          <span className="text-[10px] font-semibold text-[#a3acb9] ml-1.5 normal-case">Optional</span>
                        </span>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3acb9] pointer-events-none z-10" />
                          <input
                            type="date"
                            value={restockExpDate}
                            onChange={(e) => setRestockExpDate(e.target.value)}
                            className="w-full h-[48px] pl-9 pr-9 rounded-xl border border-gray-200/80 bg-gray-50 text-transparent caret-transparent outline-none focus:border-[#d97757] focus:bg-white transition-colors appearance-none box-border"
                            style={{ colorScheme: 'light' }}
                          />
                          <span className={`absolute left-9 right-9 top-1/2 -translate-y-1/2 truncate pointer-events-none text-[15px] ${restockExpDate ? 'font-semibold text-[#1a1f36]' : 'font-medium text-[#a3acb9]'}`}>
                            {restockExpDate ? formatExpDateDisplay(restockExpDate) : 'No date set'}
                          </span>
                          {restockExpDate && (
                            <button type="button" onClick={() => setRestockExpDate('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 active:bg-gray-300 transition-colors z-10">
                              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Confirm button */}
                    <button type="button" onClick={handleConfirmRestock} disabled={isSubmitting}
                      className="w-full h-[50px] rounded-2xl bg-[#d97757] text-white font-bold text-[14px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(226,127,44,0.4)] disabled:opacity-70 mt-6"
                    >
                      {isSubmitting ? (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Added!
                        </motion.div>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" strokeWidth={2.5} />
                          Add to Batch
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
