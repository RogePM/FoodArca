'use client';

import React, { useState, useEffect, useMemo, useRef, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { usePantry } from '@/components/providers/PantryProvider';
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
import { NoBarcodeVisualGridSheet } from './no-barcode-visual-grid-sheet';
import { QuickActionSheet } from './quick-action-sheet';

// Dynamically import scanner overlay to avoid SSR issues
const BarcodeScannerOverlay = dynamic(
  () => import('@/components/ui/BarcodeScannerOverlay').then((mod) => mod.BarcodeScannerOverlay),
  { ssr: false }
);

/**
 * Group flat inventory batch records into products with aggregated total quantity
 * and FEFO-sorted active batches.
 */
export function groupInventoryByProduct(rawItems = []) {
  const safeItems = Array.isArray(rawItems) ? rawItems : [];
  const groups = new Map();

  for (const item of safeItems) {
    if (!item) continue;
    const qty = Number(item.quantity || 0);
    if (isNaN(qty) || qty <= 0) continue; // Only active inventory batches with positive quantity

    const groupKey = item.catalogItemId || item.barcode || item.name || 'unknown-item';
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        catalogItemId: item.catalogItemId || item.id || item._id || groupKey,
        id: item.catalogItemId || item.id || item._id || groupKey,
        name: item.name || 'Unknown Item',
        category: item.category || 'Other',
        barcode: item.barcode || null,
        photoUrl: item.photoUrl || null,
        unit: item.unit || 'units',
        totalQuantity: 0,
        batches: [],
      });
    }

    const group = groups.get(groupKey);
    group.totalQuantity += qty;

    const expKey = item.expirationDate ? item.expirationDate.split('T')[0] : 'nodate';
    
    const existingBatch = group.batches.find(b => 
      (b.expirationDate ? b.expirationDate.split('T')[0] : 'nodate') === expKey
    );

    if (existingBatch) {
      existingBatch.quantity += qty;
      // Note: we just use the first batch's id for the cart, the backend handles FEFO deduction by catalogItemId anyway
    } else {
      const batchId = item.id || item._id || item.batchId || `batch-${group.batches.length}-${expKey}`;
      group.batches.push({
        id: batchId,
        _id: batchId,
        quantity: qty,
        expirationDate: item.expirationDate || null,
        expirationPrecision: item.expirationPrecision || 'none',
        sourceType: item.sourceType || 'donation',
        receivedDate: item.receivedDate || null,
        donorName: item.donorName || null,
      });
    }
  }

  // Sort batches FEFO within each product and sort products alphabetically
  const result = Array.from(groups.values()).map((product) => {
    product.batches.sort((a, b) => {
      const timeA = a?.expirationDate ? new Date(a.expirationDate).getTime() : NaN;
      const timeB = b?.expirationDate ? new Date(b.expirationDate).getTime() : NaN;
      const hasA = !isNaN(timeA);
      const hasB = !isNaN(timeB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1; // Put null / invalid expiration dates last
      if (!hasB) return -1;
      return timeA - timeB;
    });
    return product;
  });

  result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return result;
}

