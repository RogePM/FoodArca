'use client';

// Shared building blocks for the add flow: the known-item sheet and the new-item form
// both use these, so "how many", expiry and storage look and behave the same everywhere.

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, Hash, Scale, Calendar, Check } from 'lucide-react';
import { getCategoryVisual } from '@/lib/constants';
import {
  SIZE_UNITS, STORAGE_OPTIONS, categorySlug, lastDayOfMonth, formatExpiry,
} from '@/lib/inventory-format';

export const ACCENT = '#e27f2c';

const inputBase =
  'w-full h-[48px] px-3.5 rounded-xl border border-gray-200 bg-white text-[16px] font-medium text-[#1a1f36] outline-none focus:border-[#e27f2c] focus:ring-4 focus:ring-[#e27f2c]/10 transition-all placeholder:text-[#6b7280] placeholder:font-normal';
export const inputClass = inputBase;

const tileBase = 'h-11 rounded-xl border text-[14px] font-medium transition-colors flex items-center justify-center gap-1.5 px-3';
const tileOn = 'border-[#e27f2c] bg-[#fff3ea] text-[#c06245]';
const tileOff = 'border-gray-200 bg-white text-[#1a1f36] active:bg-gray-50';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

let categoriesCache = null;

// Categories from the database (one list for every pantry).
export function useCategories(pantryId) {
  const [categories, setCategories] = useState(categoriesCache || []);
  useEffect(() => {
    if (categoriesCache || !pantryId) return;
    let alive = true;
    fetch('/api/categories', { headers: { 'x-pantry-id': pantryId } })
      .then((r) => (r.ok ? r.json() : { categories: [] }))
      .then((d) => {
        categoriesCache = d.categories || [];
        if (alive) setCategories(categoriesCache);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [pantryId]);
  return categories;
}

// One normalized shape for an existing pantry item, whatever endpoint it came from.
export function toProduct(d) {
  if (!d) return null;
  return {
    catalogItemId: d.catalogItemId,
    name: d.name,
    photoUrl: d.photoUrl || null,
    barcode: d.barcode || null,
    categoryId: d.categoryId ?? null,
    categoryName: d.categoryName ?? d.category ?? null,
    isFood: d.isFood ?? true,
    trackBy: d.trackBy || 'count',
    sizeAmount: d.sizeAmount ?? null,
    sizeUnit: d.sizeUnit ?? null,
    caseSize: d.caseSize ?? null,
    totalQuantity: d.totalQuantity ?? null,
  };
}

// The pantry's items (for name autocomplete and restock), optionally with stock totals.
export function usePantryItems(pantryId, { withStock = false, enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pantryId || !enabled) return;
    let alive = true;
    setLoading(true);
    const headers = { 'x-pantry-id': pantryId };
    Promise.all([
      fetch('/api/foods/dictionary', { headers, cache: 'no-store' }).then((r) => (r.ok ? r.json() : { dictionary: [] })),
      withStock
        ? fetch('/api/foods', { headers, cache: 'no-store' }).then((r) => (r.ok ? r.json() : { data: [] }))
        : Promise.resolve({ data: [] }),
    ])
      .then(([dict, stock]) => {
        const totals = new Map();
        for (const lot of stock.data || []) {
          totals.set(lot.catalogItemId, (totals.get(lot.catalogItemId) || 0) + Number(lot.quantity || 0));
        }
        const list = (dict.dictionary || []).map((d) =>
          toProduct({ ...d, totalQuantity: withStock ? totals.get(d.catalogItemId) || 0 : null })
        );
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (alive) setItems(list);
      })
      .catch((err) => console.error('Could not load pantry items:', err))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [pantryId, withStock, enabled]);

  return { items, loading };
}

const STORAGE_KEY = 'foodarca_last_storage';
export function recallStorage() {
  try { return sessionStorage.getItem(STORAGE_KEY) || null; } catch { return null; }
}
export function rememberStorage(value) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, value);
  } catch {}
}

