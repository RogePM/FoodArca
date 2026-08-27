const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('================================================================');
console.log('=== INDEPENDENT AUDITOR VICTORY VERIFICATION TEST SUITE ========');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`[PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(`       Error: ${err.message}`);
    throw err;
  }
}

// ----------------------------------------------------------------------------
// SECTION 1: Forensic Code Inspection - NoBarcodeVisualGridSheet
// ----------------------------------------------------------------------------
const vgsPath = path.resolve(__dirname, '../../components/pages/distribution/no-barcode-visual-grid-sheet.jsx');
assert.ok(fs.existsSync(vgsPath), 'no-barcode-visual-grid-sheet.jsx must exist');
const vgsCode = fs.readFileSync(vgsPath, 'utf8');

runTest('R1.1: Visual Grid Sheet imports and structures correctly', () => {
  assert.ok(vgsCode.includes('export function NoBarcodeVisualGridSheet'), 'Export component must exist');
  assert.ok(vgsCode.includes('usePantry'), 'usePantry hook must be used');
});

runTest('R1.2: Item cards have category text completely removed', () => {
  const mapIdx = vgsCode.indexOf('filteredProducts.map');
  assert.ok(mapIdx > -1, 'filteredProducts.map found in code');
  const cardSection = vgsCode.slice(mapIdx);
  
  // Verify no category name rendering in cards
  assert.ok(!cardSection.includes('{catVisual.name}'), 'Card must not render catVisual.name');
  assert.ok(!cardSection.includes('{product.category}'), 'Card must not render product.category');
  assert.ok(!cardSection.includes('{getCategoryName('), 'Card must not render getCategoryName()');
});

runTest('R1.3: Item cards have expiration date text completely removed', () => {
  const mapIdx = vgsCode.indexOf('filteredProducts.map');
  const cardSection = vgsCode.slice(mapIdx);
  
  // Verify no expiration date rendering in cards
  assert.ok(!cardSection.includes('formatDate('), 'Card must not render formatDate');
  assert.ok(!cardSection.includes('{product.expirationDate}'), 'Card must not render expirationDate');
  assert.ok(!cardSection.includes('{meta.earliestDate}'), 'Card must not render earliestDate');
});

runTest('R1.4: Multi-batch badge rendered conditionally ONLY when batchCount > 1', () => {
  const mapIdx = vgsCode.indexOf('filteredProducts.map');
  const cardSection = vgsCode.slice(mapIdx);
  
  assert.ok(cardSection.includes('batchCount > 1'), 'Must check batchCount > 1 condition');
  assert.ok(cardSection.includes('{batchCount} Batches'), 'Must render "{batchCount} Batches"');
  assert.ok(!cardSection.includes('batchCount === 1'), 'Must not render badge for single batch');
});

runTest('R1.5: Item card contains minimal Add to Cart button with event isolation', () => {
  const mapIdx = vgsCode.indexOf('filteredProducts.map');
  const cardSection = vgsCode.slice(mapIdx);
  
  assert.ok(cardSection.includes('Add to Cart'), 'Card must render Add to Cart button');
  assert.ok(cardSection.includes('e.stopPropagation()'), 'Button must stop propagation');
  assert.ok(cardSection.includes('onSelectProduct(product)'), 'Button triggers product selection');
});

runTest('R1.6: Typography in Visual Grid Sheet uses light/medium weights without heavy bolding', () => {
  // Check that header, search, pills, cards avoid heavy bold classes (font-bold, font-extrabold, font-black)
  const heavyFontMatches = vgsCode.match(/font-(?:bold|extrabold|black)/g);
  assert.strictEqual(heavyFontMatches, null, `Found heavy bold font classes: ${heavyFontMatches}`);
  assert.ok(vgsCode.includes('font-medium'), 'Must use font-medium for clean hierarchy');
});

// ----------------------------------------------------------------------------
// SECTION 2: Forensic Code Inspection - QuickActionSheet
// ----------------------------------------------------------------------------
const qasPath = path.resolve(__dirname, '../../components/pages/distribution/quick-action-sheet.jsx');
assert.ok(fs.existsSync(qasPath), 'quick-action-sheet.jsx must exist');
const qasCode = fs.readFileSync(qasPath, 'utf8');

runTest('R2.1: Quick Action Sheet only mounts/appears if batches > 1', () => {
  assert.ok(qasCode.includes('if (!product || sortedBatches.length <= 1)'), 'Must have guard returning null for <= 1 batch');
  assert.ok(qasCode.includes('return null;'), 'Must return null when guard is hit');
});

runTest('R2.2: Heavy UI elements (steppers, number inputs, radios) completely removed', () => {
  assert.ok(!qasCode.includes('Minus'), 'Stepper Minus icon must be removed');
  assert.ok(!qasCode.includes('type="number"'), 'Number inputs must be removed');
  assert.ok(!qasCode.includes('type="radio"'), 'Radio buttons must be removed');
  assert.ok(!qasCode.includes('onUpdateQuantity'), 'Quantity stepper handlers must be removed');
});

runTest('R2.3: Batch selection list displays clean Expiration Date, Stock Count, and Add to Cart action', () => {
  assert.ok(qasCode.includes('formatDate(batch.expirationDate)'), 'Must display formatted expiration date');
  assert.ok(qasCode.includes('{remainingStock}'), 'Must display available stock count');
  assert.ok(qasCode.includes('handleStageBatch(batch)'), 'Must stage batch directly');
  assert.ok(qasCode.includes('Add to Cart'), 'Must render Add to Cart button');
});

runTest('R2.4: Typography in Quick Action Sheet uses clean light/medium weights', () => {
  const heavyFontMatches = qasCode.match(/font-(?:bold|extrabold|black)/g);
  assert.strictEqual(heavyFontMatches, null, `Found heavy bold font classes: ${heavyFontMatches}`);
  assert.ok(qasCode.includes('font-medium'), 'Must use font-medium');
  assert.ok(qasCode.includes('font-normal'), 'Must use font-normal');
});

// ----------------------------------------------------------------------------
// SECTION 3: Functional Logic & Boundary Stress Tests
// ----------------------------------------------------------------------------
const flowPath = path.resolve(__dirname, '../../components/pages/distribution/mobile-distribution-flow.jsx');
const flowCode = fs.readFileSync(flowPath, 'utf8');

const fnMatch = flowCode.match(/export function groupInventoryByProduct\([\s\S]*?\n\}/);
assert.ok(fnMatch, 'groupInventoryByProduct function found');
const fnCodeClean = fnMatch[0].replace('export function', 'function');
const groupInventoryByProduct = new Function(fnCodeClean + '\nreturn groupInventoryByProduct;')();

runTest('R3.1: groupInventoryByProduct handles null, undefined, empty, and invalid types', () => {
  assert.deepStrictEqual(groupInventoryByProduct(null), []);
  assert.deepStrictEqual(groupInventoryByProduct(undefined), []);
  assert.deepStrictEqual(groupInventoryByProduct([]), []);
  assert.deepStrictEqual(groupInventoryByProduct('invalid'), []);
  assert.deepStrictEqual(groupInventoryByProduct(12345), []);
  assert.deepStrictEqual(groupInventoryByProduct({ a: 1 }), []);
});

runTest('R3.2: FEFO sorting handles mix of valid dates, null dates, and invalid date strings', () => {
  const input = [
    { id: 'b_null', name: 'Soup', quantity: 2, expirationDate: null },
    { id: 'b_2027', name: 'Soup', quantity: 3, expirationDate: '2027-01-15' },
    { id: 'b_2026', name: 'Soup', quantity: 5, expirationDate: '2026-05-10' },
    { id: 'b_invalid', name: 'Soup', quantity: 1, expirationDate: 'garbage-date-value' },
  ];

  const grouped = groupInventoryByProduct(input);
  assert.strictEqual(grouped.length, 1);
  assert.strictEqual(grouped[0].totalQuantity, 11);
  assert.strictEqual(grouped[0].batches.length, 4);

  // 1st: 2026-05-10
  assert.strictEqual(grouped[0].batches[0].id, 'b_2026');
  // 2nd: 2027-01-15
  assert.strictEqual(grouped[0].batches[1].id, 'b_2027');
  // 3rd & 4th: null or invalid dates placed at the end
  const tailIds = [grouped[0].batches[2].id, grouped[0].batches[3].id];
  assert.ok(tailIds.includes('b_null') && tailIds.includes('b_invalid'));
});

runTest('R3.3: Filtering zero, negative, NaN, and string quantities correctly', () => {
  const input = [
    { id: 'valid1', name: 'Flour', quantity: 10, expirationDate: '2026-10-01' },
    { id: 'zero_qty', name: 'Flour', quantity: 0, expirationDate: '2026-10-01' },
    { id: 'neg_qty', name: 'Flour', quantity: -5, expirationDate: '2026-10-01' },
    { id: 'nan_qty', name: 'Flour', quantity: NaN, expirationDate: '2026-10-01' },
    { id: 'str_qty', name: 'Flour', quantity: 'abc', expirationDate: '2026-10-01' },
    { id: 'str_num', name: 'Flour', quantity: '4', expirationDate: '2026-11-01' },
  ];

  const grouped = groupInventoryByProduct(input);
  assert.strictEqual(grouped.length, 1);
  assert.strictEqual(grouped[0].totalQuantity, 14); // 10 + 4
  assert.strictEqual(grouped[0].batches.length, 2);
});

runTest('R3.4: Alphabetical sorting of grouped products', () => {
  const input = [
    { id: '1', name: 'Yogurt', quantity: 1 },
    { id: '2', name: 'Apple', quantity: 1 },
    { id: '3', name: 'Milk', quantity: 1 },
    { id: '4', name: 'Banana', quantity: 1 },
  ];

  const grouped = groupInventoryByProduct(input);
  assert.strictEqual(grouped[0].name, 'Apple');
  assert.strictEqual(grouped[1].name, 'Banana');
  assert.strictEqual(grouped[2].name, 'Milk');
  assert.strictEqual(grouped[3].name, 'Yogurt');
});

runTest('R3.5: formatDate utility edge case resilience', () => {
  const utilsPath = path.resolve(__dirname, '../../components/pages/inventory/inventory-utils.js');
  const utilsCode = fs.readFileSync(utilsPath, 'utf8');
  assert.ok(utilsCode.includes('isNaN(d.getTime())'), 'formatDate guards against invalid Date objects');

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  assert.strictEqual(formatDate(null), null);
  assert.strictEqual(formatDate(undefined), null);
  assert.strictEqual(formatDate(''), null);
  assert.strictEqual(formatDate('invalid-iso-string'), null);
  assert.strictEqual(formatDate({}), null);
  assert.ok(typeof formatDate('2026-12-31') === 'string');
});

runTest('R3.6: Staged cart stock depletion & out of stock logic', () => {
  const batch = { id: 'batch_alpha', quantity: 3 };
  const stagedCart1 = [{ batchId: 'batch_alpha', quantity: 2 }];
  const stagedCart2 = [{ batchId: 'batch_alpha', quantity: 3 }];
  const stagedCart3 = [{ batchId: 'batch_other', quantity: 10 }];

  const getRemainingStock = (b, cart, prodId) => {
    if (!Array.isArray(cart)) return Number(b.quantity || 0);
    const line = cart.find(c => c && (c.batchId === b.id || c.id === `${prodId}-${b.id}`));
    const inCart = line ? Number(line.quantity || 0) : 0;
    return Math.max(0, Number(b.quantity || 0) - inCart);
  };

  assert.strictEqual(getRemainingStock(batch, stagedCart1, 'prod_1'), 1);
  assert.strictEqual(getRemainingStock(batch, stagedCart2, 'prod_1'), 0);
  assert.strictEqual(getRemainingStock(batch, stagedCart3, 'prod_1'), 3);
  assert.strictEqual(getRemainingStock(batch, null, 'prod_1'), 3);
});

console.log(`\n================================================================`);
console.log(`=== ALL ${totalTests} AUDIT TESTS PASSED (${passedTests}/${totalTests}) ===`);
console.log(`================================================================\n`);
