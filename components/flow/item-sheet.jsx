'use client';

// One item sheet for Add (Restock) and Remove (Take out), in the Remove look:
//   grid: search · filter pills · 2-column tiles with an "in cart" badge and the page's action
//   step: the same sheet turns into the item (the page passes the title, Back and the content)
// Plus the step pieces both pages share: the item line, choice rows, the counter and the footer button.

import React, { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Layers, Loader2, Plus, Minus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { getCategoryName } from '@/lib/constants';
import { CategoryGlyph } from '@/components/ui/category-glyph';
import { useEndSentinel } from '@/lib/use-progressive-list';
import { FLOW_THEMES } from './cart';

const noop = () => {};
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const productKey = (p) => p.catalogItemId || p.id;

// Earliest date across an item's batches, and what that means today.
export function dateMeta(product) {
  const dates = (product?.batches?.length ? product.batches : [product])
    .map((b) => b?.expirationDate && new Date(b.expirationDate))
    .filter((d) => d && !isNaN(d.getTime()));
  if (!dates.length) return { hasDate: false, isExpired: false, isExpiringSoon: false };
  const earliest = new Date(Math.min(...dates));
  const today = new Date();
  earliest.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((earliest - today) / 86400000);
  return { hasDate: true, isExpired: days < 0, isExpiringSoon: days >= 0 && days <= 30 };
}

const STATUS = {
  expired: { name: 'Expired', test: (p) => dateMeta(p).isExpired, dates: true },
  expiring_soon: { name: 'Expiring Soon', test: (p) => dateMeta(p).isExpiringSoon, dates: true },
  low_stock: { name: 'Low Stock', test: (p) => { const q = Number(p.totalQuantity) || 0; return q > 0 && q < 5; } },
  out_of_stock: { name: 'Out of stock', test: (p) => !(Number(p.totalQuantity) > 0) },
  no_date: { name: 'No Date', test: (p) => !dateMeta(p).hasDate, dates: true },
};

// Pill counts from a list on the device, in the same shape a server source gives them:
// { all, status: { expired: n, … }, categories: [{ id, name, count }] }.
function countsOf(products) {
  const status = {};
  for (const [id, s] of Object.entries(STATUS)) status[id] = products.filter(s.test).length;
  return { all: products.length, status, categories: categoryCounts(products.map((p) => [p.category, 1])) };
}

/** Category pills from [category, count] pairs, merged by display name, most items first. */
export function categoryCounts(pairs) {
  const cats = new Map();
  for (const [category, n] of pairs) {
    const k = norm(getCategoryName(category));
    const c = cats.get(k) || { id: category, name: getCategoryName(category), count: 0 };
    c.count += n;
    cats.set(k, c);
  }
  return [...cats.values()].sort((a, b) => b.count - a.count);
}

// No server source: the sheet filters the products it's given.
const useNoServer = () => null;

function matchesFilter(product, filter) {
  if (!filter || filter === 'all') return true;
  if (STATUS[filter]) return STATUS[filter].test(product);
  return norm(product.category) === norm(filter) || norm(getCategoryName(product.category)) === norm(getCategoryName(filter));
}

// ---------------------------------------------------------------------------
// The sheet
// ---------------------------------------------------------------------------

/**
 * @param products    [{ catalogItemId|id, name, category, photoUrl, barcode, totalQuantity, batches? }], sorted
 * @param actionLabel the tile button ("Take out" / "Restock")
 * @param onPick      tile tapped
 * @param inCart(p)   "2 in cart" text, or null
 * @param datePills   show the date filters (Remove: items carry their batches' dates)
 * @param step        null for the grid, or { title, onBack?, content } once an item is open
 * @param hideGrid    opened on one item (a scan): nothing behind its steps
 * @param useServerList  for pantries too large to keep whole on the device: a hook
 *        ({ query, filter, open, products }) => null (use `products`) or { products, counts, loading,
 *        pending, hasMore, loadMore }, the matching items a page at a time, counts as countsOf gives
 */
export function ItemSheet({
  theme = 'remove',
  isOpen,
  onClose,
  title = 'Inventory',
  products = [],
  loading = false,
  actionLabel,
  onPick,
  inCart,
  datePills = false,
  initialFilter = 'all',
  searchPlaceholder = 'Find an item in the pantry',
  emptyText = 'Nothing here yet.',
  step = null,
  hideGrid = false,
  useServerList = useNoServer,
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [, startTransition] = useTransition();
  // The input stays instant; the grid catches up a beat behind on slow phones.
  const deferredQuery = useDeferredValue(query);

  // Fresh each time it opens.
  useEffect(() => {
    if (isOpen) {
      setFilter(initialFilter);
    } else {
      setQuery('');
    }
  }, [isOpen, initialFilter]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // A large pantry: the page's server source hands out the matching items a page at a time.
  const server = useServerList({ query: deferredQuery, filter, open: isOpen && !hideGrid, products });

  // Searchable text built once per product list, not on every keystroke.
  const indexed = useMemo(
    () => (server ? [] : products.map((p) => ({ p, text: `${p.name || ''} ${p.category || ''} ${getCategoryName(p.category)} ${p.barcode || ''}`.toLowerCase() }))),
    [products, server]
  );

  const localCounts = useMemo(() => (server ? null : countsOf(products)), [products, server]);
  const counts = server ? server.counts : localCounts;

  // "All", the status filters that have items, then each category the list has (most items first).
  const pills = useMemo(() => {
    if (!counts) return [{ id: 'all', name: 'All', count: 0 }];
    const list = [{ id: 'all', name: 'All', count: counts.all }];
    for (const [id, s] of Object.entries(STATUS)) {
      if (s.dates && !datePills) continue;
      list.push({ id, name: s.name, count: counts.status[id] || 0 });
    }
    return [...list, ...counts.categories]
      .filter((pill) => pill.id === 'all' || pill.count > 0 || pill.id === filter);
  }, [counts, datePills, filter]);

  const localShown = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return indexed.filter(({ p, text }) => matchesFilter(p, filter) && (!q || text.includes(q))).map(({ p }) => p);
  }, [indexed, filter, deferredQuery]);
  const shown = server ? server.products : localShown;
  const isLoading = server ? server.loading : loading;
  // The next page, as the end of the grid nears.
  const morePages = useEndSentinel(server?.loadMore || noop, !!server?.hasMore, shown.length);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ ...FLOW_THEMES[theme], isolation: 'isolate' }} className="fixed inset-0 z-[10000] flex flex-col justify-end">
          <motion.div
            key="item-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            key="item-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="item-sheet-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[92dvh] h-[88dvh] w-full overflow-hidden"
          >
            {/* Header */}
            <div className="relative flex items-center justify-center pt-4 pb-3.5 shrink-0">
              {step?.onBack && (
                <button
                  type="button"
                  onClick={step.onBack}
                  className="absolute left-4 p-1 text-gray-500 active:text-[#1a1f36] transition-colors"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                </button>
              )}
              <h2 id="item-sheet-title" className="text-[17px] font-medium text-[#1a1f36] tracking-tight">
                {step ? step.title : title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-5 text-[color:var(--accent)] active:scale-95 transition-all p-1"
                aria-label="Close"
              >
                <X className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>

            {step ? (
              step.content
            ) : hideGrid ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[color:var(--accent)] animate-spin" />
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="px-5 pt-1 pb-2 shrink-0">
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      enterKeyHint="search"
                      className="w-full h-[42px] pl-11 pr-10 bg-white border border-gray-300 rounded-full text-[16px] font-normal text-[#1a1f36] placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="shrink-0 border-b border-gray-100 pb-3">
                  <div className="flex gap-2.5 overflow-x-auto px-6 pt-1 scroll-smooth touch-pan-x overscroll-x-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {pills.map((pill) => {
                      const active = norm(filter) === norm(pill.id);
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => startTransition(() => setFilter(pill.id))}
                          aria-pressed={active}
                          className={`px-4 py-1.5 border rounded-full text-[13px] font-medium tracking-tight whitespace-nowrap shrink-0 transition-all ${
                            active
                              ? 'bg-[color:var(--accent-tint)] border-[color:var(--accent)] text-[color:var(--accent-strong)] shadow-sm'
                              : 'bg-white border-gray-200 text-gray-500 active:bg-gray-50'
                          }`}
                        >
                          {pill.name}
                          <span className={`ml-1.5 text-[11px] font-medium ${active ? 'text-[color:var(--accent-strong)] opacity-80' : 'text-gray-400'}`}>
                            {pill.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2-column grid */}
                <div className="flex-1 overflow-y-auto px-6 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                  {isLoading && shown.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Loader2 className="w-8 h-8 text-[color:var(--accent)] animate-spin mb-3" />
                      <p className="text-[13px] font-normal text-gray-400">Loading your items…</p>
                    </div>
                  ) : shown.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-[100px] h-[100px] shrink-0 relative mb-4">
                        <img src="/assets/images/empty-search.jpg" alt="" className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <h3 className="text-[16px] font-medium text-[#1a1f36] mb-1">No matching items found</h3>
                      <p className="text-[13px] font-normal text-gray-400 max-w-xs mb-5">
                        {query || filter !== 'all' ? 'Try a different search or filter.' : emptyText}
                      </p>
                      {(query || filter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => { setQuery(''); setFilter('all'); }}
                          className="px-4 py-2 rounded-full bg-gray-100 text-[#1a1f36] text-[13px] font-medium active:scale-95 transition-all"
                        >
                          Reset filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className={`grid grid-cols-2 gap-3.5 transition-opacity ${server?.pending ? 'opacity-60' : ''}`}>
                        {shown.map((p) => (
                          <ItemTile key={productKey(p)} product={p} actionLabel={actionLabel} onPick={onPick} inCartText={inCart?.(p)} />
                        ))}
                      </div>
                      {morePages}
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ItemTile({ product, actionLabel, onPick, inCartText }) {
  const batchCount = product.batches?.length || 0;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onPick(product)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick(product);
        }
      }}
      // Off-screen tiles skip layout and paint until they scroll near.
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 230px' }}
      className="bg-white border border-gray-200 active:border-[color:var(--accent)] rounded-lg p-3 flex flex-col text-center transition-all active:scale-[0.98] shadow-sm relative cursor-pointer"
    >
      <div className="aspect-[4/3] w-full rounded-md flex items-center justify-center relative overflow-hidden mb-2 border border-gray-100/60 bg-gray-50">
        {product.photoUrl ? (
          <img src={product.photoUrl} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        ) : (
          <CategoryGlyph category={product.category} className="w-[52%] h-[64%] object-contain" />
        )}

        {inCartText && (
          <div className="absolute top-2 right-2 bg-[color:var(--accent-tint)] text-[color:var(--accent-strong)] text-[10.5px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Check className="w-3 h-3" strokeWidth={2.6} />
            <span>{inCartText}</span>
          </div>
        )}

        {batchCount > 1 && (
          <div className="absolute top-2 left-2 bg-white/95 text-[#1a1f36] text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-100 shadow-xs flex items-center gap-1">
            <Layers className="w-2.5 h-2.5 text-[color:var(--accent)]" />
            <span>{batchCount} Batches</span>
          </div>
        )}
      </div>

      <h4 className="text-[14px] font-medium text-[#1a1f36] text-center leading-snug line-clamp-2 mt-0.5 mb-2.5 flex-1">
        {product.name}
      </h4>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPick(product); }}
        className="w-full flex items-center justify-center py-2.5 rounded-md bg-[color:var(--accent)] active:bg-[color:var(--accent-press)] text-white text-[13px] font-semibold transition-all active:scale-95 shadow-sm mt-auto"
      >
        {actionLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step pieces
// ---------------------------------------------------------------------------

// Photo or category drawing, then the name and one line under it ("48 items in stock · 2 in cart").
export function StepItem({ photoUrl, category, name, children }) {
  return (
    <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
      {photoUrl ? (
        <img src={photoUrl} alt="" className="w-14 h-14 shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-cover" />
      ) : (
        <span className="w-14 h-14 shrink-0 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
          <CategoryGlyph category={category} className="w-9 h-9" />
        </span>
      )}
      <div className="min-w-0">
        <h3 className="text-[16px] font-medium text-[#1a1f36] leading-snug truncate">{name}</h3>
        <p className="text-[13px] text-gray-500 mt-0.5">{children}</p>
      </div>
    </div>
  );
}

export const InCart = ({ children }) => <span className="text-[color:var(--accent-strong)]">{children}</span>;

// Bordered list of choices (batches, "New date or spot").
export function ChoiceList({ children }) {
  return <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">{children}</div>;
}

export function ChoiceRow({ title, badge, sub, right, disabled, onClick, icon }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 disabled:opacity-40 transition-colors"
    >
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] text-[#1a1f36]">{title}</span>
          {badge}
        </div>
        {sub && <span className="block truncate text-[13px] text-gray-500">{sub}</span>}
      </div>
      {right}
      {!disabled && <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />}
    </button>
  );
}

