'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SuccessView({ 
  quantity, 
  unit, 
  itemName, 
  expirationDate, 
  onScanAnother, 
  onDone 
}) {
  // Increased to 7 seconds to give users more time to read
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    if (countdown <= 0) {
      onDone();
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, onDone]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4, duration: 0.6 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      /* CHANGED: Swapped to pure white for a cleaner, native app feel */
      className="relative flex-1 flex flex-col bg-white overflow-hidden"
    >
      
      {/* Top/Middle Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        
        {/* CHANGED: Removed the heavy glow. Replaced with a crisp, geometric circular badge. */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="h-28 w-28 bg-emerald-50 rounded-full flex items-center justify-center">
            {/* Swapped to the standard Check icon for a bolder, cleaner stroke */}
            <Check className="h-12 w-12 text-emerald-500" strokeWidth={3} />
          </div>
        </motion.div>
        
        <motion.h2 variants={itemVariants} className="text-[28px] font-black text-gray-900 mb-2 tracking-tight">
          Added to Inventory
        </motion.h2>
        
        <motion.p variants={itemVariants} className="text-[16px] text-gray-400 font-medium mb-10 text-center">
          Successfully logged your item.
        </motion.p>
        
        {/* CHANGED: Removed borders and drop shadows. Uses a seamless, flat gray pill container. */}
        <motion.div 
          variants={itemVariants}
          className="w-full bg-gray-50/80 rounded-[24px] p-2 flex flex-col"
        >
          <div className="p-4 px-5 flex items-center justify-between">
            <span className="text-[15px] font-medium text-gray-400">Item</span>
            <span className="text-[17px] font-bold text-gray-900 truncate max-w-[65%] text-right">
              {itemName}
            </span>
          </div>
          
          {/* Subtle internal divider */}
          <div className="h-[1px] w-[calc(100%-2.5rem)] mx-auto bg-black/[0.03]" />
          
          <div className="p-4 px-5 flex items-center justify-between">
            <span className="text-[15px] font-medium text-gray-400">Amount</span>
            <span className="text-[17px] font-black text-[#d97757]">
              {quantity} <span className="text-[#d97757]/70 font-semibold ml-0.5">{unit}</span>
            </span>
          </div>
          
          {expirationDate && (
            <>
              <div className="h-[1px] w-[calc(100%-2.5rem)] mx-auto bg-black/[0.03]" />
              <div className="p-4 px-5 flex items-center justify-between">
                <span className="text-[15px] font-medium text-gray-400">Expires</span>
                <span className="text-[17px] font-bold text-gray-900">{expirationDate}</span>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom Area */}
      <motion.div 
        variants={itemVariants} 
        /* Kept the safe area padding, removed the gradient mask for cleaner styling */
        className="shrink-0 px-5 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col gap-3 bg-white"
      >
        
        {/* Subtle, minimalist progress bar */}
        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden mb-3 mx-auto">
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 7, ease: "linear" }} // Matched to the 7-second countdown
            className="h-full bg-gray-300 rounded-full"
          />
        </div>
        
        <Button 
          onClick={onScanAnother} 
          className="w-full h-14 text-[17px] font-bold bg-[#d97757] hover:bg-[#c06245] rounded-[20px] shadow-sm text-white transition-all active:scale-[0.98]"
        >
          <Camera className="mr-2 h-5 w-5" strokeWidth={2.5} /> Scan Another
        </Button>
        
        {/* CHANGED: Swapped outline button for a borderless ghost/light-gray button to reduce visual noise */}
        <Button 
          variant="ghost" 
          onClick={onDone} 
          className="w-full h-14 text-[17px] font-bold text-gray-600 bg-gray-200 hover:bg-gray-100 rounded-[20px] active:scale-[0.98] transition-all"
        >
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}