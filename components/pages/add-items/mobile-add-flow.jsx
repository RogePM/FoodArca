'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { usePantry } from '@/components/providers/PantryProvider';
import { categories } from '@/lib/constants';
import { 
  X, ShoppingBag, Plus, Minus, 
  CheckCircle2, Package, Loader2, Keyboard 
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
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = sessionStorage.getItem('foodarca_staged_batch');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('foodarca_staged_batch', JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems]);

  // --- VIEW ROUTING ---
  // activeView: 'CAMERA', 'CART', 'MANUAL_ENTRY'
  const [activeView, setActiveView] = useState('CAMERA');

  // --- SCANNER & SHEET STATE ---
  // sheetState: 'CLOSED', 'KNOWN'
  const [sheetState, setSheetState] = useState('CLOSED'); 
  const [scannedItem, setScannedItem] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
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

  // --- ACTIONS ---
  
  const handleScan = async (code) => {
    if (sheetState !== 'CLOSED' || isLookingUp) return; // Prevent duplicate scans
    setIsLookingUp(true);
    setFormBarcode(code);

    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`, {
        headers: { 'x-pantry-id': pantryId },
        cache: 'no-store'
      });
      const data = await res.json();
      
      if (data.found && data.data) {
        setScannedItem(data.data);
        setFormName(data.data.name || '');
        setFormCategory(data.data.category || categories[0].value);
        setFormQty('1');
        setFormWeight(data.data.weightPerUnit ? String(data.data.weightPerUnit) : '');
        setFormExpDate('');
        setSheetState('KNOWN');
      } else {
        // Not found -> go to full screen manual entry
        setScannedItem({ barcode: code });
        setActiveView('MANUAL_ENTRY');
      }
    } catch (err) {
      console.error(err);
      // Fallback to unknown if API fails
      setScannedItem({ barcode: code });
      setActiveView('MANUAL_ENTRY');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleManualEntry = () => {
    const randomCode = `INT-${Math.floor(100000 + Math.random() * 900000)}`;
    setScannedItem({ barcode: randomCode, isInternal: true });
    setActiveView('MANUAL_ENTRY');
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
      <MobileCartView 
        onBack={() => setActiveView('CAMERA')} 
        cartItems={cartItems}
        setCartItems={setCartItems}
        pantryId={pantryId}
        onEdit={(item) => {
          setScannedItem(item);
          setActiveView('MANUAL_ENTRY');
        }}
      />
    );
  }

  if (activeView === 'MANUAL_ENTRY') {
    return (
      <MobileManualEntryView 
        onBack={() => setActiveView('CAMERA')} 
        initialItem={scannedItem}
        onSave={(updatedItem) => {
          setCartItems(prev => {
            const exists = prev.find(i => i.id === updatedItem.id);
            if (exists) {
              return prev.map(i => i.id === updatedItem.id ? updatedItem : i);
            }
            return [updatedItem, ...prev];
          });
          setActiveView('CAMERA');
          showToast(updatedItem.name, cartItems.length + (cartItems.find(i => i.id === updatedItem.id) ? 0 : 1));
        }}
      />
    );
  }

  // default: activeView === 'CAMERA'
  return (
    <div className="fixed inset-0 z-[100] flex flex-col w-full h-[100dvh] bg-black overflow-hidden">
      
      {/* 1. BACKGROUND CAMERA LAYER (Unmounts when navigating away) */}
      <BarcodeScannerOverlay 
        onScan={handleScan}
        isPaused={sheetState !== 'CLOSED' || isLookingUp}
        showCloseButton={false} 
        className="absolute inset-0 z-0"
      />

      {/* 2. TOP CONTROLS */}
      <div className="absolute top-0 inset-x-0 p-4 pt-safe z-40 flex justify-between items-start pointer-events-none">
        {onClose ? (
          <Button 
            variant="secondary" 
            onClick={onClose} 
            className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg pointer-events-auto"
          >
            <X className="h-6 w-6" />
          </Button>
        ) : <div />}
        
        <Button 
          variant="secondary" 
          onClick={handleManualEntry}
          className="h-12 px-4 rounded-full bg-white/10 backdrop-blur-md text-white font-medium border border-white/20 shadow-lg pointer-events-auto flex items-center gap-2"
        >
          <Keyboard className="h-5 w-5" />
          Manual
        </Button>
      </div>

      {/* 3. CENTER LOADING / SUCCESS FLASH */}
      <AnimatePresence>
        {isLookingUp && (
          <motion.div 
            key="lookup-loader"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center shadow-2xl pointer-events-auto">
              <Loader2 className="h-10 w-10 text-white animate-spin mb-3" />
              <p className="text-white font-semibold">Looking up...</p>
            </div>
          </motion.div>
        )}
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

      {/* 4. FLOATING BATCH BUTTON */}
      <AnimatePresence>
        {sheetState === 'CLOSED' && (
          <motion.div 
            key="fab-batch"
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-[calc(80px+env(safe-area-inset-bottom)+16px)] right-6 z-40"
          >
            <button
              onClick={() => setActiveView('CART')}
              className="h-16 px-6 rounded-full bg-white text-[#d97757] font-bold shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center gap-3 border-2 border-white active:scale-95 transition-transform"
            >
              <ShoppingBag className="h-6 w-6" strokeWidth={2.5} />
              <span className="text-lg">Batch</span>
              {cartItems.length > 0 && (
                <span className="bg-[#d97757] text-white h-7 min-w-[28px] px-2 rounded-full flex items-center justify-center text-sm">
                  {cartItems.length}
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

        {/* KNOWN ITEM SHEET */}
        {sheetState === 'KNOWN' && (
          <motion.div 
            key="known-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] pb-[calc(80px+env(safe-area-inset-bottom))] flex flex-col max-h-[70vh]"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3" />
            <div className="px-6 pb-6 overflow-y-auto">
              <div className="flex items-start gap-4 mb-6">
                {scannedItem?.photoUrl ? (
                  <img src={scannedItem.photoUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 pt-1">
                  <h3 className="text-[18px] font-bold text-gray-900 leading-tight mb-1">{formName}</h3>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-[12px] font-semibold text-gray-600">
                    {React.createElement(getCategoryMeta(formCategory).icon, { className: "w-3.5 h-3.5" })}
                    {getCategoryMeta(formCategory).name}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[13px] font-bold text-gray-700 mb-3">Quantity to Add</label>
                <div className="flex items-center justify-center gap-6 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <button 
                    onClick={() => setFormQty(prev => String(Math.max(1, parseInt(prev || '1') - 1)))}
                    className="h-12 w-12 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 active:scale-90"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <input 
                    type="number" 
                    value={formQty} 
                    onChange={(e) => setFormQty(e.target.value)}
                    className="w-20 bg-transparent text-center text-3xl font-black text-gray-900 outline-none"
                  />
                  <button 
                    onClick={() => setFormQty(prev => String(parseInt(prev || '1') + 1))}
                    className="h-12 w-12 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 active:scale-90"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <MobileFieldLabel label="Expiration Date" optional>
                  <input 
                    type="date" 
                    value={formExpDate} 
                    onChange={e => setFormExpDate(e.target.value)}
                    className="w-full h-[52px] px-4 rounded-xl border border-gray-200/80 bg-white text-[16px] font-medium text-gray-900 outline-none focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all max-w-full box-border"
                  />
                </MobileFieldLabel>
              </div>

              <button 
                onClick={addToBatch}
                disabled={isAdding}
                className={`w-full h-14 rounded-2xl font-bold text-[16px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  isAdding 
                    ? 'bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)]' 
                    : 'bg-[#d97757] text-white shadow-[0_8px_20px_rgba(217,119,87,0.3)]'
                }`}
              >
                {isAdding ? (
                  <><CheckCircle2 className="w-6 h-6" strokeWidth={2.5} /> Added</>
                ) : (
                  <><Plus className="w-5 h-5" strokeWidth={3} /> Add to Batch</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}