export function MobileDistributionFlow({ initialItems = [], onCheckoutSuccess, onClose }) {
  const { pantryId, lastInventoryUpdate } = usePantry();

  // --- CART STATE ---
  const [cart, setCart] = useState([]);
  const [inventory, setInventory] = useState(initialItems);
  const [isPending, startTransition] = useTransition();

  // Load from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('foodarca_staged_distribution_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to load staged distribution cart from sessionStorage', e);
    }
  }, []);

  // Sync to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('foodarca_staged_distribution_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to persist staged distribution cart to sessionStorage', e);
    }
  }, [cart]);

  // Sync inventory with backend
  useEffect(() => {
    if (!pantryId) return;
    let isMounted = true;
    const syncInventory = async () => {
      try {
        const res = await fetch('/api/foods', {
          headers: { 'x-pantry-id': pantryId },
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            startTransition(() => {
              setInventory(json.data || []);
            });
          }
        }
      } catch (err) {
        console.error('Error fetching inventory in mobile distribution flow:', err);
      }
    };

    if (inventory.length === 0) {
      syncInventory();
    }
  }, [pantryId, lastInventoryUpdate]);

  // Group inventory for Visual Grid & Quick Action
  const groupedProducts = useMemo(() => groupInventoryByProduct(inventory), [inventory]);

  // --- VIEW & MODAL STATE ---
  // activeView: 'CART' (default hub) | 'CAMERA'
  const [activeView, setActiveView] = useState('CART');
  const [isVisualGridOpen, setIsVisualGridOpen] = useState(false);
  const [visualGridFilter, setVisualGridFilter] = useState('all');
  const [quickActionProduct, setQuickActionProduct] = useState(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

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
          Number(currentLine.quantity || 1) + Number(stagedItem.quantity || 1)
        );
        updated[existingIndex] = { ...currentLine, quantity: nextQty };
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
        const nextQty = Math.max(1, Math.min(maxStock, currentQty + delta));
        return { ...item, quantity: nextQty };
      })
    );
  };

  const handleRemoveItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id && item.batchId !== id));
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

  // --- PRODUCT SELECTION & QUICK ACTION HANDLERS ---

  const handleSelectProductFromGrid = (product) => {
    const batches = product?.batches || [];
    if (batches.length > 1) {
      setQuickActionProduct(product);
      setIsQuickActionOpen(true);
    } else {
      const singleBatch = batches[0] || {
        id: product.catalogItemId || product.id,
        quantity: product.totalQuantity || 1,
        expirationDate: product.expirationDate || null,
        expirationPrecision: 'none',
        sourceType: 'donation',
      };
      const stagedItem = {
        id: `${product.catalogItemId || product.id}-${singleBatch.id}`,
        batchId: singleBatch.id,
        catalogItemId: product.catalogItemId || product.id,
        name: product.name,
        category: product.category,
        categoryName: product.category,
        unit: product.unit || 'units',
        quantity: 1,
        expirationDate: singleBatch.expirationDate || null,
        expirationPrecision: singleBatch.expirationPrecision || 'none',
        availableBatchStock: Number(singleBatch.quantity || product.totalQuantity || 1),
        photoUrl: product.photoUrl || null,
        barcode: product.barcode || null,
        donorName: singleBatch.donorName || null,
        sourceType: singleBatch.sourceType || null,
      };
      handleStageItem(stagedItem);
      setIsVisualGridOpen(false);
      setActiveView('CART');
    }
  };

  const handleStageFromQuickAction = (stagedItem) => {
    handleStageItem(stagedItem);
    setIsQuickActionOpen(false);
    setQuickActionProduct(null);
    setIsVisualGridOpen(false);
    setActiveView('CART');
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

      if (matchedProduct && matchedProduct.batches && matchedProduct.batches.length > 1) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(80);
        }
        // Intercept with Quick Action Sheet for multi-batch selection
        setQuickActionProduct(matchedProduct);
        setIsQuickActionOpen(true);
      } else if (matchedProduct && matchedProduct.batches && matchedProduct.batches.length === 1) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(80);
        }
        const singleBatch = matchedProduct.batches[0];
        const stagedItem = {
          id: `${matchedProduct.catalogItemId || matchedProduct.id}-${singleBatch.id}`,
          batchId: singleBatch.id,
          catalogItemId: matchedProduct.catalogItemId || matchedProduct.id,
          name: matchedProduct.name,
          category: matchedProduct.category,
          categoryName: matchedProduct.category,
          unit: matchedProduct.unit || 'units',
          quantity: 1,
          expirationDate: singleBatch.expirationDate || null,
          expirationPrecision: singleBatch.expirationPrecision || 'none',
          availableBatchStock: Number(singleBatch.quantity || matchedProduct.totalQuantity || 1),
          photoUrl: matchedProduct.photoUrl || null,
          barcode: matchedProduct.barcode || null,
          donorName: singleBatch.donorName || null,
          sourceType: singleBatch.sourceType || null,
        };
        handleStageItem(stagedItem);
      } else {
        // Check raw inventory matches as fallback
        const matches = inventory.filter(
          (item) => item.barcode === code && Number(item.quantity) > 0
        );

        if (matches.length > 0) {
          const groupedFallback = groupInventoryByProduct(matches)[0];
          if (groupedFallback && groupedFallback.batches && groupedFallback.batches.length > 1) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(80);
            }
            setQuickActionProduct(groupedFallback);
            setIsQuickActionOpen(true);
            return;
          } else if (groupedFallback && groupedFallback.batches && groupedFallback.batches.length === 1) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(80);
            }
            const singleBatch = groupedFallback.batches[0];
            const stagedItem = {
              id: `${groupedFallback.catalogItemId || groupedFallback.id}-${singleBatch.id}`,
              batchId: singleBatch.id,
              catalogItemId: groupedFallback.catalogItemId || groupedFallback.id,
              name: groupedFallback.name,
              category: groupedFallback.category,
              categoryName: groupedFallback.category,
              unit: groupedFallback.unit || 'units',
              quantity: 1,
              expirationDate: singleBatch.expirationDate || null,
              expirationPrecision: singleBatch.expirationPrecision || 'none',
              availableBatchStock: Number(singleBatch.quantity || groupedFallback.totalQuantity || 1),
              photoUrl: groupedFallback.photoUrl || null,
              barcode: groupedFallback.barcode || null,
              donorName: singleBatch.donorName || null,
              sourceType: singleBatch.sourceType || null,
            };
            handleStageItem(stagedItem);
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
    if (cart.length === 0 || !pantryId) return;
    setIsCheckingOut(true);
    setCheckoutError('');
    setCheckoutSuccess('');

    const totalCount = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

    const cartPayload = cart.map((line) => ({
      itemId: line.batchId || line.id,
      catalogItemId: line.catalogItemId || line.id,
      itemName: line.name,
      category: line.category,
      quantityDistributed: Number(line.quantity) || 1,
      unit: line.unit || 'units',
      reason: 'Distribution',
    }));

    const payload = {
      cart: cartPayload,
      clientName: 'Walk-in',
      clientId: 'SYS',
      isNewClient: false,
    };

    try {
      const res = await fetch('/api/client-distributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pantry-id': pantryId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Checkout submission failed');
      }

      const successMsg = `Successfully deducted ${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;
      setCheckoutSuccess(successMsg);
      setCart([]);
      try {
        sessionStorage.removeItem('foodarca_staged_distribution_cart');
      } catch (_) {}

      // Refresh inventory data after checkout deduction
      try {
        const refreshRes = await fetch('/api/foods', {
          headers: { 'x-pantry-id': pantryId },
          cache: 'no-store',
        });
        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          startTransition(() => {
            setInventory(refreshJson.data || []);
          });
        }
      } catch (e) {
        console.warn('Failed to refresh inventory after checkout', e);
      }

      if (onCheckoutSuccess) {
        onCheckoutSuccess();
      }

      setTimeout(() => {
        setCheckoutSuccess('');
        setActiveView('CART');
      }, 1500);
    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* 1. PRIMARY VIEW ROUTING */}
      {activeView === 'CART' ? (
        <AnimatePresence mode="wait">
          <MobileCheckoutCartView
            cartItems={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOpenScanner={() => setActiveView('CAMERA')}
            onOpenVisualGrid={(filter = 'all') => {
              setVisualGridFilter(filter);
              setIsVisualGridOpen(true);
            }}
            onSelectProduct={handleSelectProductFromGrid}
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
            isPaused={isQuickActionOpen || isVisualGridOpen}
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
                    className="bg-[#2a2f45] text-white rounded-2xl px-5 py-3.5 shadow-xl border border-amber-500/40 w-full max-w-sm flex items-center justify-between active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                      <Search className="w-5 h-5 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[13px] text-white leading-tight">
                          Item not found in current inventory
                        </p>
                        <p className="text-[11px] text-gray-300 truncate">
                          Tap to search via No Barcode grid
                        </p>
                      </div>
                    </div>
                    <span className="bg-[#d97757] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2">
                      Search
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveView('CART')}
                    className="bg-[#2a2f45] text-white rounded-2xl px-5 py-3.5 shadow-xl border border-gray-700 w-full max-w-sm flex items-center justify-between active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-[14px] truncate">
                        Staged {toastMessage.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pl-3 border-l border-gray-600 ml-3 shrink-0">
                      <span className="text-[13px] font-bold text-gray-300">Open Cart</span>
                      <span className="bg-[#d97757] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
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
        onClose={() => setIsVisualGridOpen(false)}
        products={groupedProducts}
        onSelectProduct={handleSelectProductFromGrid}
        initialCategory={visualGridFilter}
      />

      {/* 3. QUICK ACTION SHEET (BATCH SELECTION & QUANTITY STEPPER) */}
      <QuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => {
          setIsQuickActionOpen(false);
          setQuickActionProduct(null);
        }}
        product={quickActionProduct}
        onStageItem={handleStageFromQuickAction}
        stagedCart={cart}
      />
    </>
  );
}
