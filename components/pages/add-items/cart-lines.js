// The add cart = one drop-off. Each line is one item + how much came in + expiry + storage.
// Existing items carry catalogItemId; new items carry their facts and are created on submit.

export const CART_KEY = 'foodarca_add_cart_v2';
export const DELIVERY_KEY = 'foodarca_add_delivery_v2';
// weighedLbs holds what the scale showed, in weighedUnit ('lb' | 'kg'); the API always gets pounds.
export const EMPTY_DELIVERY = { source: null, donorName: '', isAnonymous: false, weighedLbs: '', weighedUnit: 'lb' };

export function loadStored(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStored(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function newLineId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// product: an existing item (toProduct) or a new-item draft { name, categoryId, categoryName, ... }
export function makeLine(product, values, id) {
  return {
    id: id || newLineId(),
    catalogItemId: product.catalogItemId || null,
    name: product.name,
    categoryId: product.categoryId ?? null,
    categoryName: product.categoryName ?? null,
    isFood: product.isFood ?? true,
    trackBy: product.trackBy || 'count',
    sizeAmount: product.sizeAmount ?? null,
    sizeUnit: product.sizeUnit ?? null,
    caseSize: product.caseSize ?? null,
    barcode: product.barcode || null,
    photoUrl: product.photoUrl || null,
    quantity: Number(values.quantity),
    expirationDate: values.expirationDate || null,
    expirationPrecision: values.expirationDate ? values.expirationPrecision || 'day' : null,
    storageLocation: values.storageLocation || null,
  };
}

const identity = (l) =>
  l.catalogItemId
    ? `id:${l.catalogItemId}`
    : `new:${(l.barcode || '').trim()}|${(l.name || '').trim().toLowerCase()}|${l.trackBy}|${l.sizeAmount ?? ''}${l.sizeUnit ?? ''}`;

const sameShelf = (a, b) =>
  (a.expirationDate || '') === (b.expirationDate || '') && (a.storageLocation || '') === (b.storageLocation || '');

// Add a line, merging into an identical one (same item, expiry and storage). Newest first.
export function addLine(cart, line) {
  const idx = cart.findIndex((l) => l.id !== line.id && identity(l) === identity(line) && sameShelf(l, line));
  if (idx < 0) return [line, ...cart.filter((l) => l.id !== line.id)];
  const merged = { ...cart[idx], quantity: Math.round((Number(cart[idx].quantity) + Number(line.quantity)) * 1000) / 1000 };
  return [merged, ...cart.filter((l, i) => i !== idx && l.id !== line.id)];
}

// Replace a line being edited (keeps its place), merging if it now matches another line.
export function replaceLine(cart, line) {
  const others = cart.filter((l) => l.id !== line.id);
  const dupe = others.find((l) => identity(l) === identity(line) && sameShelf(l, line));
  if (dupe) return addLine(others, line);
  return cart.map((l) => (l.id === line.id ? line : l));
}

// Cart line → API line for receive_delivery
export function toApiLine(l) {
  const base = {
    quantity: Number(l.quantity),
    expiration_date: l.expirationDate || null,
    expiration_precision: l.expirationDate ? l.expirationPrecision || 'day' : null,
    storage_location: l.storageLocation || null,
  };
  if (l.catalogItemId) return { ...base, item_id: l.catalogItemId };
  return {
    ...base,
    item: {
      name: l.name,
      category_id: l.categoryId,
      track_by: l.trackBy,
      size_amount: l.trackBy === 'count' && Number(l.sizeAmount) > 0 ? Number(l.sizeAmount) : null,
      size_unit: l.trackBy === 'count' && Number(l.sizeAmount) > 0 ? l.sizeUnit : null,
      case_size: l.trackBy === 'count' && Number(l.caseSize) > 1 ? Number(l.caseSize) : null,
      barcode: l.barcode || null,
      photo_url: l.photoUrl || null,
    },
  };
}

export function toApiDelivery(d) {
  return {
    source: d.source || null,
    donorName: d.isAnonymous ? null : (d.donorName || '').trim() || null,
    isAnonymous: !!d.isAnonymous,
    weighedLbs: Number(d.weighedLbs) > 0
      ? (d.weighedUnit === 'kg' ? Math.round(Number(d.weighedLbs) * 2.20462 * 100) / 100 : Number(d.weighedLbs))
      : null,
  };
}
