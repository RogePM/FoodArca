'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scan, CheckCircle } from 'lucide-react';
import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';

export function ContinuousScanner({ onScan, onClose, toastMessage }) {
  
  // Lock document body scroll while scanning operations run active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col justify-between"
    >
      {/* TOP HEADER CONTROLS */}
      <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent pt-[max(env(safe-area-inset-top),16px)]">
        <div className="flex flex-col text-white">
          <span className="text-lg font-black tracking-tight">Continuous Scan</span>
          <span className="text-xs text-white/60 font-medium mt-0.5">Camera remains open between items</span>
        </div>
        <button 
          onClick={onClose}
          className="h-11 w-11 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* MAIN VIEWPORT CAMERA RENDER CONTAINER */}
      <div className="flex-1 w-full relative bg-zinc-950 flex items-center justify-center overflow-hidden">
        
        {/* Supress default overlay close mechanisms, tap onScan natively */}
        <BarcodeScannerOverlay 
          onScan={(code) => {
            if (code) {
              onScan(code);
            }
          }}
          onClose={onClose}
        />

        {/* FLOATING SUCCESS NOTIFICATION OVERLAY */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="absolute bottom-12 inset-x-6 mx-auto max-w-sm bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-2xl border border-black/[0.04] z-50"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-500" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[15px] font-black text-gray-900 truncate">
                  {toastMessage.name}
                </p>
                <p className="text-[13px] text-gray-400 font-medium mt-0.5">
                  Added to current checkout (Total: {toastMessage.qty})
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GEOMETRIC VIEWPORT RETICLE SCAN TARGET */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="w-64 h-64 border-2 border-white/20 rounded-[32px] relative flex items-center justify-center">
            {/* Corner Indicators */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#d97757] rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#d97757] rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#d97757] rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#d97757] rounded-br-xl" />
            <Scan className="h-8 w-8 text-white/20 animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}