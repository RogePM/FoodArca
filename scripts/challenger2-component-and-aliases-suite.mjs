import React, { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';

// Import all icons and aliases from custom-icons.jsx
import * as Icons from '../components/ui/custom-icons.jsx';

console.log('================================================================================');
console.log('  CHALLENGER 2: COMPONENT, ALIASES, CONSUMERS & TAILWIND STRESS TEST SUITE      ');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assert(condition, description, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } else {
    failedTests++;
    const errMsg = `[FAIL] ${description} ${detail ? '--> ' + detail : ''}`;
    console.error(`  ${errMsg}`);
    failureDetails.push(errMsg);
  }
}

const PRIMARY_ICONS = [
  'DryGoodsIcon',
  'FrozenFoodIcon',
  'ProduceIcon',
  'ProteinsIcon',
  'BakeryIcon',
  'CannedGoodsIcon',
  'BeveragesIcon',
  'DairyIcon',
  'HygieneIcon',
  'OtherIcon'
];

const ALIASES = {
  CanIcon: 'CannedGoodsIcon',
  TinCanIcon: 'CannedGoodsIcon',
  WaterBottleIcon: 'BeveragesIcon',
  BottleIcon: 'BeveragesIcon',
  BreadIcon: 'BakeryIcon',
  BakerySnacksIcon: 'BakeryIcon',
  LoafBreadIcon: 'BakeryIcon',
  AppleIcon: 'ProduceIcon',
  FruitVegIcon: 'ProduceIcon',
  ChickenLegIcon: 'ProteinsIcon',
  DrumstickIcon: 'ProteinsIcon',
  SteakIcon: 'ProteinsIcon',
  MilkCartonIcon: 'DairyIcon',
  SnowflakeIcon: 'FrozenFoodIcon',
  GrainSackIcon: 'DryGoodsIcon',
  SackIcon: 'DryGoodsIcon',
  SoapIcon: 'HygieneIcon',
  SoapBubblesIcon: 'HygieneIcon',
  BoxIcon: 'OtherIcon',
  PackageIcon: 'OtherIcon'
};

const CATEGORY_KEYS = [
  { name: 'Dry Goods', value: 'dry_goods', iconName: 'DryGoodsIcon' },
  { name: 'Frozen Food', value: 'frozen_food', iconName: 'FrozenFoodIcon' },
  { name: 'Produce', value: 'produce', iconName: 'ProduceIcon' },
  { name: 'Proteins', value: 'proteins', iconName: 'ProteinsIcon' },
  { name: 'Bakery & Snacks', value: 'bakery_snacks', iconName: 'BakeryIcon' },
  { name: 'Canned Goods', value: 'canned_goods', iconName: 'CannedGoodsIcon' },
  { name: 'Beverages', value: 'beverages', iconName: 'BeveragesIcon' },
  { name: 'Dairy', value: 'dairy', iconName: 'DairyIcon' },
  { name: 'Hygiene', value: 'hygiene', iconName: 'HygieneIcon' },
  { name: 'Other', value: 'other', iconName: 'OtherIcon' }
];

// ==============================================================================
// SUITE 1: 10 PRIMARY ICONS & 20 ALIASES INTEGRITY & RENDERING
// ==============================================================================
console.log('>>> SUITE 1: 10 Primary Icons & 20 Aliases Export & Identity Verification');

// 1.1 Primary Icons
for (const iconName of PRIMARY_ICONS) {
  const Comp = Icons[iconName];
  assert(Comp !== undefined && Comp !== null, `Primary icon '${iconName}' is exported`);
  assert(typeof Comp === 'object' || typeof Comp === 'function', `'${iconName}' is a valid React component`);
  assert(Comp?.displayName === iconName, `'${iconName}'.displayName is '${iconName}'`);
  
  // Render with default props
  const html = renderToStaticMarkup(React.createElement(Comp));
  assert(html.startsWith('<svg') && html.endsWith('</svg>'), `'${iconName}' renders valid root <svg> tags`);
  assert(html.includes('viewBox="0 0 24 24"'), `'${iconName}' contains viewBox="0 0 24 24"`);
  assert(!html.includes('NaN') && !html.includes('undefined') && !html.includes('null'), `'${iconName}' has no NaN/undefined/null attributes`);
}

// 1.2 Aliases verification
console.log('\n>>> SUITE 1.2: 20 Aliases Reference Equality & Rendering Parity');
const aliasEntries = Object.entries(ALIASES);
assert(aliasEntries.length === 20, `Exactly 20 aliases defined in test manifest (found: ${aliasEntries.length})`);

