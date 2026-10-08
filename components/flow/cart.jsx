'use client';

// One cart screen for Add and Remove (the Remove look). Each page passes its theme, its rows and its actions:
//   accent header (Total + the page's action) · optional strip · the items card · Clear cart
//   floating ways-in pill that folds into "+" and hides mid-scroll · Undo after Remove
// Rows are memoized and the row callbacks are stable, so typing in one counter redraws only that row.

import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Loader2, Check } from 'lucide-react';
import { CategoryGlyph } from '@/components/ui/category-glyph';
import { BottomSheet } from '@/components/pages/add-items/intake-fields';

// Set once on a screen's root; everything inside reads var(--accent…). Portaled pieces set it again.
export const FLOW_THEMES = {
  add: { '--accent': '#e27f2c', '--accent-strong': '#b5541a', '--accent-tint': '#fff0eb', '--accent-press': '#cf6f20' },
  remove: { '--accent': '#d97757', '--accent-strong': '#b5583a', '--accent-tint': '#fbeee9', '--accent-press': '#c66547' },
};

const ACCENT_BTN = 'bg-[color:var(--accent)] active:bg-[color:var(--accent-press)]';
const TEXT_LINK = 'text-[14px] font-normal text-[#1a1f36] underline underline-offset-4 decoration-gray-400';

// ---------------------------------------------------------------------------
// Confirm / Done pieces
// ---------------------------------------------------------------------------

export const MAX_PHOTOS = 6;

export const cartPhotos = (items) =>
  items.filter((l) => l.photoUrl).slice(0, MAX_PHOTOS).map((l) => ({ id: l.id || l.batchId, url: l.photoUrl }));

// The cart's own photos, overlapped. Lines without a photo are skipped.
export function CartPhotos({ photos }) {
  if (!photos?.length) return null;
  return (
    <div className="flex pl-2" aria-hidden="true">
      {photos.map((p) => (
        <img key={p.id} src={p.url} alt="" referrerPolicy="no-referrer" decoding="async" className="-ml-2 w-10 h-10 shrink-0 rounded-full border-2 border-white bg-gray-50 object-cover" />
      ))}
    </div>
  );
}

// Label/value rows on Confirm and Done: Items + From (Add) or Items + Reason (Remove).
export function CartSummary({ rows }) {
  return (
    <div className="rounded-2xl border border-gray-200 px-3.5 divide-y divide-gray-100 text-[14px] text-left">
      {rows.map((r) => (
        <div key={r.label} className="min-h-[52px] flex items-center justify-between gap-3">
          <span className="shrink-0 text-gray-500">{r.label}</span>
          <span className={`min-w-0 truncate text-right ${r.strong ? 'text-[15px] font-semibold' : r.value ? 'font-medium text-[#1a1f36]' : 'text-gray-400'}`}>
            {r.value || r.placeholder}
          </span>
        </div>
      ))}
    </div>
  );
}

// Bottom sheet: title, one line, then filled + outlined buttons. `danger` makes the filled one red.
export function ConfirmSheet({ theme = 'remove', open, onClose, id, title, body, children, primary, danger, onPrimary, secondary }) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy={id}>
      <div style={FLOW_THEMES[theme]}>
        <div className="flex justify-center pt-2.5"><span className="w-10 h-[5px] rounded-full bg-gray-200" /></div>
        <h2 id={id} className="px-4 pt-3.5 text-[17px] font-semibold tracking-[-0.01em] text-[#1a1f36]">{title}</h2>
        {body && <p className="px-4 pt-0.5 text-[13px] text-gray-500">{body}</p>}
        {children}
        <div className="px-4 pt-5 pb-[calc(28px+env(safe-area-inset-bottom))] flex flex-col gap-2">
          <button
            type="button"
            onClick={onPrimary}
            className={`w-full h-[52px] rounded-full text-white text-[16px] font-semibold ${danger ? 'bg-[#dc2626] active:bg-red-700' : ACCENT_BTN}`}
          >
            {primary}
          </button>
          <button type="button" onClick={onClose} className="w-full h-[52px] rounded-2xl border border-gray-300 bg-white text-[16px] font-semibold text-[#1a1f36] active:bg-gray-50">
            {secondary}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

