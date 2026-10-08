'use client';

// Restock: the shared ItemSheet (components/flow/item-sheet.jsx) in Add orange, the same sheet
// Remove uses. Tapping Restock turns it into the item, one step at a time:
//   1. Add to:   the item's batches (one date in one spot) + "New date or spot"
//   2. New batch only: the date (same picker as the new-item expiry page)
//   3. How many  (+ where it goes, for a new batch)
// A scan match, "pick existing" from the new-item form and Edit on a cart line open it straight
// on the item (startProduct), with nothing behind it.

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { useInventory } from '@/lib/use-inventory';
import { usePagedList, fetchPage } from '@/lib/use-paged-list';
import { FIRST_PAGE, NEXT_PAGE, FULL_SHELF_LIMIT, queryKey, toSearchParams } from '@/lib/inventory-query';
import { fetchInventoryList } from '../inventory/use-inventory-list';
import { formatAmount, formatAmountWithUnit, formatExpiry, formatStorage } from '@/lib/inventory-format';
import { recallStorage, rememberStorage, usePantryItems, toProduct } from './intake-fields';
import {
  ExpiryPicker, SpotPage, usePantrySpots, toExpiry, fromExpiry, expiryShort,
  DetailRow, WeightField, toLbs, recallScaleUnit, weightHint, spotText,
} from './new-item-pages';
import { makeLine } from './cart-lines';
import {
  ItemSheet, StepItem, StepBody, StepButton, StepOutlineButton, StepCounter, StepLabel, ChoiceList, ChoiceRow, UseFirst, InCart, productKey,
  categoryCounts,
} from '@/components/flow/item-sheet';

const NEW = 'new';
const batchKey = (b) => `${b.expirationDate || ''}|${b.storageLocation || ''}`;

// Lots that differ only by source are one physical batch on the shelf. Oldest first.
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

const isExpired = (date) => !!date && date < new Date().toISOString().slice(0, 10);

// A pantry with more items than FULL_SHELF_LIMIT: the grid asks the server for the matching items a
// page at a time, each with its stock here (/api/foods/dictionary?limit=, public.catalog_page, the
// same rules as the sheet's own filters), instead of drawing and searching the whole list on the
// phone. Smaller pantries filter on the device.
function useRestockServerList({ query, filter, open, products }) {
  const { pantryId, lastCatalogUpdate, lastInventoryUpdate } = usePantry();
  const large = products.length > FULL_SHELF_LIMIT;
  const q = { filter, search: query };
  const paged = usePagedList({
    scope: pantryId,
    key: queryKey(q),
    query: q,
    load: (args, signal) => fetchPage('/api/foods/dictionary', pantryId, toSearchParams(args), signal),
    // Both a new item and new stock change what the list shows.
    version: `${lastCatalogUpdate}:${lastInventoryUpdate}`,
    enabled: large && open && !!pantryId,
    rowsKey: 'items',
    rowId: (r) => r.catalogItemId,
    first: FIRST_PAGE,
    next: NEXT_PAGE,
  });

  const items = useMemo(
    () => (paged.entry?.items || []).map((d) => ({ ...toProduct(d), category: d.categoryName })),
    [paged.entry]
  );
  const counts = useMemo(() => {
    const sum = paged.summary;
    if (!sum) return null;
    return {
      all: sum.all,
      status: { low_stock: sum.low, out_of_stock: sum.out },
      categories: categoryCounts(Object.entries(sum.categories || {})),
    };
  }, [paged.summary]);

  if (!large) return null;
  return {
    products: items,
    counts,
    loading: !paged.entry,
    pending: paged.pending,
    hasMore: paged.hasMore,
    loadMore: paged.loadMore,
  };
}

