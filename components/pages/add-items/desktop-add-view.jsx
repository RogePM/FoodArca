'use client';

import React, { useState } from 'react';
import { ArrowDownToLine, ChevronDown, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { categories } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';

// --- COMPONENT: STRIPE-STYLE INLINE FORM (Left Column) ---
function DesktopInlineForm({ onAdd }) {
  const generateBarcode = () => `INT-${Math.floor(100000 + Math.random() * 900000)}`;

  const [itemName, setItemName] = useState('');
  const [barcode, setBarcode] = useState(generateBarcode());
  const [qty, setQty] = useState('');
  
  const [unit, setUnit] = useState('units');
  const [unitQuery, setUnitQuery] = useState('');
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [highlightedUnitIndex, setHighlightedUnitIndex] = useState(0);

  const [category, setCategory] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const [expiration, setExpiration] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Local errors
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!itemName || !qty || !category) {
      setError('Please fill out Name, Qty, and Category.');
      return;
    }
    setError('');

    // Send to parent cart
    onAdd({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: itemName,
      barcode: barcode,
      quantity: qty,
      unit: unit,
      category: category,
      categoryName: categoryQuery || category,
      expirationDate: expiration,
      storageLocation: location,
      notes: notes
    });

    // Instantly reset form for fast data entry
    setItemName('');
    setBarcode(generateBarcode());
    setQty('');
    setUnit('units');
    setUnitQuery('');
    setExpiration('');
    setLocation('');
    setNotes('');
    // Keep category/unit to speed up adding identical items, but clear them if preferred. Let's clear barcode/qty/name.
    document.querySelector('input[placeholder="e.g. Canned Black Beans"]')?.focus();
  };

  const handleClear = () => {
    setItemName(''); setBarcode(generateBarcode()); setQty(''); setUnit('units'); setUnitQuery(''); setExpiration(''); setLocation(''); setNotes(''); setError('');
  };

  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01-01`;

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); handleAdd(); }} 
      className="bg-white rounded-[24px] border border-gray-200 shadow-sm flex flex-col h-auto"
    >
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          Add New Item
        </h2>
        
        {error && <div className="mb-4 text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg">{error}</div>}

        {/* ROW 1: Name, Qty, Unit */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex-1">
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Item Name</label>
            <input 
              autoFocus
              className="w-full h-11 px-4 rounded-[14px] border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757] outline-none transition-all text-[15px]"
              placeholder="e.g. Canned Black Beans"
              value={itemName} onChange={(e) => setItemName(e.target.value)}
              tabIndex={1}
            />
          </div>
          <div className="w-[100px]">
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Qty</label>
            <input 
              type="number"
              className="w-full h-11 px-4 rounded-[14px] border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757] outline-none transition-all text-[15px]"
              placeholder="1.0"
              value={qty} onChange={(e) => setQty(e.target.value)}
              tabIndex={2}
            />
          </div>
          <div className="w-[100px] relative">
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Unit</label>
            <div className="relative">
              <input 
                className="w-full h-11 px-4 pr-8 rounded-[14px] border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757] outline-none transition-all text-[15px] cursor-pointer"
                placeholder="units"
                value={unitQuery} 
                onChange={(e) => {
                  setUnitQuery(e.target.value);
                  setIsUnitOpen(true);
                  setHighlightedUnitIndex(0);
                }}
                onFocus={() => {
                  setIsUnitOpen(true);
                  setHighlightedUnitIndex(0);
                }}
                onBlur={() => setTimeout(() => setIsUnitOpen(false), 200)}
                onKeyDown={(e) => {
                  if (!isUnitOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
                    e.preventDefault();
                    setIsUnitOpen(true);
                    return;
                  }
                  if (!isUnitOpen) return;
                  
                  const unitsList = ['units', 'lbs', 'oz', 'kg', 'gal', 'box', 'pack'];
                  const filtered = unitsList.filter(u => u.toLowerCase().includes(unitQuery.toLowerCase()));
                  
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedUnitIndex(prev => {
                      const next = Math.min(prev + 1, filtered.length - 1);
                      document.getElementById(`unit-item-${next}`)?.scrollIntoView({ block: 'nearest' });
                      return next;
                    });
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedUnitIndex(prev => {
                      const next = Math.max(prev - 1, 0);
                      document.getElementById(`unit-item-${next}`)?.scrollIntoView({ block: 'nearest' });
                      return next;
                    });
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filtered[highlightedUnitIndex]) {
                      setUnit(filtered[highlightedUnitIndex]);
                      setUnitQuery(filtered[highlightedUnitIndex]);
                      setIsUnitOpen(false);
                    }
                  } else if (e.key === 'Escape') {
                    setIsUnitOpen(false);
                  }
                }}
                tabIndex={3}
              />
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isUnitOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* CUSTOM UNIT DROPDOWN */}
            {isUnitOpen && (
              <div className="absolute z-50 mt-1.5 w-[140px] bg-white border border-gray-100 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-h-56 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1">
                {['units', 'lbs', 'oz', 'kg', 'gal', 'box', 'pack'].filter(u => u.toLowerCase().includes(unitQuery.toLowerCase())).length > 0 ? (
                  ['units', 'lbs', 'oz', 'kg', 'gal', 'box', 'pack'].filter(u => u.toLowerCase().includes(unitQuery.toLowerCase())).map((u, idx) => (
                    <button
                      id={`unit-item-${idx}`}
                      key={u}
                      type="button"
                      className={`w-full text-left px-4 py-2 text-[14px] font-medium transition-colors ${idx === highlightedUnitIndex ? 'bg-[#d97757]/5 text-[#d97757]' : 'text-gray-700 hover:bg-[#d97757]/5 hover:text-[#d97757]'}`}
                      onClick={() => {
                        setUnit(u);
                        setUnitQuery(u);
                        setIsUnitOpen(false);
                      }}
                      onMouseEnter={() => setHighlightedUnitIndex(idx)}
                    >
                      {u}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-[13px] text-gray-500 text-center font-medium">No units found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Barcode, Category, and Expiration */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-1/3">
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Barcode</label>
            <input 
              className="w-full h-11 px-4 rounded-[14px] border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757] outline-none transition-all text-[15px]"
              placeholder="Scan or type..."
              value={barcode} onChange={(e) => setBarcode(e.target.value)}
              tabIndex={4}
            />
          </div>

          <div className="w-1/3 relative">
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Category</label>
            <div className="relative">
              <input 
                className="w-full h-11 px-4 pr-10 rounded-[14px] border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757] outline-none transition-all text-[15px]"
                placeholder="Search category..."
                value={categoryQuery} 
                onChange={(e) => {
                  setCategoryQuery(e.target.value);
                  setIsCategoryOpen(true);
                  setHighlightedIndex(0);
                }}
                onFocus={() => {
                  setIsCategoryOpen(true);
                  setHighlightedIndex(0);
                }}
                onBlur={() => setTimeout(() => setIsCategoryOpen(false), 200)}
                onKeyDown={(e) => {
                  if (!isCategoryOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
                    e.preventDefault();
                    setIsCategoryOpen(true);
                    return;
                  }
                  if (!isCategoryOpen) return;
                  
                  const filtered = categories.filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase()));
                  
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex(prev => {
                      const next = Math.min(prev + 1, filtered.length - 1);
                      document.getElementById(`cat-item-${next}`)?.scrollIntoView({ block: 'nearest' });
                      return next;
                    });
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex(prev => {
                      const next = Math.max(prev - 1, 0);
                      document.getElementById(`cat-item-${next}`)?.scrollIntoView({ block: 'nearest' });
                      return next;
                    });
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filtered[highlightedIndex]) {
                      setCategory(filtered[highlightedIndex].value);
                      setCategoryQuery(filtered[highlightedIndex].name);
                      setIsCategoryOpen(false);
                    }
                  } else if (e.key === 'Escape') {
                    setIsCategoryOpen(false);
                  }
                }}
                tabIndex={5}
              />
              <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* CUSTOM DROPDOWN */}
            {isCategoryOpen && (
              <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-h-56 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1">
                {categories.filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase())).length > 0 ? (
                  categories.filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase())).map((c, idx) => (
                    <button
                      id={`cat-item-${idx}`}
                      key={c.value}
                      type="button"
                      className={`w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors flex items-center gap-3 ${idx === highlightedIndex ? 'bg-[#d97757]/5 text-[#d97757]' : 'text-gray-700 hover:bg-[#d97757]/5 hover:text-[#d97757]'}`}
                      onClick={() => {
                        setCategory(c.value);
                        setCategoryQuery(c.name);
                        setIsCategoryOpen(false);
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      <c.icon className={`h-4 w-4 ${idx === highlightedIndex ? 'opacity-100' : 'opacity-50'}`} strokeWidth={2} />
                      {c.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-[13px] text-gray-500 text-center font-medium">No categories found</div>
                )}
              </div>
            )}
          </div>
          <div className="w-1/3">
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Expiration Date</label>
            <input 
              type="date"
              min={minDate}
              className="w-full h-11 px-4 rounded-[14px] border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757] outline-none transition-all text-[15px] cursor-pointer text-gray-600"
              value={expiration} onChange={(e) => setExpiration(e.target.value)}
              tabIndex={6}
            />
          </div>
        </div>

        {/* TOGGLE OPTIONS */}
        <div>
           <button 
            type="button" 
            onClick={() => setShowOptions(!showOptions)} 
            className="text-[13px] font-bold text-[#d97757] hover:text-[#c06245] flex items-center gap-1 active:scale-95 transition-transform"
            tabIndex={7}
           >
             {showOptions ? 'Hide options' : 'Item options'} <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`} strokeWidth={2.5} />
           </button>
        </div>

        {/* EXPANDED OPTIONS */}
        {showOptions && (
          <div className="flex items-start gap-4 mt-5 animate-in fade-in slide-in-from-top-2 duration-200 border-t border-gray-100 pt-5">
             <div className="w-1/2">
               <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Storage Location</label>
               <input 
                 className="w-full h-11 px-4 rounded-[14px] border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757] outline-none transition-all text-[15px]" 
                 placeholder="e.g. Shelf A, Aisle 3" 
                 value={location} onChange={(e) => setLocation(e.target.value)}
                 tabIndex={8}
               />
             </div>
             <div className="w-1/2">
               <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Notes</label>
               <input 
                 className="w-full h-11 px-4 rounded-[14px] border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757] outline-none transition-all text-[15px]" 
                 placeholder="Optional notes" 
                 value={notes} onChange={(e) => setNotes(e.target.value)}
                 tabIndex={9}
               />
             </div>
          </div>
        )}

      </div>
      
      {/* FOOTER ACTIONS */}
      <div className="bg-gray-50/50 p-4 sm:px-8 flex items-center justify-end gap-3 border-t border-gray-100 shrink-0 rounded-b-[24px]">
        <button type="button" onClick={handleClear} tabIndex={12} className="text-[13px] font-bold text-gray-500 hover:text-gray-900 px-4 py-2.5 transition-colors">Cancel</button>
        <button type="submit" tabIndex={10} className="text-[13px] font-bold text-white bg-[#d97757] hover:bg-[#c06245] px-5 py-2.5 rounded-[12px] shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Add to list 
          <span className="bg-white/20 text-white/90 text-[9px] px-1.5 py-0.5 rounded-[4px] font-mono tracking-widest hidden sm:inline-block">enter</span>
        </button>
      </div>
    </form>
  );
}