export const UseFirst = ({ children = 'Use first' }) => (
  <span className="text-[11px] font-medium text-[color:var(--accent-strong)] bg-[color:var(--accent-tint)] px-2 py-0.5 rounded-full">{children}</span>
);

// The rounded "How many?" counter. Type the number too; 20px text so no phone zooms in.
export function StepCounter({ value, onChange, max = Infinity, label }) {
  const [draft, setDraft] = useState(null); // typed text while focused
  const n = Number(value) || 1;
  return (
    <div className="flex items-center justify-between h-[52px] rounded-full border border-gray-300 px-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, n - 1))}
        disabled={n <= 1}
        className="w-11 h-11 rounded-full flex items-center justify-center text-[#1a1f36] active:bg-gray-100 disabled:opacity-30"
        aria-label="Fewer"
      >
        <Minus className="w-5 h-5" strokeWidth={2} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft ?? String(Math.min(n, max))}
        onFocus={(e) => { setDraft(String(Math.min(n, max))); e.target.select(); }}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          setDraft(digits);
          const next = parseInt(digits, 10);
          if (next > 0) onChange(Math.min(max, next));
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        aria-label={label}
        className="w-20 text-center bg-transparent outline-none text-[20px] font-medium text-[#1a1f36] tabular-nums rounded-md focus:bg-gray-50"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, n + 1))}
        disabled={n >= max}
        className="w-11 h-11 rounded-full flex items-center justify-center text-[#1a1f36] active:bg-gray-100 disabled:opacity-30"
        aria-label="More"
      >
        <Plus className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
  );
}

export const StepLabel = ({ children, className = 'mt-6' }) => (
  <p className={`text-[15px] font-medium text-[#1a1f36] mb-3 ${className}`}>{children}</p>
);

// Scrolling body of a step, with an optional pinned footer button.
export function StepBody({ children, footer }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pt-1 pb-6">{children}</div>
      {footer && (
        <div className="shrink-0 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-100 bg-white flex flex-col gap-2">
          {footer}
        </div>
      )}
    </>
  );
}

export function StepButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[50px] rounded-full bg-[color:var(--accent)] text-white text-[15px] font-semibold active:bg-[color:var(--accent-press)] active:scale-[0.99] disabled:opacity-40 transition-all"
    >
      {children}
    </button>
  );
}

export function StepOutlineButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-[50px] rounded-full border border-gray-300 bg-white text-[#1a1f36] text-[15px] font-semibold active:bg-gray-50"
    >
      {children}
    </button>
  );
}
