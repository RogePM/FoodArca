'use client';

// Add Items (mobile). Every way in ends in the same cart line:
//   scan → item already in the pantry → RestockSheet, opened on the item (add to · date · how many)
//   scan → found online / not found    → NewItemForm (what is it? → how much came in?)
//   manual entry                       → NewItemForm
//   search to restock                  → RestockSheet: grid → Restock → the same steps, one sheet
// The cart is one drop-off: submitting it records the delivery and every line in history.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePantry } from '@/components/providers/PantryProvider';
import { loadInventory } from '@/lib/use-inventory';
import { setCartHint, CART_HINT } from '@/lib/hint-cookies';
import { RestockSheet } from './restock-sheet';
import { MobileCartView } from './mobile-cart-view';
import { AddFlowBottomBar } from './add-flow-bottom-bar';
import { NewItemForm } from './new-item-form';
import { toProduct, loadPantryItems } from './intake-fields';
import {
  CART_KEY, DELIVERY_KEY, EMPTY_DELIVERY, loadStored, saveStored, addLine, replaceLine,
} from './cart-lines';

const BarcodeScannerOverlay = dynamic(
  () => import('@/components/ui/BarcodeScannerOverlay').then((mod) => mod.BarcodeScannerOverlay),
  { ssr: false }
);

const productFromLine = (l) => ({
  catalogItemId: l.catalogItemId,
  name: l.name,
  photoUrl: l.photoUrl,
  barcode: l.barcode,
  categoryId: l.categoryId,
  categoryName: l.categoryName,
  isFood: l.isFood,
  trackBy: l.trackBy,
  sizeAmount: l.sizeAmount,
  sizeUnit: l.sizeUnit,
  caseSize: l.caseSize,
});