export function RestockSheet({ isOpen, onClose, startProduct = null, initialLine = null, cartItems = [], onAdd }) {
  const { pantryId } = usePantry();
  // The grid's list is only fetched when the grid is what opens.
  const { items, loading } = usePantryItems(pantryId, { withStock: true, enabled: isOpen && !startProduct });
  const products = useMemo(() => items.map((p) => ({ ...p, category: p.categoryName })), [items]);

  const [product, setProduct] = useState(null); // the item being restocked
  const [step, setStep] = useState(null); // null (loading) | 'pick' | 'date' | 'amount'
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('lb'); // weighed items: what the scale reads; saved in lb
  const [draft, setDraft] = useState(() => fromExpiry(null));
  const [noDate, setNoDate] = useState(false);
  const [storage, setStorage] = useState(null);
  const [choice, setChoice] = useState(null); // batch key | NEW
  const [spotOpen, setSpotOpen] = useState(false);
  const [lastSpot] = useState(() => recallStorage());
  const spots = usePantrySpots(pantryId, !!product, [lastSpot, storage]);

  // Opened on one item, or closed: start that item / clear.
  useEffect(() => {
    setProduct(isOpen ? startProduct : null);
  }, [isOpen, startProduct]);

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
    setSpotOpen(false);
  }, [product, initialLine]);

  // The item's batches at this location: from the shared shelf when it's in memory (a large pantry
  // doesn't keep it there), otherwise just this item's, from the server.
  const large = items.length > FULL_SHELF_LIMIT;
  const { lots: shelf, ready: shelfReady } = useInventory({ enabled: !large });
  const [itemLots, setItemLots] = useState(null); // { id, lots } for one item, fetched
  useEffect(() => {
    if (!product || shelfReady || !pantryId) return;
    const id = product.catalogItemId;
    const ctrl = new AbortController();
    fetchInventoryList(pantryId, { itemId: id, limit: 1 }, ctrl.signal)
      .then((page) => setItemLots({ id, lots: (page.lots || []).filter((l) => l.catalogItemId === id) }))
      .catch((err) => { if (err.name !== 'AbortError') setItemLots({ id, lots: [] }); });
    return () => ctrl.abort();
  }, [product, shelfReady, pantryId]);
  const lots = useMemo(() => {
    if (!product) return null;
    if (shelfReady) return shelf.filter((l) => l.catalogItemId === product.catalogItemId);
    return itemLots?.id === product.catalogItemId ? itemLots.lots : null;
  }, [product, shelf, shelfReady, itemLots]);

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

  // What this item already has in the Add cart.
  const inCartOf = (p) =>
    cartItems.filter((l) => l.catalogItemId && l.catalogItemId === productKey(p)).reduce((s, l) => s + (Number(l.quantity) || 0), 0);

  // --- the open item ---
  let stepView = null;
  if (product) {
    const weighed = product.trackBy === 'weight';
    const chosenBatch = batches.find((b) => b.key === choice) || null;
    const totalInStock = lots ? batches.reduce((s, b) => s + b.quantity, 0) : Number(product.totalQuantity) || 0;
    const dateLabel = (date, precision) => (date ? `Exp ${formatExpiry(date, precision)}` : 'No expiration date');
    const newDate = noDate || draft.month === null ? 'No expiration date' : `Exp ${expiryShort(draft)}`;
    const valid = Number(quantity) > 0 && choice !== null;
    const inCart = inCartOf(product);

    // Back: one step back inside the item, then the grid (or close when it opened on the item).
    const leaveItem = () => (startProduct ? onClose?.() : setProduct(null));
    const back =
      step === 'date' ? (batches.length ? () => setStep('pick') : leaveItem)
        : step === 'amount' && !initialLine
          ? (choice === NEW && product.isFood ? () => setStep('date') : batches.length ? () => setStep('pick') : leaveItem)
          : leaveItem;

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

    const submit = () => {
      if (!valid) return;
      const exp = noDate ? { date: null, precision: null } : toExpiry(draft.year, draft.month, draft.day);
      const target = chosenBatch
        ? { date: chosenBatch.expirationDate, precision: chosenBatch.expirationPrecision, storage: chosenBatch.storageLocation }
        : { date: product.isFood ? exp.date : null, precision: product.isFood ? exp.precision : null, storage };
      rememberStorage(target.storage);
      onAdd?.(
        makeLine(product, {
          quantity: weighed ? toLbs(quantity, unit) : quantity,
          expirationDate: target.date,
          expirationPrecision: target.precision,
          storageLocation: target.storage,
        }, initialLine?.id),
        !!initialLine
      );
    };

    const item = (
      <StepItem photoUrl={product.photoUrl} category={product.categoryName} name={product.name}>
        {totalInStock > 0 ? `${formatAmountWithUnit(totalInStock, product.trackBy)} in stock` : 'None in stock'}
        {inCart > 0 && !initialLine && <InCart> · {formatAmount(inCart, product.trackBy)} in cart</InCart>}
      </StepItem>
    );

    let content;
    let title;
    if (step === null) {
      title = product.name;
      content = (
        <StepBody>
          {item}
          <div className="mt-10 flex items-center justify-center gap-2 text-[13px] text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking what’s on the shelf…
          </div>
        </StepBody>
      );
    } else if (step === 'pick') {
      title = 'Add to';
      content = (
        <StepBody>
          {item}
          <p className="text-[13px] text-gray-500 mt-4 mb-2.5">
            {batches.length} {batches.length === 1 ? 'batch' : 'batches'} · oldest first
          </p>
          <ChoiceList>
            {batches.map((b, i) => (
              <ChoiceRow
                key={b.key}
                onClick={() => pickBatch(b)}
                title={product.isFood ? dateLabel(b.expirationDate, b.expirationPrecision) : 'Current stock'}
                badge={
                  product.isFood && isExpired(b.expirationDate)
                    ? <span className="text-[12.5px] text-red-600">Expired</span>
                    : i === 0 && batches.length > 1 && product.isFood && b.expirationDate && <UseFirst>Oldest</UseFirst>
                }
                sub={`${formatStorage(b.storageLocation) || 'No spot set'} · ${formatAmountWithUnit(b.quantity, product.trackBy)}`}
              />
            ))}
            <ChoiceRow
              onClick={pickNew}
              icon={<Plus className="w-[18px] h-[18px] text-[color:var(--accent-strong)] shrink-0" strokeWidth={2.2} />}
              title={product.isFood ? 'New date or spot' : 'New spot'}
            />
          </ChoiceList>
        </StepBody>
      );
    } else if (step === 'date') {
      title = 'New date';
      content = (
        <StepBody
          footer={
            <>
              <StepButton disabled={draft.month === null} onClick={() => { setNoDate(false); setStep('amount'); }}>
                {draft.month === null ? 'Pick a month' : 'Next'}
              </StepButton>
              <StepOutlineButton onClick={() => { setNoDate(true); setStep('amount'); }}>No date on the label</StepOutlineButton>
            </>
          }
        >
          {item}
          <StepLabel className="mt-4">{draft.month === null ? 'Pick the month on the label' : `Best by ${expiryShort(draft)}`}</StepLabel>
          <ExpiryPicker value={draft} onChange={setDraft} />
        </StepBody>
      );
    } else {
      title = weighed ? 'How much' : 'How many';
      content = (
        <StepBody
          footer={
            <StepButton onClick={submit} disabled={!valid}>
              {initialLine ? 'Save' : inCart > 0 ? 'Add more to cart' : 'Add to cart'}
            </StepButton>
          }
        >
          {item}
          {/* Which batch */}
          <div className="mt-4 flex items-center justify-between gap-3 text-[13px]">
            <span className="text-gray-600 truncate">
              {chosenBatch
                ? [product.isFood ? dateLabel(chosenBatch.expirationDate, chosenBatch.expirationPrecision) : 'Current stock', formatStorage(chosenBatch.storageLocation)].filter(Boolean).join(' · ')
                : product.isFood ? newDate : 'New spot'}
            </span>
            <span className="text-gray-500 shrink-0">
              {chosenBatch ? `${formatAmountWithUnit(chosenBatch.quantity, product.trackBy)} now` : 'Not on the shelf yet'}
            </span>
          </div>

          <StepLabel>{weighed ? 'How much weight?' : 'How many?'}</StepLabel>
          {weighed ? (
            <>
              <WeightField id="restock-weight" label="Weight" value={quantity} onChange={setQuantity} unit={unit} onUnit={setUnit} height="h-[52px]" />
              <p className="text-[12.5px] text-gray-500 mt-2">{weightHint(quantity, unit)}</p>
            </>
          ) : (
            <StepCounter value={quantity} onChange={setQuantity} label="How many came in" />
          )}

          {/* New batch: where it goes is typed by the pantry (or one it has used), never preset */}
          {choice === NEW && (
            <>
              <StepLabel className="mt-7">
                Where it goes <span className="font-normal text-gray-400">(optional)</span>
              </StepLabel>
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
            </>
          )}
        </StepBody>
      );
    }

    stepView = {
      title,
      onBack: back,
      content: (
        <>
          {content}
          <SpotPage
            open={spotOpen}
            spot={storage}
            lastSpot={lastSpot}
            spots={spots}
            onBack={() => setSpotOpen(false)}
            onSave={(s) => { setStorage(s); setSpotOpen(false); }}
          />
        </>
      ),
    };
  }

  return (
    <ItemSheet
      theme="add"
      isOpen={isOpen}
      onClose={onClose}
      title="Restock"
      products={products}
      loading={loading}
      actionLabel="Restock"
      onPick={setProduct}
      inCart={(p) => {
        const n = inCartOf(p);
        return n > 0 ? `${formatAmount(n, p.trackBy)} in cart` : null;
      }}
      searchPlaceholder="Find an item to restock"
      emptyText="Items you add will show up here."
      hideGrid={!!startProduct}
      step={stepView}
      useServerList={useRestockServerList}
    />
  );
}
