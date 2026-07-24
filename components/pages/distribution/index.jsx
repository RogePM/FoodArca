'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePantry } from '@/components/providers/PantryProvider';

import { DistributionDesktopTable } from './distribution-desktop-table';
import { DistributionMobileList } from './distribution-mobile-list';
import { ContinuousScanner } from './continuous-scanner';
import { CartSidebar } from './cart-sidebar';
import { CartDrawer } from './cart-drawer';
import { CheckoutModal } from './checkout-modal';

export function DistributionModule({ initialInventory = [] }) {
    const { pantryId } = usePantry();

    const [inventory, setInventory] = useState(initialInventory);
    const [isLoading, setIsLoading] = useState(initialInventory.length === 0);
    const [cart, setCart] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [scanToast, setScanToast] = useState(null);
    const [isPendings, startTransition] = useTransition();

    useEffect(() => {
        if (!pantryId) return;
        let isMounted = true;
        const syncInventory = async () => {
            try {
                const res = await fetch('/api/foods', { headers: { 'x-pantry-id': pantryId } });
                if (res.ok) {
                    const json = await res.json();
                    if (isMounted) {
                        startTransition(() => {
                            setInventory(json.data || []);
                            setIsLoading(false);
                        });
                    }
                }
            } catch (err) {
                if (isMounted) setIsLoading(false);
            }
        };
        if (inventory.length === 0) syncInventory();
        const interval = setInterval(syncInventory, 20000);
        return () => { isMounted = false; clearInterval(interval); };
    }, [pantryId]);

    // Add/Update/Remove Logic
    const handleSmartAdd = (group) => {
        const bestBatch = group.batches.find(batch => {
            const inCart = cart.find(c => c.item._id === batch._id);
            return (batch.quantity - (inCart ? inCart.quantity : 0)) > 0;
        });
        if (bestBatch) addToCart(bestBatch);
    };

    const setGroupCartQty = (group, targetQty) => {
        const groupIds = new Set(group.batches.map(b => b._id));
        setCart(prev => {
            let nextCart = prev.filter(line => !groupIds.has(line.item._id));
            let remaining = targetQty;
            for (const batch of group.batches) {
                if (remaining <= 0) break;
                const qtyToAdd = Math.min(batch.quantity, remaining);
                nextCart.push({ item: batch, quantity: qtyToAdd });
                remaining -= qtyToAdd;
            }
            return nextCart;
        });
    };

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(line => line.item._id === item._id);
            if (existing) {
                if (existing.quantity < item.quantity) {
                    triggerScanToast(item.name, existing.quantity + 1);
                    return prev.map(line => line.item._id === item._id ? { ...line, quantity: line.quantity + 1 } : line);
                }
                return prev;
            }
            triggerScanToast(item.name, 1);
            return [...prev, { item, quantity: 1 }];
        });
    };

    const updateCartQty = (itemId, delta) => {
        setCart(prev => prev.map(line => {
            if (line.item._id === itemId) {
                const currentStock = inventory.find(i => i._id === itemId)?.quantity || line.item.quantity;
                return { ...line, quantity: Math.max(1, Math.min(line.quantity + delta, currentStock)) };
            }
            return line;
        }));
    };

    const removeFromCart = (itemId) => setCart(prev => prev.filter(line => line.item._id !== itemId));
    const handleCheckoutSuccess = () => { setCart([]); setIsCartOpen(false); };

    const triggerScanToast = (name, qty) => {
        setScanToast({ name, qty });
        const timer = setTimeout(() => setScanToast(null), 1500);
        return () => clearTimeout(timer);
    };

    const handleBarcodeDetected = (code) => {
        const matchedItem = inventory.find(item => item.barcode === code && item.quantity > 0);
        if (matchedItem) addToCart(matchedItem);
        else {
            const matches = inventory.filter(i => i.barcode === code && i.quantity > 0).sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
            if (matches.length > 0) addToCart(matches[0]);
        }
    };

  return (
        <div className="w-full max-w-[100vw] overflow-x-hidden bg-[#fafafa] font-sans">
            <div className="px-0 md:px-5 lg:px-4 pb-0 md:pb-8 pt-0 md:pt-4 max-w-full mx-auto overflow-hidden h-[calc(100vh-64px)] flex flex-col relative">

                <AnimatePresence>
                    {showScanner && (
                        <ContinuousScanner onScan={handleBarcodeDetected} onClose={() => setShowScanner(false)} toastMessage={scanToast} />
                    )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col lg:flex-row w-full h-full overflow-hidden gap-4">
                    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
                        <DistributionDesktopTable
                            isLoading={isLoading} inventory={inventory} cart={cart} searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery} setGroupCartQty={setGroupCartQty}
                        />
                        <DistributionMobileList
                            isLoading={isLoading} inventory={inventory} cart={cart} setGroupCartQty={setGroupCartQty}
                            onUpdateQty={updateCartQty} onRemove={removeFromCart}
                            onOpenCart={() => setIsCartOpen(true)} onOpenScanner={() => setShowScanner(true)}
                            onCheckout={() => setShowCheckout(true)}
                        />
                    </div>
                    
                    {/* RESTORED CART SIDEBAR FOR DESKTOP */}
                    <div className="hidden lg:flex flex-col h-full w-[320px] xl:w-[340px] z-20 shrink-0 bg-white border border-gray-200 rounded-[16px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                        <CartSidebar
                            cart={cart}
                            onUpdateQty={updateCartQty}
                            onRemove={removeFromCart}
                            onCheckoutSuccess={handleCheckoutSuccess}
                        />
                    </div>
                </div>

            {/* --- NEW: CART DRAWER COMPONENT --- */}
            {/* This is the actual drawer that slides up when the button above is clicked */}
            <CartDrawer 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQty={updateCartQty}
                onRemove={removeFromCart}
                onCheckoutSuccess={handleCheckoutSuccess}
            />

            <CheckoutModal 
                isOpen={showCheckout} 
                onClose={() => setShowCheckout(false)} 
                cart={cart} 
                onSuccess={handleCheckoutSuccess} 
            />

            </div>
        </div>
    );
}