'use client';

import React, { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckoutModal } from './checkout-modal';

export function CartDrawer({ isOpen, onClose, cart, onUpdateQty, onRemove, onCheckoutSuccess }) {
  const [showCheckout, setShowCheckout] = useState(false);

  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent 
          side={isDesktop ? 'right' : 'bottom'} 
          className={`p-0 flex flex-col shadow-2xl bg-gray-50/50 ${isDesktop ? 'w-[400px] sm:max-w-[400px] border-l' : 'h-[85vh] rounded-t-[32px] border-t-0'}`}
        >
          
          <SheetHeader className="p-6 border-b border-black/[0.04] bg-white text-left shrink-0">
            <SheetTitle className="text-[22px] font-black text-gray-900 tracking-tight">Your Cart</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1 px-5 py-6">
            <div className="space-y-4 pb-10">
              {cart.map((line) => (
                <div key={line.item._id} className="bg-white p-4 rounded-[24px] border border-black/[0.04] shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-[17px] text-gray-900 leading-tight">
                        {line.item.name}
                      </p>
                    </div>
                    <button 
                      onClick={() => onRemove(line.item._id)}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-gray-300 active:bg-red-50 active:text-red-500 shrink-0 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center bg-gray-50 rounded-[16px] border border-black/[0.03] p-1 h-[52px]">
                      <button 
                        onClick={() => onUpdateQty(line.item._id, -1)}
                        className="h-full w-12 rounded-[12px] flex items-center justify-center bg-white shadow-sm text-gray-600 active:scale-95 transition-all"
                      >
                        <Minus className="h-5 w-5" strokeWidth={2.5} />
                      </button>
                      <span className="w-12 text-center text-[18px] font-black text-gray-900">
                        {line.quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQty(line.item._id, 1)}
                        className="h-full w-12 rounded-[12px] flex items-center justify-center bg-white shadow-sm text-gray-600 active:scale-95 transition-all"
                      >
                        <Plus className="h-5 w-5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-5 border-t border-black/[0.04] bg-white shrink-0 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <Button 
              onClick={() => { onClose(); setShowCheckout(true); }}
              className="w-full h-16 bg-[#d97757] hover:bg-[#c06245] text-white text-[18px] font-black rounded-[20px] shadow-lg transition-all active:scale-[0.98]"
            >
              Checkout <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Renders over everything when moving to checkout phase */}
      <CheckoutModal 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)} 
        cart={cart} 
        onSuccess={onCheckoutSuccess} 
      />
    </>
  );
}