// ---------------------------------------------------------------------------
// Visual pieces
// ---------------------------------------------------------------------------

export function categoryVisual(categoryName) {
  return getCategoryVisual(categorySlug(categoryName) || 'other');
}

// Product photo, or the category picture when there is none. Rounded square (photo rule).
export function ItemThumb({ photoUrl, categoryName, size = 56, rounded = 'rounded-xl' }) {
  const visual = categoryVisual(categoryName);
  const style = { width: size, height: size };
  if (photoUrl) {
    return (
      <img src={photoUrl} alt="" style={style} className={`${rounded} object-cover border border-gray-100 shrink-0 bg-gray-50`} />
    );
  }
  return (
    <div style={style} className={`${rounded} shrink-0 border border-gray-100 overflow-hidden flex items-center justify-center ${visual.style.bg}`}>
      <img src={visual.imagePath} alt="" className="w-full h-full object-contain mix-blend-multiply scale-[1.3]" />
    </div>
  );
}

export function FieldLabel({ children, optional, htmlFor }) {
  return (
    <div className="flex items-center justify-between ml-0.5 mb-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-gray-700">{children}</label>
      {optional && <span className="text-[11.5px] font-medium text-gray-500">Optional</span>}
    </div>
  );
}

// Count vs weigh is preset by the category. This only says which one, with a quiet way to flip it.
export function TrackByNote({ value, onChange }) {
  const weighed = value === 'weight';
  const Icon = weighed ? Scale : Hash;
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-2.5">
      <Icon className="w-4 h-4 text-gray-500 shrink-0" strokeWidth={2.4} />
      <p className="flex-1 text-[13.5px] text-[#1a1f36]">
        {weighed ? 'You’ll weigh these in pounds.' : 'You’ll count these one by one.'}
      </p>
      <button
        type="button"
        onClick={() => onChange(weighed ? 'count' : 'weight')}
        className="min-h-11 -my-2 px-1 text-[13px] font-semibold text-[#c06245] shrink-0"
      >
        {weighed ? 'Count instead' : 'Weigh instead'}
      </button>
    </div>
  );
}

// Size printed on the label of ONE item. Collapsed until asked for, unless it already has a value.
export function SizeField({ amount, unit, onChange }) {
  const [open, setOpen] = useState(!!amount);
  useEffect(() => { if (amount) setOpen(true); }, [amount]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 min-h-11 -ml-0.5 pl-0.5 pr-3 text-[13.5px] font-semibold text-[#c06245]"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Add size from label
      </button>
    );
  }

  return (
    <div>
      <FieldLabel htmlFor="size-amount" optional>Size on the label</FieldLabel>
      <div className="flex gap-2">
        <input
          id="size-amount"
          type="text"
          inputMode="decimal"
          value={amount ?? ''}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, '');
            onChange({ amount: v, unit: unit || 'oz' });
          }}
          placeholder="e.g. 15"
          className={`${inputBase} w-[96px] shrink-0 text-center`}
        />
        <div className="flex-1 grid grid-cols-5 gap-1.5">
          {SIZE_UNITS.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() => onChange({ amount, unit: u.value })}
              aria-pressed={unit === u.value}
              className={`h-[48px] rounded-xl border text-[13px] font-medium transition-colors ${unit === u.value ? tileOn : tileOff}`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mt-1.5 ml-0.5">
        <p className="text-[12px] text-gray-500">The size of one item.</p>
        <button
          type="button"
          onClick={() => { onChange({ amount: '', unit: null }); setOpen(false); }}
          className="text-[12px] font-medium text-gray-500 underline underline-offset-2"
        >
          Remove size
        </button>
      </div>
    </div>
  );
}