// --- COMPONENT: BATCH SUMMARY (Right Column) ---
function BatchSummarySidebar({ items, onRemove, onUpdateQty, onSubmit, isSubmitting, error, success }) {
  return (
    <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm flex flex-col min-h-[500px] max-h-[calc(100vh-100px)] overflow-hidden">
      
      {/* HEADER */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-bold text-gray-900 text-[16px]">Items to Add</h3>
          <p className="text-[12px] text-gray-500 mt-0.5">Review before submitting</p>
        </div>
        <div className="bg-[#d97757]/10 text-[#d97757] font-semibold text-[13px] px-3 py-1 rounded-full">
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </div>
      </div>

      {/* ERROR & SUCCESS MESSAGES */}
      {error && <div className="mx-5 mt-5 p-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg">{error}</div>}
      {success && <div className="mx-5 mt-5 p-3 text-sm font-medium text-green-700 bg-green-50 rounded-lg flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/> {success}</div>}

      {/* CART ITEMS LIST */}
      <div className="flex-1 overflow-y-auto p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
             <ArrowDownToLine className="h-8 w-8 opacity-50" />
             <p className="text-sm font-medium">Cart is empty</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white sticky top-0 border-b border-gray-100 shadow-[0_2px_4px_-4px_rgba(0,0,0,0.1)]">
                <th className="px-5 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-5 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider w-20 text-right">Qty</th>
                <th className="px-5 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 group transition-colors">
                  <td className="px-5 py-3 align-middle">
                    <h4 className="font-medium text-gray-900 text-[13px] leading-tight">{item.name}</h4>
                    <span className="text-[11px] text-gray-400 leading-tight mt-0.5 block">{item.categoryName}</span>
                  </td>
                  <td className="px-5 py-3 align-middle text-right">
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => onUpdateQty(item.id, e.target.value)}
                      className="w-16 h-8 px-2 text-center text-[13px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757] outline-none transition-all"
                    />
                  </td>
                  <td className="px-5 py-3 align-middle text-right">
                    <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FOOTER: ACTIONS */}
      <div className="p-5 border-t border-gray-100 bg-gray-50/50 shrink-0 space-y-4">
        
        {/* Action Buttons */}
        <div className="space-y-2">
          <button 
            disabled={items.length === 0 || isSubmitting}
            onClick={onSubmit}
            className="w-full text-[14px] font-bold text-white bg-[#d97757] hover:bg-[#c06245] py-3 rounded-[12px] shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Items"}
          </button>
        </div>

      </div>
    </div>
  );
}

