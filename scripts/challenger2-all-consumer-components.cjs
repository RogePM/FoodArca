const Module = require('module');
const path = require('path');
const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    request = path.resolve(__dirname, '..', request.slice(2));
  }
  return origResolveFilename.call(this, request, parent, isMain, options);
};

require('sucrase/register/js');
require('sucrase/register/jsx');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const fs = require('fs');

const Icons = require('../components/ui/custom-icons.jsx');

console.log('================================================================================');
console.log('  CHALLENGER 2: DEEP CONSUMER COMPONENT RENDERING & MAPPING AUDIT              ');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(cond, desc, detail = '') {
  totalTests++;
  if (cond) {
    passedTests++;
    console.log(`  [PASS] ${desc}`);
  } else {
    failedTests++;
    const msg = `[FAIL] ${desc} ${detail ? '--> ' + detail : ''}`;
    console.error(`  ${msg}`);
    failures.push(msg);
  }
}

// 1. Audit OpenFoodFacts Category Mapper
console.log('>>> 1. OpenFoodFacts categoryMapper.js resolution audit');
const { mapOpenFoodFactsCategory } = require('../lib/categoryMapper.js');

const categoryKeywordsTest = [
  { tags: ['pasta', 'semolina'], expected: 'dry_goods' },
  { tags: 'whole wheat flour for baking', expected: 'dry_goods' },
  { tags: ['deep frozen', 'frozen pizza'], expected: 'frozen_food' },
  { tags: ['fresh apples', 'organic spinach'], expected: 'produce' },
  { tags: ['canned tuna', 'canned soup'], expected: 'canned_goods' },
  { tags: ['chicken breast', 'poultry'], expected: 'proteins' },
  { tags: ['chocolate chip cookie', 'bakery biscuits'], expected: 'bakery_snacks' },
  { tags: ['orange juice', 'carbonated soda'], expected: 'beverages' },
  { tags: ['whole milk', 'cheddar cheese', 'yogurt'], expected: 'dairy' },
  { tags: ['bar soap', 'body shampoo'], expected: 'hygiene' },
  { tags: ['random electronic gadget'], expected: 'other' },
  { tags: null, expected: 'other' },
  { tags: undefined, expected: 'other' },
  { tags: [], expected: 'other' }
];

for (const testCase of categoryKeywordsTest) {
  const mapped = mapOpenFoodFactsCategory(testCase.tags);
  assert(mapped === testCase.expected, `mapOpenFoodFactsCategory(${JSON.stringify(testCase.tags)}) === '${testCase.expected}' (got: '${mapped}')`);
}

// 2. Comprehensive Category Style & Name Lookup
console.log('\n>>> 2. Constants Helper Functions with all possible category values');
const { categories, getCategoryStyle, getCategoryName } = require('../lib/constants.js');

assert(Array.isArray(categories) && categories.length === 10, `categories array contains exactly 10 categories (found: ${categories.length})`);

for (const cat of categories) {
  assert(typeof cat.name === 'string' && cat.name.length > 0, `Category '${cat.value}' has valid name: '${cat.name}'`);
  assert(typeof cat.value === 'string' && cat.value.length > 0, `Category '${cat.value}' has valid value identifier`);
  assert(typeof cat.icon === 'object' || typeof cat.icon === 'function', `Category '${cat.value}' has valid icon component`);
  assert(cat.icon.displayName !== undefined, `Category '${cat.value}' icon has displayName '${cat.icon.displayName}'`);
  assert(cat.style && cat.style.bg && cat.style.border && cat.style.text && cat.style.badge, `Category '${cat.value}' has complete style definitions (bg, border, text, badge)`);

  const markup = renderToStaticMarkup(React.createElement(cat.icon, { className: 'w-5 h-5' }));
  assert(markup.includes('<svg') && markup.includes('class="w-5 h-5"'), `Category '${cat.value}' icon renders without error`);
}

// 3. Test All 20 Aliases with prop combinations
console.log('\n>>> 3. Aliases Full Matrix Prop Invocations');
const ALIASES = [
  'CanIcon', 'TinCanIcon', 'WaterBottleIcon', 'BottleIcon',
  'BreadIcon', 'BakerySnacksIcon', 'LoafBreadIcon', 'AppleIcon',
  'FruitVegIcon', 'ChickenLegIcon', 'DrumstickIcon', 'SteakIcon',
  'MilkCartonIcon', 'SnowflakeIcon', 'GrainSackIcon', 'SackIcon',
  'SoapIcon', 'SoapBubblesIcon', 'BoxIcon', 'PackageIcon'
];

for (const alias of ALIASES) {
  const Comp = Icons[alias];
  assert(Comp !== undefined && Comp !== null, `Alias '${alias}' exists`);

  // Render with variety of props
  const out1 = renderToStaticMarkup(React.createElement(Comp, { size: 16, strokeWidth: 1 }));
  const out2 = renderToStaticMarkup(React.createElement(Comp, { size: 48, strokeWidth: 2, className: 'custom-class' }));
  
  assert(out1.includes('width="16"') && out1.includes('stroke-width="1"'), `Alias '${alias}' respects size=16 and strokeWidth=1`);
  assert(out2.includes('width="48"') && out2.includes('stroke-width="2"') && out2.includes('class="custom-class"'), `Alias '${alias}' respects size=48, strokeWidth=2, and className`);
}