// The one amount box: "How many did you get?" (single items) or "How much does it weigh?" (lb).
export function AmountField({ trackBy, quantity, onChange }) {

  if (trackBy === 'weight') {
    return (
      <div>
        <FieldLabel htmlFor="amount-lb">How much does it weigh?</FieldLabel>
        <div className="flex rounded-xl border border-gray-200 h-[56px] overflow-hidden focus-within:border-[#e27f2c] focus-within:ring-4 focus-within:ring-[#e27f2c]/10 transition-all">
          <input
            id="amount-lb"
            type="text"
            inputMode="decimal"
            value={quantity ?? ''}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            className="w-0 flex-1 px-4 !text-[22px] font-bold text-[#1a1f36] outline-none placeholder:text-gray-300"
          />
          <span className="w-[64px] shrink-0 flex items-center justify-center bg-gray-50 border-l border-gray-200 text-[16px] font-medium text-[#697386]">
            lb
          </span>
        </div>
      </div>
    );
  }

  const shown = Number(quantity) || 0;
  const setShown = (n) => onChange(Math.max(1, Math.floor(Number(n) || 1)));

  return (
    <div>
      <FieldLabel htmlFor="amount-count">How many did you get?</FieldLabel>
      <div className="flex items-center rounded-xl border border-gray-200 h-[56px] overflow-hidden focus-within:border-[#e27f2c] focus-within:ring-4 focus-within:ring-[#e27f2c]/10 transition-all">
        <button
          type="button"
          onClick={() => setShown(shown - 1)}
          aria-label="Decrease"
          className="h-full w-16 shrink-0 flex items-center justify-center bg-gray-50 border-r border-gray-200 text-[#1a1f36] active:bg-gray-100"
        >
          <Minus className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <input
          id="amount-count"
          type="text"
          inputMode="numeric"
          value={shown || ''}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, '');
            onChange(v === '' ? '' : Number(v));
          }}
          className="w-0 flex-1 text-center !text-[22px] font-bold text-[#1a1f36] outline-none"
        />
        <button
          type="button"
          onClick={() => setShown(shown + 1)}
          aria-label="Increase"
          className="h-full w-16 shrink-0 flex items-center justify-center bg-gray-50 border-l border-gray-200 text-[#1a1f36] active:bg-gray-100"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
      <p className="text-[12.5px] text-gray-500 mt-1.5 ml-0.5">Count each one, not the boxes they came in.</p>
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Expires: No date / Month (e.g. "Best by Mar 2027") / Exact date.
export function ExpiryField({ date, precision, onChange }) {
  const [mode, setMode] = useState(precision === 'month' ? 'month' : date ? 'day' : 'none');
  const [month, setMonth] = useState(() => (precision === 'month' && date ? Number(date.slice(5, 7)) : ''));
  const [year, setYear] = useState(() => (precision === 'month' && date ? Number(date.slice(0, 4)) : ''));
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => thisYear - 1 + i);

  const pickMode = (m) => {
    setMode(m);
    if (m === 'none') onChange({ date: null, precision: null });
    if (m === 'month') onChange(month && year ? { date: lastDayOfMonth(year, month), precision: 'month' } : { date: null, precision: null });
    if (m === 'day') onChange({ date: null, precision: null });
  };
  const setMonthYear = (m, y) => {
    setMonth(m);
    setYear(y);
    onChange(m && y ? { date: lastDayOfMonth(y, m), precision: 'month' } : { date: null, precision: null });
  };

  const selectClass = `${inputBase} appearance-none pr-8`;

  return (
    <div>
      <FieldLabel optional>Expires</FieldLabel>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Expires">
        {[['none', 'No date'], ['month', 'Month'], ['day', 'Exact date']].map(([v, l]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={mode === v}
            onClick={() => pickMode(v)}
            className={`${tileBase} ${mode === v ? tileOn : tileOff}`}
          >
            {l}
          </button>
        ))}
      </div>

      {mode === 'month' && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <select aria-label="Month" value={month} onChange={(e) => setMonthYear(Number(e.target.value) || '', year)} className={selectClass}>
            <option value="">Month</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select aria-label="Year" value={year} onChange={(e) => setMonthYear(month, Number(e.target.value) || '')} className={selectClass}>
            <option value="">Year</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {mode === 'day' && (
        <div className="relative mt-2">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6b7280] pointer-events-none z-10" />
          <input
            type="date"
            aria-label="Expiration date"
            value={precision === 'day' && date ? date : ''}
            onChange={(e) => onChange(e.target.value ? { date: e.target.value, precision: 'day' } : { date: null, precision: null })}
            className={`${inputBase} pl-12 text-transparent caret-transparent appearance-none`}
            style={{ colorScheme: 'light' }}
          />
          <span className={`absolute left-12 right-4 top-1/2 -translate-y-1/2 truncate pointer-events-none text-[16px] ${date ? 'font-medium text-[#1a1f36]' : 'text-[#6b7280]'}`}>
            {precision === 'day' && date ? formatExpiry(date, 'day') : 'Pick a date'}
          </span>
        </div>
      )}
    </div>
  );
}