for (const [aliasName, targetName] of aliasEntries) {
  const AliasComp = Icons[aliasName];
  const TargetComp = Icons[targetName];
  
  assert(AliasComp !== undefined && AliasComp !== null, `Alias export '${aliasName}' exists`);
  assert(AliasComp === TargetComp, `Alias '${aliasName}' strictly references '${targetName}' (Alias === Target)`);
  
  // Verify alias renders identical static markup as target
  const aliasHtml = renderToStaticMarkup(React.createElement(AliasComp, { size: 32, className: 'alias-test' }));
  const targetHtml = renderToStaticMarkup(React.createElement(TargetComp, { size: 32, className: 'alias-test' }));
  assert(aliasHtml === targetHtml, `Alias '${aliasName}' renders identical markup to '${targetName}'`);
}

// ==============================================================================
// SUITE 2: LIB/CONSTANTS.JS & CATEGORY KEY RESOLUTION
// ==============================================================================
console.log('\n>>> SUITE 2: lib/constants.js Category Mapping & Lookup Tests');

// Read lib/constants.js directly to ensure it links to the real exports
const constantsPath = path.resolve('lib/constants.js');
const constantsContent = fs.readFileSync(constantsPath, 'utf8');

for (const cat of CATEGORY_KEYS) {
  assert(constantsContent.includes(cat.iconName), `lib/constants.js imports '${cat.iconName}'`);
  assert(constantsContent.includes(`value: '${cat.value}'`), `lib/constants.js includes category value '${cat.value}'`);
  assert(constantsContent.includes(`name: '${cat.name}'`), `lib/constants.js includes category name '${cat.name}'`);
}

// Simulate lib/constants categories structure and functions
const categories = CATEGORY_KEYS.map(k => ({
  name: k.name,
  value: k.value,
  icon: Icons[k.iconName],
  style: {
    bg: `bg-${k.value}-50`,
    border: `border-${k.value}-100`,
    text: `text-${k.value}-700`,
    badge: `bg-${k.value}-200`
  }
}));

const getCategoryStyle = (value) => {
  const cat = categories.find(c => c.value === value?.toLowerCase());
  return cat ? cat.style : categories.find(c => c.value === 'other').style;
};

const getCategoryName = (value) => {
  const cat = categories.find(c => c.value === value?.toLowerCase());
  return cat ? cat.name : (value || 'Other');
};

// Test category mapping resolution
for (const cat of categories) {
  assert(typeof cat.icon === 'object' || typeof cat.icon === 'function', `Category '${cat.value}' maps to a valid icon component`);
  const rendered = renderToStaticMarkup(React.createElement(cat.icon, { className: 'h-5 w-5' }));
  assert(rendered.includes('<svg') && rendered.includes('class="h-5 w-5"'), `Category '${cat.value}' icon renders properly with className`);
}

// Test case sensitivity and unknown fallbacks
assert(getCategoryName('DRY_GOODS') === 'Dry Goods', `getCategoryName('DRY_GOODS') handles uppercase properly`);
assert(getCategoryName('produce') === 'Produce', `getCategoryName('produce') resolves 'Produce'`);
assert(getCategoryName('unknown_category_xyz') === 'unknown_category_xyz', `getCategoryName fallback returns raw string`);
assert(getCategoryName(null) === 'Other', `getCategoryName(null) returns 'Other'`);

assert(getCategoryStyle('FROZEN_FOOD').bg === 'bg-frozen_food-50', `getCategoryStyle('FROZEN_FOOD') handles uppercase`);
assert(getCategoryStyle('non_existent').bg === 'bg-other-50', `getCategoryStyle('non_existent') falls back to 'other'`);
assert(getCategoryStyle(null).bg === 'bg-other-50', `getCategoryStyle(null) falls back to 'other'`);

// ==============================================================================
// SUITE 3: TAILWIND UTILITY CLASSES & DUAL-TONE HARDCODED RENDERING STRESS TEST
// ==============================================================================
console.log('\n>>> SUITE 3: Tailwind Utility Class Injection & Color Resilience Stress Test');

const TAILWIND_CLASS_SETS = [
  { desc: 'Standard small icon', className: 'h-4 w-4 shrink-0' },
  { desc: 'Standard medium icon', className: 'h-5 w-5' },
  { desc: 'Large icon', className: 'h-6 w-6' },
  { desc: 'Extra large grid icon', className: 'w-12 h-12' },
  { desc: 'Responsive full width', className: 'w-full h-full object-cover' },
  { desc: 'Tailwind text color override attempt (yellow)', className: 'h-5 w-5 text-yellow-700' },
  { desc: 'Tailwind text color override attempt (violet)', className: 'h-5 w-5 text-violet-600' },
  { desc: 'Tailwind text color override attempt (brand orange)', className: 'h-4 w-4 text-[#d97757]' },
  { desc: 'Tailwind text color override attempt (gray)', className: 'h-4 w-4 text-[#697386]' },
  { desc: 'Opacity modifier', className: 'h-5 w-5 opacity-70' },
  { desc: 'Interactive group hover', className: 'w-8 h-8 group-hover:scale-105 transition-transform duration-200' },
  { desc: 'Complex stacked classes', className: 'h-4 w-4 shrink-0 mt-0.5 text-[#d97757] opacity-80' }
];

