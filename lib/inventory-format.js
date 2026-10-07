// Shared display rules for inventory values — used by screens AND the API so every
// place says the same thing. Blank stays blank: these return '' / null for unknowns,
// never a made-up default.

export const SIZE_UNITS = [
  { value: 'oz', label: 'oz' },
  { value: 'lb', label: 'lb' },
  { value: 'fl_oz', label: 'fl oz' },
  { value: 'gal', label: 'gal' },
  { value: 'ct', label: 'count' },
];

export const STORAGE_OPTIONS = [
  { value: 'shelf', label: 'Shelf' },
  { value: 'fridge', label: 'Fridge' },
  { value: 'freezer', label: 'Freezer' },
];

export const SOURCE_OPTIONS = [
  { value: 'donation', label: 'Donation' },
  { value: 'food_bank', label: 'Food bank' },
  { value: 'usda_tefap', label: 'USDA / TEFAP' },
  { value: 'food_rescue', label: 'Food rescue' },
  { value: 'purchased', label: 'Purchased' },
];

export const SOURCE_LABELS = Object.fromEntries(SOURCE_OPTIONS.map((o) => [o.value, o.label]));

// Categories that usually go on the scale. Everything else starts on "Count them".
const WEIGH_BY_DEFAULT = new Set(['Produce', 'Meat', 'Bread & bakery', 'Meat & fish', 'Meat / Protein', 'Assorted Salvage', 'Bakery']);
export const defaultTrackBy = (categoryName) => (WEIGH_BY_DEFAULT.has(categoryName) ? 'weight' : 'count');

// ---------------------------------------------------------------------------
// Categories: DB names ↔ the visual slugs in lib/constants.js (images, colors)
// ---------------------------------------------------------------------------

export const UI_TO_DB = {
  dry_goods: 'Dry goods',
  frozen_food: 'Frozen',
  produce: 'Produce',
  proteins: 'Meat',
  bakery: 'Bread & bakery',
  snacks: 'Snacks',
  canned_goods: 'Canned & jarred',
  beverages: 'Drinks',
  dairy: 'Dairy & eggs',
  hygiene: 'Hygiene',
  baby_infant: 'Baby food & formula',
  other: 'Other / not sure',
};

const DB_TO_UI = {
  // Current names (migration 20261006120000_category_list_v2)
  'Canned & jarred': 'canned_goods',
  'Dry goods': 'dry_goods',
  'Snacks': 'snacks',
  'Drinks': 'beverages',
  'Baby food & formula': 'baby_infant',
  'Meat': 'proteins',
  'Dairy & eggs': 'dairy',
  'Bread & bakery': 'bakery',
  'Diapers & baby care': 'baby_infant',
  'Pet food': 'other',
  'Other / not sure': 'other',
  // Earlier names, still recognised
  'Dry Goods / Grains': 'dry_goods',
  'Frozen': 'frozen_food',
  'Produce': 'produce',
  'Meat / Protein': 'proteins',
  'Meat & fish': 'proteins',
  'Bakery': 'bakery',
  'Canned Goods': 'canned_goods',
  'Beverages': 'beverages',
  'Dairy': 'dairy',
  'Hygiene': 'hygiene',
  'Baby Food': 'baby_infant',
  'Diapers & Baby Supplies': 'baby_infant',
  'Household': 'other',
  'Clothing': 'other',
  'Assorted Salvage': 'other',
};

export function categorySlug(dbName) {
  if (!dbName) return null;
  return DB_TO_UI[dbName] || String(dbName).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

const num = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

// "24" for counted items, "6.5 lb" for weighed items.
export function formatAmount(quantity, trackBy) {
  if (quantity == null || quantity === '') return '';
  return trackBy === 'weight' ? `${num(quantity)} lb` : num(quantity);
}

// "24 items" / "1 item" / "6.5 lb"
export function formatAmountWithUnit(quantity, trackBy) {
  if (quantity == null || quantity === '') return '';
  if (trackBy === 'weight') return `${num(quantity)} lb`;
  return `${num(quantity)} ${Number(quantity) === 1 ? 'item' : 'items'}`;
}

// "15 oz", "1 gal", "32 ct". Size describes ONE item.
export function formatSize(amount, unit) {
  if (!amount || !unit) return '';
  const label = unit === 'fl_oz' ? 'fl oz' : unit;
  return `${num(amount)} ${label}`;
}

export function formatStorage(value) {
  if (!value) return '';
  const known = STORAGE_OPTIONS.find((o) => o.value === value);
  if (known) return known.label;
  return String(value).replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseYmd(date) {
  const [y, m, d] = String(date).slice(0, 10).split('-').map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, d || 1);
}

// "Mar 2027" (month precision) or "Mar 3, 2027". null when there is no date.
export function formatExpiry(date, precision) {
  if (!date) return null;
  const d = parseYmd(date);
  if (!d || Number.isNaN(d.getTime())) return null;
  if (precision === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function lastDayOfMonth(year, month) {
  const d = new Date(Number(year), Number(month), 0); // month is 1-based here
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Totals for a mixed list: { items, lbs, text: "24 items · 6.5 lb" }
export function summarizeAmounts(lines) {
  let items = 0;
  let lbs = 0;
  for (const l of lines || []) {
    if (l.trackBy === 'weight') lbs += Number(l.quantity) || 0;
    else items += Number(l.quantity) || 0;
  }
  const parts = [];
  if (items > 0 || lbs === 0) parts.push(formatAmountWithUnit(items, 'count'));
  if (lbs > 0) parts.push(formatAmountWithUnit(Math.round(lbs * 100) / 100, 'weight'));
  return { items, lbs, text: parts.join(' · ') };
}
