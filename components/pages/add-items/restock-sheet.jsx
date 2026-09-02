'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Package,
  Layers,
  Loader2,
  Plus,
  Minus,
  Calendar,
  ChevronLeft,
  RotateCcw,
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

/**
 * RestockSheet — Two-mode slide-up sheet for restocking inventory.
 *
 * Mode 1: BROWSE — searchable grid of existing inventory items
 * Mode 2: RESTOCK — compact form (qty + expiration) for the selected item
 *
 * Props:
 *   isOpen          — controls visibility
 *   onClose         — called when user dismisses the sheet
 *   onRestockItem   — (item) => void — called when user confirms a restock
 */
export function RestockSheet({ isOpen, onClose, onRestockItem }) {
  const { pantryId } = usePantry();

  // ---------- Internal mode state ----------
  const [mode, setMode] = useState('BROWSE'); // 'BROWSE' | 'RESTOCK'
  const [selectedItem, setSelectedItem] = useState(null);

  // ---------- BROWSE state ----------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dictionaryItems, setDictionaryItems] = useState([]);
  const [isLoadingDictionary, setIsLoadingDictionary] = useState(false);

  // ---------- RESTOCK state ----------
  const [restockQty, setRestockQty] = useState(1);
  const [restockExpDate, setRestockExpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dateInputRef = useRef(null);

  // Fetch local inventory dictionary on mount
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
    return () => { isMounted = false; };
  }, [pantryId]);

  // Reset everything when sheet opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode('BROWSE');
      setSelectedItem(null);
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
      }));
    }
    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [dictionaryItems]);

  const filterPillList = useMemo(() => {
    const list = [
      { id: 'all', name: 'All', count: combinedProducts.length },
    ];
    categories.forEach((cat) => {
      const count = combinedProducts.filter((p) =>
        matchesCategoryFilter(p.category, cat.value)
      ).length;
      if (count > 0) {
        list.push({ id: cat.value, name: cat.name, count });
      }
    });
    return list;
  }, [combinedProducts]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return combinedProducts.filter((product) => {
      if (selectedCategory !== 'all') {
        if (!matchesCategoryFilter(product.category, selectedCategory)) {
          return false;
        }
      }
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
    setMode('RESTOCK');
  };

  const handleBackToBrowse = () => {
    setMode('BROWSE');
    setSelectedItem(null);
    setRestockQty(1);
    setRestockExpDate('');
    setIsSubmitting(false);
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
    };

    if (onRestockItem) onRestockItem(restockedItem);

    // Brief success flash, then back to browse for bulk restocking
    setTimeout(() => {
      setIsSubmitting(false);
      handleBackToBrowse();
    }, 600);
  };

  // ---------- Render ----------
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col justify-end"
          style={{ isolation: 'isolate' }}
        >
          {/* BACKDROP SCRIM */}
          <motion.div
            key="restock-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* SLIDE-UP SHEET */}
          <motion.div
            key="restock-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[92dvh] h-[88dvh] w-full overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {mode === 'BROWSE' ? (
                <motion.div
                  key="browse-mode"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  {/* ===== BROWSE HEADER ===== */}
                  <div className="relative flex items-center justify-center pt-4 pb-3.5 shrink-0">
                    <h2 className="text-[17px] font-medium text-[#1a1f36] tracking-tight">
                      Restock Inventory
                    </h2>
                    <button
                      type="button"
                      onClick={onClose}
                      className="absolute right-5 text-[#e27f2c] hover:text-[#c66a1a] active:scale-95 transition-all p-1"
                      aria-label="Close"
                    >
                      <X className="w-6 h-6" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* SEARCH INPUT */}
                  <div className="px-5 pt-1 pb-2 shrink-0">
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search items to restock..."
                        className="w-full h-[42px] pl-11 pr-10 bg-white border border-gray-300 rounded-full text-[16px] font-normal text-[#1a1f36] placeholder-gray-500 focus:outline-none focus:border-[#e27f2c] transition-colors"
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

                  {/* FILTER PILLS */}
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
                                ? 'bg-[#fff7f0] border-[#e27f2c]/40 text-[#e27f2c] shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pill.name}
                            <span
                              className={`ml-1.5 text-[11px] font-medium ${
                                isActive ? 'text-[#e27f2c]/70' : 'text-gray-400'
                              }`}
                            >
                              {pill.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* PRODUCT GRID */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                    {isLoadingDictionary && filteredProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 className="w-8 h-8 text-[#e27f2c] animate-spin mb-3" />
                        <p className="text-[13px] font-normal text-gray-400">Loading inventory items...</p>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#fff7f0] border border-[#e27f2c]/10 flex items-center justify-center mb-4">
                          <Package className="h-7 w-7 text-[#e27f2c]/60" />
                        </div>
                        <h3 className="text-[16px] font-medium text-[#1a1f36] mb-1">
                          No matching items
                        </h3>
                        <p className="text-[13px] font-normal text-gray-400 max-w-xs mb-5">
                          {searchQuery || selectedCategory !== 'all'
                            ? 'Try adjusting your search or filter.'
                            : 'Your inventory is empty. Add items first.'}
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

                          return (
                            <div
                              key={product.catalogItemId || product.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleSelectItem(product)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSelectItem(product);
                                }
                              }}
                              className="bg-white border border-gray-200 hover:border-[#e27f2c]/40 active:border-[#e27f2c] rounded-lg p-3 flex flex-col text-center transition-all active:scale-[0.98] shadow-sm group relative cursor-pointer"
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

                                {/* Stock badge */}
                                {product.totalQuantity > 0 && (
                                  <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md text-[#1a1f36] text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-100 shadow-xs flex items-center gap-1">
                                    <Package className="w-2.5 h-2.5 text-[#e27f2c]" />
                                    <span>{product.totalQuantity} in stock</span>
                                  </div>
                                )}
                              </div>

                              {/* Product Name */}
                              <h4 className="text-[14px] font-medium text-[#1a1f36] text-center leading-snug line-clamp-2 mt-0.5 mb-2.5 flex-1">
                                {product.name}
                              </h4>

                              {/* Restock Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectItem(product);
                                }}
                                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-[#e27f2c] text-white text-[13px] font-semibold hover:bg-[#c66a1a] transition-all active:scale-95 shadow-sm mt-auto"
                              >
                                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
                                Restock
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="restock-mode"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  {/* ===== RESTOCK HEADER ===== */}
                  <div className="relative flex items-center pt-4 pb-3.5 px-5 shrink-0">
                    <button
                      type="button"
                      onClick={handleBackToBrowse}
                      className="flex items-center gap-1 text-[#e27f2c] active:scale-95 transition-all p-1 -ml-1"
                      aria-label="Back to items"
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                      <span className="text-[14px] font-medium">Items</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="absolute right-5 text-gray-400 hover:text-gray-600 active:scale-95 transition-all p-1"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* ===== RESTOCK FORM ===== */}
                  <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                    {selectedItem && (
                      <>
                        {/* Item identity — read only */}
                        <div className="flex flex-col items-center mb-8">
                          {selectedItem.photoUrl ? (
                            <img
                              src={selectedItem.photoUrl}
                              alt={selectedItem.name}
                              className="w-24 h-24 rounded-2xl object-cover border border-gray-100 shadow-sm mb-4"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-2xl bg-[#fff7f0] border border-[#e27f2c]/10 flex items-center justify-center mb-4">
                              {(() => {
                                const catVisual = getCategoryVisual(selectedItem.category);
                                return (
                                  <img 
                                    src={catVisual.imagePath} 
                                    alt={catVisual.name}
                                    className="w-16 h-16 object-contain mix-blend-multiply"
                                  />
                                );
                              })()}
                            </div>
                          )}
                          <h3 className="text-[20px] font-semibold text-[#1a1f36] text-center leading-tight mb-1">
                            {selectedItem.name}
                          </h3>
                          <span className="text-[13px] font-normal text-gray-400">
                            {getCategoryName(selectedItem.category)}
                            {selectedItem.totalQuantity > 0 && ` · ${selectedItem.totalQuantity} in stock`}
                          </span>
                        </div>

                        {/* Quantity stepper */}
                        <div className="w-full max-w-[280px] mb-6">
                          <label className="text-[12px] font-bold text-[#8792a2] uppercase tracking-wider mb-2 block text-center">
                            How many to add?
                          </label>
                          <div className="flex items-center justify-center gap-4">
                            <button
                              type="button"
                              onClick={() => setRestockQty(Math.max(1, restockQty - 1))}
                              disabled={restockQty <= 1}
                              className="w-12 h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-[#1a1f36] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                            <input
                              type="number"
                              inputMode="numeric"
                              min="1"
                              value={restockQty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val >= 1) setRestockQty(val);
                              }}
                              className="w-20 h-14 text-center text-[28px] font-bold text-[#1a1f36] border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#e27f2c] transition-colors appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                            <button
                              type="button"
                              onClick={() => setRestockQty(restockQty + 1)}
                              className="w-12 h-12 rounded-xl border border-[#e27f2c]/30 bg-[#fff7f0] flex items-center justify-center text-[#e27f2c] active:scale-95 transition-all"
                            >
                              <Plus className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                          </div>
                          {selectedItem.unit && selectedItem.unit !== 'units' && (
                            <p className="text-[12px] text-gray-400 text-center mt-1.5">
                              {restockQty} {restockQty === 1 ? selectedItem.unit.replace(/s$/, '') : selectedItem.unit}
                            </p>
                          )}
                        </div>

                        {/* Expiration date */}
                        <div className="w-full max-w-[280px] mb-8">
                          <label className="text-[12px] font-bold text-[#8792a2] uppercase tracking-wider mb-2 block text-center">
                            Expiration Date
                            <span className="text-[10px] font-semibold text-[#a3acb9] ml-1.5">OPTIONAL</span>
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                            <input
                              ref={dateInputRef}
                              type="date"
                              value={restockExpDate}
                              onChange={(e) => setRestockExpDate(e.target.value)}
                              className="w-full h-[48px] pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-transparent caret-transparent outline-none focus:border-[#e27f2c] focus:bg-white transition-colors appearance-none box-border"
                              style={{ colorScheme: 'light' }}
                            />
                            <span className={`absolute left-10 right-4 top-1/2 -translate-y-1/2 truncate pointer-events-none text-[15px] ${restockExpDate ? 'font-semibold text-[#1a1f36]' : 'font-medium text-[#a3acb9]'}`}>
                              {restockExpDate ? formatExpDateDisplay(restockExpDate) : 'Tap to set date'}
                            </span>
                          </div>
                          {restockExpDate && (
                            <button
                              type="button"
                              onClick={() => setRestockExpDate('')}
                              className="mt-2 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors mx-auto block"
                            >
                              Clear date
                            </button>
                          )}
                        </div>

                        {/* Restock confirm button */}
                        <div className="w-full max-w-[280px] mt-auto">
                          <button
                            type="button"
                            onClick={handleConfirmRestock}
                            disabled={isSubmitting}
                            className="w-full h-[52px] rounded-2xl bg-[#e27f2c] text-white font-bold text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(226,127,44,0.45)] disabled:opacity-70"
                          >
                            {isSubmitting ? (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-2"
                              >
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Added!
                              </motion.div>
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
                                Restock +{restockQty}
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
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
