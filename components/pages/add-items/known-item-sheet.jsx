'use client';

// Adding more of an item the pantry already has (scan match, restock, or picked by name).
// Matches the "Restock" board on the add-flow canvas, one step at a time:
//   1. Add to:   the item's batches (one date in one spot) + "New batch"
//   2. New batch only: the date (same picker as the new-item expiry page)
//   3. How many  (+ where it goes, for a new batch: typed or one the pantry has used)
// The sheet keeps one height on every step so nothing jumps.

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Loader2, MapPin } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { formatAmountWithUnit, formatExpiry, formatStorage } from '@/lib/inventory-format';
import { BottomSheet, ItemThumb, recallStorage, rememberStorage } from './intake-fields';
import {
  ExpiryPicker, OutlineButton, PillButton, SpotPage, usePantrySpots, toExpiry, fromExpiry, expiryShort,
  Counter, DetailRow, WeightField, toLbs, recallScaleUnit, weightHint, spotText,
} from './new-item-pages';
import { makeLine } from './cart-lines';

const NEW = 'new';
const CIRCLE_BTN = 'w-11 h-11 shrink-0 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-[#1a1f36] active:bg-gray-200';
const batchKey = (b) => `${b.expirationDate || ''}|${b.storageLocation || ''}`;

// Lots that differ only by source are one physical batch on the shelf.
function groupBatches(lots) {
  const map = new Map();
  for (const l of lots) {
    const key = batchKey(l);
    const g = map.get(key) || {
      key,
      expirationDate: l.expirationDate,
      expirationPrecision: l.expirationPrecision,
      storageLocation: l.storageLocation,
      quantity: 0,
    };
    g.quantity += Number(l.quantity) || 0;
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => {
    if (!a.expirationDate) return 1;
    if (!b.expirationDate) return -1;
    return a.expirationDate.localeCompare(b.expirationDate);
  });
}

function isExpired(date) {
  return !!date && date < new Date().toISOString().slice(0, 10);
}

