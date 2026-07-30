'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { usePantry } from '@/components/providers/PantryProvider';
import { categories } from '@/lib/constants';
import { 
  X, ShoppingBag, Plus, Minus, 
  CheckCircle2, Package, Loader2, Keyboard, ChevronLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('foodarca_staged_batch');
      if (saved) setCartItems(JSON.parse(saved));
    } catch (e) {}
  }, []);

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
  const [scannedItem, setScannedItem] = useState(null);
  const [manualEntryReturnView, setManualEntryReturnView] = useState('CART');
  const [pendingScans, setPendingScans] = useState(new Set()); // Queue system for concurrent scans
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

  const lastScanRef = useRef({ code: null, time: 0 });

  // --- INSTANT SYNC HELPERS (For Continuous Mode) ---
  const syncQuantity = (newQty) => {
    setFormQty(newQty);
    if (!scannedItem?.id) return;
    setCartItems(prev => prev.map(i => i.id === scannedItem.id ? { ...i, quantity: parseInt(newQty) || 1 } : i));
  };

  const syncExpDate = (newDate) => {
    setFormExpDate(newDate);
    if (!scannedItem?.id) return;
    setCartItems(prev => prev.map(i => i.id === scannedItem.id ? { ...i, expirationDate: newDate } : i));
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
    if (pendingScans.has(code)) return;

    lastScanRef.current = { code, time: now };
    
    setPendingScans(prev => {
      const newSet = new Set(prev);
      newSet.add(code);
      return newSet;
    });
    setFormBarcode(code);

    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`, {
        headers: { 'x-pantry-id': pantryId },
        cache: 'no-store'
      });
      const data = await res.json();
      
      if (data.found && data.data) {
        // Continuous Mode: Auto-add 1 to batch instantly!
        const autoAddedItem = {
          id: crypto.randomUUID(),
          barcode: code,
          name: data.data.name || 'Unknown Item',
          category: data.data.category || categories[0].value,
          quantity: 1,
          totalWeightLbs: data.data.weightPerUnit || 0,
          unit: 'units',
          expirationDate: ''
        };
        
        setCartItems(prev => [autoAddedItem, ...prev]);

        // Populate the Quick Edit Popup with this exact instance
        setScannedItem(autoAddedItem); 
        setFormName(autoAddedItem.name);
        setFormCategory(autoAddedItem.category);
        setFormQty('1');
        setFormWeight(autoAddedItem.totalWeightLbs ? String(autoAddedItem.totalWeightLbs) : '');
        setFormExpDate('');
        setSheetState('KNOWN');

        // Optional haptic
        if (navigator.vibrate) navigator.vibrate(100);

      } else {
        // Not found -> go to full screen manual entry
        openManualEntry({ barcode: code }, 'CAMERA');
      }
    } catch (err) {
      console.error(err);
      openManualEntry({ barcode: code }, 'CAMERA');
    } finally {
      setPendingScans(prev => {
        const newSet = new Set(prev);
        newSet.delete(code);
        return newSet;
      });
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
    );
  }

  if (activeView === 'MANUAL_ENTRY') {
    return (
      <MobileManualEntryView 
        onBack={() => setActiveView(manualEntryReturnView)} 
        initialItem={scannedItem}
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

        {/* INLINE "ITEM ADDED" POPUP (For Continuous Scanning) */}
        {sheetState === 'KNOWN' && (
          <motion.div 
            key="known-popup"
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-[calc(76px+12px+env(safe-area-inset-bottom))] inset-x-4 z-50 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] p-4 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Item Added
              </span>
              <button onClick={() => setSheetState('CLOSED')} className="text-[#8792a2] text-[13px] font-bold underline active:opacity-70">
                Dismiss
              </button>
            </div>

            <div className="flex items-start gap-4 mb-4">
              {scannedItem?.photoUrl ? (
                <img src={scannedItem.photoUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-100 shadow-sm shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <Package className="h-7 w-7 text-gray-400" />
                </div>
              )}
              <div className="flex-1 pt-0.5">
                <h3 className="text-[16px] font-bold text-[#1a1f36] leading-tight mb-1">{formName}</h3>
                <div className="text-[13px] font-medium text-[#8792a2]">
                  {formWeight ? `${formWeight} ${formWeightUnit}` : getCategoryMeta(formCategory).name}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {/* QUANTITY */}
              <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-xl p-1.5 border border-gray-100">
                <button 
                  onClick={() => syncQuantity(String(Math.max(1, parseInt(formQty || '1') - 1)))}
                  className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#4f566b] active:scale-95"
                >
                  <Minus className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <span className="text-[18px] font-black text-[#1a1f36] px-2">{formQty}</span>
                <button 
                  onClick={() => syncQuantity(String(parseInt(formQty || '1') + 1))}
                  className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#4f566b] active:scale-95"
                >
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              {/* EXP DATE */}
              <div className="flex-1">
                <input 
                  type="date" 
                  value={formExpDate} 
                  onChange={e => syncExpDate(e.target.value)}
                  className="w-full h-full min-h-[52px] px-3 rounded-xl border border-gray-100 bg-gray-50 text-[13px] font-bold text-[#1a1f36] outline-none focus:border-[#d97757] focus:bg-white transition-colors"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}