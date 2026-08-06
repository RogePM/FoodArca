'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Save, AlertCircle, Plus, Settings2, ChevronDown, Check, Calendar, X } from 'lucide-react';
import { categories } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

function formatExpDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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

// Quiet section label above a card — just enough to orient, not shout.
// Sentence case + a lighter weight reads as far less heavy than bold+uppercase.
function SectionLabel({ children }) {
  return (
    <span className="text-[12px] font-medium text-[#c1c7d0] ml-1">{children}</span>
  );
}

// Shared dropdown for every "pick one" field on this form — a styled trigger
// backed by Radix's portal-rendered content, so options can never get clipped
// by a card's rounded corners/overflow the way a plain <select> or a manually
// absolutely-positioned menu could. Font stays 16px so iOS doesn't zoom on tap.
function FieldSelect({ value, onChange, options, placeholder = 'Select...' }) {
  const selected = options.find(o => o.value === value);
  const SelectedIcon = selected?.Icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full h-[52px] px-4 rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none flex items-center justify-between text-[16px] font-medium text-[#1a1f36] data-[state=open]:border-[#d97757] data-[state=open]:ring-2 data-[state=open]:ring-[#d97757]/10 transition-all">
        <span className="flex items-center gap-2.5 truncate min-w-0">
          {SelectedIcon && <SelectedIcon className={`h-4 w-4 shrink-0 ${selected.iconClass || 'text-[#8792a2]'}`} strokeWidth={2} />}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-[#a3acb9] shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)] p-1 rounded-xl bg-white border border-gray-200/90 shadow-xl z-[10050] max-h-[280px] overflow-y-auto"
      >
        {options.map(opt => {
          const isSelected = value === opt.value;
          const OptIcon = opt.Icon;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-[14px] rounded-lg cursor-pointer ${isSelected ? 'bg-[#fff0eb] text-[#d97757] font-bold' : 'text-[#3c4257] font-medium'}`}
            >
              {OptIcon && <OptIcon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#d97757]' : (opt.iconClass || 'text-[#8792a2]')}`} strokeWidth={2} />}
              <span className="truncate flex-1">{opt.label}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-[#d97757] shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact variant of FieldSelect for the unit dropdowns that sit merged
// into a number input's own box (Quantity, Per-Unit Weight) — same Radix
// portal-based popup, just without its own border/background since the
// parent wrapper already supplies that.
function InlineUnitSelect({ value, onChange, options }) {
  const selected = options.find(o => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-full w-full pl-3 pr-8 flex items-center text-[16px] font-bold text-[#1a1f36] outline-none data-[state=open]:bg-white transition-colors">
        <span className="truncate">{selected?.label || options[0]?.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 p-1 rounded-xl bg-white border border-gray-200/90 shadow-xl z-[10050] max-h-[280px] overflow-y-auto">
        {options.map(opt => {
          const isSelected = value === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex items-center justify-between px-3 py-2.5 text-[14px] rounded-lg cursor-pointer ${isSelected ? 'bg-[#fff0eb] text-[#d97757] font-bold' : 'text-[#3c4257] font-medium'}`}
            >
              <span>{opt.label}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-[#d97757]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const UNIT_OPTIONS = [
  { value: 'units', label: 'Units' },
  { value: 'cans', label: 'Cans' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'packets', label: 'Bags' },
  { value: 'cases', label: 'Cases' },
];

const WEIGHT_UNIT_OPTIONS = [
  { value: 'lbs', label: 'lbs' },
  { value: 'oz', label: 'oz' },
  { value: 'fl_oz', label: 'fl oz' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'mL' },
  { value: 'l', label: 'L' },
  { value: 'gal', label: 'gal' },
];

const SOURCE_OPTIONS = [
  { value: 'not_specified', label: 'Not specified' },
  { value: 'donation', label: 'Donation' },
  { value: 'retail_rescue', label: 'Rescue' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'usda', label: 'USDA' },
];

const PACK_SIZE_PRESETS = ['3', '6', '8', '12', '24', '36', '48'];

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
  
  // Items per pack — a preset dropdown for the common cases (packs of 6, 12, 24...)
  // with a "Custom amount" escape hatch for anything unusual.
  const [packSize, setPackSize] = useState(initialItem?.packSize || '');
  const [packSizeMode, setPackSizeMode] = useState(() => {
    const v = initialItem?.packSize ? String(initialItem.packSize) : '';
    if (!v) return 'none';
    return PACK_SIZE_PRESETS.includes(v) ? v : 'custom';
  });

  // More Details
  const [donorName, setDonorName] = useState(initialItem?.donorName || '');
  const [isMoreDetailsOpen, setIsMoreDetailsOpen] = useState(false);

  const PACK_SIZE_OPTIONS = [
    { value: 'none', label: 'Not packaged' },
    ...PACK_SIZE_PRESETS.map(n => ({ value: n, label: `${n} per pack` })),
    { value: 'custom', label: 'Custom amount…' },
  ];

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
      // Fixed + z-[9999], same as the camera view and a populated cart — filling
      // out this form is just as much "mid-batch" as those, so the bottom tab
      // bar should stay covered here too instead of floating over the form
      // (it used to, since z-50 sat below the nav's own z-[100]).
      className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-[#f8fafb] flex flex-col"
    >
      {/* HEADER */}
      <div className="p-4 pt-safe flex items-center justify-between border-b bg-white shadow-sm shrink-0 relative z-10">
        <button onClick={onBack} className="flex items-center text-[#8792a2] font-semibold active:text-[#4f566b] active:scale-95 transition-all -ml-2 p-2">
          <ChevronLeft className="w-6 h-6 mr-1" strokeWidth={2.25} />
          Cancel
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-[17px] text-[#1a1f36] tracking-tight leading-tight">
            {isEditing ? 'Edit Item' : 'Add Item'}
          </h1>
          {displayBarcode && !initialItem?.isInternal && (
            <span className="text-[11px] font-bold text-[#a3acb9] uppercase tracking-widest">{displayBarcode}</span>
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
        <SectionLabel>Product</SectionLabel>
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
            <FieldSelect
              value={formCategory}
              onChange={setFormCategory}
              options={categories.map(c => ({ value: c.value, label: c.name, Icon: c.icon, iconClass: c.style.text }))}
            />
          </MobileFieldLabel>
        </div>

        {/* CARD 2: MEASUREMENTS */}
        <SectionLabel>Measurements</SectionLabel>
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
                <InlineUnitSelect value={formUnit} onChange={setFormUnit} options={UNIT_OPTIONS} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-[#8792a2]" />
                </div>
              </div>
            </div>
          </MobileFieldLabel>

          <MobileFieldLabel label="Items per Pack" optional hint="How many come in one case or bag?">
            <FieldSelect
              value={packSizeMode}
              onChange={(val) => {
                setPackSizeMode(val);
                if (val === 'none') setPackSize('');
                else if (val !== 'custom') setPackSize(val);
              }}
              options={PACK_SIZE_OPTIONS}
            />
            {packSizeMode === 'custom' && (
              <input
                type="number"
                value={packSize}
                onChange={e => setPackSize(e.target.value)}
                placeholder="e.g. 15"
                autoFocus
                className={`${inputClass} mt-2`}
              />
            )}
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
                <InlineUnitSelect value={formWeightUnit} onChange={setFormWeightUnit} options={WEIGHT_UNIT_OPTIONS} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-[#8792a2]" />
                </div>
              </div>
            </div>
          </MobileFieldLabel>
        </div>

        {/* CARD 3: METADATA */}
        <SectionLabel>Details</SectionLabel>
        <div className="bg-white border border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl p-5 space-y-5 overflow-hidden">
          <MobileFieldLabel label="Expiration Date" optional>
            {/* The input's own text/placeholder is hidden — iOS never shows a
                date input's placeholder attribute at all, while Chrome/Android
                render their own built-in "mm/dd/yyyy" hint regardless of it, so
                relying on either leaves the other platform with no filler text.
                One consistent label rendered ourselves fixes both. */}
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3acb9] pointer-events-none z-10" />
              <input
                type="date"
                value={expirationDate}
                onChange={e => setExpirationDate(e.target.value)}
                className="w-full h-[52px] pl-10 pr-10 rounded-xl border border-gray-200/80 bg-white text-transparent caret-transparent outline-none focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all appearance-none box-border max-w-full"
                style={{ colorScheme: 'light' }}
              />
              <span className={`absolute left-10 right-10 top-1/2 -translate-y-1/2 truncate pointer-events-none text-[16px] ${expirationDate ? 'font-medium text-gray-900' : 'font-medium text-[#a3acb9]'}`}>
                {expirationDate ? formatExpDateDisplay(expirationDate) : 'No date set'}
              </span>
              {expirationDate && (
                <button
                  type="button"
                  onClick={() => setExpirationDate('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 active:bg-gray-300 transition-colors z-10"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </MobileFieldLabel>

          <MobileFieldLabel label="Source Type">
            <FieldSelect value={formSource} onChange={setFormSource} options={SOURCE_OPTIONS} />
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
                <span className="text-[12px] text-[#8792a2] font-medium">Donor Name</span>
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