export function KnownItemSheet({ product, initialLine, onClose, onAdd }) {
  const { pantryId } = usePantry();
  const open = !!product;
  const [step, setStep] = useState(null); // null (loading) | 'pick' | 'date' | 'amount'
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('lb'); // weighed items: what the scale reads; saved in lb
  const [draft, setDraft] = useState(() => fromExpiry(null));
  const [noDate, setNoDate] = useState(false);
  const [storage, setStorage] = useState(null);
  const [lots, setLots] = useState(null); // null = loading
  const [choice, setChoice] = useState(null); // batch key | NEW
  const [spotOpen, setSpotOpen] = useState(false);
  const [lastSpot] = useState(() => recallStorage());
  const spots = usePantrySpots(pantryId, open, [lastSpot, storage]);

  // Reset for each item.
  useEffect(() => {
    if (!product) return;
    // Cart lines hold pounds, so an edit opens in lb; a new weight uses the scale's last unit.
    setUnit(initialLine ? 'lb' : recallScaleUnit());
    if (initialLine) {
      setQuantity(initialLine.quantity);
      setDraft(fromExpiry(initialLine.expirationDate, initialLine.expirationPrecision));
      setNoDate(!initialLine.expirationDate);
      setStorage(initialLine.storageLocation);
    } else {
      setQuantity(product.trackBy === 'weight' ? '' : 1);
      setDraft(fromExpiry(null));
      setNoDate(false);
      setStorage(recallStorage());
    }
    setChoice(null);
    setStep(null);
    setLots(null);
    setSpotOpen(false);
  }, [product, initialLine]);

  // Load the item's batches at this location.
  useEffect(() => {
    if (!product?.catalogItemId || !pantryId) return;
    let alive = true;
    fetch(`/api/items/${product.catalogItemId}?history=0`, { headers: { 'x-pantry-id': pantryId }, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { lots: [] }))
      .then((d) => { if (alive) setLots(d.lots || []); })
      .catch(() => { if (alive) setLots([]); });
    return () => { alive = false; };
  }, [product, pantryId]);

  const batches = useMemo(() => groupBatches(lots || []), [lots]);

  // First step once batches are known: editing → straight to the amount (its own batch if it
  // still exists); no batches → a new batch; otherwise the volunteer picks.
  useEffect(() => {
    if (lots === null || step !== null || !product) return;
    if (initialLine) {
      const k = batchKey(initialLine);
      setChoice(batches.some((b) => b.key === k) ? k : NEW);
      setStep('amount');
    } else if (batches.length === 0) {
      setChoice(NEW);
      setStep(product.isFood ? 'date' : 'amount');
    } else {
      setStep('pick');
    }
  }, [lots, batches, initialLine, step, product]);

  if (!product) return <BottomSheet open={false} onClose={onClose} />;

  const weighed = product.trackBy === 'weight';
  const chosenBatch = batches.find((b) => b.key === choice) || null;
  const totalInStock = batches.reduce((s, b) => s + b.quantity, 0);
  const amountOf = (n) => (weighed ? formatAmountWithUnit(n, 'weight') : String(n));
  const dateLabel = (date, precision) => (date ? formatExpiry(date, precision) : 'No date');
  const newDate = noDate || draft.month === null ? 'No date' : expiryShort(draft);
  const valid = Number(quantity) > 0 && choice !== null;

  const pickBatch = (b) => {
    setChoice(b.key);
    if (!initialLine) setQuantity(weighed ? '' : 1);
    setStep('amount');
  };
  const pickNew = () => {
    setChoice(NEW);
    setDraft(fromExpiry(null));
    setNoDate(false);
    setStorage(lastSpot);
    setStep(product.isFood ? 'date' : 'amount');
  };

  const backTarget =
    step === 'date' ? (batches.length ? 'pick' : null)
      : step === 'amount' ? (choice === NEW && product.isFood ? 'date' : batches.length ? 'pick' : null)
        : null;

  const submit = () => {
    if (!valid) return;
    const exp = noDate ? { date: null, precision: null } : toExpiry(draft.year, draft.month, draft.day);
    const target = chosenBatch
      ? { date: chosenBatch.expirationDate, precision: chosenBatch.expirationPrecision, storage: chosenBatch.storageLocation }
      : { date: product.isFood ? exp.date : null, precision: product.isFood ? exp.precision : null, storage };
    rememberStorage(target.storage);
    onAdd(makeLine(product, {
      quantity: weighed ? toLbs(quantity, unit) : quantity,
      expirationDate: target.date,
      expirationPrecision: target.precision,
      storageLocation: target.storage,
    }, initialLine?.id));
  };

  // Header text per step
  let title = product.name;
  let sub = totalInStock > 0 ? `${formatAmountWithUnit(totalInStock, product.trackBy)} in stock` : 'None in stock';
  if (step === 'date') {
    title = 'New date';
    sub = draft.month === null ? 'Pick the month on the label' : `Best by ${expiryShort(draft)}`;
  } else if (step === 'amount') {
    if (chosenBatch) {
      title = product.isFood ? dateLabel(chosenBatch.expirationDate, chosenBatch.expirationPrecision) : product.name;
      sub = [formatStorage(chosenBatch.storageLocation) || 'No spot set', `${amountOf(chosenBatch.quantity)} now`].join(' · ');
    } else {
      title = product.isFood ? newDate : product.name;
      sub = 'Not on the shelf yet';
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="known-item-title">
      <div className="relative h-[min(640px,92dvh)] flex flex-col overflow-hidden rounded-t-[32px] text-[#1a1f36]">
        <div className="flex justify-center pt-2.5 shrink-0"><span className="w-10 h-[5px] rounded-full bg-gray-200" /></div>

        {/* Header */}
        <div className="shrink-0 px-4 pt-3.5 pb-4 flex items-center gap-3">
          {step === 'pick' || step === null ? (
            <ItemThumb photoUrl={product.photoUrl} categoryName={product.categoryName} size={44} />
          ) : backTarget ? (
            <button type="button" onClick={() => setStep(backTarget)} aria-label="Back" className={CIRCLE_BTN}>
              <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
            </button>
          ) : null}
          <div className="flex-1 min-w-0">
            <h2 id="known-item-title" className="truncate text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
            <p className="truncate text-[13px] text-gray-500">{sub}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={CIRCLE_BTN}>
            <X className="w-[18px] h-[18px]" strokeWidth={2.4} />
          </button>
        </div>

        {step === null && (
          <div className="flex-1 flex items-center justify-center gap-2 text-[13px] text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking what’s on the shelf…
          </div>
        )}

        {/* 1 · Which batch */}
        {step === 'pick' && (
          <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
            <span className="text-[13px] font-medium text-gray-500">Add to</span>
            <div className="rounded-2xl border border-gray-200 px-3.5">
              {batches.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => pickBatch(b)}
                  className="w-full min-h-16 py-2.5 flex items-center gap-3 border-b border-gray-100 text-left"
                >
                  <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-[15px] font-medium">
                      {product.isFood ? dateLabel(b.expirationDate, b.expirationPrecision) : 'Current stock'}
                      {product.isFood && isExpired(b.expirationDate) && <span className="ml-1.5 text-[12.5px] font-normal text-red-600">· Expired</span>}
                    </span>
                    <span className="truncate text-[13px] text-gray-500">{formatStorage(b.storageLocation) || 'No spot set'}</span>
                  </span>
                  <span className="text-[15px] font-medium text-[#4b5263]">{amountOf(b.quantity)}</span>
                  <ChevronRight className="w-[18px] h-[18px] shrink-0 text-gray-400" strokeWidth={2.2} />
                </button>
              ))}
              <button type="button" onClick={pickNew} className="w-full h-14 flex items-center gap-2 text-[15px] font-medium">
                <Plus className="w-[18px] h-[18px]" strokeWidth={2.2} />
                {product.isFood ? 'New date or spot' : 'New spot'}
              </button>
            </div>
          </div>
        )}

        {/* 2 · New batch: the date */}
        {step === 'date' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 pb-2">
              <ExpiryPicker value={draft} onChange={setDraft} />
            </div>
            <div className="shrink-0 px-4 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))] flex flex-col gap-2">
              <PillButton disabled={draft.month === null} onClick={() => { setNoDate(false); setStep('amount'); }}>
                {draft.month === null ? 'Pick a month' : 'Next'}
              </PillButton>
              <OutlineButton onClick={() => { setNoDate(true); setStep('amount'); }}>No date on the label</OutlineButton>
            </div>
          </>
        )}

        {/* 3 · How many (+ spot for a new batch) */}
        {step === 'amount' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 pt-1 pb-4 flex flex-col gap-6">
              {weighed ? (
                <div className="flex flex-col gap-2">
                  <label htmlFor="known-weight" className="text-[13px] font-medium text-gray-500">How much</label>
                  <WeightField id="known-weight" value={quantity} onChange={setQuantity} unit={unit} onUnit={setUnit} />
                  <span className="text-[12px] text-gray-500">{weightHint(quantity, unit)}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium text-gray-500">How many</span>
                  <Counter
                    value={quantity}
                    onChange={setQuantity}
                    label="How many"
                    word={['Canned & jarred', 'Canned Goods'].includes(product.categoryName) ? (Number(quantity) === 1 ? 'can' : 'cans') : (Number(quantity) === 1 ? 'item' : 'items')}
                  />
                </div>
              )}

              {/* New batch: where it goes is typed by the pantry (or one it has used), never preset */}
              {choice === NEW && (
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium text-gray-500">Where it goes <span className="font-normal">· optional</span></span>
                  <div className="rounded-2xl border border-gray-200 px-3.5">
                    <DetailRow
                      round
                      last
                      title="Where it goes"
                      value={spotText(storage, lastSpot)}
                      onClick={() => setSpotOpen(true)}
                      icon={(cls) => <span className={cls}><MapPin className="w-[18px] h-[18px]" strokeWidth={2} /></span>}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="shrink-0 px-4 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))]">
              <PillButton onClick={submit} disabled={!valid}>
                {initialLine ? 'Save' : Number(quantity) > 0 ? `Add ${weighed ? `${Number(quantity)} ${unit}` : quantity}` : 'Add'}
              </PillButton>
            </div>
          </>
        )}

        <SpotPage
          open={spotOpen}
          spot={storage}
          lastSpot={lastSpot}
          spots={spots}
          onBack={() => setSpotOpen(false)}
          onSave={(s) => { setStorage(s); setSpotOpen(false); }}
        />
      </div>
    </BottomSheet>
  );
}
