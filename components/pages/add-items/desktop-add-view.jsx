'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowDownToLine, ChevronDown, Plus, Trash2, Loader2, CheckCircle2, 
  Search, Sparkles, Calendar, Gift, ShoppingBag, 
  Landmark, HeartHandshake, AlertCircle, Minus, Package, Barcode,
  ArrowLeft, ArrowRight, Check
} from 'lucide-react';
import { categories } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';

// --- HELPER: GET CATEGORY ICON & COLOR ---
function getCategoryMeta(catName) {
  const safeStr = String(catName || '').toLowerCase();
  const found = categories.find(c => c.name.toLowerCase() === safeStr || c.value.toLowerCase() === safeStr);
  if (found) return { icon: found.icon, name: found.name, value: found.value };
  return { icon: Package, name: String(catName || 'Other'), value: 'other' };
}

// --- COMPONENT: 2-STEP TYPEFORM INTAKE TERMINAL ---
function DesktopInlineForm({ onAdd, pantryId, onPulseChange }) {
  const generateBarcode = () => `INT-${Math.floor(100000 + Math.random() * 900000)}`;

  // Wizard Step State
  const [step, setStep] = useState(1); // 1 = Catalog Specs, 2 = Batch & Source

  // Step 1: Barcode & Item Catalog Definition
  const [barcode, setBarcode] = useState(generateBarcode());
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('canned_goods');
  const [categoryQuery, setCategoryQuery] = useState('Canned Goods');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupSource, setLookupSource] = useState(null);

  // Unit Size / Weight per unit ("Each one is *")
  const [weightPerUnit, setWeightPerUnit] = useState('1');
  const [unit, setUnit] = useState('units');

  // Step 2: Batch Quantity, Expiration & Source
  const [qty, setQty] = useState('1');
  const [expiration, setExpiration] = useState('');
  const [expirationPrecision, setExpirationPrecision] = useState('day'); // 'day', 'month', 'none'
  const [sourceType, setSourceType] = useState('donation'); // 'donation', 'purchased', 'usda', 'retail_rescue'
  const [donorName, setDonorName] = useState('');

  // Local state
  const [error, setError] = useState('');
  const [isAddedPulse, setIsAddedPulse] = useState(false);

  // Barcode Debounce Ref
  const barcodeTimerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(barcodeTimerRef.current);
  }, []);

  // Idiomatic React focus management between wizard steps
  useEffect(() => {
    if (step === 2) {
      document.getElementById('intake-qty')?.focus();
    }
  }, [step]);

  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01-01`;

  const catMeta = getCategoryMeta(categoryQuery || category);
  const CategoryIcon = catMeta.icon;

  // Barcode Lookup Handler
  const handleBarcodeLookup = async (codeToSearch) => {
    const code = (codeToSearch || barcode || '').trim();
    if (!code || !pantryId) return;
    
    setIsLookingUp(true);
    setError('');
    setLookupSource(null);

    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`, {
        headers: { 'x-pantry-id': pantryId }
      });
      if (res.ok) {
        const result = await res.json();
        if (result && result.found && result.data) {
          const d = result.data;
          if (d.name) setItemName(d.name);
          if (d.category) {
            const meta = getCategoryMeta(d.category);
            setCategory(meta.value);
            setCategoryQuery(meta.name);
          }
          if (d.unit) {
            setUnit(d.unit);
          }
          if (d.weightPerUnit) setWeightPerUnit(String(d.weightPerUnit));
          if (d.photoUrl) setPhotoUrl(d.photoUrl);
          setLookupSource(result.source || 'catalog');
          
          // Auto-advance focus to item name or weight after successful lookup
          setTimeout(() => {
            if (!d.name) document.getElementById('intake-item-name')?.focus();
            else document.getElementById('intake-weight')?.focus();
          }, 100);
        }
      }
    } catch (err) {
      console.warn('Barcode lookup error:', err);
    } finally {
      setIsLookingUp(false);
    }
  };

  const triggerLookup = (code) => {
    clearTimeout(barcodeTimerRef.current);
    handleBarcodeLookup(code);
  };

  // Step 1 -> Step 2 Validation
  const handleNextStep = () => {
    if (!itemName.trim()) {
      setError('Please enter an Item Name before proceeding.');
      document.getElementById('intake-item-name')?.focus();
      return;
    }
    const numW = parseFloat(weightPerUnit);
    if (isNaN(numW) || numW <= 0) {
      setError('Please enter a valid weight/size per unit.');
      document.getElementById('intake-weight')?.focus();
      return;
    }
    setError('');
    setStep(2);
  };

  // Submit Batch Item to Cart
  const handleAdd = () => {
    if (!qty) {
      setError('Please specify the batch quantity.');
      return;
    }
    const numQty = parseFloat(qty);
    if (isNaN(numQty) || numQty <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }
    if (expirationPrecision !== 'none' && !expiration) {
      setError('Please select an expiration date or choose "No Date".');
      document.getElementById('intake-expiration')?.focus();
      return;
    }
    setError('');

    onAdd({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: itemName,
      barcode: barcode.trim() || generateBarcode(),
      quantity: qty,
      unit: unit || 'units',
      category: category || 'other',
      categoryName: categoryQuery || catMeta.name || 'Other',
      expirationDate: expirationPrecision === 'none' ? null : (expiration || null),
      expirationPrecision: expirationPrecision,
      sourceType: sourceType || 'donation',
      donorName: donorName.trim() || null,
      photoUrl: photoUrl || null,
      weightPerUnit: Number(weightPerUnit || 1)
    });

    // Celebratory pulse on item addition
    setIsAddedPulse(true);
    if (onPulseChange) onPulseChange(true);
    setTimeout(() => {
      setIsAddedPulse(false);
      if (onPulseChange) onPulseChange(false);
    }, 2500);

    // Reset fields for fast sequential intake while preserving source/donor settings
    setItemName('');
    setBarcode(generateBarcode());
    setQty('1');
    setPhotoUrl(null);
    setLookupSource(null);
    setExpiration('');
    setError('');
    setStep(1); // Return to Step 1 for next item!
  };

  const handleClear = () => {
    setItemName('');
    setBarcode(generateBarcode());
    setQty('1');
    setWeightPerUnit('1');
    setUnit('units');
    setCategory('canned_goods');
    setCategoryQuery('Canned Goods');
    setExpiration('');
    setExpirationPrecision('day');
    setPhotoUrl(null);
    setLookupSource(null);
    setDonorName('');
    setError('');
    setIsAddedPulse(false);
    if (onPulseChange) onPulseChange(false);
    setStep(1);
  };

  // Calculate live weight math for Step 2 badge
  const calcTotalWeightLbs = () => {
    const q = parseFloat(qty) || 0;
    const numW = parseFloat(weightPerUnit);
    const w = (!isNaN(numW) && weightPerUnit !== '') ? numW : 1;
    if (unit === 'lbs') return q * w;
    if (unit === 'oz' || unit === 'fl oz') return (q * w) / 16;
    if (unit === 'kg') return (q * w) * 2.20462;
    if (unit === 'g') return (q * w) * 0.00220462;
    if (unit === 'mg') return (q * w) * 0.00000220462;
    return q * w;
  };

  // Checkmark completion helpers
  const isStep1NameValid = itemName.trim().length > 0;
  const isStep1CatValid = Boolean(category && category !== 'General');
  const isStep1WeightValid = parseFloat(weightPerUnit) > 0;
  const isStep2QtyValid = parseFloat(qty) > 0;
  const isStep2ExpValid = expirationPrecision === 'none' || Boolean(expiration);

  return (
    <div className="bg-white rounded-[28px] border border-gray-200/80 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden transition-all duration-300">
      
      {/* TYPEFORM HEADER: PROGRESS & STEP STATUS */}
      <div className="p-6 bg-gradient-to-r from-[#faf8f6] via-white to-[#faf8f6] border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {step === 2 && (
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all shrink-0"
              title="Back to Step 1"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#c06245]">
                Step {step} of 2
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-bold text-gray-600">
                {step === 1 ? 'Catalog Item Definition' : 'Batch Quantity & Source'}
              </span>
            </div>
            {/* Smooth Progress Bar */}
            <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#d97757] to-[#c06245] transition-all duration-500 ease-out rounded-full" 
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>
        </div>

        <button 
          type="button" 
          onClick={handleClear} 
          className="text-xs font-bold text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-6 p-4 text-sm text-red-600 font-semibold bg-red-50/90 border border-red-200/80 rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" /> {error}
        </div>
      )}

      {isAddedPulse && (
        <div className="mx-6 mt-6 p-4 text-sm text-green-800 font-bold bg-green-50/90 border border-green-200/80 rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <span>✨ Item added to Self-Checkout Cart! Ready for next scan or manual entry.</span>
        </div>
      )}

      {/* =========================================================================
          STEP 1 OF 2: CATALOG ITEM DEFINITION ("What are we adding?")
         ========================================================================= */}
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="flex flex-col flex-1 animate-in slide-in-from-left-8 fade-in duration-300">
          <div className="p-8 space-y-7">
            
            {/* Barcode & Photo Lookup (Typeform Auto-Lookup & Pulse) */}
            <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="intake-barcode" className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Barcode className="h-3.5 w-3.5 text-[#c06245]" /> Barcode / UPC (Optional)
                </label>
                {lookupSource && (
                  <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Found in {lookupSource === 'openfoodfacts' ? 'OpenFoodFacts' : 'Catalog'}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    id="intake-barcode"
                    type="text"
                    onFocus={(e) => e.target.select()}
                    onPaste={(e) => {
                      const pasted = e.clipboardData?.getData('text');
                      if (pasted && pasted.trim().length >= 4) {
                        clearTimeout(barcodeTimerRef.current);
                        barcodeTimerRef.current = setTimeout(() => triggerLookup(pasted.trim()), 50);
                      }
                    }}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/15 outline-none transition-all text-sm font-mono text-gray-800 font-medium shadow-sm"
                    placeholder="Scan barcode or paste UPC..."
                    value={barcode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBarcode(val);
                      if (val.trim().length >= 8 && !val.startsWith('INT-')) {
                        clearTimeout(barcodeTimerRef.current);
                        barcodeTimerRef.current = setTimeout(() => triggerLookup(val.trim()), 350);
                      }
                    }}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') { 
                        e.preventDefault(); 
                        triggerLookup(barcode); 
                      } 
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleBarcodeLookup(barcode)}
                  disabled={isLookingUp}
                  className="h-11 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-sm disabled:opacity-50"
                >
                  {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  <span>Lookup</span>
                </button>
              </div>
            </div>

            {/* Product Photo & Name Row */}
            <div className="flex items-start gap-5">
              {/* Thumbnail Card */}
              <div className="w-20 h-20 rounded-2xl border-2 border-gray-200/80 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {photoUrl ? (
                  <img src={photoUrl} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 gap-1 p-1 text-center">
                    <CategoryIcon className="h-7 w-7 text-[#c06245]" strokeWidth={1.8} />
                    <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-tighter truncate max-w-[64px]">
                      {catMeta.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Item Name Input (With Inline ✓ Checkmark) */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="intake-item-name" className="block text-sm font-extrabold text-gray-900 tracking-tight">
                    1. What is the item name? <span className="text-[#c06245]">*</span>
                  </label>
                  {isStep1NameValid && <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in-50" />}
                </div>
                <input 
                  id="intake-item-name"
                  required
                  aria-required="true"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  className="w-full h-13 px-4 rounded-2xl border-2 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#d97757] focus:ring-4 focus:ring-[#d97757]/10 outline-none transition-all text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal shadow-sm"
                  placeholder="e.g. Tomato sauce, 24 oz jar"
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)}
                />
                <p className="text-xs text-gray-400 font-medium pl-1">
                  This name will be saved to your pantry catalog.
                </p>
              </div>
            </div>

            {/* Category Selector (With Inline ✓ Checkmark & Auto-advance) */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label htmlFor="intake-category" className="block text-sm font-extrabold text-gray-900 tracking-tight">
                  2. Which category does it belong to? <span className="text-[#c06245]">*</span>
                </label>
                {isStep1CatValid && <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in-50" />}
              </div>
              <div className="relative">
                <input 
                  id="intake-category"
                  className="w-full h-12 px-4 pr-10 rounded-2xl border-2 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#d97757] focus:ring-4 focus:ring-[#d97757]/10 outline-none transition-all text-sm font-bold text-gray-800 cursor-pointer shadow-sm"
                  placeholder="Select category..."
                  value={categoryQuery} 
                  onChange={(e) => {
                    setCategoryQuery(e.target.value);
                    setIsCategoryOpen(true);
                    setHighlightedIndex(0);
                  }}
                  onFocus={(e) => { 
                    e.target.select(); 
                    setIsCategoryOpen(true); 
                    setHighlightedIndex(0); 
                    // Reset filter so full list shows when clicking a pre-filled field
                    setCategoryQuery('');
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsCategoryOpen(false);
                      const matched = categories.find(c => c.name.toLowerCase() === categoryQuery.trim().toLowerCase());
                      if (matched) {
                        setCategory(matched.value);
                        setCategoryQuery(matched.name);
                      } else {
                        // Restore previous valid value if nothing matches
                        const prev = categories.find(c => c.value === category);
                        setCategoryQuery(prev ? prev.name : 'Other');
                      }
                    }, 200);
                  }}
                  onKeyDown={(e) => {
                    if (!isCategoryOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
                      e.preventDefault();
                      setCategoryQuery('');
                      setIsCategoryOpen(true);
                      return;
                    }
                    if (!isCategoryOpen) return;
                    const filtered = categories.filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase()));
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIndex(prev => Math.min(prev + 1, filtered.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedIndex(prev => Math.max(prev - 1, 0));
                    } else if (e.key === 'Enter' && filtered[highlightedIndex]) {
                      e.preventDefault();
                      const chosen = filtered[highlightedIndex];
                      setCategory(chosen.value);
                      setCategoryQuery(chosen.name);
                      setIsCategoryOpen(false);
                      setTimeout(() => document.getElementById('intake-weight')?.focus(), 50);
                    } else if (e.key === 'Escape') {
                      setIsCategoryOpen(false);
                      const prev = categories.find(c => c.value === category);
                      setCategoryQuery(prev ? prev.name : 'Other');
                    }
                  }}
                />
                {/* Clickable chevron to toggle dropdown */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    setCategoryQuery('');
                    setIsCategoryOpen(prev => !prev);
                    setHighlightedIndex(0);
                    document.getElementById('intake-category')?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown */}
              {isCategoryOpen && (
                <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-1">
                  {categories.filter(c => !categoryQuery || c.name.toLowerCase().includes(categoryQuery.toLowerCase())).map((c, idx) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-3 ${idx === highlightedIndex ? 'bg-[#d97757]/10 text-[#d97757]' : 'text-gray-700 hover:bg-[#d97757]/5 hover:text-[#d97757]'}`}
                      onClick={() => {
                        setCategory(c.value);
                        setCategoryQuery(c.name);
                        setIsCategoryOpen(false);
                        setTimeout(() => document.getElementById('intake-weight')?.focus(), 50);
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      <c.icon className="h-4 w-4 shrink-0 text-[#c06245]" strokeWidth={2} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Unit Size/Weight AND 4. Quantity (Split into 2 Columns on same row) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              
              {/* Left Col: Unit Size & Weight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="intake-weight" className="block text-sm font-extrabold text-gray-900 tracking-tight">
                    3. Each unit is size/weight: <span className="text-[#c06245]">*</span>
                  </label>
                  {isStep1WeightValid && <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in-50" />}
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  {/* Value input */}
                  <div className="relative shrink-0 w-24">
                    <input 
                      id="intake-weight"
                      type="number"
                      step="any"
                      required
                      aria-required="true"
                      onFocus={(e) => e.target.select()}
                      className="w-full h-10 px-3 pr-8 rounded-xl border-2 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/10 outline-none transition-all text-sm font-extrabold text-gray-900 shadow-sm"
                      placeholder="16"
                      value={weightPerUnit} 
                      onChange={(e) => setWeightPerUnit(e.target.value)}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase pointer-events-none">
                      {unit}
                    </span>
                  </div>

                  {/* Main chips: oz, lbs, units */}
                  {['oz', 'lbs', 'units'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => {
                        setUnit(u);
                        setTimeout(() => document.getElementById('intake-weight')?.focus(), 50);
                      }}
                      className={`h-10 px-3 rounded-xl text-xs font-extrabold transition-all border-2 flex items-center justify-center whitespace-nowrap ${
                        unit === u
                          ? 'bg-[#2b2b2b] text-white border-[#2b2b2b] shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {u}
                    </button>
                  ))}

                  {/* Small 'More' dropdown box */}
                  <div className="relative inline-block">
                    <select
                      aria-label="More measurement units"
                      value={['oz', 'lbs', 'units'].includes(unit) ? '' : unit}
                      onChange={(e) => {
                        if (e.target.value) setUnit(e.target.value);
                      }}
                      className={`h-10 px-2.5 pr-7 rounded-xl text-xs font-extrabold transition-all border-2 appearance-none cursor-pointer outline-none ${
                        !['oz', 'lbs', 'units'].includes(unit)
                          ? 'bg-[#2b2b2b] text-white border-[#2b2b2b] shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <option value="" disabled>More ▾</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="gal">gal</option>
                      <option value="can">can</option>
                      <option value="box">box</option>
                      <option value="bag">bag</option>
                      <option value="jar">jar</option>
                      <option value="pack">pack</option>
                      <option value="case">case</option>
                    </select>
                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none ${
                      !['oz', 'lbs', 'units'].includes(unit) ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Right Col: Quantity Stepper */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="intake-qty-step1" className="block text-sm font-extrabold text-gray-900 tracking-tight">
                    4. How many items are you adding? <span className="text-[#c06245]">*</span>
                  </label>
                  <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in-50" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => {
                      const current = parseFloat(qty) || 1;
                      if (current > 1) setQty(String(current - 1));
                    }}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-700 transition-all active:scale-95 shrink-0"
                  >
                    <Minus className="h-4 w-4 stroke-[2.5]" />
                  </button>

                  <input 
                    id="intake-qty-step1"
                    type="number"
                    step="any"
                    required
                    aria-required="true"
                    onFocus={(e) => e.target.select()}
                    className="w-20 h-10 text-center rounded-xl border-2 border-gray-200 bg-white focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/10 outline-none transition-all text-base font-black text-gray-900 shadow-sm"
                    placeholder="1"
                    value={qty} 
                    onChange={(e) => setQty(e.target.value)}
                  />

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => {
                      const current = parseFloat(qty) || 0;
                      setQty(String(current + 1));
                    }}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-700 transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>

                  <span className="text-xs font-bold text-gray-500 ml-1">
                    {unit === 'units' ? 'items' : unit}
                  </span>
                </div>
              </div>

            </div>

            {/* Live Math Preview Badge in Step 1 */}
            <div className="bg-[#d97757]/10 border border-[#d97757]/20 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-gray-800 mt-2">
              <span className="text-[#c06245] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Est. total weight:
              </span>
              <span className="font-extrabold text-gray-900 font-mono text-sm">
                {qty || 0} × {weightPerUnit} {unit} ≈ {calcTotalWeightLbs().toFixed(1)} lbs
              </span>
            </div>

          </div>

          {/* STEP 1 FOOTER */}
          <div className="bg-gray-50/90 p-5 px-8 border-t border-gray-100 flex items-center justify-between mt-auto">
            <span className="text-xs text-gray-500 font-semibold flex items-center">
              Press <code className="bg-white text-gray-800 px-2 py-0.5 rounded-md font-mono text-xs font-extrabold border border-gray-200 mx-1">Enter</code> to continue
            </span>
            <button 
              type="submit" 
              className="h-12 px-8 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-sm shadow-lg shadow-gray-900/10 transition-all flex items-center gap-2.5 active:scale-[0.98]"
            >
              <span>Next: Set Expiration & Source</span>
              <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">⏎ Enter</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          STEP 2 OF 2: BATCH DETAILS & INTAKE SOURCE ("How many & where from?")
         ========================================================================= */}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="flex flex-col flex-1 animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="p-8 space-y-7">
            
            {/* Item Summary Pill / Banner */}
            <div className="bg-[#2b2b2b] text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Product" className="w-full h-full object-cover" />
                  ) : (
                    <CategoryIcon className="h-5 w-5 text-[#c06245]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-white truncate">{itemName}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                    <span className="bg-white/15 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      {catMeta.name}
                    </span>
                    <span>•</span>
                    <span className="font-semibold">{qty || 0} × {weightPerUnit} {unit} ≈ {calcTotalWeightLbs().toFixed(1)} lbs</span>
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="text-xs font-bold text-[#c06245] hover:underline px-2 shrink-0"
              >
                Change
              </button>
            </div>

            {/* Expiration Date — label + tabs stacked for clarity */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="intake-expiration" className="block text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                  <span>Expiration Date {expirationPrecision !== 'none' && <span className="text-[#c06245]">*</span>}</span>
                  {isStep2ExpValid && <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in-50" />}
                </label>
              </div>

              {/* Precision selector — full-width tab strip for visibility */}
              <div role="radiogroup" aria-label="Expiration precision" className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'day', label: 'Exact Date' },
                  { id: 'month', label: 'Month / Year' },
                  { id: 'none', label: 'No Date' }
                ].map((prec) => (
                  <button
                    key={prec.id}
                    type="button"
                    role="radio"
                    aria-checked={expirationPrecision === prec.id}
                    onClick={() => {
                      setExpirationPrecision(prec.id);
                      setTimeout(() => {
                        if (prec.id === 'none') document.getElementById('intake-donor')?.focus();
                        else document.getElementById('intake-expiration')?.focus();
                      }, 50);
                    }}
                    className={`py-2.5 text-xs font-extrabold rounded-xl border-2 transition-all text-center ${
                      expirationPrecision === prec.id
                        ? 'bg-[#2b2b2b] text-white border-[#2b2b2b] shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {prec.label}
                  </button>
                ))}
              </div>

              {expirationPrecision === 'none' ? (
                <div className="w-full h-11 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-xs font-bold text-green-700 gap-2">
                  <Check className="h-4 w-4" /> No expiration date required
                </div>
              ) : (
                <input 
                  id="intake-expiration"
                  type={expirationPrecision === 'month' ? 'month' : 'date'}
                  min={expirationPrecision === 'month' ? minDate.slice(0, 7) : minDate}
                  onFocus={(e) => e.target.select()}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#d97757] focus:ring-4 focus:ring-[#d97757]/10 outline-none transition-all text-sm font-bold text-gray-800 shadow-sm"
                  value={expiration} 
                  onChange={(e) => setExpiration(e.target.value)}
                />
              )}
            </div>

            {/* Intake Source & Donor (Typeform Auto-advance) */}
            <div className="space-y-3">
              <label className="block text-sm font-extrabold text-gray-900 tracking-tight">
                Intake Source & Donor <span className="text-[#c06245]">*</span>
              </label>

              {/* Segmented Source Cards */}
              <div role="radiogroup" aria-label="Intake source" className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'donation', label: 'Donation (Default)', icon: Gift },
                  { id: 'purchased', label: 'Purchased', icon: ShoppingBag },
                  { id: 'usda', label: 'USDA Commodity', icon: Landmark },
                  { id: 'retail_rescue', label: 'Retail Rescue', icon: HeartHandshake }
                ].map((s, idx) => {
                  const Icon = s.icon;
                  const isSelected = sourceType === s.id;
                  return (
                    <button
                      key={s.id}
                      id={`intake-source-${idx}`}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setSourceType(s.id);
                        setTimeout(() => document.getElementById('intake-donor')?.focus(), 50);
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-bold transition-all border-2 ${isSelected ? 'bg-orange-50/60 border-[#d97757] text-[#c06245] shadow-sm' : 'bg-gray-50/60 border-gray-200/80 text-gray-700 hover:bg-gray-100/80'}`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#c06245]' : 'text-gray-500'}`} strokeWidth={2.2} />
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Donor Name Note */}
              <div className="pt-1">
                <label htmlFor="intake-donor" className="block text-xs font-bold text-gray-600 mb-1">
                  Donor / Vendor Name (Optional)
                </label>
                <input 
                  id="intake-donor"
                  type="text"
                  onFocus={(e) => e.target.select()}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/10 outline-none transition-all text-xs font-semibold text-gray-800"
                  placeholder="e.g. St. Mary's Food Drive, Walmart Rescue #402..."
                  value={donorName} 
                  onChange={(e) => setDonorName(e.target.value)}
                />
              </div>
            </div>

          </div>

          {/* STEP 2 FOOTER */}
          <div className="bg-gray-50/90 p-5 px-8 border-t border-gray-100 flex items-center justify-between mt-auto">
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="text-xs font-extrabold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-gray-200/60 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 font-semibold hidden sm:flex items-center">
                Press <code className="bg-white text-gray-800 px-2 py-0.5 rounded-md font-mono text-xs font-extrabold border border-gray-200 mx-1">Enter</code> to add
              </span>
              <button 
                type="submit" 
                className="h-12 px-8 rounded-2xl bg-gradient-to-r from-[#d97757] to-[#c06245] hover:from-[#c06245] hover:to-[#a85238] text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2.5 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>+ Add to Self-Checkout Cart</span>
                <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">⏎ Enter</span>
              </button>
            </div>
          </div>
        </form>
      )}

    </div>
  );
}

