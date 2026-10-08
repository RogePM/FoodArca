'use client';

// The Remove page's landing (empty cart), from the Remove canvas board 1:
// clay search header, Scan to Remove hero, Browse items by category, Expiring soon.
// Empty states: nothing expiring in the next 2 weeks, and nothing in stock at all.

import React, { useMemo, useState } from 'react';
import { Search, Scan, Plus, Check, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useInventory } from '@/lib/use-inventory';
import { useToday } from '@/components/providers/PantryProvider';
import { useSeed } from '@/components/providers/server-seed';
import { getCategoryName } from '@/lib/constants';
import { CategoryGlyph } from '@/components/ui/category-glyph';

const SOON_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;
const CARD_LIFT = 'shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]';

const isWeightUnit = (unit) => /^(lb|lbs|pound|pounds)$/i.test(unit || '');
const round = (n) => Math.round(n * 100) / 100;

// 'YYYY-MM-DD' as a local calendar date (never shifted by a timezone), so the server and the
// browser draw the same dates.
function localDate(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function shortDate(date, withYear) {
  return date.toLocaleDateString('en-US', withYear
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric' });
}

// Batch rows → one entry per item: total in stock and its earliest date.
function summarize(rows) {
  const map = new Map();
  for (const r of rows || []) {
    const qty = Number(r?.quantity || 0);
    if (!(qty > 0)) continue;
    const key = r.catalogItemId || r.barcode || r.name || 'unknown';
    const p = map.get(key) || {
      key,
      catalogItemId: r.catalogItemId || null,
      name: r.name || 'Unknown item',
      category: r.category || 'other',
      unit: r.unit,
      photoUrl: r.photoUrl || null,
      total: 0,
      earliest: null,
    };
    p.total += qty;
    if (!p.photoUrl && r.photoUrl) p.photoUrl = r.photoUrl;
    const d = localDate(r.expirationDate);
    if (d && !isNaN(d.getTime()) && (!p.earliest || d < p.earliest)) p.earliest = d;
    map.set(key, p);
  }
  return [...map.values()];
}

function stockText(p) {
  return isWeightUnit(p.unit) ? `${round(p.total)} lb in stock` : `${round(p.total)} in stock`;
}

function Thumb({ item }) {
  if (item.photoUrl) {
    return (
      <img
        src={item.photoUrl}
        alt=""
        referrerPolicy="no-referrer"
        className="w-10 h-10 shrink-0 rounded-xl border border-gray-200 bg-gray-50 object-cover"
      />
    );
  }
  return (
    <span className="w-10 h-10 shrink-0 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
      <CategoryGlyph category={item.category} className="w-7 h-7" />
    </span>
  );
}

export function RemoveLanding({ onOpenScanner, onOpenVisualGrid, onOpenProduct }) {
  const router = useRouter();
  // The shared shelf (lib/use-inventory): already loaded when the sheet opens. Until it's current,
  // the server's head start (app/dashboard/remove/page.jsx: shelf counts and the soonest four items)
  // draws the page; once the shelf has been current it stays in charge, through realtime refreshes.
  const { lots: rows, ready, fresh } = useInventory();
  const seed = useSeed('removeLanding');
  const [shelfTookOver, setShelfTookOver] = useState(false);
  if (fresh && !shelfTookOver) setShelfTookOver(true);
  const useShelf = seed ? shelfTookOver : ready;
  const loading = !useShelf && !seed;

  const items = useMemo(() => summarize(useShelf ? rows : seed?.lots), [useShelf, rows, seed]);
  const hasStock = useShelf ? items.length > 0 : (seed?.summary?.all || 0) > 0;
  const empty = !loading && !hasStock;

  // Busiest shelves first, six tiles. Counted from the shelf, or from the server's summary.
  const shelves = useMemo(() => {
    const map = new Map();
    const add = (category, n) => {
      const label = getCategoryName(category);
      const s = map.get(label) || { label, filter: category, count: 0 };
      s.count += n;
      map.set(label, s);
    };
    if (useShelf) for (const p of items) add(p.category, 1);
    else for (const [category, n] of Object.entries(seed?.summary?.categories || {})) add(category, n);
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [useShelf, items, seed]);

  // The pantry's date (the same on the server and in the browser).
  const todayIso = useToday();
  const todayDate = useMemo(() => localDate(todayIso), [todayIso]);

  // What should go out first: expired or expiring within 2 weeks, oldest first.
  const { soon, next } = useMemo(() => {
    const today = todayDate.getTime();
    const dated = items
      .filter((p) => p.earliest)
      .map((p) => ({ ...p, days: Math.round((p.earliest.getTime() - today) / DAY) }))
      .sort((a, b) => a.days - b.days);
    return {
      soon: dated.filter((p) => p.days <= SOON_DAYS).slice(0, 3),
      next: dated.find((p) => p.days > SOON_DAYS) || null,
    };
  }, [items, todayDate]);

  const thisYear = todayDate.getFullYear();
  const soonSub = (p) => {
    const date = shortDate(p.earliest, p.earliest.getFullYear() !== thisYear);
    return `${p.days < 0 ? 'Expired' : 'Expires'} ${date} · ${stockText(p)}`;
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Clay header: Remove's mark (Add's is the yellower orange). Search opens the item sheet. */}
      <div className="z-20 sticky top-0 bg-[#d97757] px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-2 shadow-[0_1px_0_0_#d97757] shrink-0">
        <button
          type="button"
          onClick={() => onOpenVisualGrid?.('all')}
          className="w-full h-12 rounded-2xl bg-white shadow-[0_4px_20px_-6px_rgba(0,0,0,0.15)] flex items-center gap-2.5 pl-3.5 pr-4 text-left text-base font-medium text-gray-400"
        >
          <Search className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
          Search items to remove
        </button>
      </div>

      <div className="flex-1 flex flex-col px-4 mt-9 pb-4 text-[#1a1f36]">
        {/* Hero: scan */}
        <div className={`border border-gray-200 rounded-2xl bg-white p-[clamp(18px,3.4dvh,24px)] ${CARD_LIFT}`}>
          <div className="flex items-start justify-between">
            <div className="flex flex-col pr-4">
              <h2 className="text-[clamp(19px,3.4dvh,23px)] font-semibold tracking-tight leading-snug">Scan to Remove</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-500">Point the camera at an item to take it out.</p>
            </div>
            <img src="/assets/images/scan-remove.svg" alt="" className="w-[clamp(78px,13dvh,104px)] h-[clamp(78px,13dvh,104px)] shrink-0" />
          </div>
          <button
            type="button"
            onClick={onOpenScanner}
            className={`w-full h-[clamp(52px,7.5dvh,58px)] mt-[clamp(16px,2.8dvh,22px)] rounded-full bg-[#d97757] active:bg-[#c66547] text-white text-[16px] font-semibold flex items-center justify-center gap-2 ${CARD_LIFT}`}
          >
            <Scan className="w-[19px] h-[19px]" strokeWidth={2.2} />
            Open Scanner
          </button>
        </div>

        {/* Browse by category: opens the sheet on that shelf */}
        <section className={`mt-8 flex flex-col ${empty ? 'flex-1' : ''}`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-medium tracking-tight text-gray-900">Browse items</h2>
            {hasStock && (
              <button
                type="button"
                onClick={() => onOpenVisualGrid?.('all')}
                className="h-11 -my-3 pl-3 text-[12.5px] font-medium text-gray-500"
              >
                See all ›
              </button>
            )}
          </div>

          {loading && !hasStock ? (
            <div className="grid grid-cols-2 gap-3" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[76px] rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : empty ? (
            // Nothing in stock: the card fills the rest of the page, content centered.
            <div className="flex-1 min-h-[240px] rounded-2xl border border-gray-200 px-5 py-6 flex flex-col items-center justify-center gap-4 text-center">
              <div className="flex gap-2" aria-hidden="true">
                {['canned', 'produce', 'dairy'].map((c) => (
                  <span key={c} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <img src={`/category-art/${c}.svg`} alt="" className="w-[30px] h-[30px] opacity-45" />
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-[16px] font-medium tracking-[-0.01em] text-[#111827]">Nothing in stock yet</h3>
                <p className="text-[13.5px] leading-normal text-gray-500">Add items first, then you can take them out here.</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard/add')}
                className="h-12 px-[18px] rounded-2xl border border-gray-300 bg-white flex items-center gap-2 text-[15px] font-semibold active:bg-gray-50"
              >
                <Plus className="w-[18px] h-[18px]" strokeWidth={2.2} />
                Go to Add items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shelves.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => onOpenVisualGrid?.(s.filter)}
                  className={`min-h-[76px] p-3 rounded-2xl border border-gray-200 bg-white flex items-center gap-3 text-left active:scale-95 active:bg-gray-50 transition-all duration-200 ${CARD_LIFT}`}
                >
                  <span className="w-12 h-12 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center">
                    <CategoryGlyph category={s.filter} className="w-8 h-8" />
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-[15px] font-medium leading-snug">{s.label}</span>
                    <span className="text-[12.5px] text-gray-500">{s.count} {s.count === 1 ? 'item' : 'items'}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* What should go out first */}
        {hasStock && (
          <section className={`mt-8 rounded-2xl border border-gray-300/70 bg-white p-4 ${CARD_LIFT}`}>
            <h2 className="mb-1 text-[16px] font-medium tracking-tight text-gray-900">Expiring soon</h2>
            <div className="flex flex-col">
              {soon.length > 0 ? (
                soon.map((p, k) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => onOpenProduct?.(p)}
                    className={`w-full min-h-[68px] py-3.5 flex items-center gap-3.5 text-left ${k < soon.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <Thumb item={p} />
                    <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="truncate text-[14px] font-medium text-[#111827]">{p.name}</span>
                      <span className={`truncate text-[12px] ${p.days < 0 ? 'text-[#b5541a] font-medium' : 'text-gray-500'}`}>{soonSub(p)}</span>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] shrink-0 text-gray-400" strokeWidth={2.2} />
                  </button>
                ))
              ) : (
                // Nothing close: say so, and point at what's next.
                <button
                  type="button"
                  onClick={() => next && onOpenProduct?.(next)}
                  disabled={!next}
                  className="w-full min-h-[68px] pt-3.5 pb-1 flex items-center gap-3.5 text-left"
                >
                  <span className="w-10 h-10 shrink-0 rounded-full bg-[#ecfdf3] text-[#15803d] flex items-center justify-center">
                    <Check className="w-5 h-5" strokeWidth={2.4} />
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-[14px] font-medium text-[#111827]">Nothing expires in the next 2 weeks</span>
                    <span className="truncate text-[12px] text-gray-500">
                      {next ? `Next: ${next.name} · ${shortDate(next.earliest, true)}` : 'No dates coming up.'}
                    </span>
                  </span>
                  {next && <ChevronRight className="w-[18px] h-[18px] shrink-0 text-gray-400" strokeWidth={2.2} />}
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
