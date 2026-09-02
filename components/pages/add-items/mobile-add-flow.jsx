'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { usePantry } from '@/components/providers/PantryProvider';
import { categories } from '@/lib/constants';
import { RestockSheet } from '@/components/pages/add-items/restock-sheet';
import { 
  X, ShoppingBag, Plus, Minus, Calendar,
  CheckCircle2, Package, Loader2, Keyboard, ChevronLeft, ChevronDown, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

// Helper for labels
function MobileFieldLabel({ label, optional, children }) {
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-bold text-[#1a1f36] leading-none ml-0.5">{label}</label>
        {optional && <span className="text-[11px] font-semibold text-[#a3acb9] uppercase tracking-wide mr-1">Optional</span>}
      </div>
      {children}
    </div>
  );
}

import { MobileCartView } from './mobile-cart-view';
import { MobileManualEntryView } from './mobile-manual-entry-view';

// Dynamically import the scanner overlay to avoid SSR issues
const BarcodeScannerOverlay = dynamic(
  () => import('@/components/ui/BarcodeScannerOverlay').then(mod => mod.BarcodeScannerOverlay),
  { ssr: false }
);

function formatExpDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCategoryMeta(catName) {
  const safeStr = String(catName || '').toLowerCase();
  const found = categories.find(
    (c) => c.name.toLowerCase() === safeStr || c.value.toLowerCase() === safeStr
  );
  if (found) return { icon: found.icon, name: found.name, value: found.value };
  return { icon: Package, name: 'Other', value: 'other' };
}

export function MobileAddFlow({ onClose }) {
  const { pantryId } = usePantry();

  // --- CART STATE ---
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('foodarca_staged_batch');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('foodarca_staged_batch', JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems]);

  // --- VIEW ROUTING ---
  // activeView: 'CAMERA', 'CART', 'MANUAL_ENTRY'
  const [activeView, setActiveView] = useState('CART');

  // --- SCANNER & SHEET STATE ---
  // sheetState: 'CLOSED', 'KNOWN'
  const [sheetState, setSheetState] = useState('CLOSED');
  const [isGridSheetOpen, setIsGridSheetOpen] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  const [manualEntryReturnView, setManualEntryReturnView] = useState('CART');
  // Pure bookkeeping, not rendered — kept as a ref so a scan-in-flight doesn't
  // re-render the component (a re-render here recreates handleScan, which used
  // to force the camera to tear down and reacquire mid-scan; see BarcodeScannerOverlay).
  const pendingScansRef = useRef(new Set());
  const [toastMessage, setToastMessage] = useState(null); // { title: string, count: number }
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State (for the Known Item Sheet)
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0].value);
  const [formQty, setFormQty] = useState('1');
  const [formWeight, setFormWeight] = useState('');
  const [formWeightUnit, setFormWeightUnit] = useState('lbs');
  const [formBarcode, setFormBarcode] = useState('');
  const [formExpDate, setFormExpDate] = useState('');
  const [formUnit, setFormUnit] = useState('units');

  const QUICK_UNIT_OPTIONS = [
    { value: 'units', label: 'Units' },
    { value: 'cans', label: 'Cans' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'bottles', label: 'Bottles' },
    { value: 'bags', label: 'Bags' },
    { value: 'cases', label: 'Cases' },
  ];

  const lastScanRef = useRef({ code: null, time: 0 });

  // --- FORM STATE HELPERS (update local form only, NOT cart) ---
  const syncQuantity = (newQty) => {
    setFormQty(newQty);
  };

  const syncExpDate = (newDate) => {
    setFormExpDate(newDate);
  };

  const syncUnit = (newUnit) => {
    setFormUnit(newUnit);
  };

  // --- ACTIONS ---
  
  const handleScan = async (code) => {
    // 1. Continuous Mode Debounce: 
    // Prevent scanning the EXACT same barcode within 1.5 seconds.
    const now = Date.now();
    if (lastScanRef.current.code === code && (now - lastScanRef.current.time) < 1500) {
      return;
    }
    
    // 2. Concurrency Safety: Prevent duplicate lookups of the same barcode in flight
    if (pendingScansRef.current.has(code)) return;

    lastScanRef.current = { code, time: now };
    pendingScansRef.current.add(code);
    setFormBarcode(code);

    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`, {
        headers: { 'x-pantry-id': pantryId },
        cache: 'no-store'
      });
      const data = await res.json();
      
      if (data.found && data.data) {
        // Known item found — populate popup for user confirmation (do NOT add to cart yet)
        const pendingItem = {
          id: crypto.randomUUID(),
          barcode: code,
          name: data.data.name || 'Unknown Item',
          category: data.data.category || categories[0].value,
          quantity: 1,
          totalWeightLbs: data.data.weightPerUnit || 0,
          unit: data.data.unit || 'units',
          expirationDate: '',
          photoUrl: data.data.photoUrl || null
        };

        // Populate the confirmation popup
        setScannedItem(pendingItem); 
        setFormName(pendingItem.name);
        setFormCategory(pendingItem.category);
        setFormQty('1');
        setFormWeight(pendingItem.totalWeightLbs ? String(pendingItem.totalWeightLbs) : '');
        setFormExpDate('');
        setFormUnit(pendingItem.unit || 'units');
        setSheetState('KNOWN');

        // Optional haptic
        if (navigator.vibrate) navigator.vibrate(100);

      } else {
        // Not found -> go to full screen manual entry
        openManualEntry({ barcode: code }, 'CART');
      }
    } catch (err) {
      console.error(err);
      openManualEntry({ barcode: code }, 'CART');
    } finally {
      pendingScansRef.current.delete(code);
    }
  };

  const openManualEntry = (itemToEdit = null, returnTo = 'CAMERA') => {
    setScannedItem(itemToEdit);
    setSheetState('CLOSED');
    setManualEntryReturnView(returnTo);
    setActiveView('MANUAL_ENTRY');
  };

  const handleManualEntry = () => {
    const randomCode = `INT-${Math.floor(100000 + Math.random() * 900000)}`;
    openManualEntry({ barcode: randomCode, isInternal: true }, 'CAMERA');
  };

  const closeSheet = () => {
    setSheetState('CLOSED');
    setScannedItem(null);
  };

  const showToast = (title, count) => {
    setToastMessage({ title, count });
    setTimeout(() => setToastMessage(null), 2500);
  };

  const addToBatch = () => {
    if (!formName.trim() || !formQty || isAdding) return;
    
    const qtyNum = parseFloat(formQty) || 1;
    let perUnitLbs = 0;
    if (formWeight && formWeightUnit === 'oz') {
      perUnitLbs = parseFloat(formWeight) / 16;
    } else if (formWeight) {
      perUnitLbs = parseFloat(formWeight);
    }
    
    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      barcode: formBarcode,
      name: formName.trim(),
      category: formCategory,
      categoryName: getCategoryMeta(formCategory).name,
      quantity: String(qtyNum),
      unit: scannedItem?.unit || 'units',
      weightPerUnit: perUnitLbs > 0 ? perUnitLbs.toFixed(2) : '0',
      totalWeightLbs: Number((perUnitLbs * qtyNum).toFixed(2)),
      intakeMode: 'count',
      expirationDate: formExpDate || null,
      expirationPrecision: formExpDate ? 'day' : 'none',
      sourceType: 'donation',
      photoUrl: scannedItem?.photoUrl || null
    };

    setCartItems(prev => [newItem, ...prev]);
    setIsAdding(true);
    
    setTimeout(() => {
      setIsAdding(false);
      closeSheet();
      showToast(newItem.name, cartItems.length + 1);
    }, 1000);
  };

  // Prevent background scrolling on iOS when a sheet is open
  useEffect(() => {
    if (sheetState !== 'CLOSED') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sheetState]);


  // ============================
  // ROUTER RENDER LOGIC
  // ============================

  if (activeView === 'CART') {
    return (
      <>
      <AnimatePresence>
        <MobileCartView 
          cartItems={cartItems} 
          setCartItems={setCartItems}
          pantryId={pantryId}
          onBack={(viewName) => {
            // If called with no arguments (Back button), return to Dashboard
            if (!viewName || typeof viewName !== 'string') {
              if (onClose) onClose();
              return;
            }
            if (viewName === 'SEARCH') {
              setIsGridSheetOpen(true);
              return;
            }
            if (viewName === 'MANUAL_ENTRY') {
              const randomCode = `INT-${Math.floor(100000 + Math.random() * 900000)}`;
              openManualEntry({ barcode: randomCode, isInternal: true }, 'CART');
              return;
            }
            setActiveView(viewName);
          }}
          onEdit={(item) => {
            openManualEntry(item, 'CART');
          }}
        />
      </AnimatePresence>
      <RestockSheet 
        isOpen={isGridSheetOpen}
        onClose={() => setIsGridSheetOpen(false)}
        onRestockItem={(item) => {
          const newItem = {
            id: item.id,
            barcode: item.barcode,
            name: item.name,
            category: item.category,
            categoryName: getCategoryMeta(item.category).name,
            quantity: String(item.quantity),
            unit: item.unit || 'units',
            weightPerUnit: item.weightPerUnit ? String(item.weightPerUnit) : '0',
            totalWeightLbs: item.totalWeightLbs || 0,
            intakeMode: 'count',
            expirationDate: item.expirationDate || null,
            expirationPrecision: item.expirationPrecision || 'none',
            sourceType: 'donation',
            photoUrl: item.photoUrl || null,
          };
          setCartItems(prev => [newItem, ...prev]);
          showToast(newItem.name, cartItems.length + 1);
        }}
      />
      </>
    );
  }

  if (activeView === 'MANUAL_ENTRY') {
    return (
      <MobileManualEntryView 
        onBack={() => setActiveView(manualEntryReturnView)} 
        initialItem={scannedItem}
        pantryId={pantryId}
        onSave={(updatedItem) => {
          setCartItems(prev => {
            const exists = prev.find(i => i.id === updatedItem.id);
            if (exists) {
              return prev.map(i => i.id === updatedItem.id ? updatedItem : i);
            }
            return [updatedItem, ...prev];
          });
          setActiveView(manualEntryReturnView);
          showToast(updatedItem.name, cartItems.length + (cartItems.find(i => i.id === updatedItem.id) ? 0 : 1));
        }}
      />
    );
  }

  // default: activeView === 'CAMERA'
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col w-full h-[100dvh] bg-black overflow-hidden">
      
      {/* 1. BACKGROUND CAMERA LAYER (Unmounts when navigating away) */}
      <BarcodeScannerOverlay 
        onScan={handleScan}
        isPaused={false} // True continuous mode! Never pause!
        showCloseButton={false} 
        className="absolute inset-0 z-0"
      />

      {/* 2. TOP CONTROLS */}
      <div className="absolute top-0 inset-x-0 p-4 pt-safe z-40 flex justify-between items-start pointer-events-none">
        <Button 
          variant="secondary" 
          onClick={() => setActiveView('CART')}
          className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-lg pointer-events-auto"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={2.5} />
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={handleManualEntry}
          className="h-12 px-4 rounded-full bg-white/20 backdrop-blur-md text-white font-semibold text-[13px] tracking-wide border border-white/30 shadow-lg pointer-events-auto flex items-center gap-2"
        >
          <Keyboard className="h-5 w-5" strokeWidth={2.5} />
          Manual
        </Button>
      </div>

      {/* 3. CENTER SUCCESS FLASH (Loader Removed for Continuous Flow) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            key="toast"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-0 bottom-[calc(80px+env(safe-area-inset-bottom)+8px)] z-40 flex justify-center px-4"
          >
            <button 
              onClick={() => setActiveView('CART')}
              className="bg-[#2a2f45] text-white rounded-2xl px-5 py-3.5 shadow-xl border border-gray-700 w-full max-w-sm flex items-center justify-between active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-[14px] truncate">Added {toastMessage.title}</span>
              </div>
              <div className="flex items-center gap-2 pl-3 border-l border-gray-600 ml-3 shrink-0">
                <span className="text-[13px] font-bold text-gray-300">Open Cart</span>
                <span className="bg-[#d97757] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {toastMessage.count}
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MINI-CART BAR (Replaces FAB) */}
      <div className="absolute bottom-0 inset-x-0 bg-white shadow-[0_-20px_40px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom)] z-40 pointer-events-auto">
        <div className="h-[76px] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <ShoppingBag className="w-[26px] h-[26px] text-[#1a1f36]" strokeWidth={2.5} />
              {cartItems.length > 0 && (
                <div className="absolute -top-1.5 -right-2 bg-[#FF3B30] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartItems.length}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[#1a1f36] tracking-tight">
                {cartItems.length === 0 ? 'Batch is empty' : `${cartItems.length} items staged`}
              </span>
              {cartItems.length > 0 && (
                <span className="text-[13px] font-medium text-[#8792a2]">Ready for intake</span>
              )}
            </div>
          </div>
          <Button
            onClick={() => setActiveView('CART')}
            className="h-11 px-5 rounded-full bg-[#f4f4f6] text-[#1a1f36] font-bold text-[14px] hover:bg-gray-200"
          >
            View Cart
          </Button>
        </div>
      </div>

      {/* 5. BOTTOM SHEETS (Only Known Item left) */}
      <AnimatePresence>
        {/* SCRIM */}
        {sheetState !== 'CLOSED' && (
          <motion.div 
            key="scrim"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={closeSheet}
          />
        )}

        {/* FAST INTAKE POPUP (For Known Barcodes) */}
        {sheetState === 'KNOWN' && (
          <motion.div
            key="known-popup"
            initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute bottom-[calc(76px+12px+env(safe-area-inset-bottom))] inset-x-4 z-50 bg-white rounded-[24px] shadow-[0_20px_50px_-10px_rgba(26,31,54,0.35)] border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[12px] font-bold text-[#d97757] bg-[#fff0eb] px-2.5 py-1 rounded-full flex items-center gap-1.5 tracking-wide">
                  <Package className="w-3.5 h-3.5" /> Item Found
                </span>
                <button onClick={() => setSheetState('CLOSED')} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[#8792a2] active:bg-gray-200 transition-colors shrink-0">
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex items-center gap-3.5 min-w-0">
                {scannedItem?.photoUrl ? (
                  <img src={scannedItem.photoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#fff0eb] border border-[#d97757]/10 flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6 text-[#d97757]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-bold text-[#1a1f36] leading-tight tracking-tight truncate">{formName}</h3>
                  <p className="text-[12px] font-medium text-[#8792a2] mt-1 truncate">
                    {formWeight ? `${formWeight} ${formWeightUnit} · ` : ''}{getCategoryMeta(formCategory).name}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="px-5 py-4 space-y-4">

              {/* Row 1: Quantity + Unit */}
              <div className="flex gap-3 min-w-0">
                {/* Quantity Stepper */}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-[#8792a2] uppercase tracking-wider mb-1.5 block">Qty</span>
                  <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200/80 h-[48px] min-w-0">
                    <button
                      type="button"
                      onClick={() => syncQuantity(String(Math.max(1, parseInt(formQty || '1') - 1)))}
                      className="h-full w-11 shrink-0 flex items-center justify-center text-[#4f566b] active:bg-gray-100 rounded-l-xl transition-colors"
                    >
                      <Minus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formQty}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        syncQuantity(val || '1');
                      }}
                      className="w-0 flex-1 min-w-0 text-center text-[18px] font-black text-[#1a1f36] bg-transparent outline-none h-full"
                    />
                    <button
                      type="button"
                      onClick={() => syncQuantity(String(parseInt(formQty || '1') + 1))}
                      className="h-full w-11 shrink-0 flex items-center justify-center text-[#4f566b] active:bg-gray-100 rounded-r-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Unit Dropdown (Radix — portal-based, can never clip/overflow the sheet) */}
                <div className="w-[112px] shrink-0">
                  <span className="text-[11px] font-bold text-[#8792a2] uppercase tracking-wider mb-1.5 block">Counted as</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full h-[48px] px-3 rounded-xl border border-gray-200/80 bg-gray-50 text-[13px] font-bold text-[#1a1f36] flex items-center justify-between outline-none data-[state=open]:border-[#d97757] data-[state=open]:bg-white transition-colors">
                      <span className="truncate">{QUICK_UNIT_OPTIONS.find(o => o.value === formUnit)?.label || 'Units'}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-[#a3acb9] shrink-0" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 p-1 rounded-xl bg-white border border-gray-200/90 shadow-xl z-[10050]">
                      {QUICK_UNIT_OPTIONS.map(opt => (
                        <DropdownMenuItem
                          key={opt.value}
                          onClick={() => syncUnit(opt.value)}
                          className={`flex items-center justify-between px-3 py-2 text-[13px] rounded-lg cursor-pointer ${
                            formUnit === opt.value
                              ? 'bg-[#fff0eb] text-[#d97757] font-bold'
                              : 'text-[#3c4257] font-medium'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {formUnit === opt.value && <Check className="h-3.5 w-3.5 text-[#d97757]" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Row 2: Expiration Date */}
              <div>
                <span className="text-[11px] font-bold text-[#8792a2] uppercase tracking-wider mb-1.5 block">Expiration Date</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3acb9] pointer-events-none z-10" />
                  {/* The input's own text/placeholder is hidden (text-transparent) — every
                      browser renders its native date placeholder differently (iOS shows
                      none, Chrome/Android show their own "mm/dd/yyyy" regardless of the
                      placeholder attribute), so we render one consistent label ourselves
                      instead of layering a second one on top and doubling up. */}
                  <input
                    type="date"
                    value={formExpDate}
                    onChange={e => syncExpDate(e.target.value)}
                    className="w-full h-[48px] pl-9 pr-9 rounded-xl border border-gray-200/80 bg-gray-50 text-transparent caret-transparent outline-none focus:border-[#d97757] focus:bg-white transition-colors appearance-none box-border"
                    style={{ colorScheme: 'light' }}
                  />
                  <span className={`absolute left-9 right-9 top-1/2 -translate-y-1/2 truncate pointer-events-none text-[15px] ${formExpDate ? 'font-semibold text-[#1a1f36]' : 'font-medium text-[#a3acb9]'}`}>
                    {formExpDate ? formatExpDateDisplay(formExpDate) : 'No date set'}
                  </span>
                  {/* Explicit clear button — appearance-none above also hides the
                      browser's own native "clear" control, so this is the only way
                      to reset the date once one is picked. */}
                  {formExpDate && (
                    <button
                      type="button"
                      onClick={() => syncExpDate('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 active:bg-gray-300 transition-colors z-10"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="px-5 pb-5 pt-1">
              <button
                onClick={() => {
                  // Confirmed — NOW add to cart
                  const confirmedItem = {
                    id: scannedItem?.id || crypto.randomUUID(),
                    barcode: formBarcode,
                    name: formName.trim(),
                    category: formCategory,
                    categoryName: getCategoryMeta(formCategory).name,
                    quantity: String(parseInt(formQty) || 1),
                    unit: formUnit,
                    weightPerUnit: formWeight ? (formWeightUnit === 'oz' ? (parseFloat(formWeight) / 16).toFixed(2) : parseFloat(formWeight).toFixed(2)) : '0',
                    totalWeightLbs: formWeight ? Number(((formWeightUnit === 'oz' ? parseFloat(formWeight) / 16 : parseFloat(formWeight)) * (parseInt(formQty) || 1)).toFixed(2)) : 0,
                    intakeMode: 'count',
                    expirationDate: formExpDate || null,
                    expirationPrecision: formExpDate ? 'day' : 'none',
                    sourceType: 'donation',
                    photoUrl: scannedItem?.photoUrl || null
                  };
                  setCartItems(prev => [confirmedItem, ...prev]);
                  closeSheet();
                  showToast(confirmedItem.name, cartItems.length + 1);
                }}
                className="w-full h-[50px] rounded-2xl bg-[#d97757] text-white font-bold text-[14px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(217,119,87,0.45)]"
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
                Add to Batch
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}