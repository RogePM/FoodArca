'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { usePantry } from '@/components/providers/PantryProvider';
import { useInventory } from '@/lib/use-inventory';
import { setCartHint, CART_HINT } from '@/lib/hint-cookies';
import {
  ChevronLeft,
  Search,
  ShoppingCart,
  CheckCircle2,
  Package,
  MinusSquare,
  Loader2,
  Scan,
  Barcode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileCheckoutCartView } from './mobile-checkout-cart-view';
import { NoBarcodeVisualGridSheet, groupInventoryByProduct } from './no-barcode-visual-grid-sheet';

// Dynamically import scanner overlay to avoid SSR issues
const BarcodeScannerOverlay = dynamic(
  () => import('@/components/ui/BarcodeScannerOverlay').then((mod) => mod.BarcodeScannerOverlay),
  { ssr: false }
);

export function MobileDistributionFlow({ onCheckoutSuccess, onClose }) {
  const { pantryId } = usePantry();

  // --- CART STATE ---
  const [cart, setCart] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('foodarca_staged_distribution_cart');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load staged distribution cart', e);
      }
    }
    return [];
  });

  // The shelf, shared with the landing and the sheet (one request, kept for the session).
  const { lots: inventory, ready: inventoryReady, refresh: refreshInventory } = useInventory();

  // Sync to sessionStorage whenever cart changes
  useEffect(() => {
    try {
      sessionStorage.setItem('foodarca_staged_distribution_cart', JSON.stringify(cart));
      setCartHint(CART_HINT.remove, cart.length > 0);
    } catch (e) {
      console.warn('Failed to persist staged distribution cart', e);
    }
  }, [cart]);

  // Group inventory for Visual Grid & Quick Action
  const groupedProducts = useMemo(() => groupInventoryByProduct(inventory), [inventory]);

  // --- VIEW & MODAL STATE ---
  // activeView: 'CART' (default hub) | 'CAMERA'
  const [activeView, setActiveView] = useState('CART');
  const [isVisualGridOpen, setIsVisualGridOpen] = useState(false);
  const [visualGridFilter, setVisualGridFilter] = useState('all');
  const [scanProduct, setScanProduct] = useState(null); // scanned item whose steps are open in the sheet

  // Scanner & Feedback State
  const [toastMessage, setToastMessage] = useState(null); // { title: string, count: number }
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const lastScanRef = useRef({ code: null, time: 0 });
  const pendingScansRef = useRef(new Set());

  // --- CART HANDLERS ---

  const handleStageItem = (stagedItem) => {
    if (!stagedItem) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (line) =>
          (stagedItem.batchId && line.batchId === stagedItem.batchId) ||
          line.id === stagedItem.id
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentLine = updated[existingIndex];
        const maxStock = Number(currentLine.availableBatchStock ?? stagedItem.availableBatchStock ?? 9999);
        const nextQty = Math.min(
          maxStock,
          Math.round((Number(currentLine.quantity || 1) + Number(stagedItem.quantity || 1)) * 100) / 100
        );
        // One line per batch: the latest reason picked for it wins.
        updated[existingIndex] = { ...currentLine, quantity: nextQty, reason: stagedItem.reason || currentLine.reason };
        return updated;
      }

      return [stagedItem, ...prev];
    });

    showToast(stagedItem.name || 'Item staged', cart.length + 1);
  };

  const handleUpdateQuantity = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id && item.batchId !== id) return item;
        const maxStock = Number(item.availableBatchStock ?? 9999);
        const currentQty = Number(item.quantity || 1);
        // Weighed lines can go below 1 lb (e.g. 0.4 lb); counted lines stop at 1.
        const isWeight = /^(lb|lbs|pound|pounds)$/i.test(item.unit || '');
        const nextQty = Math.max(isWeight ? 0.01 : 1, Math.min(maxStock, Math.round((currentQty + delta) * 100) / 100));
        return { ...item, quantity: nextQty };
      })
    );
  };

  const handleRemoveItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id && item.batchId !== id));
  };

  // Undo after Remove: put the line back where it was.
  const handleRestoreItem = (line, index) => {
    setCart((prev) => {
      if (prev.some((l) => l.id === line.id)) return prev;
      const next = prev.slice();
      next.splice(index < 0 ? 0 : Math.min(index, next.length), 0, line);
      return next;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    try {
      sessionStorage.removeItem('foodarca_staged_distribution_cart');
    } catch (_) {}
  };

  const showToast = (title, count, type = 'success') => {
    setToastMessage({ title, count, type });
    setTimeout(() => setToastMessage(null), type === 'not-found' ? 3500 : 2500);
  };

  // --- ITEM SHEET (batch → how much → reason) ---

  const handleStageFromSheet = (stagedItem) => {
    handleStageItem(stagedItem);
    setIsVisualGridOpen(false);
    // From a scan, stay on the camera to keep scanning; from the Inventory sheet, back to the cart.
    if (scanProduct) setScanProduct(null);
    else setActiveView('CART');
  };

  // --- CAMERA SCANNER HANDLER ---
  const handleScan = async (code) => {
    const now = Date.now();
    if (lastScanRef.current.code === code && now - lastScanRef.current.time < 1500) {
      return;
    }
    if (pendingScansRef.current.has(code)) return;

    lastScanRef.current = { code, time: now };
    pendingScansRef.current.add(code);

    try {
      // Find matching product in groupedProducts or inventory
      const matchedProduct = groupedProducts.find(
        (p) =>
          p.barcode === code ||
          (p.batches && p.batches.some((b) => b.barcode === code))
      );

      // Found it: open the same "Take from" / "How much" steps as the Inventory sheet.
      const openScanSteps = (product) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(80);
        }
        setScanProduct(product);
        setIsVisualGridOpen(true);
      };

      if (matchedProduct && matchedProduct.batches && matchedProduct.batches.length > 0) {
        openScanSteps(matchedProduct);
      } else {
        // Check raw inventory matches as fallback
        const matches = inventory.filter(
          (item) => item.barcode === code && Number(item.quantity) > 0
        );

        if (matches.length > 0) {
          const groupedFallback = groupInventoryByProduct(matches)[0];
          if (groupedFallback && groupedFallback.batches && groupedFallback.batches.length > 0) {
            openScanSteps(groupedFallback);
            return;
          }
        }

        // Show user-friendly toast with guidance to search via No Barcode grid
        showToast('Item not found in current inventory', cart.length, 'not-found');
      }
    } catch (err) {
      console.error('Scan handling error:', err);
      showToast('Item not found in current inventory', cart.length, 'not-found');
    } finally {
      pendingScansRef.current.delete(code);
    }
  };

  // --- CHECKOUT SUBMISSION ---
  const handleCheckout = async () => {
    if (cart.length === 0 || !pantryId) return false;
    setIsCheckingOut(true);
    setCheckoutError('');
    setCheckoutSuccess('');

    const totalCount = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

    const toPayloadLine = (line) => ({
      itemId: line.batchId || line.id,
      catalogItemId: line.catalogItemId || line.id,
      itemName: line.name,
      category: line.category,
      quantityDistributed: Number(line.quantity) || 1,
      unit: line.unit || 'units',
    });

    // Given-out lines go out as one visit; lines with a throw-out reason go out per reason.
    const groups = [];
    const givenOut = cart.filter((l) => !l.reason || l.reason === 'given_out');
    if (givenOut.length) {
      groups.push({
        lines: givenOut,
        url: '/api/client-distributions',
        body: { cart: givenOut.map(toPayloadLine), clientName: 'Walk-in', clientId: 'SYS', isNewClient: false },
      });
    }
    for (const reason of ['expired', 'damaged', 'recalled', 'other']) {
      const lines = cart.filter((l) => l.reason === reason);
      if (lines.length) groups.push({ lines, url: '/api/throw-out', body: { reason, lines: lines.map(toPayloadLine) } });
    }

    try {
      for (const group of groups) {
        const res = await fetch(group.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-pantry-id': pantryId,
          },
          body: JSON.stringify(group.body),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Checkout submission failed');
        }
        // Drop what went through, so a retry after a later failure can't remove it twice.
        const doneIds = new Set(group.lines.map((l) => l.id));
        setCart((prev) => prev.filter((l) => !doneIds.has(l.id)));
      }

      const successMsg = `Successfully deducted ${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;
      setCheckoutSuccess(successMsg);
      setCart([]);
      try {
        sessionStorage.removeItem('foodarca_staged_distribution_cart');
      } catch (_) {}

      // Refresh the shared shelf after the deduction.
      refreshInventory();

      if (onCheckoutSuccess) {
        onCheckoutSuccess();
      }

      // The cart shows its Removed screen, which leads back to the Remove page.
      setActiveView('CART');
      return true;
    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed. Please try again.');
      return false;
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* 1. PRIMARY VIEW ROUTING */}
      {activeView === 'CART' ? (
        <AnimatePresence mode="wait" initial={false}>
          <MobileCheckoutCartView
            cartItems={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onRestoreItem={handleRestoreItem}
            onClearCart={handleClearCart}
            onOpenScanner={() => setActiveView('CAMERA')}
            onOpenVisualGrid={(filter = 'all') => {
              setVisualGridFilter(filter);
              setIsVisualGridOpen(true);
            }}
            onOpenProduct={(item) => {
              // A landing row opens that item's steps, like a scan; unknown items fall back to the full sheet.
              const match = groupedProducts.find(
                (p) => (item.catalogItemId && p.catalogItemId === item.catalogItemId) || p.name === item.name
              );
              setVisualGridFilter('all');
              setScanProduct(match || null);
              setIsVisualGridOpen(true);
            }}
            onCheckout={handleCheckout}
            isSubmitting={isCheckingOut}
            checkoutSuccess={checkoutSuccess}
            checkoutError={checkoutError}
            onBack={onClose}
          />
        </AnimatePresence>
      ) : (
        /* CAMERA SCANNER VIEW */
        <div className="fixed inset-0 z-[9999] flex flex-col w-full h-[100dvh] bg-black overflow-hidden">
          {/* CAMERA STREAM LAYER */}
          <BarcodeScannerOverlay
            onScan={handleScan}
            isPaused={isVisualGridOpen}
            showCloseButton={false}
            className="absolute inset-0 z-0"
          />

          {/* TOP CONTROLS */}
          <div className="absolute top-0 inset-x-0 p-4 pt-safe z-40 flex justify-between items-start pointer-events-none">
            <Button
              variant="secondary"
              onClick={() => setActiveView('CART')}
              className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-lg pointer-events-auto"
              aria-label="Back to Cart"
            >
              <ChevronLeft className="h-7 w-7" strokeWidth={2.5} />
            </Button>
          </div>

          {/* CENTER TOAST FLASH */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                key="toast"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-x-0 bottom-[calc(80px+env(safe-area-inset-bottom)+8px)] z-40 flex justify-center px-4 pointer-events-auto"
              >
                {toastMessage.type === 'not-found' ? (
                  <button
                    onClick={() => {
                      setToastMessage(null);
                      setIsVisualGridOpen(true);
                    }}
                    className="bg-white rounded-2xl pl-3 pr-4 py-2.5 border border-gray-200 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.2)] w-full max-w-sm flex items-center justify-between active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                      <span className="w-9 h-9 rounded-full bg-[#fbeee9] text-[#d97757] flex items-center justify-center shrink-0">
                        <Search className="w-[18px] h-[18px]" strokeWidth={2.4} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[14px] text-[#1a1f36] leading-tight truncate">
                          Not in your inventory
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-gray-500 truncate">
                          Tap to search for it instead
                        </p>
                      </div>
                    </div>
                    <span className="text-[13.5px] font-semibold text-[#b5583a] shrink-0 ml-3">
                      Search
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveView('CART')}
                    className="bg-white rounded-2xl pl-3 pr-3 py-2.5 border border-gray-200 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.2)] w-full max-w-sm flex items-center justify-between active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="w-9 h-9 rounded-full bg-[#fbeee9] text-[#d97757] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-[18px] h-[18px]" strokeWidth={2.4} />
                      </span>
                      <span className="font-semibold text-[14px] text-[#1a1f36] truncate">
                        Added {toastMessage.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-3 ml-3 shrink-0 border-l border-gray-200">
                      <span className="text-[13.5px] font-semibold text-[#b5583a]">Open cart</span>
                      <span className="bg-[#d97757] text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                        {toastMessage.count}
                      </span>
                    </div>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTTOM NAVIGATION BAR */}
          <div className="absolute bottom-0 inset-x-0 bg-white z-40 pointer-events-auto shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            {/* Helper Text Subheader */}
            <div className="border-b border-gray-100 py-3.5 px-6 text-center">
              <p className="text-[14px] font-medium text-[#1a1f36]">
                Scan a barcode to remove an item from inventory
              </p>
            </div>
            
            {/* Bottom Tabs */}
            <div className="flex items-center justify-between px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
              {/* Scanner Tab (Active) */}
              <button className="flex flex-col items-center justify-center py-2 px-4 flex-1">
                <Scan className="w-6 h-6 text-[#d97757] mb-1.5" strokeWidth={2.2} />
                <span className="text-[11px] font-semibold text-[#d97757]">Scanner</span>
              </button>

              {/* No Barcode Tab */}
              <button 
                onClick={() => setIsVisualGridOpen(true)}
                className="flex flex-col items-center justify-center py-2 px-4 flex-1 active:opacity-70 transition-opacity"
              >
                <Barcode className="w-6 h-6 text-[#1a1f36] mb-1.5" strokeWidth={2.2} />
                <span className="text-[11px] font-medium text-[#1a1f36]">No barcode</span>
              </button>

              {/* Cart Tab */}
              <button 
                onClick={() => setActiveView('CART')}
                className="flex flex-col items-center justify-center py-2 px-4 flex-1 active:opacity-70 transition-opacity"
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-[#1a1f36] mb-1.5" strokeWidth={2.2} />
                  {cart.length > 0 && (
                    <div className="absolute -top-1.5 -right-2 bg-[#FF3B30] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {cart.length}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium text-[#1a1f36]">Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. "NO BARCODE" VISUAL GRID SHEET */}
      <NoBarcodeVisualGridSheet
        isOpen={isVisualGridOpen}
        onClose={() => {
          setIsVisualGridOpen(false);
          setScanProduct(null);
        }}
        startProduct={scanProduct}
        products={groupedProducts}
        loading={!inventoryReady}
        onStageItem={handleStageFromSheet}
        stagedCart={cart}
        initialCategory={visualGridFilter}
      />
    </>
  );
}