export function MobileAddFlow({ onClose }) {
  const { pantryId, lastInventoryUpdate, lastCatalogUpdate } = usePantry();
  const router = useRouter();

  // Keep the shared shelf and item list current while Add is open, so Search and a scan open their
  // sheet already filled.
  useEffect(() => { loadInventory(pantryId, lastInventoryUpdate); }, [pantryId, lastInventoryUpdate]);
  useEffect(() => { loadPantryItems(pantryId, lastCatalogUpdate); }, [pantryId, lastCatalogUpdate]);

  // --- Cart (one drop-off), kept for the session so a volunteer can step away ---
  const [cartItems, setCartItems] = useState(() => (typeof window !== 'undefined' ? loadStored(CART_KEY, []) : []));
  const [delivery, setDelivery] = useState(() =>
    typeof window !== 'undefined' ? { ...EMPTY_DELIVERY, ...loadStored(DELIVERY_KEY, EMPTY_DELIVERY) } : EMPTY_DELIVERY
  );
  useEffect(() => {
    saveStored(CART_KEY, cartItems);
    setCartHint(CART_HINT.add, cartItems.length > 0);
  }, [cartItems]);
  useEffect(() => { saveStored(DELIVERY_KEY, delivery); }, [delivery]);
  // Carts saved by the previous version of this screen can't be submitted any more.
  useEffect(() => { try { sessionStorage.removeItem('foodarca_staged_batch'); } catch {} }, []);

  // --- Views and overlays ---
  const [activeView, setActiveView] = useState('CART'); // CART | CAMERA
  const [newItem, setNewItem] = useState(null); // { initial?, editLine? }
  const [known, setKnown] = useState(null); // { product, initialLine? }
  const [restockOpen, setRestockOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const pendingScansRef = useRef(new Set());
  const lastScanRef = useRef({ code: null, time: 0 });

  const showToast = (title) => {
    clearTimeout(toastTimer.current);
    setToast(title);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const putLine = (line, isEdit) => {
    setCartItems((prev) => (isEdit ? replaceLine(prev, line) : addLine(prev, line)));
    if (!isEdit) showToast(line.name);
  };

  const openManual = () => setNewItem({ initial: { lookup: 'manual' } });
  const editLine = (line) =>
    line.catalogItemId
      ? setKnown({ product: productFromLine(line), initialLine: line })
      : setNewItem({ editLine: line });

  // Stable so the camera isn't torn down on every render (see BarcodeScannerOverlay).
  const handleScan = useCallback(async (code) => {
    const now = Date.now();
    if (lastScanRef.current.code === code && now - lastScanRef.current.time < 1500) return;
    if (pendingScansRef.current.has(code)) return;
    lastScanRef.current = { code, time: now };
    pendingScansRef.current.add(code);

    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`, {
        headers: { 'x-pantry-id': pantryId },
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.found && data.source === 'catalog') {
        setKnown({ product: toProduct(data.data) });
        if (navigator.vibrate) navigator.vibrate(100);
      } else if (data.found) {
        setNewItem({
          initial: {
            barcode: code,
            name: data.data.name || '',
            photoUrl: data.data.photoUrl || null,
            sizeAmount: data.data.sizeAmount ?? null,
            sizeUnit: data.data.sizeUnit ?? null,
            lookup: 'openfoodfacts',
          },
        });
      } else {
        setNewItem({ initial: { barcode: code, lookup: 'notfound' } });
      }
    } catch (err) {
      console.error(err);
      setNewItem({ initial: { barcode: code, lookup: 'notfound' } });
    } finally {
      pendingScansRef.current.delete(code);
    }
  }, [pantryId]);

  const exitFlow = () => (onClose ? onClose() : router.push('/dashboard'));

  const overlays = (
    <>
      {/* One sheet for search-to-restock, a scan match and Edit on a known line (opened on the item). */}
      <RestockSheet
        isOpen={restockOpen || !!known}
        startProduct={known?.product || null}
        initialLine={known?.initialLine || null}
        cartItems={cartItems}
        onClose={() => { setRestockOpen(false); setKnown(null); }}
        onAdd={(line, isEdit) => { putLine(line, isEdit); setRestockOpen(false); setKnown(null); }}
      />

      <AnimatePresence>
        {newItem && (
          <NewItemForm
            key={newItem.editLine?.id || newItem.initial?.barcode || 'manual'}
            initial={newItem.initial}
            editLine={newItem.editLine}
            pantryId={pantryId}
            onBack={() => setNewItem(null)}
            onSave={(line) => { putLine(line, !!newItem.editLine); setNewItem(null); }}
            onPickExisting={(product) => { setNewItem(null); setKnown({ product }); }}
          />
        )}
      </AnimatePresence>
    </>
  );

  if (activeView === 'CART') {
    return (
      <>
        <AnimatePresence initial={false}>
          <MobileCartView
            cartItems={cartItems}
            setCartItems={setCartItems}
            delivery={delivery}
            setDelivery={setDelivery}
            onEdit={editLine}
            onBack={(viewName) => {
              if (!viewName || typeof viewName !== 'string') return exitFlow();
              if (viewName === 'SEARCH') return setRestockOpen(true);
              if (viewName === 'MANUAL_ENTRY') return openManual();
              setActiveView(viewName);
            }}
          />
        </AnimatePresence>
        {overlays}
      </>
    );
  }

  // CAMERA
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col w-full h-[100dvh] bg-black overflow-hidden">
      <BarcodeScannerOverlay
        onScan={handleScan}
        isPaused={restockOpen || !!known || !!newItem}
        showCloseButton={false}
        className="absolute inset-0 z-0"
      />

      <div className="absolute top-0 inset-x-0 p-4 pt-safe z-40 flex justify-between items-start pointer-events-none">
        <Button
          variant="secondary"
          onClick={() => setActiveView('CART')}
          className="h-14 w-14 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 shadow-lg pointer-events-auto"
          aria-label="Back to cart"
        >
          <ChevronLeft className="h-12 w-12 text-white" strokeWidth={3} />
        </Button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="absolute inset-x-0 bottom-[calc(105px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 pointer-events-auto"
          >
            <button
              onClick={() => setActiveView('CART')}
              className="bg-white rounded-[20px] pl-3.5 pr-2 py-2 shadow-xl border border-gray-100 w-full max-w-sm flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#fff0eb] flex items-center justify-center text-[#e27f2c] shrink-0">
                  <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={2.4} />
                </div>
                <span className="font-semibold text-[14px] text-[#1a1f36] truncate">Added {toast}</span>
              </div>
              <div className="flex items-center gap-1.5 pl-3 ml-2 shrink-0 border-l border-gray-100">
                <span className="text-[13px] font-semibold text-[#e27f2c]">Open cart</span>
                <span className="bg-[#e27f2c] text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AddFlowBottomBar
        activeTab="SCANNER"
        cartCount={cartItems.length}
        helperText="Scan a barcode to add an item"
        onScanner={() => {}}
        onSearch={() => setRestockOpen(true)}
        onManual={openManual}
        onCart={() => setActiveView('CART')}
        hideCart
      />

      {overlays}
    </div>
  );
}