// --- MAIN PAGE LAYOUT ---
export function DesktopAddView() {
  const { pantryId } = usePantry();

  const [cartItems, setCartItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddItem = (item) => {
    setCartItems(prev => [...prev, item]);
    setSuccess('');
    setError('');
  };

  const handleRemoveItem = (id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateQty = (id, newQty) => {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
  };

  const handleSubmitBatch = async () => {
    if (cartItems.length === 0) return;
    if (!pantryId) {
      setError('No active pantry selected.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/foods/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pantry-id': pantryId
        },
        body: JSON.stringify({ items: cartItems })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to submit batch');
      }

      setSuccess(`Successfully added ${cartItems.length} items to inventory!`);
      setCartItems([]); // Clear cart only on success
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#f7f7f5]">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* 2-COLUMN SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: ENTRY FORM */}
          <div className="lg:col-span-2">
            <DesktopInlineForm onAdd={handleAddItem} />
          </div>

          {/* RIGHT: BATCH SUMMARY */}
          <div className="lg:col-span-1 h-fit max-h-[calc(100vh-100px)] sticky top-6">
            <BatchSummarySidebar 
              items={cartItems} 
              onRemove={handleRemoveItem} 
              onUpdateQty={handleUpdateQty} 
              onSubmit={handleSubmitBatch} 
              isSubmitting={isSubmitting}
              error={error}
              success={success}
            />
          </div>

        </div>

      </div>
    </div>
  );
}