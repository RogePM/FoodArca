'use client';

// Adding an item the pantry doesn't have yet (matches the "New item" boards on the add-flow canvas).
//   1. New item:  name · category (sets count vs weigh) · extras (photo, size for counted items)
//   2. The item:  how many (loose or sealed boxes) / how much it weighs · expires · where it goes
// Category, size, expiry and spot open their own slide-in pages; the photo opens a sheet.
// Item facts are saved once; next time only the known-item sheet is needed.
// The inventory page reuses it to edit stock on hand (`inStock`): same pages, Save instead of Add.

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ArrowRight, Plus, Camera, Calendar, MapPin } from 'lucide-react';
import { capitalizeWords, categorySlug, defaultTrackBy, formatSize } from '@/lib/inventory-format';
import { useCategories, usePantryItems, ItemThumb, recallStorage, rememberStorage } from './intake-fields';
import {
  LIFT, Required, Progress, Counter, Segmented, DetailRow, DetailsCard, PillButton,
  CategoryPage, TrackSwitch, SizePage, ExpiryPage, SpotPage, PhotoSheet, usePantrySpots, expiryText, spotText, unitLabel,
  WeightField, toLbs, recallScaleUnit, weightHint,
} from './new-item-pages';
import { makeLine } from './cart-lines';

const realBarcode = (b) => (b && !/^(INT|SYS)-/i.test(b) ? b : null);
const CIRCLE_BTN = 'w-11 h-11 shrink-0 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-[#1a1f36] active:bg-gray-200';

function SizeIcon({ className }) {
  return (
    <span className={className}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h10M4 17h6" /></svg>
    </span>
  );
}

