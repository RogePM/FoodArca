'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Trash2, Edit3, ShoppingBag, 
  Loader2, CheckCircle2, Package, AlertTriangle 
} from 'lucide-react';

export function MobileCartView({ onBack, cartItems, setCartItems, pantryId, onEdit }) {
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState('');
  const [cartError, setCartError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearBatch = () => {
    setCartItems([]);
    try { sessionStorage.removeItem('foodarca_staged_batch'); } catch (_) {}
    onBack();
  };

  const removeFromBatch = (id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
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
      className="flex flex-col w-full h-[100dvh] bg-[#f8fafb] z-[999] fixed inset-0 overflow-hidden"
    >
      {/* HEADER */}
      <div className="p-4 pt-safe flex items-center justify-between border-b bg-white shadow-sm shrink-0 relative z-10">
        <button onClick={onBack} className="flex items-center text-gray-600 font-medium active:scale-95 transition-transform -ml-2 p-2">
          <ChevronLeft className="w-6 h-6 mr-1" />
          Back
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-lg text-gray-900 leading-tight">Staged Batch</h1>
          {cartItems.length > 0 && <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{cartItems.length} items</span>}
        </div>
        {cartItems.length > 0 ? (
          <button 
            onClick={() => setShowClearConfirm(true)} 
            className="text-rose-500 font-bold px-2 py-2 -mr-2 active:bg-rose-50 rounded-lg transition-colors"
          >
            Clear
          </button>
        ) : <div className="w-16" />}
      </div>

      {/* ITEM LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-20 opacity-70">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-gray-500 font-semibold text-lg">Batch is empty.</p>
            <p className="text-sm text-gray-400 mt-1">Scan items to add them here.</p>
          </div>
        ) : (
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl p-5 flex gap-4 relative items-center"
              >
                <div className="flex-1 min-w-0 pr-[90px]">
                  <div className="flex items-start gap-2.5 mb-1.5">
                    <span className="font-bold text-[#d97757] text-[13px] bg-[#d97757]/10 px-2 py-0.5 rounded-md shrink-0">x{item.quantity}</span>
                    <h4 className="font-bold text-[#1a1f36] text-[16px] leading-snug">{item.name}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[#8792a2]">
                    <span className="uppercase tracking-widest">{item.barcode}</span>
                    {item.totalWeightLbs > 0 && (
                      <>
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{item.totalWeightLbs} {item.weightUnit || 'lbs'}</span>
                      </>
                    )}
                    {item.unit && item.unit !== 'units' && (
                      <>
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="capitalize">{item.unit}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* ACTION BUTTONS */}
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button 
                    onClick={() => onEdit(item)}
                    className="p-3 text-[#8792a2] hover:text-[#d97757] bg-gray-50 hover:bg-[#d97757]/10 rounded-xl active:scale-95 transition-all border border-gray-200/60"
                  >
                    <Edit3 className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => removeFromBatch(item.id)}
                    className="p-3 text-[#8792a2] hover:text-rose-500 bg-gray-50 hover:bg-rose-50 rounded-xl active:scale-95 transition-all border border-gray-200/60"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* FOOTER BUTTON */}
      <div className="p-4 shrink-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[calc(1rem+env(safe-area-inset-bottom))] relative z-10">
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
      </div>

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
              className="bg-white rounded-3xl p-6 shadow-2xl relative z-10 w-full max-w-[340px]"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Clear entire batch?</h3>
              <p className="text-center text-gray-500 text-[14px] mb-6">
                This will instantly remove all {cartItems.length} items from your staged batch. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-xl active:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={clearBatch}
                  className="flex-1 h-12 bg-rose-500 text-white font-bold rounded-xl active:bg-rose-600 shadow-[0_4px_14px_rgba(244,63,94,0.3)]"
                >
                  Clear Batch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
