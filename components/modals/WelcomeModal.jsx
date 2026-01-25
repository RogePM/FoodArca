'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ScanBarcode, Zap, Camera, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Check LocalStorage on mount
    const hasSeenModal = localStorage.getItem('foodarca-welcome-v1');
    
    // 2. If they haven't seen it, show it after a small delay
    if (!hasSeenModal) {
      const timer = setTimeout(() => setIsOpen(true), 1500); 
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // 3. Save the flag so it never shows again
    localStorage.setItem('foodarca-welcome-v1', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
          >
            {/* Decoration Header */}
            <div className="h-28 bg-[#d97757]/10 w-full relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#d97757]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
                
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                    <Leaf className="h-8 w-8 text-[#d97757]" />
                </div>
            </div>

            <div className="px-6 pt-10 pb-8">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Welcome to Food Arca
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Here are three ways to speed up your workflow:
                    </p>
                </div>

                {/* FEATURE LIST */}
                <div className="space-y-3 mb-8">
                    
                    {/* Item 1: Smart Cache */}
                    <div className="flex gap-4 items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#d97757] shadow-sm">
                            <ScanBarcode className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Smart Memory</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Scan a barcode once. The app remembers it forever so you never have to type it again.
                            </p>
                        </div>
                    </div>

                    {/* Item 2: Fast Mode */}
                    <div className="flex gap-4 items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#d97757] shadow-sm">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Fast Mode</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Enable <span className="font-semibold text-gray-700">Fast Mode</span> in Settings to distribute items without adding recipient details.
                            </p>
                        </div>
                    </div>

                    {/* Item 3: Camera Distribution */}
                    <div className="flex gap-4 items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#d97757] shadow-sm">
                            <Camera className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Quick Distribution</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Use the camera scanner in the <span className="font-semibold text-gray-700">Cart</span> to find and add items instantly.
                            </p>
                        </div>
                    </div>

                </div>

                <div className="space-y-3 text-center">
                    <Button 
                        onClick={handleClose}
                        className="w-full h-12 rounded-xl bg-[#d97757] hover:bg-[#c46a4d] text-white font-bold text-sm shadow-lg shadow-orange-200/50 transition-all active:scale-[0.98]"
                    >
                        Let's Get Started
                    </Button>
                    
                    <button 
                        onClick={handleClose}
                        className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                    >
                        Don't show this again
                    </button>
                </div>
            </div>

            {/* Close X (Top Right) */}
            <button 
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-gray-400 hover:text-gray-900 transition-all"
            >
                <X className="h-4 w-4" />
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}