// Full screen after the cart goes through ("Added to inventory" / "Removed from inventory").
export function DoneScreen({ theme = 'remove', title, sub, photos, rows, primary, onPrimary, secondary, onSecondary }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div style={FLOW_THEMES[theme]} className="fixed inset-0 z-[105] bg-white flex flex-col text-[#1a1f36]">
      <div className="flex-1 flex flex-col justify-center gap-6 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="w-16 h-16 rounded-full bg-[color:var(--accent-tint)] text-[color:var(--accent)] flex items-center justify-center">
            <Check className="w-[30px] h-[30px]" strokeWidth={2.6} />
          </span>
          <h2 className="text-[20px] font-semibold tracking-[-0.01em]">{title}</h2>
          <p className="-mt-1.5 text-[14px] text-gray-500">{sub}</p>
        </div>
        {photos?.length > 0 && <div className="flex justify-center"><CartPhotos photos={photos} /></div>}
        <CartSummary rows={rows} />
      </div>
      <div className="px-4 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))] flex flex-col gap-2">
        <button type="button" onClick={onPrimary} className={`w-full h-[52px] rounded-full text-white text-[16px] font-semibold ${ACCENT_BTN}`}>
          {primary}
        </button>
        <button type="button" onClick={onSecondary} className="w-full h-[52px] rounded-2xl border border-gray-300 bg-white text-[16px] font-semibold active:bg-gray-50">
          {secondary}
        </button>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Amounts: tap to type. 16px text so no phone zooms in on focus.
// ---------------------------------------------------------------------------

function CountInput({ value, max, onCommit }) {
  const [draft, setDraft] = useState(null); // null while not editing
  const commit = () => {
    const n = parseInt(draft, 10);
    if (draft !== null && n > 0) {
      const next = Math.min(max, n);
      if (next !== Number(value)) onCommit(next);
    }
    setDraft(null);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft ?? String(value)}
      onFocus={(e) => { setDraft(String(value)); e.target.select(); }}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      aria-label="Quantity"
      className="w-8 h-full text-center bg-transparent outline-none text-[16px] font-medium text-[color:var(--accent)] tabular-nums focus:bg-[color:var(--accent-tint)]"
    />
  );
}

// Weighed lines: type what the scale says. Capped at `max`; empty or zero snaps back.
function WeightInput({ value, max, onCommit }) {
  const [draft, setDraft] = useState(null);
  const commit = () => {
    const n = parseFloat(draft);
    if (draft !== null && n > 0) {
      const next = Math.min(max, Math.round(n * 100) / 100);
      if (next !== Number(value)) onCommit(next);
    }
    setDraft(null);
  };
  return (
    <label className="flex items-center justify-center gap-1 w-[112px] h-[34px] rounded-full border border-[color:var(--accent)] bg-white cursor-text">
      <input
        type="text"
        inputMode="decimal"
        value={draft ?? String(value)}
        onFocus={(e) => { setDraft(String(value)); e.target.select(); }}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        aria-label="Weight, in pounds"
        className="w-12 text-right bg-transparent outline-none text-[16px] font-medium text-[color:var(--accent)] tabular-nums"
      />
      <span className="text-[14px] text-[color:var(--accent)] opacity-80">lb</span>
    </label>
  );
}

export function AmountControl({ isWeight, value, max = Infinity, onChange }) {
  if (isWeight) return <WeightInput value={value} max={max} onCommit={onChange} />;
  const n = Number(value) || 1;
  return (
    <div className="flex items-center rounded-full border border-[color:var(--accent)] h-[34px] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => n > 1 && onChange(n - 1)}
        className="h-full w-10 flex items-center justify-center text-[color:var(--accent)] active:bg-[color:var(--accent-tint)] transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" strokeWidth={2} />
      </button>
      <CountInput value={value} max={max} onCommit={onChange} />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, n + 1))}
        disabled={n >= max}
        className="h-full w-10 flex items-center justify-center text-[color:var(--accent)] active:bg-[color:var(--accent-tint)] disabled:opacity-30 disabled:active:bg-transparent transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

