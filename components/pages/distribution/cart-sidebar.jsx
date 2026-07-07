'use client';

import React, { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckoutModal } from './checkout-modal';

export function CartSidebar({ cart, onUpdateQty, onRemove, onCheckoutSuccess }) {
  const [showCheckout, setShowCheckout] = useState(false);
  const totalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    // FLUID SHELL: fills parent container
    <div className="flex flex-col h-full w-full bg-white border-l border-[#e5e7eb]">
      
      {/* HEADER */}
      <div className="px-4 py-6 border-b border-[#e5e7eb] shrink-0 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#111827] tracking-tight">
            Distribution Cart
          </h2>
          <button 
            onClick={() => cart.forEach(c => onRemove(c.item._id))} 
            disabled={cart.length === 0}
            className="text-[13px] text-red-500 hover:text-red-600 font-medium disabled:opacity-50 transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="flex justify-between mt-4 text-[13px]">
          <span className="text-[#6b7280]">
            {cart.length} items
          </span>
          <span className="font-medium text-[#111827]">
            Total: {totalItems} units
          </span>
        </div>
      </div>

      {/* ITEMS */}
      <div className="flex-1 min-h-0 bg-white">
        <ScrollArea className="h-full px-5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-[#9ca3af]">
              <p className="text-[13px] font-medium">Cart is empty</p>
            </div>
          ) : (
            <div className="py-2">
              {cart.map((line) => (
                <div key={line.item._id} className="flex items-center justify-between py-3 border-b border-[#f1f5f9] last:border-0 group">
                  
                  {/* Left: Name & Unit */}
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-semibold text-[13px] text-[#111827] truncate leading-tight">
                      {line.item.name}
                    </p>
                    <p className="text-[11px] text-[#6b7280] mt-0.5 truncate">
                      {line.item.unit || 'units'}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    
                    {/* Flat Square Quantity Controls */}
                    <div className="flex items-center border border-[#e5e7eb] rounded-lg overflow-hidden h-8">
                      <button 
                        onClick={() => onUpdateQty(line.item._id, -1)}
                        className="h-8 w-8 flex items-center justify-center bg-[#f9fafb] hover:bg-[#f1f5f9] text-[#374151] transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      
                      {/* INLINE NUMBER INPUT IN CART */}
                      <input 
                        type="number"
                        min="1"
                        value={line.quantity || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            onUpdateQty(line.item._id, val - line.quantity);
                          }
                        }}
                        className="w-10 text-center text-[13px] font-semibold text-[#111827] bg-white flex items-center justify-center outline-none focus:bg-[#d97757]/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <button 
                        onClick={() => onUpdateQty(line.item._id, 1)}
                        className="h-8 w-8 flex items-center justify-center bg-[#f9fafb] hover:bg-[#f1f5f9] text-[#374151] transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button 
                      onClick={() => onRemove(line.item._id)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* FOOTER */}
      <div className="p-5 border-t border-[#e5e7eb] bg-white shrink-0 flex flex-col gap-3">
        <Button 
          disabled={cart.length === 0}
          onClick={() => setShowCheckout(true)}
          className="h-11 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-[14px] font-medium w-full shadow-sm"
        >
          Distribute Items
        </Button>
      </div>

      <CheckoutModal 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)} 
        cart={cart} 
        onSuccess={onCheckoutSuccess} 
      />
    </div>
  );
}
