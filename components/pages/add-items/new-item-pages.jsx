'use client';

// Pieces of the new-item form (see the "New item" boards on the add-flow canvas):
// slide-in pages for category, size, expiry and spot, the photo sheet, and the shared
// counter / row / header shapes those screens are built from.

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ChevronLeft, ChevronRight, RotateCw, Hash, Scale } from 'lucide-react';
import { SIZE_UNITS, formatStorage, lastDayOfMonth } from '@/lib/inventory-format';
import { CategoryGlyph } from '@/components/ui/category-glyph';
import { BottomSheet } from './intake-fields';

export const LIFT = 'shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CIRCLE_BTN = 'w-11 h-11 shrink-0 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-[#1a1f36] active:bg-gray-200';

// The category page groups the list so nobody reads 15 rows. Order is fixed, so people learn
// where things sit. Categories are broad (what it is, how it's stored); the example line under
// each name settles the in-between cases. Icons come from CategoryGlyph.
const OTHER = 'Other / not sure';
const CATEGORY_GROUPS = [
  { title: 'Pantry shelf', names: ['Canned & jarred', 'Dry goods', 'Snacks', 'Drinks', 'Baby food & formula'] },
  { title: 'Fresh & cold', names: ['Produce', 'Meat', 'Dairy & eggs', 'Bread & bakery', 'Frozen'] },
  { title: 'Not food', names: ['Hygiene', 'Diapers & baby care', 'Household', 'Pet food'] },
];
const CATEGORY_TILE = {
  'Canned & jarred': { hint: 'Veggies, soup, beans, tuna, peanut butter' },
  'Dry goods': { hint: 'Pasta, rice, cereal, flour, dry beans' },
  'Snacks': { hint: 'Chips, crackers, bars, cookies' },
  'Drinks': { hint: 'Juice, water, shelf milk, coffee' },
  'Baby food & formula': { hint: 'Jars, pouches, formula' },
  'Produce': { hint: 'Fresh fruit and vegetables' },
  'Meat': { hint: 'Chicken, beef, pork, fish' },
  'Dairy & eggs': { hint: 'Milk, cheese, yogurt, eggs' },
  'Bread & bakery': { hint: 'Bread, buns, pastries' },
  'Frozen': { hint: 'Meals, veggies, desserts' },
  'Hygiene': { hint: 'Soap, shampoo, toothpaste, pads' },
  'Diapers & baby care': { hint: 'Diapers, wipes, baby wash' },
  'Household': { hint: 'Cleaning, paper towels, toilet paper' },
  'Pet food': { hint: 'Dog and cat food' },
  [OTHER]: { hint: 'Pick this if nothing fits. You can change it later.' },
};

export function Required() {
  return <span className="text-[12px] font-medium text-[#b5541a]">· Required</span>;
}
export function Optional() {
  return <span className="text-[12px] font-normal text-gray-500">· Optional</span>;
}

// 4px progress bar under the header.
export function Progress({ step }) {
  return (
    <div role="progressbar" aria-label={`Step ${step} of 2`} aria-valuemin={0} aria-valuemax={2} aria-valuenow={step} className="h-1 bg-gray-100">
      <motion.div
        className={`h-full bg-[#e27f2c] ${step === 1 ? 'rounded-r' : ''}`}
        animate={{ width: step === 1 ? '50%' : '100%' }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

const STEP_BTN = 'w-14 h-14 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-[#1a1f36] active:bg-gray-200';

// [−] [ 12 cans ] [+]   square gray buttons around a plain box. 20px text, so phones don't zoom.
export function Counter({ value, word, onChange, min = 1, label, lessLabel = 'One less', moreLabel = 'One more', decimal = false }) {
  const n = Number(value) || 0;
  const step = (d) => onChange(Math.max(min, Math.round((n + d) * 100) / 100));
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => step(-1)} aria-label={lessLabel} className={STEP_BTN}>
        <Minus className="w-5 h-5" strokeWidth={2.4} />
      </button>
      <div className="flex-1 min-w-0 h-14 px-3 rounded-xl border border-gray-200 flex items-center justify-center focus-within:border-[#1a1f36]">
        {/* Number and word share a baseline, so "item" sits on the same line as the digits. */}
        <div className="flex items-baseline gap-1.5">
        <input
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          enterKeyHint="done"
          aria-label={label}
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, '');
            onChange(raw === '' ? '' : decimal ? raw : Number(raw));
          }}
          onBlur={() => { if (!(Number(value) >= min)) onChange(min); }}
          className="w-[72px] p-0 border-0 outline-none bg-transparent text-right !text-[20px] leading-7 font-semibold text-[#1a1f36]"
        />
        <span className="w-[72px] text-[15px] leading-7 text-gray-500">{word}</span>
        </div>
      </div>
      <button type="button" onClick={() => step(1)} aria-label={moreLabel} className={STEP_BTN}>
        <Plus className="w-5 h-5" strokeWidth={2.4} />
      </button>
    </div>
  );
}