// A row's detail lines: { text, tone: 'strong' | 'medium' | 'faint', accent? (rides on the line in the accent color) }
const TONES = { strong: 'text-gray-600', medium: 'text-gray-500 font-medium', faint: 'text-gray-400' };

const CartRow = memo(function CartRow({ row, isLast, onRemove, onEdit, onQuantity }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="bg-white"
    >
      <div className="p-3.5 flex flex-col gap-2">
        <div className="flex gap-3.5 items-start">
          {row.photoUrl ? (
            <img
              src={row.photoUrl}
              alt=""
              width={72}
              height={72}
              loading="lazy"
              decoding="async"
              className="w-[72px] h-[72px] rounded-md object-cover border border-gray-100 shrink-0 bg-gray-50"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-md flex items-center justify-center shrink-0 border border-gray-200 bg-gray-50">
              <CategoryGlyph category={row.category} className="w-11 h-11" />
            </div>
          )}
          <div className="flex-1 min-w-0 py-1">
            <h4 className="font-normal text-gray-900 text-[15.5px] leading-snug mb-2">{row.name}</h4>
            <div className="flex flex-col gap-1.5 text-[13px] font-normal">
              {row.details.map((d) => (
                <div key={d.text} className={TONES[d.tone]}>
                  {d.text}
                  {d.accent && <span className="text-[color:var(--accent-strong)]">{' · '}{d.accent}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-5">
            {onEdit && (
              <button type="button" onClick={() => onEdit(row.key)} className={TEXT_LINK}>Edit</button>
            )}
            <button type="button" onClick={() => onRemove(row.key)} className={`${TEXT_LINK} hover:text-red-600 hover:decoration-red-300 transition-colors`}>
              Remove
            </button>
          </span>
          <AmountControl
            isWeight={row.isWeight}
            value={row.quantity}
            max={row.max}
            onChange={(next) => onQuantity(row.key, next)}
          />
        </div>
      </div>
      {!isLast && <div className="mx-4 border-b border-gray-300" />}
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// The screen
// ---------------------------------------------------------------------------

/**
 * @param rows   [{ key, item, name, photoUrl, category, details, isWeight, quantity, max }]
 * @param totals { items, lbs } for the header
 * @param ways   [{ label, icon, onClick }] for the floating pill
 * @param onRemove(item, index) / onRestore(item, index) / onQuantity(item, next) / onEdit?(item)
 */
export function FlowCart({
  theme = 'remove',
  rows,
  totals,
  actionLabel,
  onAction,
  busy = false,
  error = '',
  strip = null,
  title = 'Items',
  clearLabel = 'Clear cart',
  empty = null,
  ways = [],
  onQuantity,
  onRemove,
  onRestore,
  onEdit,
  onClear,
  children,
}) {
  const hasRows = rows.length > 0;
  const [scrolled, setScrolled] = useState(false);
  const [pillOpen, setPillOpen] = useState(false); // "+" tapped: show the ways in again
  const [isScrolling, setIsScrolling] = useState(false); // hide the floating control mid-scroll so it never sits on a row
  const [showClear, setShowClear] = useState(false);
  const [removed, setRemoved] = useState(null); // { item, index, name } for Undo
  const scrollIdle = useRef(null);
  const undoTimer = useRef(null);
  useEffect(() => () => { clearTimeout(scrollIdle.current); clearTimeout(undoTimer.current); }, []);

  // Few items and at the top (or "+" was tapped): the pill. Otherwise the round button.
  const expanded = (rows.length <= 3 && !scrolled) || pillOpen;

  // Stable row callbacks that always see the latest rows and handlers.
  const latest = useRef({ rows, onQuantity, onRemove, onEdit });
  useLayoutEffect(() => {
    latest.current = { rows, onQuantity, onRemove, onEdit };
  });
  const find = (key) => {
    const index = latest.current.rows.findIndex((r) => r.key === key);
    return { row: latest.current.rows[index], index };
  };
  const handleQuantity = useCallback((key, next) => {
    const { row } = find(key);
    if (!row) return;
    setRemoved(null);
    latest.current.onQuantity?.(row.item, next);
  }, []);
  const handleRemove = useCallback((key) => {
    const { row, index } = find(key);
    if (!row) return;
    setRemoved({ item: row.item, index, name: row.item.name });
    latest.current.onRemove?.(row.item, index);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), 5000);
  }, []);
  const handleEdit = useCallback((key) => {
    const { row } = find(key);
    if (row) latest.current.onEdit?.(row.item);
  }, []);

  const undo = () => {
    if (!removed) return;
    onRestore?.(removed.item, removed.index);
    clearTimeout(undoTimer.current);
    setRemoved(null);
  };

  const totalParts = [
    totals.items > 0 || totals.lbs === 0 ? { n: totals.items, label: totals.items === 1 ? 'item' : 'items' } : null,
    totals.lbs > 0 ? { n: Math.round(totals.lbs * 100) / 100, label: 'lb' } : null,
  ].filter(Boolean);
  const countText = `${rows.length} ${rows.length === 1 ? 'item' : 'items'}`;
  const showFloating = hasRows && !isScrolling;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={FLOW_THEMES[theme]}
      className="absolute inset-0 z-50 bg-white flex flex-col"
    >
      {/* Header and cards scroll together */}
      <div
        onScroll={(e) => {
          setScrolled(e.currentTarget.scrollTop > 24);
          setPillOpen(false);
          setIsScrolling(true);
          clearTimeout(scrollIdle.current);
          // Fallback for browsers without scrollend.
          scrollIdle.current = setTimeout(() => setIsScrolling(false), 120);
        }}
        onScrollEnd={() => {
          clearTimeout(scrollIdle.current);
          setIsScrolling(false);
        }}
        className={`flex-1 overflow-y-auto w-full ${hasRows ? 'pb-[calc(120px+env(safe-area-inset-bottom))]' : 'pb-[calc(clamp(72px,13dvh,104px)+env(safe-area-inset-bottom))]'}`}
      >
        {!hasRows ? (
          empty
        ) : (
          <>
            <div className="px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-3.5 flex items-center justify-between bg-[color:var(--accent)] relative z-20 shadow-sm">
              <div className="flex flex-col antialiased">
                <span className="text-[11px] font-semibold text-white/75 uppercase tracking-[0.08em] leading-none">Total</span>
                <span className="mt-1 flex items-baseline gap-1 leading-none text-white">
                  {totalParts.map((part, i) => (
                    <React.Fragment key={part.label}>
                      {i > 0 && <span className="mx-1 text-[13px] font-normal text-white/55">+</span>}
                      <span className="text-[19px] font-semibold tracking-tight tabular-nums">{part.n}</span>
                      <span className="text-[13px] font-normal text-white/80">{part.label}</span>
                    </React.Fragment>
                  ))}
                </span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => { setRemoved(null); onAction?.(); }}
                className="h-[44px] px-6 rounded-full bg-white text-[color:var(--accent-strong)] text-[15px] font-semibold shadow-sm flex items-center gap-1.5 active:scale-95 active:bg-[color:var(--accent-tint)] disabled:opacity-60 transition-all"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {actionLabel}
              </button>
            </div>

            {strip}

            <div className="h-3" />

            {error && (
              <div role="alert" className="mx-4 mb-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
                {error}
              </div>
            )}

            <div className="mx-4 mb-8 bg-white border border-gray-200 rounded-md overflow-hidden shadow-md">
              <div className="mx-4 py-3 border-b border-gray-300 flex items-center bg-white">
                <span className="text-[17px] text-[#1a1f36] font-medium tracking-tight">{title}</span>
              </div>
              <div className="flex flex-col bg-white">
                <AnimatePresence initial={false}>
                  {rows.map((row, i) => (
                    <CartRow
                      key={row.key}
                      row={row}
                      isLast={i === rows.length - 1}
                      onRemove={handleRemove}
                      onEdit={onEdit ? handleEdit : undefined}
                      onQuantity={handleQuantity}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex justify-center pt-4 pb-2">
              <button
                type="button"
                onClick={() => { setRemoved(null); setShowClear(true); }}
                className={`${TEXT_LINK} hover:text-red-600 hover:decoration-red-300 transition-colors`}
              >
                {clearLabel}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating ways in: the pill, or the round "+" */}
      <AnimatePresence initial={false} mode="popLayout">
        {showFloating && expanded && (
          <motion.div
            key="ways-pill"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] flex justify-center pointer-events-none z-40"
          >
            {/* Filled accent so it floats clear of the outlined counters; every way in weighs the same. */}
            <div className="pointer-events-auto h-12 p-1 flex items-center rounded-full bg-[color:var(--accent)] shadow-[0_4px_12px_-6px_rgba(0,0,0,0.25)]">
              {ways.map(({ label, icon: Icon, onClick }, i) => (
                <React.Fragment key={label}>
                  {i > 0 && <span aria-hidden className="w-px h-5 bg-white/35" />}
                  <button
                    type="button"
                    onClick={onClick}
                    className="h-full px-4 rounded-full text-white flex items-center gap-2 text-[14px] font-semibold active:bg-white/15"
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={2.2} />
                    {label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
        {showFloating && !expanded && (
          <motion.button
            key="ways-circle"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            onClick={() => setPillOpen(true)}
            aria-label="Add more items"
            aria-expanded={false}
            className="absolute right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-40 w-12 h-12 rounded-full bg-[color:var(--accent)] text-white flex items-center justify-center shadow-[0_4px_12px_-6px_rgba(0,0,0,0.18)] active:bg-[color:var(--accent-press)] active:scale-95 transition-colors"
          >
            <Plus className="w-5 h-5" strokeWidth={2.4} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Undo after Remove */}
      <AnimatePresence>
        {removed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            role="status"
            className={`absolute left-4 z-40 h-[52px] ${
              showFloating && !expanded
                ? 'right-[76px] bottom-[calc(78px+env(safe-area-inset-bottom))]'
                : showFloating
                  ? 'right-4 bottom-[calc(144px+env(safe-area-inset-bottom))]'
                  : 'right-4 bottom-[calc(80px+env(safe-area-inset-bottom))]'
            } rounded-2xl bg-white border border-gray-200 text-[#1a1f36] flex items-center gap-3 pl-4 pr-2 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.2)]`}
          >
            <span className="flex-1 min-w-0 truncate text-[14px] font-medium">Removed {removed.name}</span>
            <button type="button" onClick={undo} className="h-10 px-3.5 rounded-xl text-[14px] font-semibold text-[color:var(--accent-strong)] active:bg-[color:var(--accent-tint)]">
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmSheet
        theme={theme}
        open={showClear}
        onClose={() => setShowClear(false)}
        id="flow-clear-title"
        title="Clear the cart?"
        body={`All ${countText} come out of the cart. Nothing in inventory changes.`}
        primary="Clear cart"
        danger
        onPrimary={() => { setShowClear(false); onClear?.(); }}
        secondary="Keep them"
      />

      {children}
    </motion.div>
  );
}

// Rows are built once per cart line (lines are replaced, never mutated), so unchanged rows keep
// their identity and their memoized CartRow skips the redraw.
export function rowBuilder(toRow) {
  const cache = new WeakMap();
  return (item) => {
    let row = cache.get(item);
    if (!row) {
      row = toRow(item);
      cache.set(item, row);
    }
    return row;
  };
}
