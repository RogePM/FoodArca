'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, Wand2, Loader2, Camera, 
  ChevronRight, Check, MapPin, ScanBarcode 
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
  storageLocation, setStorageLocation,
  notes, setNotes
}) {
  const [showCategoryScreen, setShowCategoryScreen] = useState(false);
  const selectedCatObj = categories.find(c => c.value === category);

  // ==========================================
  // SUB-VIEW: CATEGORY SELECTION 
  // ==========================================
 if (showCategoryScreen) {
    return (
      // Changed to a flex layout to ensure the header stays pinned and the list scrolls smoothly below it
      <div className="fixed inset-0 z-[70] bg-[#f2f2f7] flex flex-col animate-in slide-in-from-right-8 duration-300">
        
        {/* HEADER: Increased height to h-16 for more breathing room */}
        <header className="shrink-0 bg-[#f2f2f7]/90 backdrop-blur-xl border-b border-black/[0.05] pt-[max(env(safe-area-inset-top),0px)]">
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

        {/* LIST CONTAINER: flex-1 allows this specific area to scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-32">
          <div className="bg-white border-y border-black/[0.05] mt-6">
            {categories.map((c, index) => {
              const isSelected = c.value === category;
              return (
                <button
                  key={c.value}
                  onClick={() => {
                    setCategory(c.value);
                    setShowCategoryScreen(false);
                  }}
                  // MASSIVE TOUCH TARGET: Increased height to 100px
                  className="w-full flex items-center px-6 min-h-[100px] relative active:bg-gray-50 transition-colors"
                >
                  {/* ICON BLOCK: Increased to 60x60 with an 18px border radius */}
                  <div className={`h-[60px] w-[60px] rounded-[18px] flex items-center justify-center shrink-0 mr-5 transition-all
                    ${isSelected ? 'bg-[#d97757] text-white shadow-md shadow-[#d97757]/20' : 'bg-gray-50 text-gray-400 border border-black/[0.03]'}
                  `}>
                    <c.icon className="h-8 w-8" strokeWidth={isSelected ? 2 : 1.5} />
                  </div>
                  
                  {/* TEXT: Bumped up to 22px. Uses a thicker font weight for readability */}
                  <span className={`text-[22px] flex-1 text-left tracking-tight ${isSelected ? 'text-[#d97757] font-bold' : 'text-gray-900 font-medium'}`}>
                    {c.name}
                  </span>
                  
                  {/* CHECKMARK: Made slightly thicker and larger */}
                  {isSelected && <Check className="h-8 w-8 text-[#d97757]" strokeWidth={3} />}
                  
                  {/* DIVIDER: Adjusted the left indent to perfectly align with the new 60px icons */}
                  {index !== categories.length - 1 && (
                    <div className="absolute bottom-0 left-[108px] right-0 h-[1px] bg-black/[0.04]" />
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
  return (
    <div className="absolute inset-0 z-10 bg-[#f2f2f7] overflow-y-auto overscroll-none">

      <header className="sticky top-0 z-20 bg-[#f2f2f7]/90 backdrop-blur-xl border-b border-transparent pt-[max(env(safe-area-inset-top),0px)]">
        <div className="flex items-center justify-between px-4 h-14 relative">
          <button onClick={onBack} className="flex items-center text-[#d97757] font-medium text-[17px] active:opacity-50 transition-opacity z-10">
            <ArrowLeft className="h-6 w-6 mr-1" strokeWidth={2} /> Cancel
          </button>
          <h2 className="text-[17px] font-medium text-gray-900 absolute inset-x-0 text-center pointer-events-none">Add Stock</h2>
        </div>
      </header>

      {/* CHANGED: Massive bottom padding (pb-[320px]) so the keyboard doesn't overlap the notes box */}
      <div className="px-4 py-6 pb-[320px] space-y-7 relative z-0">
        
        {/* SECTION 1: SCAN / ID */}
        <section>
          <div className="flex justify-between items-end mb-2 px-2">
            {/* CHANGED: Header from text-gray-500 to text-gray-600 to be slightly darker */}
            <h3 className="text-[13px] font-medium text-gray-600 uppercase tracking-wide">Identification</h3>
            {!isInternalBarcode && (
              <button type="button" onClick={generateInternalBarcode} className="text-[13px] font-medium text-[#d97757]">
                No Barcode?
              </button>
            )}
          </div>
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-200/50 flex items-center p-2 relative">
            <div className="h-12 w-12 flex items-center justify-center text-gray-400 shrink-0">
              <ScanBarcode className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="relative flex-1">
              <input
                value={barcode}
                onChange={(e) => { setBarcode(e.target.value); setIsInternalBarcode(false); }}
                placeholder="Scan or enter code..."
                className="w-full h-12 bg-transparent text-[17px] font-normal text-gray-900 placeholder:text-gray-400 outline-none"
              />
              {isLoadingBarcode && <Loader2 className="absolute right-2 top-3 h-6 w-6 animate-spin text-[#d97757]" />}
            </div>
            <button 
              type="button" 
              onClick={onCameraClick} 
              className="h-12 w-12 shrink-0 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-[12px] flex items-center justify-center transition-colors"
            >
              <Camera className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </section>

        {/* SECTION 2: DETAILS GROUP */}
        <section>
          <div className="flex justify-between items-end mb-2 px-2">
            <h3 className="text-[13px] font-medium text-gray-600 uppercase tracking-wide">Product Details</h3>
          </div>
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-200/50 flex flex-col relative overflow-hidden">
            
            <div className="flex flex-col justify-center min-h-[68px] px-4 py-2 relative">
              <label className="text-[15px] font-normal text-gray-500 mb-0.5">Item Name</label>
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Canned Black Beans"
                className="w-full text-[17px] font-normal text-gray-900 outline-none placeholder:text-gray-300 bg-transparent"
              />
              <div className="absolute bottom-0 left-4 right-0 h-[1px] bg-gray-200/80" />
            </div>

            <button 
              type="button"
              onClick={() => setShowCategoryScreen(true)}
              className="flex flex-col justify-center min-h-[68px] px-4 py-2 relative active:bg-gray-50 transition-colors text-left"
            >
              <label className="text-[15px] font-normal text-gray-500 mb-0.5">Category</label>
              <div className="flex items-center justify-between w-full">
                <span className={`text-[17px] font-normal ${selectedCatObj ? 'text-gray-900' : 'text-gray-400'}`}>
                  {selectedCatObj ? selectedCatObj.name : 'Select Category...'}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-300" strokeWidth={2} />
              </div>
              <div className="absolute bottom-0 left-4 right-0 h-[1px] bg-gray-200/80" />
            </button>

            <div className="flex flex-col justify-center min-h-[68px] px-4 py-2 relative">
              <label className="text-[15px] font-normal text-gray-500 mb-0.5">Expiration Date</label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full text-[17px] font-normal text-gray-900 outline-none bg-transparent"
              />
              <div className="absolute bottom-0 left-4 right-0 h-[1px] bg-gray-200/80" />
            </div>

            <div className="flex flex-col justify-center min-h-[68px] px-4 py-2 relative">
              <label className="text-[15px] font-normal text-gray-500 mb-0.5">Storage Location</label>
              <input
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Aisle 3, Shelf B"
                className="w-full text-[17px] font-normal text-gray-900 outline-none placeholder:text-gray-300 bg-transparent"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: QUANTITY */}
        <section>
          <div className="flex justify-between items-end mb-2 px-2">
            <h3 className="text-[14px] font-medium text-gray-600 uppercase tracking-wide">Stock Added</h3>
          </div>
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-200/50 flex relative overflow-hidden">
            <div className="flex-1 flex flex-col justify-center min-h-[76px] px-4 py-2">
              <label className="text-[15px] font-normal text-gray-500 mb-0.5">Amount</label>
              <input
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full text-[24px] font-medium text-[#d97757] outline-none placeholder:text-gray-300 bg-transparent"
              />
            </div>
            
            <div className="w-[1px] bg-gray-200/80 my-3" />
            
            <div className="w-32 relative flex flex-col justify-center px-4 py-2 active:bg-gray-50">
               <label className="text-[15px] font-normal text-gray-500 mb-0.5">Unit</label>
               <select 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 text-[17px]"
                >
                  <optgroup label="Count"><option value="units">Units</option></optgroup>
                  <optgroup label="Weight">
                    <option value="lbs">Lbs</option>
                    <option value="kg">Kg</option>
                    <option value="oz">Oz</option>
                  </optgroup>
                </select>
                <div className="flex items-center justify-between text-[17px] font-normal text-gray-900 pointer-events-none">
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  <ChevronRight className="h-5 w-5 text-gray-300" strokeWidth={2} />
                </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: NOTES */}
        <section>
          <div className="flex justify-between items-end mb-2 px-2">
            <h3 className="text-[14px] font-medium text-gray-600 uppercase tracking-wide">Notes</h3>
          </div>
          {/* CHANGED: Removed the toggle button. It's always a textbox now. */}
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-200/50 p-3 relative overflow-hidden">
            <textarea
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Donated by Walmart, Dented box..."
              // Kept min height reasonable (80px) and font at 17px to prevent auto-zoom on iOS
              className="w-full bg-transparent border-0 min-h-[80px] text-[17px] font-normal text-gray-900 placeholder:text-gray-400 focus:ring-0 resize-none outline-none p-1"
            />
          </div>
        </section>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-[50] bg-white/90 backdrop-blur-md border-t border-gray-200/60 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex gap-3">
        
        <Button
          variant="outline"
          className="w-[110px] h-14 text-[17px] font-semibold border-gray-200 text-gray-700 rounded-[14px] active:scale-[0.98] transition-transform bg-white hover:bg-gray-50 shadow-sm"
          onClick={onBack}
        >
          Cancel
        </Button>

        <Button
          className="flex-1 h-14 text-[17px] font-semibold bg-[#d97757] hover:bg-[#c06245] rounded-[14px] transition-transform active:scale-[0.98] shadow-md text-white"
          onClick={onSubmit}
          disabled={isSubmitting || !itemName || !quantity}
        >
          {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
          {isSubmitting ? "Saving..." : "Save Item"}
        </Button>

      </footer>

    </div>
  );
}