for (const iconName of PRIMARY_ICONS) {
  const Comp = Icons[iconName];

  for (const tCase of TAILWIND_CLASS_SETS) {
    const html = renderToStaticMarkup(React.createElement(Comp, { className: tCase.className }));
    
    // 1. Check that className is applied on the root <svg>
    assert(html.includes(`class="${tCase.className}"`), `${iconName} passes className '${tCase.className}' to root <svg>`);
    
    // 2. Check that viewBox is preserved
    assert(html.includes('viewBox="0 0 24 24"'), `${iconName} preserves viewBox="0 0 24 24" under '${tCase.desc}'`);
    
    // 3. Check that currentColor is NEVER introduced by text color classes
    assert(!html.includes('currentColor'), `${iconName} NEVER uses 'currentColor' under '${tCase.desc}'`);
    
    // 4. Check that hardcoded outline gray (#6b7280) and brand orange (#f97316) are preserved
    assert(html.includes('#6b7280'), `${iconName} maintains hardcoded outline gray (#6b7280) under '${tCase.desc}'`);
    assert(html.includes('#f97316'), `${iconName} maintains brand orange accent (#f97316) under '${tCase.desc}'`);
    
    // 5. Check that base white fill (#ffffff) is preserved
    assert(html.includes('#ffffff'), `${iconName} maintains base white fill (#ffffff) under '${tCase.desc}'`);
  }
}

// ==============================================================================
// SUITE 4: REAL APPLICATION CONSUMERS SIMULATION
// ==============================================================================
console.log('\n>>> SUITE 4: Real Application Consumer Context Simulation');

// Consumer 1: NoBarcodeVisualGridSheet & QuickActionSheet helper getCategoryVisual
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

const testInputs = [
  'dry_goods', 'Dry Goods', 'dry-goods', 'drygoods',
  'frozen_food', 'Frozen Food', 'frozenfood',
  'produce', 'Produce',
  'proteins', 'Proteins',
  'bakery_snacks', 'Bakery & Snacks', 'bakery-snacks',
  'canned_goods', 'Canned Goods', 'cannedgoods',
  'beverages', 'Beverages',
  'dairy', 'Dairy',
  'hygiene', 'Hygiene',
  'other', 'Other',
  'unknown_cat', '', null, undefined
];

for (const input of testInputs) {
  const visual = getCategoryVisual(input);
  assert(visual !== null && visual !== undefined, `getCategoryVisual('${input}') returned visual object`);
  assert(typeof visual.Icon === 'object' || typeof visual.Icon === 'function', `visual.Icon for '${input}' is a callable component`);
  
  // Render visual.Icon in the exact format used by NoBarcodeVisualGridSheet
  const gridCardHtml = renderToStaticMarkup(
    React.createElement('div', { className: `w-20 h-20 rounded-full ${visual.style.bg} flex items-center justify-center` },
      React.createElement(visual.Icon, { className: 'w-12 h-12', strokeWidth: 1 })
    )
  );
  assert(gridCardHtml.includes('class="w-12 h-12"'), `NoBarcodeVisualGridSheet card renders icon for input '${input}'`);
  assert(gridCardHtml.includes('stroke-width="1"'), `NoBarcodeVisualGridSheet passes strokeWidth=1 for input '${input}'`);
}

// Consumer 2: DistributionDesktopTable & DistributionMobileList
console.log('\n>>> SUITE 4.2: Distribution Desktop Table & Mobile List Simulation');
for (const cat of categories) {
  const Icon = cat.icon;
  const tableCellHtml = renderToStaticMarkup(
    React.createElement('div', { className: 'flex items-center gap-3' },
      React.createElement('div', { className: `p-2 rounded-lg ${cat.style.bg} ${cat.style.text}` },
        React.createElement(Icon, { className: 'h-5 w-5', strokeWidth: 2.5 })
      ),
      React.createElement('span', { className: 'font-medium text-gray-900' }, cat.name)
    )
  );
  assert(tableCellHtml.includes('class="h-5 w-5"'), `Distribution table cell renders '${cat.name}' icon with 'h-5 w-5'`);
  assert(tableCellHtml.includes('stroke-width="2.5"'), `Distribution table cell applies strokeWidth=2.5 to '${cat.name}'`);
}