// Weights: the box takes what the scale shows, in lb or kg. Everything is saved in lb.
export const LB_PER_KG = 2.20462;
export function toLbs(value, unit) {
  const n = Number(value) || 0;
  return unit === 'kg' ? Math.round(n * LB_PER_KG * 100) / 100 : n;
}
const SCALE_UNIT_KEY = 'foodarca_scale_unit';
// Remembered per device, so someone at a kg scale switches once.
export function recallScaleUnit() {
  try { return localStorage.getItem(SCALE_UNIT_KEY) === 'kg' ? 'kg' : 'lb'; } catch { return 'lb'; }
}
function rememberScaleUnit(unit) {
  try { localStorage.setItem(SCALE_UNIT_KEY, unit); } catch {}
}
export function weightHint(value, unit) {
  return unit === 'kg' && Number(value) > 0
    ? `Saved as ${toLbs(value, unit)} lb.`
    : 'Put it all on the scale and type the number it shows.';
}

// [ 18.5          ] [ lb | kg ]
export function WeightField({ id, label, value, onChange, unit, onUnit, height = 'h-14' }) {
  return (
    <div className="flex gap-2">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        enterKeyHint="done"
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
        placeholder="0"
        className={`flex-1 min-w-0 ${height} px-4 rounded-xl border border-gray-200 bg-white !text-[20px] font-semibold text-[#1a1f36] outline-none focus:border-[#1a1f36] placeholder:text-gray-400 placeholder:font-normal`}
      />
      <div role="radiogroup" aria-label="Scale unit" className={`${height} shrink-0 flex gap-1 p-1 rounded-xl bg-gray-100`}>
        {['lb', 'kg'].map((u) => (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={unit === u}
            onClick={() => { onUnit(u); rememberScaleUnit(u); }}
            className={`w-14 h-full rounded-[9px] text-[15px] ${unit === u ? 'bg-white text-[#1a1f36] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-gray-500 font-medium'}`}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  );
}

// Gray segmented control (white pill on the chosen one).
export function Segmented({ options, value, onChange, label, height = 'h-11', cols }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-1 rounded-xl bg-gray-100 p-1" style={{ gridTemplateColumns: `repeat(${cols || options.length}, minmax(0, 1fr))` }}>
      {options.map(([v, l]) => {
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={`${height} rounded-[9px] text-[14px] ${on ? `bg-white text-[#1a1f36] font-semibold ${LIFT}` : 'text-gray-500 font-medium'}`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

// One row in a details card: icon tile · title + value · chevron.
export function DetailRow({ icon, round, title, value, onClick, disabled, last }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[60px] py-2 flex items-center gap-3 text-left text-[#1a1f36] disabled:opacity-55 ${last ? '' : 'border-b border-gray-100'}`}
    >
      {icon(round ? 'w-10 h-10 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-[#4b5263]' : 'w-10 h-10 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-[#4b5263]')}
      <span className="flex-1 min-w-0 flex flex-col gap-px">
        <span className="text-[14px] font-medium">{title}</span>
        <span className="text-[12px] text-gray-500 truncate">{value}</span>
      </span>
      <ChevronRight className="w-[18px] h-[18px] shrink-0 text-gray-400" strokeWidth={2.2} />
    </button>
  );
}

export function DetailsCard({ title, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="text-[14px] font-medium text-gray-900">{title} <Optional /></span>
      <div className={`rounded-2xl border border-gray-300/70 px-3.5 ${LIFT}`}>{children}</div>
    </div>
  );
}

// Full-screen page that slides in from the right over the form.
function SlidePage({ open, onBack, title, children, footer }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="page"
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="absolute inset-0 z-20 bg-white flex flex-col"
        >
          <div className="shrink-0 pt-[env(safe-area-inset-top)] border-b border-gray-100">
            <div className="h-[60px] px-4 flex items-center gap-3">
              <button type="button" onClick={onBack} aria-label="Back" className={CIRCLE_BTN}>
                <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
              </button>
              <span className="flex-1 min-w-0 text-[16px] font-medium tracking-[-0.01em]">{title}</span>
            </div>
          </div>
          {children}
          {footer && <div className="shrink-0 px-4 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))]">{footer}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PillButton({ children, onClick, disabled, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[52px] rounded-full text-[16px] font-semibold flex items-center justify-center gap-2 ${disabled ? 'bg-gray-100 text-gray-500' : `bg-[#e27f2c] text-white active:bg-[#cf6f20] ${LIFT}`} ${className}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Category page
// ---------------------------------------------------------------------------

// The drawings are mostly white line art, so they sit straight on the card (no gray chip) and
// large enough to recognise before reading the name.
function CategoryIcon({ name, size = 64 }) {
  return <CategoryGlyph category={name} className={`${size === 64 ? 'w-16 h-16' : 'w-12 h-12'} object-contain object-left-bottom`} />;
}

export function CategoryPage({ open, onBack, categories, selectedId, onSelect }) {
  const known = new Set([...CATEGORY_GROUPS.flatMap((g) => g.names), OTHER]);
  // A category added later that isn't placed yet still shows, in the last group.
  const groups = CATEGORY_GROUPS.map((g, i) => ({
    title: g.title,
    items: [
      ...g.names.map((n) => categories.find((c) => c.name === n)).filter(Boolean),
      ...(i === CATEGORY_GROUPS.length - 1 ? categories.filter((c) => !known.has(c.name)) : []),
    ],
  })).filter((g) => g.items.length > 0);
  const other = categories.find((c) => c.name === OTHER);
  const tileClass = (on) =>
    `text-[#1a1f36] text-left ${on ? 'border-[1.5px] border-[#1a1f36] bg-gray-50' : 'border border-gray-200 bg-white active:bg-gray-50'}`;

  return (
    <SlidePage open={open} onBack={onBack} title="Pick a category">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))] flex flex-col gap-5">
        {categories.length === 0 ? (
          <p className="py-8 text-center text-[13.5px] text-gray-500">Loading categories…</p>
        ) : (
          <>
            {groups.map((g) => (
              <div key={g.title} className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-[#4b5263]">{g.title}</span>
                <div className="grid grid-cols-2 gap-2">
                  {g.items.map((c) => {
                    const on = selectedId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onSelect(c)}
                        className={`p-3 pt-2 rounded-2xl flex flex-col items-start gap-1 ${tileClass(on)}`}
                      >
                        <CategoryIcon name={c.name} />
                        <span className="w-full min-w-0 flex flex-col gap-0.5">
                          <span className="text-[14px] font-medium leading-tight">{c.name}</span>
                          {CATEGORY_TILE[c.name] && (
                            <span className="text-[11.5px] leading-snug text-gray-500">{CATEGORY_TILE[c.name].hint}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {other && (
              <button
                type="button"
                aria-pressed={selectedId === other.id}
                onClick={() => onSelect(other)}
                className={`w-full min-h-16 p-2.5 rounded-2xl flex items-center gap-2.5 ${tileClass(selectedId === other.id)}`}
              >
                <CategoryIcon name={OTHER} size={48} />
                <span className="flex-1 min-w-0 flex flex-col gap-px">
                  <span className="text-[14px] font-medium">{OTHER}</span>
                  <span className="text-[12px] text-gray-500">{CATEGORY_TILE[OTHER].hint}</span>
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </SlidePage>
  );
}

// Count | Weigh (lb) switch under the chosen category.
export function TrackSwitch({ value, onChange }) {
  const opts = [['count', 'Count', Hash], ['weight', 'Weigh (lb)', Scale]];
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-[#4b5263]">How do you track it?</span>
      <div role="radiogroup" aria-label="How do you track it?" className="grid grid-cols-2 gap-1 p-1 rounded-[14px] bg-[#eceef1]">
        {opts.map(([v, label, Icon]) => {
          const on = v === value;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(v)}
              className={`h-11 rounded-[10px] flex items-center justify-center gap-1.5 text-[14px] font-semibold ${on ? 'bg-white text-[#1a1f36] shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-gray-500'}`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>
      <span className="text-[12px] text-gray-500">
        {value === 'weight' ? 'You’ll enter the total pounds.' : 'You’ll enter how many cans, boxes or items.'}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Size page (counted items): size printed on one item
// ---------------------------------------------------------------------------

const LABEL_UNITS = SIZE_UNITS.filter((u) => u.value !== 'ct');
export const unitLabel = (v) => (SIZE_UNITS.find((u) => u.value === v) || {}).label || v;

export function SizePage({ open, size, onBack, onSave }) {
  const [amount, setAmount] = useState(15);
  const [unit, setUnit] = useState('oz');
  useEffect(() => {
    if (!open) return;
    setAmount(Number(size.amount) > 0 ? Number(size.amount) : 15);
    setUnit(size.unit && size.unit !== 'ct' ? size.unit : 'oz');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const ok = Number(amount) > 0;
  return (
    <SlidePage
      open={open}
      onBack={onBack}
      title={<>Size on the label <Optional /></>}
      footer={
        <PillButton onClick={() => onSave(ok ? { amount: Number(amount), unit } : { amount: '', unit: null })}>
          {ok ? `Use ${Number(amount)} ${unitLabel(unit)}` : 'Done'}
        </PillButton>
      }
    >
      <div className="flex-1 overflow-y-auto px-4 pt-6 flex flex-col gap-3">
        <span className="text-[12px] text-gray-500">For one can or box, as printed.</span>
        <Counter value={amount} word={unitLabel(unit)} onChange={setAmount} min={1} decimal label="Size of one item" lessLabel="Smaller" moreLabel="Bigger" />
        <Segmented label="Unit" options={LABEL_UNITS.map((u) => [u.value, u.label])} value={unit} onChange={setUnit} height="h-10" />
        <button
          type="button"
          onClick={() => onSave({ amount: '', unit: null })}
          className="self-start py-3 text-[13.5px] font-medium text-gray-500"
        >
          Not on the label? Leave it blank
        </button>
      </div>
    </SlidePage>
  );
}

// ---------------------------------------------------------------------------
// Expiry page: taps only, no keyboard
// ---------------------------------------------------------------------------

export function expiryText(date, precision) {
  if (!date) return 'Not recorded';
  const [y, m, d] = date.split('-').map(Number);
  return 'Best by ' + MONTHS[m - 1] + (precision === 'day' ? ` ${d}, ${y}` : ` ${y}`);
}

// Picked parts → the stored value: a day date, or the last day of the month at month precision.
export function toExpiry(year, month, day) {
  if (month === null) return { date: null, precision: null };
  if (day) return { date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, precision: 'day' };
  return { date: lastDayOfMonth(year, month + 1), precision: 'month' };
}
export function fromExpiry(date, precision) {
  if (!date) return { year: new Date().getFullYear() + 1, month: null, day: null };
  const [y, m, d] = date.split('-').map(Number);
  return { year: y, month: m - 1, day: precision === 'day' ? d : null };
}
export const expiryShort = ({ year, month, day }) => (month === null ? '' : MONTHS[month] + (day ? ` ${day}, ${year}` : ` ${year}`));

// Year card (‹ 2027 ›) over a 4 × 3 month grid, then one swipeable row of days.
// Everything keeps its height, so picking a day never moves the screen.
export function ExpiryPicker({ value, onChange }) {
  const { year, month, day } = value;
  const minYear = new Date().getFullYear();
  const daysIn = month === null ? 31 : new Date(year, month + 1, 0).getDate();
  const on = 'border-[1.5px] border-[#1a1f36] bg-gray-50 text-[#1a1f36] font-semibold';
  const off = 'border border-gray-200 bg-white text-[#4b5263] font-medium';
  const yearBtn = (enabled) =>
    `w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center ${enabled ? 'bg-gray-100 text-[#1a1f36] active:bg-gray-200' : 'bg-white text-gray-300'}`;

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl border border-gray-200 px-3 pt-2 pb-3 flex flex-col gap-2 ${LIFT}`}>
        <div className="flex items-center justify-between">
          <button type="button" aria-label={`Go to ${year - 1}`} disabled={year <= minYear} onClick={() => onChange({ year: year - 1, month, day: null })} className={yearBtn(year > minYear)}>
            <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={2.4} />
          </button>
          <span className="text-[17px] font-semibold tracking-[-0.01em]">{year}</span>
          <button type="button" aria-label={`Go to ${year + 1}`} onClick={() => onChange({ year: year + 1, month, day: null })} className={yearBtn(true)}>
            <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.4} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MONTHS.map((m, i) => (
            <button key={m} type="button" aria-pressed={i === month} onClick={() => onChange({ year, month: i, day: null })} className={`h-12 rounded-xl text-[14px] ${i === month ? on : off}`}>{m}</button>
          ))}
        </div>
      </div>
      <div className={`flex flex-col gap-2 transition-opacity ${month === null ? 'opacity-[0.35] pointer-events-none' : ''}`} aria-disabled={month === null}>
        <span className="text-[13px] font-medium text-gray-500">Day <span className="font-normal">· optional</span></span>
        <div className="-mx-4 px-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: daysIn }, (_, i) => i + 1).map((d) => (
            <button key={d} type="button" aria-pressed={d === day} onClick={() => onChange({ year, month, day: d === day ? null : d })} className={`w-11 h-11 shrink-0 rounded-full text-[14px] ${d === day ? on : off}`}>{d}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Secondary outlined pill, same size as PillButton.
export function OutlineButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-full h-[52px] rounded-full border border-gray-300 bg-white text-[16px] font-semibold text-[#1a1f36] active:bg-gray-50">
      {children}
    </button>
  );
}

export function ExpiryPage({ open, date, precision, onBack, onSave }) {
  const [draft, setDraft] = useState(() => fromExpiry(date, precision));
  useEffect(() => {
    if (open) setDraft(fromExpiry(date, precision));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const short = expiryShort(draft);
  return (
    <SlidePage
      open={open}
      onBack={onBack}
      title={<>Expiry date <Optional /></>}
      footer={
        <div className="flex flex-col gap-2">
          <PillButton onClick={() => onSave(toExpiry(draft.year, draft.month, draft.day))} disabled={draft.month === null}>
            {draft.month === null ? 'Pick a month' : `Use ${short}`}
          </PillButton>
          <OutlineButton onClick={() => onSave({ date: null, precision: null })}>No date on the label</OutlineButton>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4 flex flex-col gap-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-gray-500">Best by</span>
          <span className={`text-[28px] font-semibold tracking-[-0.02em] ${draft.month === null ? 'text-gray-400' : 'text-[#1a1f36]'}`}>
            {draft.month === null ? 'Pick a month' : short}
          </span>
        </div>
        <ExpiryPicker value={draft} onChange={setDraft} />
      </div>
    </SlidePage>
  );
}

// ---------------------------------------------------------------------------
// Spot page: type at the top, the pantry's past spots below (kept in the top half for the keyboard)
// ---------------------------------------------------------------------------

export function spotText(spot, lastSpot) {
  if (!spot) return 'Not recorded';
  return formatStorage(spot) + (spot === lastSpot ? ' · same as last time' : '');
}

// Spots this pantry has used: every storage value on its shelves now, plus the last one picked.
export function usePantrySpots(pantryId, enabled, extra = []) {
  const [spots, setSpots] = useState([]);
  useEffect(() => {
    if (!pantryId || !enabled) return;
    let alive = true;
    fetch('/api/foods', { headers: { 'x-pantry-id': pantryId }, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => {
        if (!alive) return;
        setSpots([...new Set((d.data || []).map((l) => l.storageLocation).filter(Boolean))]);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [pantryId, enabled]);
  const extraKey = extra.filter(Boolean).join('\n');
  return useMemo(() => [...new Set([...(extraKey ? extraKey.split('\n') : []), ...spots])], [spots, extraKey]);
}

export function SpotPage({ open, spot, lastSpot, spots, onBack, onSave }) {
  const [q, setQ] = useState('');
  useEffect(() => { if (open) setQ(''); }, [open]);

  const qTrim = q.trim();
  const ql = qTrim.toLowerCase();
  const matches = spots.filter((s) => formatStorage(s).toLowerCase().includes(ql));
  const exact = spots.some((s) => formatStorage(s).toLowerCase() === ql);

  return (
    <SlidePage open={open} onBack={onBack} title={<>Where does it go? <Optional /></>}>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 flex flex-col gap-3">
        <div className="h-[52px] flex items-center gap-2 rounded-xl border-[1.5px] border-[#1a1f36] pl-3.5 pr-1.5">
          <input
            type="text"
            aria-label="Spot name"
            enterKeyHint="done"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && qTrim) onSave(exact ? spots.find((s) => formatStorage(s).toLowerCase() === ql) : qTrim); }}
            placeholder="Type a spot, like Back room shelf"
            className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[16px] text-[#1a1f36] placeholder:text-gray-500"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Clear" className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 text-[16px]">×</button>
          )}
        </div>

        {qTrim && !exact && (
          <button type="button" onClick={() => onSave(qTrim)} className="w-full min-h-[52px] rounded-xl border border-gray-200 bg-white flex items-center gap-3 px-3.5 py-2 text-left text-[#1a1f36]">
            <span className="w-8 h-8 shrink-0 rounded-full bg-gray-100 flex items-center justify-center"><Plus className="w-4 h-4" strokeWidth={2.4} /></span>
            <span className="flex-1 min-w-0 truncate text-[14px] font-medium">Use “{qTrim}”</span>
            <span className="text-[12px] text-gray-500">New spot</span>
          </button>
        )}

        <span className="mt-1 text-[13px] font-medium text-[#4b5263]">{qTrim ? 'Saved spots that match' : 'Spots your pantry has used'}</span>
        <div className="flex flex-col">
          {matches.map((s) => (
            <button key={s} type="button" onClick={() => onSave(s)} className="w-full min-h-12 px-0.5 flex items-center gap-3 border-b border-gray-100 text-left text-[#1a1f36]">
              <span className={`flex-1 min-w-0 truncate text-[14px] ${s === spot ? 'font-semibold' : 'font-medium'}`}>{formatStorage(s)}</span>
              <span className="text-[12px] text-gray-500">{s === spot ? 'Selected' : s === lastSpot ? 'Last time' : ''}</span>
            </button>
          ))}
        </div>
        {qTrim && matches.length === 0 && (
          <span className="text-[12px] text-gray-500">Nothing saved matches. Tap “Use” above to save it as a new spot.</span>
        )}
        {!qTrim && spots.length === 0 && (
          <span className="text-[12px] text-gray-500">No spots saved yet. Type one above.</span>
        )}
        {spot && (
          <button type="button" onClick={() => onSave(null)} className="self-start py-3 text-[13.5px] font-medium text-gray-500">
            Clear the spot
          </button>
        )}
      </div>
    </SlidePage>
  );
}

// ---------------------------------------------------------------------------
// Photo sheet: pick from an image search for this name + category
// ---------------------------------------------------------------------------

export function PhotoSheet({ open, onClose, name, categoryName, categorySlug, photoUrl, onSelect }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(() => new Set());
  const [queryKey, setQueryKey] = useState('');

  const search = async (refresh = false) => {
    const q = name.trim();
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ q, category: categorySlug || '', t: Date.now().toString() });
      if (refresh) {
        params.set('refresh', '1');
        if (images.length) params.set('exclude', images.join(','));
      }
      const res = await fetch(`/api/foods/image-search?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = Array.isArray(data.images) ? data.images : [];
      setImages(list);
      setFailed(new Set());
      setQueryKey(`${q.toLowerCase()}|${categorySlug}`);
      if (!list.length) setError(`No photos found for “${q}”.`);
    } catch {
      setError('Can’t search photos right now. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && queryKey !== `${name.trim().toLowerCase()}|${categorySlug}`) search();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = images.filter((u) => !failed.has(u)).slice(0, 6);

  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="photo-sheet-title" zIndex={10100}>
      <div className="flex justify-center pt-2.5"><span className="w-10 h-[5px] rounded-full bg-gray-200" /></div>
      <div className="px-4 pt-4 flex items-center justify-between">
        <h2 id="photo-sheet-title" className="text-[16px] font-medium tracking-[-0.01em] text-[#1a1f36]">Pick a photo</h2>
        <button type="button" onClick={() => search(true)} disabled={loading} className="py-3 flex items-center gap-1.5 text-[13.5px] text-[#1a1f36] disabled:opacity-50">
          <RotateCw className="w-[15px] h-[15px]" strokeWidth={2.2} />
          <span className="underline underline-offset-2">Show others</span>
        </button>
      </div>
      <p className="px-4 text-[12px] text-gray-500">Results for “{name.trim().toLowerCase()}” in {(categoryName || 'this category').toLowerCase()}.</p>

      <div className="px-4 pt-4 grid grid-cols-3 gap-2">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />)
          : shown.map((url, i) => {
              const on = url === photoUrl;
              return (
                <button
                  key={url}
                  type="button"
                  aria-label={`Search result ${i + 1}`}
                  aria-pressed={on}
                  onClick={() => onSelect(on ? null : url)}
                  className={`aspect-square rounded-xl overflow-hidden bg-white ${on ? 'border-[2.5px] border-[#1a1f36]' : 'border border-gray-200'}`}
                >
                  <img
                    src={url}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={() => setFailed((prev) => new Set([...prev, url]))}
                    className="w-full h-full object-contain p-1"
                  />
                </button>
              );
            })}
      </div>
      {!loading && error && <p className="px-4 pt-3 text-[12.5px] text-gray-500">{error}</p>}
      {loading && <p className="sr-only" role="status">Searching photos</p>}

      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => onSelect(null)}
          disabled={!photoUrl}
          className={`w-full h-12 rounded-2xl border border-gray-200 bg-white text-[14px] font-medium ${photoUrl ? 'text-red-600' : 'text-gray-400'}`}
        >
          Remove photo
        </button>
      </div>
      <div className="px-4 pt-5 pb-[calc(28px+env(safe-area-inset-bottom))]">
        <PillButton onClick={onClose}>Done</PillButton>
      </div>
    </BottomSheet>
  );
}
