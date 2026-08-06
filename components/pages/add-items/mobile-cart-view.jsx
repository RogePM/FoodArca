'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Trash2, Edit3, ShoppingBag,
  Loader2, CheckCircle2, AlertTriangle,
  Scan, Keyboard, Smartphone, Minus, Plus
} from 'lucide-react';
import { categories } from '@/lib/constants';

function getCategoryVisual(value) {
  const cat = categories.find(c => c.value === value) || categories[categories.length - 1];
  return { Icon: cat.icon, style: cat.style, name: cat.name };
}

function formatItemExpiration(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MobileCartView({ onBack, cartItems, setCartItems, pantryId, onEdit }) {
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState('');
  const [cartError, setCartError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearBatch = () => {
    setCartItems([]);
    try { sessionStorage.removeItem('foodarca_staged_batch'); } catch (_) {}
    // Emptying the cart already reverts this view to its inline (non-fullscreen)
    // layout on its own, which brings the bottom nav back — no navigation needed.
    // The old onBack() call here was a no-op anyway (add-item-view.jsx never
    // passes an onClose down), which is why this dialog used to stay stuck open.
    setShowClearConfirm(false);
  };

  const removeFromBatch = (id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItemQty = (id, delta) => {
    setCartItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const next = Math.max(1, (parseInt(i.quantity, 10) || 1) + delta);
      return { ...i, quantity: String(next) };
    }));
  };

  const submitBatch = async () => {
    if (cartItems.length === 0 || !pantryId) return;
    setIsSubmittingCart(true);
    setCartError('');
    setCartSuccess('');
    
    try {
      const response = await fetch('/api/foods/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pantry-id': pantryId },
        body: JSON.stringify({ items: cartItems }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to submit batch');
      
      setCartSuccess('Batch successfully added!');
      setCartItems([]);
      try { sessionStorage.removeItem('foodarca_staged_batch'); } catch (_) {}
      
      setTimeout(() => {
        setCartSuccess('');
        onBack();
      }, 2000);
    } catch (err) {
      setCartError(err.message);
    } finally {
      setIsSubmittingCart(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={cartItems.length > 0
        // Once a batch is staged the user is mid-task — go full-screen (same trick
        // the camera view uses) so the bottom tab bar is covered rather than
        // inviting a jump to another tab mid-batch. Submit or Clear is the way out.
        ? 'fixed inset-0 z-[9999] w-full h-[100dvh] bg-[#f8fafb] flex flex-col'
        : 'flex-1 w-full relative bg-[#f8fafb] flex flex-col min-h-full'
      }
    >
      {/* HEADER — same lightweight bar in both states; Clear only appears once there's something to clear */}
      <div className="px-5 pt-safe pb-3 border-b border-gray-200/60 bg-white/80 shrink-0 flex items-center justify-between">
        <h1 className="text-[17px] font-bold text-[#1a1f36] pt-2">Add Items</h1>
        {cartItems.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-rose-500 font-bold text-[14px] pt-2 active:opacity-60 transition-opacity"
          >
            Clear
          </button>
        )}
      </div>

      {/* ITEM LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-16 pt-4">
            {/* Title above illustration */}
            <h2 className="text-[20px] font-bold text-[#1a1f36] mb-4 tracking-tight text-center">
              Scan to Add Items
            </h2>

            {/* Custom Empty State Illustration — sized down via a scaled, clipped
                wrapper rather than resizing every piece by hand, so all the
                internal proportions/overlaps stay exactly as designed. */}
            <div className="w-44 h-44 mb-6 overflow-hidden flex items-center justify-center">
              <div className="relative w-56 h-56 shrink-0 scale-[0.786] flex items-center justify-center bg-[#f0f4f8] rounded-full overflow-hidden shadow-inner">
                {/* Background Bags */}
                <div className="absolute w-28 h-40 bg-[#ef6c00] rounded-lg rotate-12 opacity-90 shadow-sm" />
                <div className="absolute w-28 h-40 bg-[#fb8c00] rounded-lg -rotate-6 opacity-90 shadow-sm" />

                {/* Phone Outline */}
                <div className="absolute w-24 h-40 bg-[#424242] rounded-xl border-4 border-[#424242] flex flex-col items-center shadow-lg">
                  <div className="w-full flex-1 bg-white rounded-t-xl relative flex items-center justify-center overflow-hidden">
                     {/* Checkmark inside phone */}
                     <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center z-10 shadow-sm">
                       <CheckCircle2 className="w-8 h-8 text-white" />
                     </div>
                  </div>
                  <div className="w-full h-6 bg-[#424242] rounded-b-xl flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[#4f566b] text-[14px] text-center font-medium px-6 leading-snug mb-3">
              Point your camera at a product barcode to instantly add it to your batch.
            </p>
            <button
              onClick={() => setShowHowItWorks(true)}
              className="text-[#006bb6] text-[15px] font-bold hover:underline active:opacity-70"
            >
              How it works
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {cartItems.map((item) => {
              const catVisual = getCategoryVisual(item.category);
              const expLabel = formatItemExpiration(item.expirationDate);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl p-4 flex gap-3.5 items-center"
                >
                  {/* IMAGE, OR A CATEGORY-COLORED FALLBACK WHEN THERE ISN'T ONE —
                      once there's no image, this icon is the only place category
                      color shows; the category label below stays plain/dark. */}
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" />
                  ) : (
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${catVisual.style.border} ${catVisual.style.bg}`}>
                      <catVisual.Icon className={`h-6 w-6 ${catVisual.style.text}`} strokeWidth={2} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#1a1f36] text-[15px] leading-snug truncate">{item.name}</h4>
                    <p className="text-[13px] font-medium text-[#4f566b] mt-0.5 truncate">
                      {item.categoryName || catVisual.name}
                      {expLabel && <span className="text-[#a3acb9] font-normal"> · Exp {expLabel}</span>}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="flex items-center gap-1 text-[12px] font-semibold text-[#8792a2] active:text-[#d97757] transition-colors"
                      >
                        <Edit3 className="h-3 w-3" strokeWidth={2.5} /> Edit
                      </button>
                      <button
                        onClick={() => removeFromBatch(item.id)}
                        className="flex items-center gap-1 text-[12px] font-semibold text-[#8792a2] active:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={2.5} /> Remove
                      </button>
                    </div>
                  </div>

                  {/* QUANTITY — quick inline adjust, sits where a price would;
                      centered on the row (via items-center above) instead of
                      pinned to the top, and sized to actually read as the
                      row's second focal point rather than an afterthought. */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className="flex items-center bg-gray-50 border border-gray-200/80 rounded-full h-11 px-1.5">
                      <button
                        type="button"
                        onClick={() => updateItemQty(item.id, -1)}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-[#4f566b] active:bg-gray-200 transition-colors"
                      >
                        <Minus className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                      <span className="w-7 text-center text-[16px] font-bold text-[#1a1f36]">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQty(item.id, 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-[#4f566b] active:bg-gray-200 transition-colors"
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </div>
                    {item.unit && item.unit !== 'units' && (
                      <span className="text-[10px] font-semibold text-[#a3acb9] uppercase tracking-wide">{item.unit}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* FLOATING ACTION BUTTONS (ALWAYS VISIBLE) — stacked so the typed-entry
          button sits above the scan button, in both the empty and filled states */}
      <div className={`absolute right-5 flex flex-col gap-3 z-50 transition-all duration-300 ${cartItems.length > 0 ? 'bottom-[calc(90px+env(safe-area-inset-bottom))]' : 'bottom-[calc(30px+env(safe-area-inset-bottom))]'}`}>
        {/* Back to white (grey read as harder to see, not easier) — the
            contrast now comes from a real edge and a stronger lift, not
            from the fill color, so it still stays neutral/secondary next
            to the orange Scan button below it. */}
        <button
          type="button"
          onClick={() => onBack('MANUAL_ENTRY')}
          className="w-14 h-14 rounded-full bg-white text-[#4f566b] shadow-[0_6px_18px_rgba(26,31,54,0.18)] flex items-center justify-center active:scale-90 transition-transform border-2 border-gray-300"
        >
          <Keyboard className="w-6 h-6" strokeWidth={2} />
        </button>
        <button 
          type="button"
          onClick={() => onBack('CAMERA')}
          className="w-14 h-14 rounded-full bg-[#d97757] text-white shadow-[0_8px_20px_rgba(217,119,87,0.3)] flex items-center justify-center active:scale-90 transition-transform"
        >
          <Scan className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* FOOTER BUTTON (ONLY VISIBLE IF ITEMS IN CART) */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="p-4 shrink-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[calc(1rem+env(safe-area-inset-bottom))] relative z-10"
          >
            {cartError && <p className="text-rose-600 text-[13px] text-center mb-3 font-bold bg-rose-50 py-2 rounded-lg">{cartError}</p>}
            
            <button
              type="button"
              disabled={(cartItems.length === 0 && !cartSuccess) || isSubmittingCart}
              onClick={cartSuccess ? undefined : submitBatch}
              className={`w-full h-[56px] text-[16px] font-bold rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-2 ${
                cartSuccess 
                  ? 'bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)]' 
                  : 'bg-[#d97757] hover:bg-[#c66547] text-white shadow-[0_4px_14px_rgba(217,119,87,0.3)]'
              }`}
            >
              {isSubmittingCart ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</>
              ) : cartSuccess ? (
                <><CheckCircle2 className="h-6 w-6" strokeWidth={2.5} /> {cartSuccess}</>
              ) : (
                <><ShoppingBag className="h-5 w-5" strokeWidth={2.5} /> Submit Batch</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLEAR CONFIRMATION MODAL */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] p-6 shadow-2xl relative z-10 w-full max-w-[340px] border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-500" strokeWidth={2.25} />
              </div>
              <h3 className="text-[18px] font-bold text-center text-[#1a1f36] tracking-tight mb-1.5">Clear this batch?</h3>
              <p className="text-center text-[#8792a2] text-[14px] leading-relaxed mb-6">
                This removes all {cartItems.length} staged {cartItems.length === 1 ? 'item' : 'items'}. You won't be able to undo it.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 h-12 bg-[#f4f4f6] text-[#1a1f36] font-bold text-[14px] rounded-2xl active:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearBatch}
                  className="flex-1 h-12 bg-rose-500 text-white font-bold text-[14px] rounded-2xl active:bg-rose-600 shadow-[0_4px_14px_rgba(244,63,94,0.3)] transition-colors"
                >
                  Clear Batch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOW IT WORKS MODAL */}
      {mounted ? createPortal(
        <AnimatePresence>
          {showHowItWorks && (
            <div className="fixed inset-0 z-[9999] flex flex-col justify-end" style={{ isolation: 'isolate' }}>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowHowItWorks(false)}
              />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-2xl flex flex-col items-center"
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-5" />
                
                <h2 className="text-[20px] font-bold text-[#1a1f36] mb-6 text-center">How to Add Items</h2>
                
                <div className="w-full space-y-5 mb-8 px-2">
                  <div className="flex gap-4 items-start">
                    <div className="bg-[#d97757]/10 p-2.5 rounded-xl text-[#d97757] shrink-0">
                      <Scan className="w-6 h-6" strokeWidth={2.5}/>
                    </div>
                    <div>
                      <p className="font-bold text-[#1a1f36] text-[15px] mb-0.5">1. Tap Scan</p>
                      <p className="text-[#697386] text-[14px] leading-snug">Press the floating orange scanner button on the bottom right.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="bg-[#d97757]/10 p-2.5 rounded-xl text-[#d97757] shrink-0">
                      <Smartphone className="w-6 h-6" strokeWidth={2.5}/>
                    </div>
                    <div>
                      <p className="font-bold text-[#1a1f36] text-[15px] mb-0.5">2. Point Camera</p>
                      <p className="text-[#697386] text-[14px] leading-snug">Aim your device at any food product's barcode.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="bg-[#d97757]/10 p-2.5 rounded-xl text-[#d97757] shrink-0">
                      <CheckCircle2 className="w-6 h-6" strokeWidth={2.5}/>
                    </div>
                    <div>
                      <p className="font-bold text-[#1a1f36] text-[15px] mb-0.5">3. Auto-Stage</p>
                      <p className="text-[#697386] text-[14px] leading-snug">We'll instantly identify the item and stage it in your batch!</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowHowItWorks(false)}
                  className="w-full h-[56px] bg-[#1a1f36] text-white text-[16px] font-bold rounded-xl active:scale-95 transition-transform shadow-[0_8px_20px_rgba(26,31,54,0.2)]"
                >
                  Got it
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      ) : null}
    </motion.div>
  );
}
