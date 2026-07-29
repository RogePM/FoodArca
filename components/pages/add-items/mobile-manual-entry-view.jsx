'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Save, Box, AlertCircle, Plus, Settings2, ChevronDown } from 'lucide-react';
import { categories } from '@/lib/constants';

function getCategoryMeta(catName) {
  const safeStr = String(catName || '').toLowerCase();
  const found = categories.find(
    (c) => c.name.toLowerCase() === safeStr || c.value.toLowerCase() === safeStr
  );
  if (found) return { name: found.name, value: found.value };
  return { name: 'Other', value: 'other' };
}

// Custom Field Label mirroring Desktop but tailored for Mobile spacing
function MobileFieldLabel({ label, required, optional, hint, children }) {
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1 text-[13px] font-bold text-[#1a1f36] leading-none ml-0.5">
          <span>{label}</span>
          {required && <span className="text-[#d97757] text-[14px] leading-none">*</span>}
        </label>
        {optional && <span className="text-[11px] font-semibold text-[#a3acb9] uppercase tracking-wide mr-1">Optional</span>}
      </div>
      {hint && <p className="text-[12px] text-[#697386] leading-snug ml-0.5">{hint}</p>}
      {children}
    </div>
  );
}

export function MobileManualEntryView({ onBack, initialItem, onSave }) {
  const isEditing = !!initialItem?.id;
  const displayBarcode = initialItem?.barcode || '';
  
  const [formName, setFormName] = useState(initialItem?.name || '');
  const [formCategory, setFormCategory] = useState(initialItem?.category || categories[0].value);
  const [formQty, setFormQty] = useState(initialItem?.quantity || '1');
  
  // Mobile defaults to per-unit weight entry
  const [formWeight, setFormWeight] = useState(
    initialItem?.weightPerUnit && initialItem?.weightPerUnit !== '0' && initialItem?.weightPerUnit !== '0.00'
      ? String(initialItem.weightPerUnit) 
      : ''
  );
  const [formWeightUnit, setFormWeightUnit] = useState('lbs'); 
  const [expirationDate, setExpirationDate] = useState(initialItem?.expirationDate || '');
  const [formUnit, setFormUnit] = useState(initialItem?.unit || 'units');
  const [formSource, setFormSource] = useState(initialItem?.sourceType || 'not_specified');
  
  // More Details
  const [packSize, setPackSize] = useState(initialItem?.packSize || '');
  const [donorName, setDonorName] = useState(initialItem?.donorName || '');
  const [isMoreDetailsOpen, setIsMoreDetailsOpen] = useState(false);

  const handleSave = () => {
    if (!formName.trim() || !formQty) return;
    
    const qtyNum = parseFloat(formQty) || 1;
    let perUnitLbs = 0;
    if (formWeight && formWeightUnit === 'oz') {
      perUnitLbs = parseFloat(formWeight) / 16;
    } else if (formWeight) {
      perUnitLbs = parseFloat(formWeight);
    }
    
    const newItem = {
      id: initialItem?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      barcode: displayBarcode,
      name: formName.trim(),
      category: formCategory,
      categoryName: getCategoryMeta(formCategory).name,
      quantity: String(qtyNum),
      unit: formUnit,
      weightPerUnit: perUnitLbs > 0 ? perUnitLbs.toFixed(2) : '0',
      totalWeightLbs: Number((perUnitLbs * qtyNum).toFixed(2)),
      intakeMode: 'count',
      expirationDate: expirationDate || null,
      expirationPrecision: expirationDate ? 'day' : 'none',
      sourceType: formSource,
      packSize: packSize ? String(packSize) : null,
      donorName: donorName.trim() || null,
      photoUrl: initialItem?.photoUrl || null
    };

    onSave(newItem);
  };

  const inputClass = "w-full h-[52px] px-4 rounded-xl border border-gray-200/80 bg-white text-[16px] font-medium text-gray-900 outline-none focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all placeholder:text-[#a3acb9]";

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 bg-[#f8fafb] flex flex-col pb-[calc(80px+env(safe-area-inset-bottom))]"
    >
      {/* HEADER */}
      <div className="p-4 pt-safe flex items-center justify-between border-b bg-white shadow-sm shrink-0 relative z-10">
        <button onClick={onBack} className="flex items-center text-gray-600 font-medium active:scale-95 transition-transform -ml-2 p-2">
          <ChevronLeft className="w-6 h-6 mr-1" />
          Cancel
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-lg text-gray-900 leading-tight">
            {isEditing ? 'Edit Item' : 'Add Item'}
          </h1>
          {displayBarcode && !initialItem?.isInternal && (
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{displayBarcode}</span>
          )}
        </div>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* FORM BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {!isEditing && displayBarcode && !initialItem?.isInternal && (
          <div className="bg-orange-50 border border-[#d97757]/30 rounded-2xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-[#d97757] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#c06245] font-bold text-[14px]">Barcode Not Found</p>
              <p className="text-[#c06245]/80 text-[13px] mt-1 leading-snug">
                This item isn't in our global database. Fill in the details below and it will be saved for future scans!
              </p>
            </div>
          </div>
        )}

        {/* CARD 1: CORE DETAILS */}
        <div className="bg-white border border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl p-5 space-y-5">
          <MobileFieldLabel label="Item Name" required>
            <input 
              type="text" 
              value={formName} 
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. Campbell's Tomato Soup"
              className={inputClass}
            />
          </MobileFieldLabel>

          <MobileFieldLabel label="Category" required>
            <div className="relative">
              <select 
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className={`${inputClass} appearance-none pr-10`}
              >
                {categories.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-[#8792a2]" />
              </div>
            </div>
          </MobileFieldLabel>
        </div>

        {/* CARD 2: MEASUREMENTS */}
        <div className="bg-white border border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl p-5 space-y-5">
          <MobileFieldLabel label="Quantity" required>
            <div className="flex shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
              <input 
                type="number" 
                value={formQty} 
                onChange={e => setFormQty(e.target.value)}
                className="w-full h-[52px] pl-4 rounded-l-xl border border-gray-200/80 border-r-0 bg-white text-[16px] font-bold text-gray-900 outline-none focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/10 relative z-10"
              />
              <div className="relative border border-gray-200/80 rounded-r-xl bg-gray-50 shrink-0 w-[110px]">
                <select
                  value={formUnit}
                  onChange={e => setFormUnit(e.target.value)}
                  className="h-full w-full pl-3 pr-8 bg-transparent text-[16px] font-bold text-[#1a1f36] outline-none appearance-none"
                >
                  <option value="units">Units</option>
                  <option value="cans">Cans</option>
                  <option value="boxes">Boxes</option>
                  <option value="bottles">Bottles</option>
                  <option value="packets">Bags</option>
                  <option value="cases">Cases</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-[#8792a2]" />
                </div>
              </div>
            </div>
          </MobileFieldLabel>

          <MobileFieldLabel label="Per-Unit Weight" optional hint="Weight of a single item">
            <div className="flex shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
              <input 
                type="number" 
                value={formWeight} 
                onChange={e => setFormWeight(e.target.value)}
                placeholder="e.g. 16"
                className="w-full h-[52px] px-4 rounded-l-xl border border-gray-200/80 border-r-0 bg-white text-[16px] font-medium text-gray-900 outline-none focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/10 relative z-10 placeholder:text-[#a3acb9]"
              />
              <div className="relative border border-gray-200/80 rounded-r-xl bg-gray-50 shrink-0 w-[90px]">
                <select
                  value={formWeightUnit}
                  onChange={e => setFormWeightUnit(e.target.value)}
                  className="h-full w-full pl-3 pr-8 bg-transparent text-[16px] font-bold text-[#1a1f36] outline-none appearance-none"
                >
                  <option value="lbs">lbs</option>
                  <option value="oz">oz</option>
                  <option value="fl_oz">fl oz</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="ml">mL</option>
                  <option value="l">L</option>
                  <option value="gal">gal</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-[#8792a2]" />
                </div>
              </div>
            </div>
          </MobileFieldLabel>
        </div>

        {/* CARD 3: METADATA */}
        <div className="bg-white border border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl p-5 space-y-5 overflow-hidden">
          <MobileFieldLabel label="Expiration Date" optional>
            <input 
              type="date" 
              value={expirationDate} 
              onChange={e => setExpirationDate(e.target.value)}
              className={`${inputClass} max-w-full box-border`}
            />
          </MobileFieldLabel>
          
          <MobileFieldLabel label="Source Type">
            <div className="relative">
              <select 
                value={formSource}
                onChange={e => setFormSource(e.target.value)}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="not_specified">Not specified</option>
                <option value="donation">Donation</option>
                <option value="retail_rescue">Rescue</option>
                <option value="purchased">Purchased</option>
                <option value="usda">USDA</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-[#8792a2]" />
              </div>
            </div>
          </MobileFieldLabel>
        </div>

        {/* CARD 4: MORE DETAILS ACCORDION */}
        <div className="bg-white border border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMoreDetailsOpen(!isMoreDetailsOpen)}
            className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Settings2 className="h-4.5 w-4.5 text-[#8792a2]" strokeWidth={2} />
              <div className="flex flex-col items-start">
                <span className="text-[14px] font-bold text-[#1a1f36]">More Details</span>
                <span className="text-[12px] text-[#8792a2] font-medium">Donor Name, Pack Size</span>
              </div>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-[#8792a2] transition-transform duration-200 ${isMoreDetailsOpen ? 'rotate-180' : ''}`} 
              strokeWidth={2} 
            />
          </button>
          
          <AnimatePresence>
            {isMoreDetailsOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-gray-100"
              >
                <div className="p-5 space-y-5 bg-gray-50/50">
                  <MobileFieldLabel label="Items per pack" optional hint="e.g. 15 diapers per bag">
                    <input 
                      type="number" 
                      value={packSize} 
                      onChange={e => setPackSize(e.target.value)}
                      placeholder="e.g. 15"
                      className={inputClass}
                    />
                  </MobileFieldLabel>
                  
                  <MobileFieldLabel label="Donor Name" optional>
                    <input 
                      type="text" 
                      value={donorName} 
                      onChange={e => setDonorName(e.target.value)}
                      placeholder="e.g. Target"
                      className={inputClass}
                    />
                  </MobileFieldLabel>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-10" /> {/* Bottom Spacer */}
      </div>

      {/* FOOTER BUTTON */}
      <div className="p-4 shrink-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[calc(1rem+env(safe-area-inset-bottom))] relative z-10">
        <button 
          onClick={handleSave}
          disabled={!formName.trim() || !formQty}
          className="w-full h-[56px] rounded-xl bg-[#d97757] hover:bg-[#c66547] text-white font-bold text-[16px] shadow-[0_4px_14px_rgba(217,119,87,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isEditing ? <Save className="w-5 h-5" strokeWidth={2.5} /> : <Plus className="w-5 h-5" strokeWidth={3} />}
          {isEditing ? 'Save Changes' : 'Save to Batch'}
        </button>
      </div>

    </motion.div>
  );
}
