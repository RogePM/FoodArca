'use client';

// The Add page's landing (empty cart): search header, Scan to Add hero, the two other
// ways in, and Recently Added. Shown until the first item lands in the cart.

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckCircle2, Scan, ChevronRight } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { useSeed } from '@/components/providers/server-seed';
import { getCategoryVisual } from '@/components/pages/inventory/inventory-utils';
import { MobileInventorySearch } from '@/components/ui/mobile-inventory-search';

// The last "Recently added" list saved on this device (see the effect below), for the first draw.
function savedRecent(orgId) {
  try {
    const saved = orgId && JSON.parse(localStorage.getItem(`foodarca_recent_v1:${orgId}`) || 'null');
    return Array.isArray(saved) ? saved : null;
  } catch {
    return null;
  }
}

// shell: drawn by the server before the add flow loads (add-item-view); layout only, no requests.
export function EmptyCartLanding({ onBack, shell = false }) {
  const { pantryDetails, lastInventoryUpdate } = usePantry();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  // First draw: the server's list (app/dashboard/add/page.jsx) when it sent one, else the copy saved
  // on this device. The shell (server-drawn) uses only the server's, so it matches in the browser.
  const seeded = useSeed('recentAdded');
  const [initialRecent] = useState(() => seeded || (shell || typeof window === 'undefined' ? null : savedRecent(pantryDetails?.id)));
  const [recentItems, setRecentItems] = useState(initialRecent || []);
  const [recentItemsLoading, setRecentItemsLoading] = useState(!initialRecent);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Recently-added quick-tap strip: the items most recently received, each once, newest first,
  // with their photos, in one small request (/api/foods/changes/recent?added=8). The last list is
  // kept on the device and shown at once, then refreshed (and again whenever stock changes).
  useEffect(() => {
    const pantryId = pantryDetails?.id;
    if (!pantryId || shell) return;
    const saveKey = `foodarca_recent_v1:${pantryId}`;
    let cancelled = false;

    try {
      const saved = JSON.parse(localStorage.getItem(saveKey) || 'null');
      if (Array.isArray(saved)) {
        setRecentItems(saved);
        setRecentItemsLoading(false);
      }
    } catch {}

    fetch('/api/foods/changes/recent?added=8', { headers: { 'x-pantry-id': pantryId }, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((items) => {
        if (cancelled || !Array.isArray(items)) return;
        setRecentItems(items);
        try { localStorage.setItem(saveKey, JSON.stringify(items)); } catch {}
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRecentItemsLoading(false); });

    return () => { cancelled = true; };
  }, [pantryDetails?.id, lastInventoryUpdate, shell]);

  // Recently Added rows are read-only for now (see TODO.md — Recent Activity feature).

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 bg-white flex flex-col"
    >
      <div className="flex-1 overflow-y-auto w-full pb-[calc(clamp(72px,13dvh,104px)+env(safe-area-inset-bottom))]">
        {/* EMPTY STATE: REMOVE-PAGE STYLE ACTION CARDS */}
        <div className="flex flex-col min-h-full">
          {/* ─── STICKY SEARCH HEADER ─── same sticky-orange-bar treatment as
              Settings' mobile header, giving this screen the "top" identity
              that was missing once the title was removed. Also a real,
              useful entry point (jump straight to an inventory item) rather
              than a decorative bar. */}
          <div className="z-20 sticky top-0 bg-[#e27f2c] px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-2 shadow-[0_1px_0_0_#e27f2c] shrink-0">
            <MobileInventorySearch
              onSubmit={(query, filterId) => {
                const params = new URLSearchParams();
                if (query) params.set('q', query);
                if (filterId) params.set('filter', filterId);
                router.push(`/dashboard/inventory${params.toString() ? `?${params}` : ''}`);
              }}
              onItemSelect={(item) =>
                router.push(
                  `/dashboard/inventory?itemId=${encodeURIComponent(item.catalogItemId || item.id || item._id)}&q=${encodeURIComponent(item.name || '')}`
                )
              }
            />
          </div>

          <div className="px-4 mt-9">
            {/* ─── CARD: SCAN TO ADD (HERO) ─── */}
            <div>
              <div className="border border-gray-200 rounded-2xl bg-white p-[clamp(18px,3.4dvh,24px)] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col pr-4">
                    <h2 className="text-[clamp(19px,3.4dvh,23px)] font-semibold text-[#1a1f36] tracking-tight leading-snug">
                      Scan to Add
                    </h2>
                    <p className="text-[13.5px] text-gray-500 mt-1.5 leading-relaxed">
                      Skip manual entry.
                    </p>
                    <button
                      onClick={() => setShowHowItWorks(true)}
                      className="text-[13.5px] underline underline-offset-2 decoration-gray-400 text-[#1a1f36] font-normal mt-1.5 w-fit"
                    >
                      How it works
                    </button>
                  </div>

                  <div className="w-[clamp(78px,13dvh,104px)] h-[clamp(78px,13dvh,104px)] shrink-0 relative">
                    <img
                      src="/assets/images/add-scan-amber.jpg?v=4"
                      alt="Scan to Add"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                </div>

                <button
                  onClick={() => onBack && onBack('CAMERA')}
                  className="w-full h-[clamp(52px,7.5dvh,58px)] mt-[clamp(16px,2.8dvh,22px)] rounded-full bg-[#e27f2c] text-white text-[16px] font-semibold transition-all duration-200 hover:bg-[#cf6f20] active:scale-95 shadow-sm flex items-center justify-center gap-2"
                >
                  <Scan className="w-[19px] h-[19px]" strokeWidth={2.4} />
                  Open Scanner
                </button>
              </div>
            </div>

            {/* ─── SECONDARY OPTIONS: SEARCH TO RESTOCK + MANUAL ENTRY (COMPACT ROW) ───
                Section title + spacing lifted from Settings' section pattern
                (h2 text-[16px] font-medium mb-3, mt-8 between sections) so the
                hero and this row read as two distinct, separated groups. */}
            <div className="mt-8">
              <h2 className="text-[16px] font-medium text-gray-900 mb-3 tracking-tight">
                Or add another way
              </h2>
              <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onBack && onBack('SEARCH')}
                className="border border-gray-200 rounded-2xl bg-white p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex flex-col items-start justify-between text-left active:scale-95 active:bg-gray-50 transition-all duration-200 min-h-[148px]"
              >
                <div className="w-full flex items-center justify-between">
                  <img
                    src="/assets/images/product-photo-search.jpg"
                    alt=""
                    className="w-16 h-16 object-contain mix-blend-multiply"
                  />
                  <ChevronRight className="w-[18px] h-[18px] text-gray-400" strokeWidth={2.5} />
                </div>
                <div className="mt-3">
                  <span className="text-[15px] font-medium text-[#1a1f36] leading-snug block">
                    Search to Restock
                  </span>
                  <span className="text-[12.5px] text-gray-500 mt-0.5 leading-snug block">
                    Existing items
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onBack && onBack('MANUAL_ENTRY')}
                className="border border-gray-200 rounded-2xl bg-white p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex flex-col items-start justify-between text-left active:scale-95 active:bg-gray-50 transition-all duration-200 min-h-[148px]"
              >
                <div className="w-full flex items-center justify-between">
                  <img
                    src="/assets/images/add-manual-amber.jpg"
                    alt=""
                    className="w-16 h-16 object-contain mix-blend-multiply"
                  />
                  <ChevronRight className="w-[18px] h-[18px] text-gray-400" strokeWidth={2.5} />
                </div>
                <div className="mt-3">
                  <span className="text-[15px] font-medium text-[#1a1f36] leading-snug block">
                    Manual Entry
                  </span>
                  <span className="text-[12.5px] text-gray-500 mt-0.5 leading-snug block">
                    No barcode needed
                  </span>
                </div>
              </button>
              </div>
            </div>

            {/* ─── RECENTLY ADDED: ONE-TAP RE-ADD (real activity_logs data) ───
                Same card as Settings' "More Tools & Preferences": title
                inside the card, inset hover rows, plain trailing chevron —
                quieter than a boxed action button. Deliberately distanced
                from the primary Scan action above so it reads as a nice-to-
                have shortcut, not a co-equal focus. Capped short, with a
                "View all" row into the full Inventory page for the rest. */}
            {recentItemsLoading && (
              <div className="mt-8 bg-white border border-gray-300/70 rounded-2xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[16px] font-medium text-gray-900 tracking-tight">
                    Recently Added
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3.5 py-3.5 -mx-2 px-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="w-2/5 h-3.5 bg-gray-200/80 rounded-md animate-pulse" />
                        <div className="w-1/4 h-3 bg-gray-100 rounded-md animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!recentItemsLoading && recentItems.length > 0 && (
              <div className="mt-8 bg-white border border-gray-300/70 rounded-2xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[16px] font-medium text-gray-900 tracking-tight">
                    Recently Added
                  </h2>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/inventory')}
                    className="flex items-center gap-0.5 text-[12.5px] font-medium text-gray-400 hover:text-gray-600 transition-colors -mr-1 px-1 py-0.5"
                  >
                    View all
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentItems.slice(0, 4).map((log) => {
                    const catVisual = getCategoryVisual(log.category);
                    return (
                      <button
                        key={log.itemId}
                        type="button"
                        className="w-full flex items-center justify-between gap-3 py-3.5 -mx-2 px-2 rounded-xl hover:bg-gray-50/70 active:bg-gray-100 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {log.photoUrl ? (
                            <img
                              src={log.photoUrl}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover border border-gray-200/80 shrink-0 bg-gray-50"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200/80 flex items-center justify-center overflow-hidden shrink-0">
                              <img
                                src={catVisual.imagePath}
                                alt=""
                                className="w-full h-full object-contain mix-blend-multiply scale-125"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-[14px] font-medium text-gray-900 leading-snug truncate group-hover:text-[#d97757] transition-colors">
                              {log.itemName}
                            </h3>
                            <p className="text-[12px] text-gray-500 leading-snug mt-0.5">
                              {catVisual.name}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-[18px] w-[18px] text-gray-400 group-hover:text-gray-600 shrink-0 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SLIDE-UP SHEET: HOW IT WORKS */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showHowItWorks && (
              <div
                className="fixed inset-0 z-[99999] flex flex-col justify-end"
                style={{ isolation: 'isolate' }}
              >
                <motion.div
                  key="how-scrim"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => setShowHowItWorks(false)}
                />

                <motion.div
                  key="how-sheet"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="relative bg-white rounded-t-[32px] p-6 pb-[calc(20px+env(safe-area-inset-bottom))] max-w-lg mx-auto w-full shadow-2xl border-t border-gray-100 z-10"
                >
                  {/* Close 'X' Button */}
                  <button
                    onClick={() => setShowHowItWorks(false)}
                    className="absolute top-3.5 right-4 p-1.5 text-[#e27f2c] hover:opacity-80 active:scale-95 transition-transform"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" strokeWidth={2.5} />
                  </button>

                  <h2 className="text-[18px] font-semibold text-[#1a1f36] mb-5 mt-1">
                    How to add items
                  </h2>

                  <div className="w-full space-y-4 mb-6">
                    <div className="flex gap-3.5 items-start">
                      <div className="w-9 h-9 rounded-xl bg-[#fff0eb] flex items-center justify-center text-[#e27f2c] shrink-0">
                        <Scan className="w-4.5 h-4.5" strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1f36] text-[14px] mb-0.5">
                          1. Scan or search
                        </p>
                        <p className="text-gray-500 font-normal text-[13px] leading-snug">
                          Tap the scanner button or search items from your inventory.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3.5 items-start">
                      <div className="w-9 h-9 rounded-xl bg-[#fff0eb] flex items-center justify-center text-[#e27f2c] shrink-0">
                        <Plus className="w-4.5 h-4.5" strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1f36] text-[14px] mb-0.5">
                          2. Set quantity & exp date
                        </p>
                        <p className="text-gray-500 font-normal text-[13px] leading-snug">
                          Adjust counts and set optional expiration dates.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3.5 items-start">
                      <div className="w-9 h-9 rounded-xl bg-[#fff0eb] flex items-center justify-center text-[#e27f2c] shrink-0">
                        <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1f36] text-[14px] mb-0.5">
                          3. Stock your pantry
                        </p>
                        <p className="text-gray-500 font-normal text-[13px] leading-snug">
                          Confirm your cart to instantly update stock levels.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowHowItWorks(false)}
                    className="w-full h-[46px] bg-[#e27f2c] text-white text-[14.5px] font-semibold rounded-full active:bg-[#cf6f20] transition-colors shadow-sm"
                  >
                    Got it
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  );
}