// Where it goes: Shelf / Fridge / Freezer, or a custom spot.
export function StorageField({ value, onChange }) {
  const isCustom = value && !STORAGE_OPTIONS.some((o) => o.value === value);
  const [showCustom, setShowCustom] = useState(!!isCustom);

  return (
    <div>
      <FieldLabel optional>Where does it go?</FieldLabel>
      <div className="grid grid-cols-4 gap-2">
        {STORAGE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => { setShowCustom(false); onChange(value === o.value ? null : o.value); }}
            className={`${tileBase} ${value === o.value ? tileOn : tileOff}`}
          >
            {o.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={showCustom}
          onClick={() => { setShowCustom(true); if (!isCustom) onChange(null); }}
          className={`${tileBase} ${showCustom ? tileOn : tileOff}`}
        >
          Other
        </button>
      </div>
      {showCustom && (
        <input
          type="text"
          value={isCustom ? value : ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="e.g. Back room"
          aria-label="Storage spot"
          className={`${inputBase} mt-2`}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sheets
// ---------------------------------------------------------------------------

export function BottomSheet({ open, onClose, children, labelledBy, zIndex = 10050, maxHeight = '92dvh' }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex, isolation: 'isolate' }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative bg-white rounded-t-[32px] shadow-2xl w-full max-w-lg mx-auto flex flex-col"
            style={{ maxHeight }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function SheetHeader({ id, title, onClose }) {
  return (
    <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0 border-b border-gray-100">
      <h2 id={id} className="text-[16px] font-semibold text-[#1a1f36]">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
      >
        <X className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function CategorySheet({ open, onClose, categories, selectedId, onSelect }) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="category-sheet-title" zIndex={10100} maxHeight="88dvh">
      <SheetHeader id="category-sheet-title" title="Pick a category" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-3 pb-[calc(14px+env(safe-area-inset-bottom))]">
        {categories.length === 0 ? (
          <p className="text-[13.5px] text-gray-500 py-8 text-center">Loading categories…</p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {categories.map((c) => {
              const active = selectedId === c.id;
              const visual = categoryVisual(c.name);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onSelect(c); onClose(); }}
                  className={`relative flex flex-col items-center gap-2 py-3 px-1.5 rounded-xl border transition-colors ${active ? 'border-[#e27f2c] bg-[#fff3ea]' : 'border-gray-200 bg-white active:bg-gray-50'}`}
                >
                  {active && <Check className="absolute top-2 right-2 w-4 h-4 text-[#e27f2c]" strokeWidth={3} />}
                  <div className={`w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center ${visual.style.bg}`}>
                    <img src={visual.imagePath} alt="" className="w-full h-full object-contain mix-blend-multiply" style={{ transform: `scale(${visual.imageScale})` }} />
                  </div>
                  <span className={`text-[12.5px] font-semibold text-center leading-tight ${active ? 'text-[#c06245]' : 'text-gray-700'}`}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

// Primary pill button pinned to the bottom of a sheet or screen.
export function PrimaryButton({ children, disabled, onClick, busy }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="w-full h-[50px] rounded-full bg-[#e27f2c] hover:bg-[#cf6f20] text-white font-semibold text-[15.5px] shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
    >
      {children}
    </button>
  );
}