// --- COMPONENT: SELF-CHECKOUT LIVE CART RECEIPT TABLE (Collapsible POS Terminal) ---
function BatchSummarySidebar({ items, onRemove, onUpdateQty, onSubmit, isSubmitting, error, success, isExpanded, onToggleExpand, isAddedPulse }) {
  // Listen for Escape key to close drawer when expanded
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        onToggleExpand();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, onToggleExpand]);

  // Calculate estimated total weight
  const totalWeightLbs = items.reduce((acc, item) => {
    const q = parseFloat(item.quantity) || 0;
    const numW = parseFloat(item.weightPerUnit);
    const w = (!isNaN(numW) && item.weightPerUnit !== '') ? numW : 1;
    if (item.unit === 'lbs') return acc + (q * w);
    if (item.unit === 'oz' || item.unit === 'fl oz') return acc + ((q * w) / 16);
    if (item.unit === 'kg') return acc + (q * w * 2.20462);
    if (item.unit === 'g') return acc + (q * w * 0.00220462);
    if (item.unit === 'mg') return acc + (q * w * 0.00000220462);
    return acc + (q * w);
  }, 0).toFixed(1);

  const totalUnits = items.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0), 0);

  // --- COLLAPSED VIEW (Slim Vertical Strip) ---
  const renderCollapsedView = () => (
    <div className={`bg-white rounded-[24px] border border-gray-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between min-h-[560px] max-h-[calc(100vh-80px)] overflow-hidden transition-all duration-500 ${isAddedPulse ? 'ring-4 ring-[#d97757]/60 shadow-xl' : ''}`}>
      
      {/* Compact Header — Expand button on left so it expands leftward */}
      <div className="p-4 bg-[#2b2b2b] text-white border-b border-gray-800 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleExpand}
          className="text-xs font-bold text-[#d97757] hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 shrink-0"
          title="Expand Cart"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-90" />
          <span>Expand</span>
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <ShoppingBag className="h-4 w-4 text-[#d97757]" />
          <span className="font-bold text-sm">Cart ({items.length})</span>
        </div>
      </div>

      {/* Stacked Item Chips Strip */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-gray-400 gap-2 text-center">
            <ShoppingBag className="h-8 w-8 stroke-[1.5] text-gray-300" />
            <p className="text-xs font-semibold text-gray-500">Cart is empty</p>
            <p className="text-[10px] text-gray-400">Scanned items appear here</p>
          </div>
        ) : (
          items.map((item) => {
            const catMeta = getCategoryMeta(item.categoryName || item.category);
            const Icon = catMeta.icon;
            return (
              <div key={item.id} className="bg-gray-50 hover:bg-orange-50/40 border border-gray-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="h-4 w-4 text-[#d97757]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-xs truncate leading-tight">{item.name}</h4>
                    <span className="text-[10px] font-semibold text-gray-500 block truncate mt-0.5">
                      {item.quantity} × {item.weightPerUnit} {item.unit === 'units' ? 'items' : item.unit}
                    </span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => onRemove(item.id)} 
                  className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                  title="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Pinned Stats Bar & Submit Button */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 space-y-3">
        <div className="flex items-center justify-between text-xs font-extrabold text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-sm">
          <span>{items.length} items ({totalUnits} units)</span>
          <span className="text-[#d97757] font-black">{totalWeightLbs} lbs</span>
        </div>
        
        <button 
          type="button"
          disabled={items.length === 0 || isSubmitting}
          onClick={onSubmit}
          className="w-full h-12 text-xs font-extrabold text-white bg-[#2b2b2b] hover:bg-[#1a1a1a] rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#d97757]" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-[#d97757]" />
              <span>Submit Batch ({items.length})</span>
            </>
          )}
        </button>
      </div>

    </div>
  );

  // --- EXPANDED VIEW (Full Receipt Review Table - 6 Cols) ---
  const renderExpandedView = (isDrawer = false) => (
    <div className={`bg-white ${isDrawer ? 'h-full max-h-screen rounded-none sm:rounded-l-[24px] border-l border-gray-200/80 shadow-2xl' : 'rounded-[24px] border border-gray-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] min-h-[560px] max-h-[calc(100vh-80px)]'} flex flex-col justify-between overflow-hidden transition-all duration-500 ${isAddedPulse && !isDrawer ? 'ring-4 ring-[#d97757]/60 shadow-xl' : ''}`}>
      
      {/* HEADER: RECEIPT SUMMARY */}
      <div className="p-6 bg-[#2b2b2b] text-white border-b border-gray-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#d97757]" /> Self-Checkout Receipt
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Live Intake Batch Review</p>
        </div>
        
        {/* Stats Pill & Collapse Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-semibold">
            <div>
              <span className="text-gray-400 text-[10px] uppercase tracking-wider">Items </span>
              <span className="text-white font-bold">{items.length}</span>
            </div>
            <div className="h-4 w-[1px] bg-white/20" />
            <div>
              <span className="text-gray-400 text-[10px] uppercase tracking-wider">Est. Weight </span>
              <span className="text-[#d97757] font-bold">{totalWeightLbs} lbs</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleExpand}
            className="text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            title={isDrawer ? "Close Drawer" : "Collapse Cart"}
          >
            <ChevronDown className={`h-4 w-4 text-[#d97757] ${isDrawer ? '-rotate-90' : 'rotate-90'}`} />
            <span>{isDrawer ? 'Close' : 'Collapse'}</span>
          </button>
        </div>
      </div>

      {/* ERROR & SUCCESS MESSAGES */}
      {error && <div className="mx-6 mt-6 p-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0"/> {error}</div>}
      {success && <div className="mx-6 mt-6 p-4 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0"/> {success}</div>}

      {/* RECEIPT ITEMS TABLE */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-300">
              <ArrowDownToLine className="h-8 w-8 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-gray-600">No items scanned or added yet</p>
            <p className="text-xs text-gray-400 max-w-xs text-center">Use the Express Intake Terminal on the left to scan barcodes or manually enter pantry items.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[580px]">
            <thead>
              <tr className="bg-gray-50/90 sticky top-0 border-b border-gray-200/80 backdrop-blur-md z-10">
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Quantity</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const catMeta = getCategoryMeta(item.categoryName || item.category);
                const Icon = catMeta.icon;
                return (
                  <tr key={item.id} className="hover:bg-orange-50/20 group transition-colors">
                    {/* Product Cell with Photo Thumbnail OR Fallback Category Icon */}
                    <td className="px-6 py-3.5 align-middle">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Icon className="h-5 w-5 text-[#d97757]" strokeWidth={1.8} />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/60">
                              {catMeta.name}
                            </span>
                            {item.barcode && !item.barcode.startsWith('INT-') && !item.barcode.startsWith('SYS-') && (
                              <span className="text-[10px] font-mono text-gray-400">
                                #{item.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Source & Donor Cell */}
                    <td className="px-4 py-3.5 align-middle">
                      <span className="text-xs font-bold text-gray-700 capitalize block">
                        {item.sourceType ? item.sourceType.replace('_', ' ') : 'Donation'}
                      </span>
                      {item.donorName && (
                        <span className="text-[11px] text-gray-500 truncate max-w-[130px] block font-medium">
                          {item.donorName}
                        </span>
                      )}
                    </td>

                    {/* Expiration Cell */}
                    <td className="px-4 py-3.5 align-middle">
                      {item.expirationDate ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-800 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200/60">
                          <Calendar className="h-3 w-3 text-orange-600" />
                          {item.expirationDate}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium italic">No date</span>
                      )}
                    </td>

                    {/* Quantity Stepper Cell */}
                    <td className="px-6 py-3.5 align-middle text-right">
                      <div className="inline-flex items-center justify-end gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => {
                            const current = parseFloat(item.quantity) || 1;
                            if (current > 1) onUpdateQty(item.id, String(current - 1));
                          }}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input 
                          type="number" 
                          step="any"
                          value={item.quantity} 
                          onChange={(e) => onUpdateQty(item.id, e.target.value)}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (isNaN(val) || val <= 0) onUpdateQty(item.id, '1');
                          }}
                          className="w-12 h-7 text-center text-xs font-bold text-gray-900 bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const current = parseFloat(item.quantity) || 0;
                            onUpdateQty(item.id, String(current + 1));
                          }}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-500 block mt-1 text-right pr-1">
                        {item.unit || 'units'}
                      </span>
                    </td>

                    {/* Remove Item Button */}
                    <td className="px-4 py-3.5 align-middle text-right">
                      <button 
                        type="button"
                        onClick={() => onRemove(item.id)} 
                        className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50"
                        title="Remove from cart"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* FOOTER: CHECKOUT BAR (Pinned at bottom in both states) */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0 space-y-4">
        <div className="flex items-center justify-between text-sm font-semibold text-gray-600">
          <span>Ready to commit to inventory database?</span>
          <span className="text-[#2b2b2b] font-bold">{items.length} unique products</span>
        </div>
        
        <button 
          type="button"
          disabled={items.length === 0 || isSubmitting}
          onClick={onSubmit}
          className="w-full h-14 text-base font-bold text-white bg-[#2b2b2b] hover:bg-[#1a1a1a] rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-[#d97757]" />
              <span>Submitting Batch to Supabase...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-[#d97757]" />
              <span>Submit Batch to Inventory ({items.length} items)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // --- COLLAPSED STATE ---
  if (!isExpanded) {
    return renderCollapsedView();
  }

  // --- EXPANDED STATE (Responsive Slide-over Drawer for < xl, Side-by-Side for >= xl) ---
  return (
    <>
      {/* On < xl screens: Keep the collapsed view in the grid so the underlying form layout never squishes */}
      <div className="block xl:hidden">
        {renderCollapsedView()}
      </div>

      {/* On < xl screens: Render the slide-over drawer modal for spacious expanded receipt review */}
      <div className="xl:hidden fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-300">
        {/* Dark backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={onToggleExpand}
          aria-hidden="true"
        />

        {/* Slide-over panel */}
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
          <div className="w-screen max-w-2xl lg:max-w-3xl bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            {renderExpandedView(true)}
          </div>
        </div>
      </div>

      {/* On >= xl screens: Render the expanded view directly in the grid side-by-side */}
      <div className="hidden xl:block">
        {renderExpandedView(false)}
      </div>
    </>
  );
}

// --- MAIN PAGE LAYOUT (Edge-to-Edge Self-Checkout Store Terminal) ---
export function DesktopAddView() {
  const { pantryId } = usePantry();

  const [cartItems, setCartItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCartExpanded, setIsCartExpanded] = useState(false); // Collapsed (3 cols) by default!
  const [isAddedPulse, setIsAddedPulse] = useState(false);

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

      setSuccess(`Successfully added ${cartItems.length} unique items (${data.count || cartItems.length} total batches) to inventory!`);
      setCartItems([]); // Clear cart only on success
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f7f7f5] px-6 py-6 md:px-8">
      {/* EDGE-TO-EDGE GRID WITH DYNAMIC COLLAPSIBLE COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: 2-STEP TYPEFORM INTAKE TERMINAL */}
        <div className={`transition-all duration-300 ${
          isCartExpanded 
            ? 'md:col-span-7 lg:col-span-7 xl:col-span-6 2xl:col-span-6' 
            : 'md:col-span-7 lg:col-span-7 xl:col-span-8 2xl:col-span-9'
        }`}>
          <DesktopInlineForm onAdd={handleAddItem} pantryId={pantryId} onPulseChange={setIsAddedPulse} />
        </div>

        {/* RIGHT COLUMN: COLLAPSIBLE POS RECEIPT CART */}
        <div className={`transition-all duration-300 h-fit sticky top-6 ${
          isCartExpanded 
            ? 'md:col-span-5 lg:col-span-5 xl:col-span-6 2xl:col-span-6' 
            : 'md:col-span-5 lg:col-span-5 xl:col-span-4 2xl:col-span-3'
        }`}>
          <BatchSummarySidebar 
            items={cartItems} 
            onRemove={handleRemoveItem} 
            onUpdateQty={handleUpdateQty} 
            onSubmit={handleSubmitBatch} 
            isSubmitting={isSubmitting}
            error={error}
            success={success}
            isExpanded={isCartExpanded}
            onToggleExpand={() => setIsCartExpanded(!isCartExpanded)}
            isAddedPulse={isAddedPulse}
          />
        </div>

      </div>
    </div>
  );
}