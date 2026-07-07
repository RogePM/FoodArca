'use client';

import React, { useState } from 'react';
import { Loader2, Check, User, X, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { usePantry } from '@/components/providers/PantryProvider';

export function CheckoutModal({ isOpen, onClose, cart, onSuccess }) {
  const { pantryId, pantryDetails } = usePantry();
  const enableClientTracking = pantryDetails?.settings?.enable_client_tracking ?? true;

  const [isAnonymous, setIsAnonymous] = useState(!enableClientTracking);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState(null);

  // Simplified handler - assuming Fast Mode for clean testing
  const handleCheckout = async () => {
    setIsCheckingOut(true);

    const cartItems = cart.map(line => ({
      itemId: line.item._id,
      itemName: line.item.name,
      category: line.item.category,
      quantityDistributed: line.quantity,
      unit: line.item.unit || 'units',
      reason: 'distribution-regular'
    }));

    const payload = {
      cart: cartItems,
      clientName: isAnonymous ? 'Walk-in' : 'Tracked Client',
      clientId: isAnonymous ? 'SYS' : 'TRACKED',
      isNewClient: false,
      address: '',
      childrenCount: 0,
      adultCount: 1,
      seniorCount: 0
    };

    try {
      const response = await fetch('/api/client-distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pantry-id': pantryId },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Checkout failed");

      setCheckoutStatus('success');
      setTimeout(() => {
        setCheckoutStatus(null);
        onClose();
        onSuccess();
      }, 1500);

    } catch (e) {
      alert(`Error: ${e.message}`);
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#f2f2f7] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        {/* HEADER */}
        <div className="p-6 border-b border-black/[0.04] bg-white flex justify-between items-center shrink-0">
          <h2 className="text-[22px] font-black text-gray-900 tracking-tight">Complete Order</h2>
          <button onClick={onClose} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Settings Card */}
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-black/[0.03] space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[16px] font-bold text-gray-900">Fast Mode (Anonymous)</h4>
                <p className="text-[13px] text-gray-400 font-medium mt-0.5">Skip client tracking to save time</p>
              </div>
              <Switch 
                checked={isAnonymous} 
                onCheckedChange={setIsAnonymous} 
                disabled={!enableClientTracking}
                className="data-[state=checked]:bg-[#d97757]"
              />
            </div>

            {/* If anonymous is OFF, show the search input */}
            {!isAnonymous && (
              <>
                <div className="h-px bg-black/[0.04] w-full" />
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-gray-800 tracking-tight">Find Recipient</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      placeholder="Search name or ID..."
                      className="pl-12 h-14 bg-gray-50/80 border-black/[0.03] rounded-[16px] text-[16px] font-medium"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-white border-t border-black/[0.04] shrink-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className={`w-full h-16 text-[18px] font-black rounded-[20px] shadow-lg transition-all active:scale-[0.98] ${
              checkoutStatus === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#d97757] hover:bg-[#c06245]'
            }`}
          >
            {isCheckingOut ? (
              <div className="flex items-center gap-2"><Loader2 className="animate-spin h-6 w-6" /> Processing...</div>
            ) : checkoutStatus === 'success' ? (
              <div className="flex items-center gap-2"><Check className="h-6 w-6" /> Success!</div>
            ) : (
              `Distribute ${cart.reduce((a,c) => a + c.quantity, 0)} Items`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}