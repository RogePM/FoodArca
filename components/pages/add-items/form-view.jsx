'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, Wand2, Loader2, Camera, 
  ChevronRight, ChevronDown, Check, MapPin, ScanBarcode 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categories } from '@/lib/constants';

export function FormView({
  onBack,
  onCameraClick,
  onSubmit,
  isSubmitting,
  isLoadingBarcode,
  generateInternalBarcode,
  isInternalBarcode,
  
  barcode, setBarcode, setIsInternalBarcode,
  itemName, setItemName,
  category, setCategory,
  quantity, setQuantity,
  unit, setUnit,
  expirationDate, setExpirationDate,
  weightPerUnit, setWeightPerUnit,
  expirationPrecision, setExpirationPrecision,
  sourceType, setSourceType,
  donorName, setDonorName,
  photoUrl, setPhotoUrl,
  storageLocation, setStorageLocation,
  notes, setNotes
}) {
  const [showCategoryScreen, setShowCategoryScreen] = useState(false);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const selectedCatObj = categories.find(c => c.value === category);

  // ==========================================
  // SUB-VIEW: CATEGORY SELECTION 
  // ==========================================
  if (showCategoryScreen) {
    return (
      // Changed to a flex layout to ensure the header stays pinned and the list scrolls smoothly below it
      <div className="fixed inset-0 z-[70] bg-[#f7f7f5] flex flex-col animate-in slide-in-from-right-8 duration-300">
        
        {/* HEADER: Increased height to h-16 for more breathing room */}
        <header className="shrink-0 bg-[#f7f7f5]/90 backdrop-blur-xl border-b border-black/[0.05] pt-[max(env(safe-area-inset-top),0px)]">
          <div className="flex items-center justify-between px-4 h-16 relative">
            
            {/* BACK BUTTON FIX: Massive touch target using padding and negative margin */}
            <button 
              onClick={() => setShowCategoryScreen(false)} 
              // The `px-4 py-3 -ml-4` creates a huge invisible hit box around the word "Back"
              className="flex items-center text-[#d97757] font-medium text-[19px] px-4 py-3 -ml-4 active:bg-[#d97757]/10 rounded-2xl transition-colors z-10"
            >
              <ArrowLeft className="h-7 w-7 mr-1" strokeWidth={2.5} /> Back
            </button>
            
            <h2 className="text-[18px] font-bold text-gray-900 absolute inset-x-0 text-center pointer-events-none">
              Category
            </h2>
          </div>
        </header>

        {/* LIST CONTAINER */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-32 pt-6 px-4">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
            {categories.map((c, index) => {
              const isSelected = c.value === category;
              return (
                <button
                  key={c.value}
                  onClick={() => {
                    setCategory(c.value);
                    setShowCategoryScreen(false);
                  }}
                  className="w-full flex items-center px-4 min-h-[72px] relative active:bg-gray-50 transition-colors"
                >
                  {/* ICON BLOCK */}
                  <div className={`h-[44px] w-[44px] rounded-[14px] flex items-center justify-center shrink-0 mr-4 transition-all
                    ${isSelected ? 'bg-[#d97757] text-white shadow-md shadow-[#d97757]/20' : 'bg-gray-50 text-gray-500 border border-black/[0.03]'}
                  `}>
                    <c.icon className="h-6 w-6" strokeWidth={isSelected ? 2.5 : 1.5} />
                  </div>
                  
                  {/* TEXT */}
                  <span className={`text-[17px] flex-1 text-left tracking-tight ${isSelected ? 'text-[#d97757] font-bold' : 'text-gray-900 font-medium'}`}>
                    {c.name}
                  </span>
                  
                  {/* CHECKMARK */}
                  {isSelected && <Check className="h-6 w-6 text-[#d97757]" strokeWidth={3} />}
                  
                  {/* DIVIDER: Aligned with the text */}
                  {index !== categories.length - 1 && (
                    <div className="absolute bottom-0 left-[76px] right-0 h-[1px] bg-black/[0.04]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  // ==========================================
  // MAIN VIEW: NATIVE FORM LAYOUT
  // ==========================================
  // ==========================================
  // MAIN VIEW: NATIVE FORM LAYOUT
  // ==========================================
  return (
    <div className="flex-1 w-full z-10 bg-[#fafafa] flex flex-col overflow-hidden">

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-6 pt-[max(env(safe-area-inset-top,16px),16px)]">
        
        {/* INLINE HEADER (Scrolls away, freeing up space) */}
        <div className="flex items-center justify-between px-1">
          <button onClick={onBack} className="flex items-center text-[#d97757] font-medium text-[17px] active:opacity-50 transition-opacity">
            <ArrowLeft className="h-6 w-6 mr-1" strokeWidth={2} /> Back
          </button>
          <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight leading-none">Add Item</h2>
        </div>

        {/* SECTION 1: SCAN / ID */}
        <section>
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex items-center p-2 relative mt-2">
            <div className="h-12 w-12 flex items-center justify-center text-gray-400 shrink-0">
              <ScanBarcode className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="relative flex-1">
              <input
                value={barcode}
                onChange={(e) => { setBarcode(e.target.value); setIsInternalBarcode(false); }}
                placeholder="Scan or enter code..."
                className="w-full h-12 bg-transparent text-[17px] font-semibold text-gray-900 placeholder:text-gray-300 outline-none"
              />
              {isLoadingBarcode && <Loader2 className="absolute right-2 top-3 h-6 w-6 animate-spin text-[#d97757]" />}
            </div>
            <button 
              type="button" 
              onClick={onCameraClick} 
              className="h-12 w-12 shrink-0 bg-[#d97757]/5 text-[#d97757] hover:bg-[#d97757]/10 rounded-[20px] flex items-center justify-center transition-colors"
            >
              <Camera className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
          {!isInternalBarcode && (
            <div className="flex justify-end px-2 mt-2">
              <button type="button" onClick={generateInternalBarcode} className="text-[13px] font-medium text-[#d97757]">
                No Barcode? Generate one
              </button>
            </div>
          )}
        </section>

        {/* SECTION 2: LIST DETAILS CARD (iOS Settings Style) */}
        <section>
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden divide-y divide-gray-100/80">
            
            {/* ITEM NAME */}
            <div className="flex items-center justify-between min-h-[64px] px-5 py-3">
              <span className="text-[16px] font-medium text-gray-900 shrink-0 mr-4">Name</span>
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Canned Beans"
                className="flex-1 text-right text-[16px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 bg-transparent"
              />
            </div>

            {/* CATEGORY */}
            <button 
              type="button"
              onClick={() => setShowCategoryScreen(true)}
              className="flex items-center justify-between min-h-[64px] px-5 py-3 active:bg-gray-50 transition-colors w-full"
            >
              <span className="text-[16px] font-medium text-gray-900">Category</span>
              <div className="flex items-center gap-1">
                <span className={`text-[15px] font-medium ${selectedCatObj ? 'text-gray-500' : 'text-gray-400'}`}>
                  {selectedCatObj ? selectedCatObj.name : 'Select...'}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" strokeWidth={2.5} />
              </div>
            </button>

            {/* UNIT SIZE / WEIGHT */}
            <div className="flex items-center justify-between min-h-[64px] px-5 py-3">
              <span className="text-[16px] font-medium text-gray-900 shrink-0 mr-4">Unit Size</span>
              <div className="flex items-center flex-1 justify-end gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="1"
                  value={weightPerUnit}
                  onChange={(e) => setWeightPerUnit(e.target.value)}
                  className="w-20 text-right text-[16px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 bg-transparent"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="bg-gray-100 border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm font-bold text-gray-800 outline-none"
                >
                  <option value="units">units</option>
                  <option value="oz">oz</option>
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                  <option value="fl_oz">fl oz</option>
                  <option value="gallon">gal</option>
                  <option value="can">can</option>
                  <option value="box">box</option>
                  <option value="bag">bag</option>
                  <option value="jar">jar</option>
                </select>
              </div>
            </div>

            {/* QUANTITY */}
            <div className="flex flex-col min-h-[64px] px-5 py-3 justify-center">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-medium text-gray-900 shrink-0">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(quantity) || 1;
                      if (cur > 1) setQuantity(String(cur - 1));
                    }}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-gray-700 active:scale-95 transition-all text-base"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-16 text-center text-[18px] font-black text-[#d97757] outline-none placeholder:text-[#d97757]/40 bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(quantity) || 0;
                      setQuantity(String(cur + 1));
                    }}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-gray-700 active:scale-95 transition-all text-base"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-gray-500 ml-1">{unit}</span>
                </div>
              </div>

              {/* Live Weight Math calculation badge */}
              <div className="mt-2.5 text-right text-xs font-mono font-bold text-gray-600 bg-[#d97757]/10 p-2 rounded-xl border border-[#d97757]/20 flex items-center justify-between">
                <span className="text-[#c06245] font-extrabold">Est. Total Weight:</span>
                <span>
                  {quantity || 0} × {weightPerUnit || 1} {unit} ≈ {
                    (() => {
                      const q = parseFloat(quantity) || 0;
                      const w = parseFloat(weightPerUnit) || 1;
                      if (unit === 'lbs') return (q * w).toFixed(1);
                      if (unit === 'kg') return (q * w * 2.20462).toFixed(1);
                      if (['oz', 'fl_oz', 'can', 'box', 'bag', 'jar'].includes(unit)) return (q * (w / 16)).toFixed(1);
                      if (unit === 'gallon') return (q * (w * 8.34)).toFixed(1);
                      return (q * w).toFixed(1);
                    })()
                  } lbs
                </span>
              </div>
            </div>

            {/* EXPIRATION */}
            <div className="flex flex-col min-h-[64px] px-5 py-3 justify-center gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-medium text-gray-900 shrink-0">Expiration</span>
                <div className="flex bg-gray-100 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setExpirationPrecision('day'); }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${expirationPrecision === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                  >
                    Exact
                  </button>
                  <button
                    type="button"
                    onClick={() => { setExpirationPrecision('month'); }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${expirationPrecision === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    onClick={() => { setExpirationPrecision('unknown'); setExpirationDate(''); }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${expirationPrecision === 'unknown' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                  >
                    No Date
                  </button>
                </div>
              </div>
              {expirationPrecision !== 'unknown' && (
                <input
                  type={expirationDate ? "date" : "text"}
                  onFocus={(e) => e.target.type = "date"}
                  onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  placeholder="mm/dd/yyyy"
                  className="w-full text-right text-[15px] font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-400"
                />
              )}
            </div>

            {/* INTAKE SOURCE */}
            <div className="flex flex-col min-h-[64px] px-5 py-3 justify-center gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-medium text-gray-900 shrink-0">Source</span>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="bg-gray-100 border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm font-bold text-gray-800 outline-none"
                >
                  <option value="Donation">Donation</option>
                  <option value="Purchased">Purchased</option>
                  <option value="usda_commodity">USDA commodity</option>
                  <option value="Retail rescue">Retail rescue</option>
                </select>
              </div>
              <input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Donor name / note (optional)..."
                className="w-full text-right text-[14px] font-medium text-gray-600 outline-none bg-transparent placeholder:text-gray-400"
              />
            </div>

            {/* OPTIONAL FIELDS */}
            {showOptionalDetails && (
              <>
                <div className="flex items-center justify-between min-h-[56px] px-5 py-2 bg-gray-50/50">
                  <span className="text-[16px] font-medium text-gray-900 shrink-0 mr-4">Location</span>
                  <input
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    placeholder="e.g. Aisle 3, Shelf B"
                    className="flex-1 text-right text-[15px] font-medium text-gray-500 outline-none placeholder:text-gray-400 bg-transparent"
                  />
                </div>
                
                <div className="flex flex-col justify-center px-5 py-3 bg-gray-50/50">
                  <textarea
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add optional notes..."
                    className="w-full bg-transparent border-0 min-h-[60px] text-[15px] font-medium text-gray-600 placeholder:text-gray-400 focus:ring-0 resize-none outline-none p-0"
                  />
                </div>
              </>
            )}
          </div>

          {/* TOGGLE OPTIONAL BUTTON */}
          <div className={`flex justify-start w-full ${showOptionalDetails ? 'mt-4 mb-2' : 'mt-6 mb-4'}`}>
            <button 
              type="button" 
              onClick={() => setShowOptionalDetails(!showOptionalDetails)}
              className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center gap-2 active:bg-gray-50 transition-all active:scale-95"
            >
              <span className="text-[14px] font-semibold text-gray-600">
                {showOptionalDetails ? 'Hide details' : 'Add location & notes'}
              </span>
              <div className="h-5 w-5 rounded-full bg-[#d97757]/10 flex items-center justify-center text-[#d97757] shrink-0">
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${showOptionalDetails ? 'rotate-180' : ''}`} strokeWidth={3} />
              </div>
            </button>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <Button
              className="w-full h-14 text-[17px] font-semibold bg-[#d97757] hover:bg-[#c06245] rounded-[20px] transition-transform active:scale-[0.98] shadow-[0_4px_15px_-3px_rgba(217,119,87,0.3)] text-white"
              onClick={onSubmit}
              disabled={isSubmitting || !itemName || !quantity}
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
              {isSubmitting ? "Saving..." : "Save Item"}
            </Button>
          </div>
        </section>

        {/* SAFARI BOTTOM NAV SPACER */}
        {/* Safari ignores pb- on scroll containers, so we use a physical block to force scroll extension */}
        <div className="h-[120px] shrink-0 w-full pointer-events-none" />

      </div>
    </div>
  );
}