// 4. Test Category Lookup edge cases & formatting
console.log('\n>>> 4. Category Key Case Sensitivity & Mapping Resilience');
const testCases = [
  { input: 'dry_goods', expectedName: 'Dry Goods', expectedIcon: 'DryGoodsIcon' },
  { input: 'DRY_GOODS', expectedName: 'Dry Goods', expectedIcon: 'DryGoodsIcon' },
  { input: 'Frozen_Food', expectedName: 'Frozen Food', expectedIcon: 'FrozenFoodIcon' },
  { input: 'PRODUCE', expectedName: 'Produce', expectedIcon: 'ProduceIcon' },
  { input: 'proteins', expectedName: 'Proteins', expectedIcon: 'ProteinsIcon' },
  { input: 'bakery_snacks', expectedName: 'Bakery & Snacks', expectedIcon: 'BakeryIcon' },
  { input: 'canned_goods', expectedName: 'Canned Goods', expectedIcon: 'CannedGoodsIcon' },
  { input: 'beverages', expectedName: 'Beverages', expectedIcon: 'BeveragesIcon' },
  { input: 'dairy', expectedName: 'Dairy', expectedIcon: 'DairyIcon' },
  { input: 'hygiene', expectedName: 'Hygiene', expectedIcon: 'HygieneIcon' },
  { input: 'other', expectedName: 'Other', expectedIcon: 'OtherIcon' },
  { input: 'non_existent_category', expectedName: 'non_existent_category', fallbackToOtherStyle: true },
  { input: null, expectedName: 'Other', fallbackToOtherStyle: true },
  { input: undefined, expectedName: 'Other', fallbackToOtherStyle: true }
];

for (const tc of testCases) {
  const name = getCategoryName(tc.input);
  assert(name === tc.expectedName, `getCategoryName(${JSON.stringify(tc.input)}) === '${tc.expectedName}' (got: '${name}')`);

  const style = getCategoryStyle(tc.input);
  assert(style && style.bg && style.text, `getCategoryStyle(${JSON.stringify(tc.input)}) returns valid style object`);
  if (tc.fallbackToOtherStyle) {
    const otherStyle = getCategoryStyle('other');
    assert(style.bg === otherStyle.bg, `getCategoryStyle(${JSON.stringify(tc.input)}) correctly falls back to 'other' style`);
  }
}

// 5. Test Mock Inventory Items rendered in UI Components
console.log('\n>>> 5. Mock Inventory Item Generation and Visual Lookup Verification');
const mockInventory = [
  { id: '1', name: 'All Purpose Flour', category: 'dry_goods' },
  { id: '2', name: 'Frozen Garden Peas', category: 'frozen_food' },
  { id: '3', name: 'Crisp Lettuce', category: 'produce' },
  { id: '4', name: 'Salmon Steaks', category: 'proteins' },
  { id: '5', name: 'Whole Wheat Sourdough', category: 'bakery_snacks' },
  { id: '6', name: 'Canned Crushed Tomatoes', category: 'canned_goods' },
  { id: '7', name: 'Sparkling Spring Water', category: 'beverages' },
  { id: '8', name: 'Lowfat Milk', category: 'dairy' },
  { id: '9', name: 'Liquid Hand Soap', category: 'hygiene' },
  { id: '10', name: 'Miscellaneous Supplies', category: 'other' }
];

function getCategoryVisual(value) {
  const safeVal = String(value || 'other').toLowerCase();
  const cat = categories.find(
    (c) =>
      c.value === safeVal ||
      c.name.toLowerCase() === safeVal ||
      c.value === safeVal.replace(/[\s-]/g, '_') ||
      c.value.replace(/_/g, '') === safeVal.replace(/[\s&_-]/g, '')
  );
  if (cat) return { Icon: cat.icon, style: cat.style, name: cat.name, value: cat.value };
  const fallback = categories.find((c) => c.value === 'other') || categories[0];
  return { Icon: fallback.icon, style: fallback.style, name: value || 'Other', value: 'other' };
}

for (const item of mockInventory) {
  const visual = getCategoryVisual(item.category);
  assert(visual.Icon !== undefined, `Found visual icon for '${item.name}' (${item.category})`);
  
  // Render badge markup
  const badgeMarkup = renderToStaticMarkup(
    React.createElement('span', { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${visual.style.bg} ${visual.style.text}` },
      React.createElement(visual.Icon, { className: 'w-3.5 h-3.5', strokeWidth: 2 }),
      visual.name
    )
  );
  assert(badgeMarkup.includes('class="w-3.5 h-3.5"'), `Rendered badge markup for '${item.name}'`);
  assert(badgeMarkup.includes('stroke-width="2"'), `Applied strokeWidth=2 to '${item.name}' badge`);
}

console.log('\n================================================================================');
console.log('                               TEST SUMMARY                                     ');
console.log('================================================================================');
console.log(`Total Assertions : ${totalTests}`);
console.log(`Passed Assertions: ${passedTests}`);
console.log(`Failed Assertions: ${failedTests}`);

const verdict = failedTests === 0 ? 'APPROVE' : 'REQUEST_CHANGES';
console.log(`\nFINAL EMPIRICAL VERDICT: ${verdict}`);
console.log('================================================================================\n');

if (failures.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