export function NewItemForm({ initial = {}, editLine = null, inStock = false, lockTrackBy = false, pantryId, onBack, onSave, onPickExisting }) {
  const categories = useCategories(pantryId);
  const { items: pantryItems } = usePantryItems(pantryId);
  const src = editLine || initial;

  const [step, setStep] = useState(1);
  const [page, setPage] = useState(null); // 'category' | 'size' | 'photo' | 'expiry' | 'spot'
  const [name, setName] = useState(capitalizeWords(src.name || ''));
  const [category, setCategory] = useState(
    src.categoryId ? { id: src.categoryId, name: src.categoryName, isFood: src.isFood ?? true } : null
  );
  const [trackBy, setTrackBy] = useState(src.trackBy || 'count');
  const [trackTouched, setTrackTouched] = useState(!!editLine);
  const [size, setSize] = useState({ amount: src.sizeAmount ?? '', unit: src.sizeUnit ?? null });
  const [photoUrl, setPhotoUrl] = useState(src.photoUrl || null);
  const [quantity, setQuantity] = useState(editLine ? editLine.quantity : (src.trackBy === 'weight' ? '' : 1));
  // Cart lines hold pounds, so an edit opens in lb; a new weight starts in the scale's last unit.
  const [unit, setUnit] = useState(() => (editLine ? 'lb' : recallScaleUnit()));
  const [mode, setMode] = useState('single'); // counted: 'single' (loose) | 'boxes' (sealed)
  const [boxes, setBoxes] = useState(1);
  const [perBox, setPerBox] = useState(Number(src.caseSize) > 1 ? Number(src.caseSize) : 24);
  const [expiry, setExpiry] = useState({ date: editLine?.expirationDate || null, precision: editLine?.expirationPrecision || null });
  const [lastSpot] = useState(() => recallStorage());
  const [storage, setStorage] = useState(editLine ? editLine.storageLocation : lastSpot);
  const [nameFocused, setNameFocused] = useState(false);
  const spots = usePantrySpots(pantryId, step === 2, [lastSpot, storage]);

  // If the category list arrives after an edit opened, fill in is_food from it.
  useEffect(() => {
    if (category && categories.length) {
      const c = categories.find((x) => x.id === category.id);
      if (c && c.isFood !== category.isFood) setCategory({ id: c.id, name: c.name, isFood: c.isFood });
    }
  }, [categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = name.trim().toLowerCase();
  // Only offered when there's somewhere to go (the add flow); editing stock can't switch items.
  const others = useMemo(() => (onPickExisting ? pantryItems : []), [pantryItems, onPickExisting]);
  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    return others.filter((i) => i.name?.toLowerCase().includes(query)).slice(0, 5);
  }, [others, query]);
  const exactMatch = useMemo(
    () => (query ? others.find((i) => i.name?.trim().toLowerCase() === query) : null),
    [others, query]
  );

  // Switching how it's tracked resets the amount: a weighed item starts empty (never "1 lb").
  const changeTrackBy = (v) => {
    if (v === trackBy) return;
    setTrackBy(v);
    setQuantity(v === 'weight' ? '' : 1);
    setMode('single');
  };

  const pickCategory = (c) => {
    setCategory({ id: c.id, name: c.name, isFood: c.isFood });
    if (!trackTouched) changeTrackBy(defaultTrackBy(c.name));
    setPage(null);
  };

  const isFood = category?.isFood ?? true;
  const counted = trackBy === 'count';
  const canned = category?.name === 'Canned & jarred' || category?.name === 'Canned Goods';
  const one = canned ? 'can' : 'item';
  const many = canned ? 'cans' : 'items';
  const total = counted ? (mode === 'boxes' ? (Number(boxes) || 0) * (Number(perBox) || 0) : Number(quantity) || 0) : toLbs(quantity, unit);
  const step1Valid = name.trim().length > 0 && !!category;
  const step2Valid = total > 0;
  const hasSize = counted && Number(size.amount) > 0;

  const goNext = () => {
    if (!step1Valid) return;
    if (counted && !(Number(quantity) >= 1)) setQuantity(1);
    setStep(2);
  };

  const save = () => {
    if (!step2Valid) return;
    rememberStorage(storage);
    const draft = {
      catalogItemId: null,
      name: name.trim(),
      categoryId: category.id,
      categoryName: category.name,
      isFood,
      trackBy,
      sizeAmount: hasSize ? Number(size.amount) : null,
      sizeUnit: hasSize ? size.unit || 'oz' : null,
      caseSize: counted ? (mode === 'boxes' ? Number(perBox) : src.caseSize ?? null) : null,
      barcode: realBarcode(src.barcode),
      photoUrl,
    };
    onSave(makeLine(draft, {
      quantity: total,
      expirationDate: isFood ? expiry.date : null,
      expirationPrecision: isFood ? expiry.precision : null,
      storageLocation: storage,
    }, editLine?.id));
  };

  const handleBack = () => (step === 2 ? setStep(1) : onBack());
  const photoReady = !!category && name.trim().length >= 2;
  const caption = [category?.name, counted ? (hasSize ? `${Number(size.amount)} ${unitLabel(size.unit || 'oz')} each` : null) : 'weighed']
    .filter(Boolean).join(' · ');
  const amountText = counted ? `${total} ${total === 1 ? one : many}` : `${Number(quantity) || 0} ${unit}`;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-item-heading"
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex flex-col overflow-hidden text-[#1a1f36]"
    >
      {/* Header: close + "New item" (step 1) or back + the item itself (step 2), then progress */}
      <div className="shrink-0 bg-white pt-[env(safe-area-inset-top)]">
        <div className="h-[60px] px-4 flex items-center gap-3">
          <button type="button" onClick={handleBack} aria-label={step === 1 ? 'Close' : 'Back'} className={CIRCLE_BTN}>
            {step === 1 ? <X className="w-[18px] h-[18px]" strokeWidth={2.4} /> : <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />}
          </button>
          {step === 1 ? (
            <h1 id="new-item-heading" className="text-[16px] font-medium tracking-[-0.01em]">{editLine ? 'Edit item' : 'New item'}</h1>
          ) : (
            <div className="flex-1 min-w-0 flex flex-col">
              <h1 id="new-item-heading" className="truncate text-[16px] font-medium tracking-[-0.01em]">{name.trim()}</h1>
              <span className="truncate text-[12px] text-gray-500">{caption}</span>
            </div>
          )}
        </div>
        <Progress step={step} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6">
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              {/* Name */}
              <div className="relative flex flex-col gap-2">
                <label htmlFor="new-item-name" className="text-[14px] font-medium text-gray-900">Item name <Required /></label>
                <input
                  id="new-item-name"
                  type="text"
                  value={name}
                  autoFocus={!src.name}
                  onChange={(e) => setName(capitalizeWords(e.target.value))}
                  autoCapitalize="words"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setTimeout(() => setNameFocused(false), 150)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  placeholder="e.g. Black beans"
                  className="h-[52px] px-3.5 rounded-xl border border-gray-200 bg-white text-[16px] font-medium text-[#1a1f36] outline-none focus:border-[#1a1f36] placeholder:text-gray-500 placeholder:font-normal"
                />
                {nameFocused && suggestions.length > 0 && !exactMatch && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
                    <p className="px-3.5 pt-2.5 pb-1 text-[12px] text-gray-500">Already in your pantry</p>
                    {suggestions.map((s) => (
                      <button
                        key={s.catalogItemId}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onPickExisting(s)}
                        className="w-full px-3.5 py-2.5 flex items-center gap-3 border-t border-gray-100 text-left active:bg-gray-50"
                      >
                        <ItemThumb photoUrl={s.photoUrl} categoryName={s.categoryName} size={40} />
                        <span className="flex-1 min-w-0">
                          <span className="block truncate text-[14px] font-medium">{s.name}</span>
                          <span className="block truncate text-[12px] text-gray-500">
                            {[s.categoryName, formatSize(s.sizeAmount, s.sizeUnit)].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <Plus className="w-4 h-4 shrink-0 text-gray-400" strokeWidth={2.4} />
                      </button>
                    ))}
                  </div>
                )}
                {exactMatch && (
                  <button
                    type="button"
                    onClick={() => onPickExisting(exactMatch)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 text-left"
                  >
                    <ItemThumb photoUrl={exactMatch.photoUrl} categoryName={exactMatch.categoryName} size={40} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-medium">Already in your pantry</span>
                      <span className="block text-[12px] text-gray-500">Add more of {exactMatch.name}</span>
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0 text-[#4b5263]" strokeWidth={2.4} />
                  </button>
                )}
              </div>

              {/* Category + count/weigh */}
              <div className="flex flex-col gap-2">
                <span className="text-[14px] font-medium text-gray-900">Category <Required /></span>
                <div className={`overflow-hidden rounded-2xl border border-gray-200 ${LIFT}`}>
                  <button
                    type="button"
                    onClick={() => setPage('category')}
                    className="w-full min-h-14 px-3.5 py-1.5 flex items-center gap-3 bg-white text-left active:bg-gray-50"
                  >
                    <span className={`flex-1 text-[16px] ${category ? 'font-medium text-[#1a1f36]' : 'font-normal text-gray-500'}`}>
                      {category ? category.name : 'Pick a category'}
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] shrink-0 text-gray-400" strokeWidth={2.2} />
                  </button>
                  {category && !lockTrackBy && (
                    <div className="border-t border-gray-100 bg-gray-50 px-3.5 pt-2.5 pb-3">
                      <TrackSwitch value={trackBy} onChange={(v) => { changeTrackBy(v); setTrackTouched(true); }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Optional extras: rows that open a sheet or a page */}
              <DetailsCard title="Extras" className="mt-4">
                <DetailRow
                  title="Photo"
                  value={!category ? 'Pick a category first' : !photoReady ? 'Type the name first' : photoUrl ? 'Added' : 'Not added'}
                  disabled={!photoReady}
                  onClick={() => setPage('photo')}
                  last={!counted}
                  icon={(cls) =>
                    photoUrl ? (
                      <span className={`${cls} overflow-hidden border-2 border-[#1a1f36] bg-white`}>
                        <img src={photoUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                      </span>
                    ) : (
                      <span className={cls}><Camera className="w-5 h-5" strokeWidth={1.8} /></span>
                    )
                  }
                />
                {counted && (
                  <DetailRow
                    title="Size on the label"
                    value={hasSize ? `${Number(size.amount)} ${unitLabel(size.unit || 'oz')} each` : 'Not added'}
                    onClick={() => setPage('size')}
                    last
                    icon={(cls) => <SizeIcon className={cls} />}
                  />
                )}
              </DetailsCard>
            </motion.div>
          ) : (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              {counted ? (
                <div className="flex flex-col gap-3">
                  <span className="text-[16px] font-medium tracking-[-0.01em]">{inStock ? 'How many are there?' : 'How many did you get?'} <Required /></span>
                  <Segmented
                    label="How did they come?"
                    options={[['single', `Loose ${many}`], ['boxes', 'Sealed boxes']]}
                    value={mode}
                    onChange={setMode}
                  />
                  <span className="text-[12px] text-gray-500">
                    {mode === 'single' ? `Count every ${one} you have in hand.` : `Count unopened boxes. We’ll add up the ${many}.`}
                  </span>
                  {mode === 'single' ? (
                    <Counter value={quantity} word={Number(quantity) === 1 ? one : many} onChange={setQuantity} label="How many" />
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-medium text-[#4b5263]">Boxes</span>
                        <Counter value={boxes} word={Number(boxes) === 1 ? 'box' : 'boxes'} onChange={setBoxes} label="Boxes" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-medium text-[#4b5263]">{canned ? 'Cans' : 'Items'} in each box</span>
                        <Counter value={perBox} word={many} onChange={setPerBox} min={2} label={`${canned ? 'Cans' : 'Items'} in each box`} />
                      </div>
                      <div className="px-3.5 py-3 rounded-xl bg-gray-50 flex justify-between text-[14px]">
                        <span className="text-[#4b5263]">{Number(boxes) || 0} {Number(boxes) === 1 ? 'box' : 'boxes'} × {Number(perBox) || 0} {many}</span>
                        <span className="font-semibold">= {total} {many}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <label htmlFor="amount-lb" className="text-[16px] font-medium tracking-[-0.01em]">{inStock ? 'How much is there?' : 'How much does it weigh?'} <Required /></label>
                  <WeightField id="amount-lb" value={quantity} onChange={setQuantity} unit={unit} onUnit={setUnit} />
                  <span className="text-[12px] text-gray-500">{weightHint(quantity, unit)}</span>
                </div>
              )}

              <DetailsCard title="More details">
                {isFood && (
                  <DetailRow
                    round
                    title="Expires"
                    value={expiryText(expiry.date, expiry.precision)}
                    onClick={() => setPage('expiry')}
                    icon={(cls) => <span className={cls}><Calendar className="w-[18px] h-[18px]" strokeWidth={2} /></span>}
                  />
                )}
                <DetailRow
                  round
                  last
                  title="Where it goes"
                  value={spotText(storage, lastSpot)}
                  onClick={() => setPage('spot')}
                  icon={(cls) => <span className={cls}><MapPin className="w-[18px] h-[18px]" strokeWidth={2} /></span>}
                />
              </DetailsCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 bg-white px-4 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))]">
        {step === 1 ? (
          <PillButton onClick={goNext} disabled={!step1Valid}>Next</PillButton>
        ) : (
          <PillButton onClick={save} disabled={!step2Valid}>
            {editLine ? 'Save' : step2Valid ? `Add ${amountText} to cart` : 'Add to cart'}
          </PillButton>
        )}
      </div>

      <CategoryPage
        open={page === 'category'}
        onBack={() => setPage(null)}
        categories={categories}
        selectedId={category?.id}
        onSelect={pickCategory}
      />
      <SizePage
        open={page === 'size'}
        size={size}
        onBack={() => setPage(null)}
        onSave={(s) => { setSize(s); setPage(null); }}
      />
      <ExpiryPage
        open={page === 'expiry'}
        date={expiry.date}
        precision={expiry.precision}
        onBack={() => setPage(null)}
        onSave={(e) => { setExpiry(e); setPage(null); }}
      />
      <SpotPage
        open={page === 'spot'}
        spot={storage}
        lastSpot={lastSpot}
        spots={spots}
        onBack={() => setPage(null)}
        onSave={(s) => { setStorage(s); setPage(null); }}
      />
      <PhotoSheet
        open={page === 'photo'}
        onClose={() => setPage(null)}
        name={name}
        categoryName={category?.name}
        categorySlug={categorySlug(category?.name) || ''}
        photoUrl={photoUrl}
        onSelect={setPhotoUrl}
      />
    </motion.div>
  );
}
