const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('=== VICTORY AUDITOR INDEPENDENT ADVERSARIAL STRESS TEST SUITE ===');

// --- Test Suite A: Functional Logic & Boundary Edge Cases ---
const flowPath = path.join(__dirname, '../../components/pages/distribution/mobile-distribution-flow.jsx');
const flowContent = fs.readFileSync(flowPath, 'utf8');

const fnMatch = flowContent.match(/export function groupInventoryByProduct\([\s\S]*?\n\}/);
assert.ok(fnMatch, 'groupInventoryByProduct function found');
const fnCode = fnMatch[0].replace('export function', 'function');
const groupInventoryByProduct = new Function(fnCode + '\nreturn groupInventoryByProduct;')();

// Test A1: Mixed complex data shapes
const complexItems = [
  { catalogItemId: 'c1', name: 'Apples', category: 'Produce', quantity: 10, expirationDate: '2026-10-01' },
  { catalogItemId: 'c1', name: 'Apples', category: 'Produce', quantity: 5, expirationDate: '2026-09-01' },
  { catalogItemId: 'c2', name: 'Banana', category: 'Fruit', quantity: 0, expirationDate: '2026-08-01' }, // 0 qty ignored
  { catalogItemId: 'c3', name: 'Carrots', category: 'Produce', quantity: -5, expirationDate: '2026-08-01' }, // negative qty ignored
  { catalogItemId: 'c4', name: 'Dates', category: 'Dried', quantity: 'NaN', expirationDate: '2026-08-01' }, // NaN qty ignored
  { barcode: 'B001', name: 'Eggs', category: 'Dairy', quantity: 12, expirationDate: null },
  { barcode: 'B001', name: 'Eggs', category: 'Dairy', quantity: 6, expirationDate: '2026-08-30' },
];

const grouped = groupInventoryByProduct(complexItems);
assert.strictEqual(grouped.length, 2, 'Should only contain Apples and Eggs');
assert.strictEqual(grouped[0].name, 'Apples');
assert.strictEqual(grouped[0].totalQuantity, 15);
assert.strictEqual(grouped[0].batches.length, 2);
assert.strictEqual(grouped[0].batches[0].expirationDate, '2026-09-01', 'Earlier date comes first');
assert.strictEqual(grouped[0].batches[1].expirationDate, '2026-10-01', 'Later date comes second');

assert.strictEqual(grouped[1].name, 'Eggs');
assert.strictEqual(grouped[1].totalQuantity, 18);
assert.strictEqual(grouped[1].batches.length, 2);
assert.strictEqual(grouped[1].batches[0].expirationDate, '2026-08-30', 'Valid date before null date');
assert.strictEqual(grouped[1].batches[1].expirationDate, null, 'Null date placed last');
console.log('✓ PASS A1: Complex data grouping, filtering, and FEFO sorting strictly verified');

// Test A2: Expiration Meta Calculation logic
const vgsPath = path.join(__dirname, '../../components/pages/distribution/no-barcode-visual-grid-sheet.jsx');
const vgsContent = fs.readFileSync(vgsPath, 'utf8');

const metaMatch = vgsContent.match(/function getProductExpirationMeta\([\s\S]*?\n\}/);
assert.ok(metaMatch, 'getProductExpirationMeta function found');
const metaCode = metaMatch[0];
const getProductExpirationMeta = new Function(metaCode + '\nreturn getProductExpirationMeta;')();

const prodExpiringSoon = {
  batches: [
    { expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() }, // 5 days from now
    { expirationDate: '2028-01-01' }
  ]
};
const metaSoon = getProductExpirationMeta(prodExpiringSoon);
assert.strictEqual(metaSoon.hasDate, true);
assert.strictEqual(metaSoon.isExpiringSoon, true);

const prodExpiringFar = {
  batches: [
    { expirationDate: '2029-01-01' }
  ]
};
const metaFar = getProductExpirationMeta(prodExpiringFar);
assert.strictEqual(metaFar.hasDate, true);
assert.strictEqual(metaFar.isExpiringSoon, false);

const prodNoDate = {
  batches: [
    { expirationDate: null }
  ]
};
const metaNoDate = getProductExpirationMeta(prodNoDate);
assert.strictEqual(metaNoDate.hasDate, false);
assert.strictEqual(metaNoDate.isExpiringSoon, false);
console.log('✓ PASS A2: getProductExpirationMeta correctly categorizes expiring soon, future, and no-date items');

// Test Suite B: UI / AST Strict Inspections
// Test B1: Visual Grid Card Requirements
const qasPath = path.join(__dirname, '../../components/pages/distribution/quick-action-sheet.jsx');
const qasContent = fs.readFileSync(qasPath, 'utf8');

// Ensure card does not render any category or expiration text
assert.ok(!vgsContent.includes('<p className="text-[12px] font-medium text-gray-500'), 'Old category line removed');
assert.ok(!vgsContent.includes('Exp:'), 'Grid card does not render Exp:');
assert.ok(!vgsContent.includes('formattedExp'), 'Grid card does not compute formattedExp');

// Ensure badge only shows when batchCount > 1
assert.ok(vgsContent.includes('batchCount > 1 &&'), 'Badge strictly conditioned on batchCount > 1');
assert.ok(vgsContent.includes('{batchCount} Batches'), 'Badge displays batch count with Batches text');

// Ensure QuickActionSheet strictly guards against <= 1 batch
assert.ok(qasContent.includes('sortedBatches.length <= 1'), 'QuickActionSheet has <= 1 batch guard');
assert.ok(qasContent.includes('return null;'), 'QuickActionSheet returns null when <= 1 batch');

// Ensure QuickActionSheet multi-batch row shows only expiration date and stock count
assert.ok(qasContent.includes('{formattedExp ? `Exp: ${formattedExp}` : \'No expiration date\'}'), 'Formatted exp date in row');
assert.ok(qasContent.includes('{remainingStock} {product.unit || \'units\'} available'), 'Available stock count in row');
assert.ok(qasContent.includes('Add to Cart'), 'Clean Add to Cart action');

// Ensure font weights are lightweight (no font-bold, font-semibold, etc. in either sheet)
const heavyFontRegex = /\bfont-(?:bold|semibold|extrabold|black)\b/;
assert.ok(!heavyFontRegex.test(vgsContent), 'No heavy font weights in no-barcode-visual-grid-sheet.jsx');
assert.ok(!heavyFontRegex.test(qasContent), 'No heavy font weights in quick-action-sheet.jsx');

console.log('✓ PASS B1: All AST & JSX strict requirements verified');

// Test Suite C: Forensics & Anti-Cheating
assert.ok(!vgsContent.includes('/* mock */'), 'No mock annotations in visual grid');
assert.ok(!qasContent.includes('/* mock */'), 'No mock annotations in quick action');
assert.ok(!vgsContent.includes('test-result'), 'No hardcoded test result strings');
assert.ok(!qasContent.includes('test-result'), 'No hardcoded test result strings');

console.log('=== ALL VICTORY AUDITOR ADVERSARIAL STRESS TESTS PASSED ===');