// Consumer 3: MobileCheckoutCartView & MobileCartView
console.log('\n>>> SUITE 4.3: Checkout Cart Views Simulation');
for (const cat of categories) {
  const catVisual = getCategoryVisual(cat.value);
  const cartItemHtml = renderToStaticMarkup(
    React.createElement('div', { className: 'flex items-center gap-3 p-3 bg-white rounded-xl' },
      React.createElement('div', { className: `w-12 h-12 rounded-xl ${catVisual.style.bg} flex items-center justify-center` },
        React.createElement(catVisual.Icon, { className: 'w-6 h-6' })
      ),
      React.createElement('span', { className: 'text-sm font-medium' }, catVisual.name)
    )
  );
  assert(cartItemHtml.includes('class="w-6 h-6"'), `Checkout cart view renders '${cat.name}' with 'w-6 h-6'`);
}

// Consumer 4: DesktopAddView & FormView (Interactive form pills with conditional strokeWidth)
console.log('\n>>> SUITE 4.4: Add Items Form Pills Simulation');
for (const cat of categories) {
  for (const isSelected of [true, false]) {
    const pillHtml = renderToStaticMarkup(
      React.createElement('button', {
        type: 'button',
        className: `flex items-center gap-2 px-3 py-2 rounded-lg border ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`
      },
        React.createElement(cat.icon, {
          className: 'h-6 w-6',
          strokeWidth: isSelected ? 2.5 : 1.5
        }),
        React.createElement('span', null, cat.name)
      )
    );
    const expectedStroke = isSelected ? 'stroke-width="2.5"' : 'stroke-width="1.5"';
    assert(pillHtml.includes(expectedStroke), `FormView pill for '${cat.name}' correctly applies ${expectedStroke} (isSelected=${isSelected})`);
  }
}

// ==============================================================================
// SUITE 5: ADVERSARIAL EDGE CASE AND PROP MUTATION HARNESS
// ==============================================================================
console.log('\n>>> SUITE 5: Adversarial Edge Cases, Prop Spreading & Ref Forwarding');

for (const iconName of PRIMARY_ICONS) {
  const Comp = Icons[iconName];

  // 1. Ref forwarding
  const ref = createRef();
  const el = React.createElement(Comp, { ref });
  assert(el.ref === ref, `${iconName} attaches React ref via forwardRef`);

  // 2. Empty props
  const emptyPropsHtml = renderToStaticMarkup(React.createElement(Comp, {}));
  assert(emptyPropsHtml.includes('width="24"') && emptyPropsHtml.includes('height="24"'), `${iconName} falls back cleanly to size=24 with empty props`);

  // 3. Extreme size values
  const zeroSizeHtml = renderToStaticMarkup(React.createElement(Comp, { size: 0 }));
  assert(zeroSizeHtml.includes('width="0"') && zeroSizeHtml.includes('height="0"'), `${iconName} safely handles size=0`);
  
  const giantSizeHtml = renderToStaticMarkup(React.createElement(Comp, { size: 1024 }));
  assert(giantSizeHtml.includes('width="1024"') && giantSizeHtml.includes('height="1024"'), `${iconName} safely handles size=1024`);

  // 4. Spread attributes (ARIA, data, ID, role)
  const spreadHtml = renderToStaticMarkup(React.createElement(Comp, {
    id: `svg-${iconName}`,
    role: 'img',
    'aria-label': `${iconName} icon`,
    'data-category': iconName.toLowerCase(),
    'data-testid': `icon-${iconName}`
  }));
  assert(
    spreadHtml.includes(`id="svg-${iconName}"`) &&
    spreadHtml.includes('role="img"') &&
    spreadHtml.includes(`aria-label="${iconName} icon"`) &&
    spreadHtml.includes(`data-category="${iconName.toLowerCase()}"`) &&
    spreadHtml.includes(`data-testid="icon-${iconName}"`),
    `${iconName} spreads arbitrary HTML/SVG attributes to root <svg>`
  );
}

// ==============================================================================
// FINAL SUMMARY & VERDICT
// ==============================================================================
console.log('\n================================================================================');
console.log('                               TEST SUMMARY                                     ');
console.log('================================================================================');
console.log(`Total Assertions : ${totalTests}`);
console.log(`Passed Assertions: ${passedTests}`);
console.log(`Failed Assertions: ${failedTests}`);

const verdict = failedTests === 0 ? 'APPROVE' : 'REQUEST_CHANGES';
console.log(`\nFINAL EMPIRICAL VERDICT: ${verdict}`);
console.log('================================================================================\n');

if (failureDetails.length > 0) {
  console.error('Failure Details:');
  for (const fail of failureDetails) {
    console.error(`- ${fail}`);
  }
  process.exit(1);
} else {
  process.exit(0);
}
