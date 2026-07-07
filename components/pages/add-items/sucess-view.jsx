'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Camera, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SuccessView({ 
  quantity, 
  unit, 
  itemName, 
  expirationDate, 
  onScanAnother, 
  onAddManual,
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
      
      {/* Top/Middle Area - Now scrollable to prevent pushing footer off-screen on small devices */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto py-6">
        
        {/* Glowing Soft Checkmark Badge */}
        <motion.div variants={itemVariants} className="mb-6 relative">
          <div className="absolute inset-0 bg-[#059669] opacity-15 blur-[24px] rounded-full scale-[1.5]" />
          <div className="h-24 w-24 bg-[#059669]/10 border border-[#059669]/20 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(5,150,105,0.15)]">
            <Check className="h-10 w-10 text-[#059669]" strokeWidth={3} />
          </div>
        </motion.div>
        
        <motion.h2 variants={itemVariants} className="text-[22px] font-bold text-gray-900 mb-1 tracking-tight">
          Added to Inventory
        </motion.h2>
        
        <motion.p variants={itemVariants} className="text-[15px] text-gray-500 font-medium mb-8 text-center">
          Successfully logged your item.
        </motion.p>
        
        {/* Premium Summary Card */}
        <motion.div 
          variants={itemVariants}
          className="w-full bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] rounded-[20px] overflow-hidden flex flex-col divide-y divide-gray-50"
        >
          <div className="p-3.5 px-5 flex items-center justify-between">
            <span className="text-[15px] font-medium text-gray-500">Item</span>
            <span className="text-[16px] font-semibold text-gray-900 truncate max-w-[65%] text-right">
              {itemName}
            </span>
          </div>
          
          <div className="p-3.5 px-5 flex items-center justify-between">
            <span className="text-[15px] font-medium text-gray-500">Amount</span>
            <span className="text-[16px] font-bold text-[#d97757]">
              {quantity} <span className="text-[#d97757]/80 font-semibold ml-0.5">{unit}</span>
            </span>
          </div>
          
          {expirationDate && (
            <div className="p-3.5 px-5 flex items-center justify-between bg-gray-50/30">
              <span className="text-[15px] font-medium text-gray-500">Expires</span>
              <span className="text-[16px] font-semibold text-gray-900">{expirationDate}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Area */}
      <motion.div 
        variants={itemVariants} 
        className="shrink-0 px-5 pt-2 pb-6 flex flex-col bg-white"
      >
        
        {/* Subtle, minimalist progress bar */}
        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden mb-6 mx-auto">
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 7, ease: "linear" }}
            className="h-full bg-[#d97757]/40 rounded-full"
          />
        </div>

        <div className="flex gap-3 mb-4">
          <Button 
            onClick={onScanAnother} 
            className="flex-1 h-14 text-[16px] font-bold bg-[#d97757] hover:bg-[#c06245] rounded-[20px] shadow-sm shadow-[#d97757]/20 text-white transition-all active:scale-[0.98]"
          >
            <Camera className="mr-1.5 h-5 w-5" strokeWidth={2.5} /> Scan Next
          </Button>

          <Button 
            variant="outline"
            onClick={onAddManual} 
            className="flex-1 h-14 text-[16px] font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-[20px] shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="mr-1.5 h-5 w-5" strokeWidth={2.5} /> Manual
          </Button>
        </div>
        
        {/* Visual Separation */}
        <div className="w-full h-[1px] bg-gray-100 mb-3" />
        
        <Button 
          variant="ghost" 
          onClick={onDone} 
          className="w-full h-12 text-[16px] font-bold text-gray-500 hover:bg-gray-50 rounded-[20px] active:scale-[0.98] transition-all"
        >
          I'm Done
        </Button>
      </motion.div>
    </motion.div>
  );
}