import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import swc from 'next/dist/build/swc/index.js';

const require = createRequire(import.meta.url);

async function runIndependentAudit() {
  console.log('===========================================================');
  console.log('    INDEPENDENT VICTORY AUDIT: CUSTOM SVG ICONS REWRITE   ');
  console.log('===========================================================\n');

  await swc.loadBindings();

  const filePath = path.resolve('components/ui/custom-icons.jsx');
  const sourceCode = fs.readFileSync(filePath, 'utf8');

  let passedAll = true;
  let totalAssertions = 0;
  let passedAssertions = 0;

  function assert(desc, condition, details = '') {
    totalAssertions++;
    if (condition) {
      passedAssertions++;
      console.log(`  [PASS] ${desc}`);
    } else {
      passedAll = false;
      console.error(`  [FAIL] ${desc} ${details ? '--> ' + details : ''}`);
    }
  }

  // -------------------------------------------------------------
  // PHASE A & B: SOURCE CODE & AST INTEGRITY FORENSICS
  // -------------------------------------------------------------
  console.log('--- PHASE B.1: Static Source Code & Integrity Forensics ---');

  // 1. Zero currentColor
  const currentColorMatches = sourceCode.match(/currentColor/gi);
  assert("Zero 'currentColor' occurrences in custom-icons.jsx", !currentColorMatches);

  // 2. Zero stroke={color}
  const strokeColorMatches = sourceCode.match(/stroke=\{color\}/gi);
  assert("Zero 'stroke={color}' occurrences in custom-icons.jsx", !strokeColorMatches);

  // 3. Zero bypass/cheat tokens
  const bypassMatches = sourceCode.match(/\b(bypass|FACADE|MOCK|DUMMY|__CHEAT__)\b/i);
  assert("Zero bypass/facade tokens detected in source", !bypassMatches);

  // 4. Hardcoded Palette check: Only approved colors used
  const hexMatches = sourceCode.match(/#[0-9a-fA-F]{6}/g) || [];
  const uniqueHexes = [...new Set(hexMatches.map(h => h.toLowerCase()))];
  const approvedHexes = ['#6b7280', '#595959', '#f97316', '#e5e7eb', '#d1d5db', '#ffffff'];
  const unapprovedHexes = uniqueHexes.filter(h => !approvedHexes.includes(h));
  assert(
    `All hex colors belong to approved palette. Found: [${uniqueHexes.join(', ')}]`,
    unapprovedHexes.length === 0,
    `Unapproved: [${unapprovedHexes.join(', ')}]`
  );

  // 5. Default prop declarations
  const strokeWidthDefaults = sourceCode.match(/strokeWidth\s*=\s*1\.5/g) || [];
  assert("All 10 primary icons declare strokeWidth = 1.5 default", strokeWidthDefaults.length === 10);

  const sizeDefaults = sourceCode.match(/size\s*=\s*24/g) || [];
  assert("All 10 primary icons declare size = 24 default", sizeDefaults.length === 10);

  const classNameDefaults = sourceCode.match(/className\s*=\s*''/g) || [];
  assert("All 10 primary icons declare className = '' default", classNameDefaults.length === 10);

  // -------------------------------------------------------------
  // PHASE B.2: COMPONENT COMPILATION & AST EXECUTION
  // -------------------------------------------------------------
  console.log('\n--- PHASE B.2: AST Compilation & Component Contracts ---');

  const swcResult = await swc.transform(sourceCode, {
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'automatic' } }
    },
    module: { type: 'commonjs' }
  });

  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', 'React', swcResult.code);
  fn(
    m,
    m.exports,
    mod => {
      if (mod === 'react') return React;
      if (mod === 'react/jsx-runtime') return require('react/jsx-runtime');
      return require(mod);
    },
    React
  );

  const icons = m.exports;

  const requiredIcons = [
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

  const requiredAliases = [
    ['CanIcon', 'CannedGoodsIcon'],
    ['TinCanIcon', 'CannedGoodsIcon'],
    ['WaterBottleIcon', 'BeveragesIcon'],
    ['BottleIcon', 'BeveragesIcon'],
    ['BreadIcon', 'BakeryIcon'],
    ['BakerySnacksIcon', 'BakeryIcon'],
    ['LoafBreadIcon', 'BakeryIcon'],
    ['AppleIcon', 'ProduceIcon'],
    ['FruitVegIcon', 'ProduceIcon'],
    ['ChickenLegIcon', 'ProteinsIcon'],
    ['DrumstickIcon', 'ProteinsIcon'],
    ['SteakIcon', 'ProteinsIcon'],
    ['MilkCartonIcon', 'DairyIcon'],
    ['SnowflakeIcon', 'FrozenFoodIcon'],
    ['GrainSackIcon', 'DryGoodsIcon'],
    ['SackIcon', 'DryGoodsIcon'],
    ['SoapIcon', 'HygieneIcon'],
    ['SoapBubblesIcon', 'HygieneIcon'],
    ['BoxIcon', 'OtherIcon'],
    ['PackageIcon', 'OtherIcon']
  ];

  for (const name of requiredIcons) {
    assert(`Icon '${name}' exported and is a valid React component`, !!icons[name]);
    assert(`Icon '${name}' has displayName '${name}'`, icons[name].displayName === name);
  }

  for (const [alias, primary] of requiredAliases) {
    assert(`Alias '${alias}' strictly equals primary '${primary}'`, icons[alias] === icons[primary]);
  }

  // -------------------------------------------------------------
  // PHASE C.1: SEMANTIC COMPOSITION & GEOMETRIC VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- PHASE C.1: 10 Icon Compositions & Layering ---');

  // 1. DryGoodsIcon: Tall bag on left (wheat stalk #f97316) overlapping jar on right (dots)
  const dryGoods = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.DryGoodsIcon));
  assert('DryGoodsIcon: has dark gray outline stroke="#6b7280"', dryGoods.includes('stroke="#6b7280"'));
  assert('DryGoodsIcon: has orange wheat stalk graphic stroke="#f97316"', dryGoods.includes('stroke="#f97316"'));
  assert('DryGoodsIcon: wheat stalk path exists', dryGoods.includes('d="M7.8 9.5v7"'));
  assert('DryGoodsIcon: flour bag front layer has fill="#ffffff"', dryGoods.includes('fill="#ffffff"'));
  assert('DryGoodsIcon: glass jar has fill="#e5e7eb"', dryGoods.includes('fill="#e5e7eb"'));
  assert('DryGoodsIcon: glass jar texture dots exist', (dryGoods.match(/<circle/g) || []).length >= 4);

  // 2. FrozenFoodIcon: Tall freezer bag, dark gray snowflake center, orange seal top, circular badge bottom right with orange snowflake
  const frozen = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.FrozenFoodIcon));
  assert('FrozenFoodIcon: has orange zip seal line at top', frozen.includes('x1="4.5" y1="6" x2="16.5" y2="6" stroke="#f97316"'));
  assert('FrozenFoodIcon: has dark gray snowflake lines', frozen.includes('x1="9.5" y1="9" x2="9.5" y2="17" stroke="#6b7280"'));
  assert('FrozenFoodIcon: has circular badge bottom right', frozen.includes('cx="17.5" cy="16.5" r="4.5" fill="#ffffff"'));
  assert('FrozenFoodIcon: has orange snowflake inside circular badge', frozen.includes('x1="17.5" y1="13.5" x2="17.5" y2="19.5" stroke="#f97316"'));
  assert('FrozenFoodIcon: freezer bag body has white fill for occlusion', frozen.includes('fill="#ffffff"'));

  // 3. ProduceIcon: Bowl at bottom, white apple on left (orange stem, gray leaf), tall light-gray leafy green center back, orange carrot pointing diagonally up right
  const produce = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.ProduceIcon));
  assert('ProduceIcon: has produce bowl at bottom', produce.includes('d="M2.5 14c0 4.2 4.2 7 9.5 7s9.5-2.8 9.5-7'));
  assert('ProduceIcon: bowl has fill="#ffffff"', produce.includes('fill="#ffffff"'));
  assert('ProduceIcon: has tall leafy green with fill="#e5e7eb"', produce.includes('d="M12 2.5C10.2 4 9 6.2 9 8.5') && produce.includes('fill="#e5e7eb"'));
  assert('ProduceIcon: has white apple body', produce.includes('d="M6.5 8.8C5.2 8 3.5 9 3.5 11') && produce.includes('fill="#ffffff"'));
  assert('ProduceIcon: apple has orange stem stroke="#f97316"', produce.includes('d="M6.5 8.8c0-1.5.6-2.5 1.5-3" stroke="#f97316"'));
  assert('ProduceIcon: apple has gray leaf fill="#e5e7eb"', produce.includes('d="M7.5 6.5c1-.8 2.2-.6 2.5.3 0 .8-1.2 1-2.5-.3z" fill="#e5e7eb"'));
  assert('ProduceIcon: has orange carrot pointing diagonally up', produce.includes('d="M13 14.2L17.5 6c.6-.9 1.9-.6 2.3.4') && produce.includes('fill="#f97316"'));

  // 4. ProteinsIcon: Platter at bottom, salmon fillet (orange fill, white contours), chicken drumstick (gray meat, white bone, dark gray outline)
  const proteins = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.ProteinsIcon));
  assert('ProteinsIcon: has platter at bottom with fill="#ffffff"', proteins.includes('d="M2 17.5C2 19.8 6.5 21.5 12 21.5s10-1.7 10-4') && proteins.includes('fill="#ffffff"'));
  assert('ProteinsIcon: has salmon fillet with fill="#f97316"', proteins.includes('d="M4.5 11.5C4.5 8.8 6.5 7.5 8.5 7.5') && proteins.includes('fill="#f97316"'));
  assert('ProteinsIcon: salmon fillet has white contour lines', proteins.includes('stroke="#ffffff"'));
  assert('ProteinsIcon: has chicken drumstick meat with fill="#e5e7eb"', proteins.includes('d="M12.5 13.5c-1-2.2.5-4.5 2.8-4.5') && proteins.includes('fill="#e5e7eb"'));
  assert('ProteinsIcon: chicken drumstick bone has fill="#ffffff"', proteins.includes('M19.5 6.5a1 1 0') && proteins.includes('fill="#ffffff"'));

  // 5. BakeryIcon: Slice of white bread on left (crumb shading #e5e7eb) overlapping snack bag on right (orange circle #f97316)
  const bakery = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.BakeryIcon));
  assert('BakeryIcon: has snack bag with top and bottom crimp seals', bakery.includes('d="M11.5 3.5h9v2h-9z"') && bakery.includes('d="M11.5 18.5h9v2h-9z"'));
  assert('BakeryIcon: snack bag has orange circle graphic', bakery.includes('cx="16" cy="12" r="2.5" fill="#f97316"'));
  assert('BakeryIcon: slice of white bread has fill="#ffffff"', bakery.includes('d="M3.5 10.5C2.5 8 5 6.5 7 7') && bakery.includes('fill="#ffffff"'));
  assert('BakeryIcon: bread slice has crumb shading fill="#e5e7eb"', bakery.includes('opacity="0.5"') && bakery.includes('fill="#e5e7eb"'));

  // 6. CannedGoodsIcon: Tall ribbed can back right (orange stripe near top) + shorter can front left (orange tomato graphic)
  const canned = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.CannedGoodsIcon));
  assert('CannedGoodsIcon: tall ribbed can has orange stripe near top', canned.includes('d="M12 7.5 H21 V9.5 H12 Z" fill="#f97316"'));
  assert('CannedGoodsIcon: tall can has rib lines', canned.includes('x1="12" y1="12" x2="21" y2="12"'));
  assert('CannedGoodsIcon: shorter can has pull tab and rim', canned.includes('cx="8.25" cy="10" rx="5.25" ry="1.4"'));
  assert('CannedGoodsIcon: front can has orange tomato graphic', canned.includes('cx="8.25" cy="15.5" r="2.3" fill="#f97316"'));

  // 7. BeveragesIcon: Tall bottle on left (orange water drop graphic) + shorter soda can on right (orange wave graphic)
  const beverages = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.BeveragesIcon));
  assert('BeveragesIcon: tall bottle has cap and body with fill="#ffffff"', beverages.includes('d="M6.2 4.5 V6.5 L3 9.5 V19.5') && beverages.includes('fill="#ffffff"'));
  assert('BeveragesIcon: tall bottle has orange water drop graphic', beverages.includes('d="M7.25 12.5 C6.2 14 5.5 15.2 5.5 16.3') && beverages.includes('fill="#f97316"'));
  assert('BeveragesIcon: shorter soda can has top lid and body with fill="#ffffff"', beverages.includes('d="M12.5 7.5 H19.5 L21 9 V19.5') && beverages.includes('fill="#ffffff"'));
  assert('BeveragesIcon: shorter soda can has orange wave graphic', beverages.includes('d="M11 14.5 C13 13 14.5 16 17 14.5') && beverages.includes('fill="#f97316"'));

  // 8. DairyIcon: Tall milk bottle on left (cow face graphic) + yogurt cup on right (orange lid & spoon sticking out)
  const dairy = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.DairyIcon));
  assert('DairyIcon: tall milk bottle has cap and body with fill="#ffffff"', dairy.includes('d="M6 4 V6 L3 9 V19.5') && dairy.includes('fill="#ffffff"'));
  assert('DairyIcon: milk bottle has cow face graphic (muzzle, nostrils, horns)', dairy.includes('cx="7.5" cy="16" rx="2" ry="1.2"'));
  assert('DairyIcon: yogurt cup has spoon sticking out', dairy.includes('d="M15.5 10.5 L18.5 5 C19.2 3.8 21 4.8 20.2 6.2 L17.5 11" fill="#ffffff"'));
  assert('DairyIcon: yogurt cup has orange lid with peel tab', dairy.includes('d="M11 10 C11 9.5 11.5 9 12 9 H21.5') && dairy.includes('fill="#f97316"'));

  // 9. HygieneIcon: Pump bottle on left (orange pump & drop) + toilet paper roll on right
  const hygiene = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.HygieneIcon));
  assert('HygieneIcon: pump bottle has orange pump actuator and drop', hygiene.includes('d="M4 4.5 H8.5') && hygiene.includes('stroke="#f97316"'));
  assert('HygieneIcon: pump bottle has orange drop graphic', hygiene.includes('d="M7.25 13.5 C6.2 15 5.5 16.2') && hygiene.includes('fill="#f97316"'));
  assert('HygieneIcon: toilet paper roll has body, top ellipse and hollow core', hygiene.includes('ellipse cx="16" cy="8.5" rx="4.5" ry="2"'));
  assert('HygieneIcon: toilet paper roll has hanging sheet with dashed line', hygiene.includes('d="M20.5 10 V20.5') && hygiene.includes('stroke-dasharray="1.5 1"'));

  // 10. OtherIcon: Shopping basket (vertical slots) + circular badge bottom right with orange plus sign
  const other = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.OtherIcon));
  assert('OtherIcon: shopping basket has handle and rim', other.includes('d="M6 9.5 V5 C6 4.2 6.8 3.5 7.6 3.5 H16.4') && other.includes('rect x="2" y="9.5" width="20" height="2.5"'));
  assert('OtherIcon: shopping basket has body with fill="#ffffff"', other.includes('d="M3.5 12 L5 19') && other.includes('fill="#ffffff"'));
  assert('OtherIcon: shopping basket has 4 vertical ventilation slots', other.includes('x1="7.5" y1="13.5" x2="8" y2="18.5"') && other.includes('x1="16.5" y1="13.5" x2="16" y2="18.5"'));
  assert('OtherIcon: has circular badge bottom right', other.includes('circle cx="17.5" cy="17.5" r="4.5" fill="#ffffff"'));
  assert('OtherIcon: has orange plus (+) sign lines inside badge', other.includes('x1="15" y1="17.5" x2="20" y2="17.5" stroke="#f97316"') && other.includes('x1="17.5" y1="15" x2="17.5" y2="20" stroke="#f97316"'));

  // -------------------------------------------------------------
  // PHASE C.2: PROP STRESS & FORWARDING VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- PHASE C.2: Props, Styles & Custom Attributes ---');

  for (const name of requiredIcons) {
    const Component = icons[name];
    const customHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Component, {
        size: 32,
        strokeWidth: 2,
        className: 'w-8 h-8 text-primary shadow-sm',
        'data-audit-id': `icon-${name}`,
        'aria-label': `${name} category`
      })
    );
    assert(`${name}: custom size=32 width attribute`, customHtml.includes('width="32"'));
    assert(`${name}: custom size=32 height attribute`, customHtml.includes('height="32"'));
    assert(`${name}: custom strokeWidth=2`, customHtml.includes('stroke-width="2"'));
    assert(`${name}: custom className passed`, customHtml.includes('class="w-8 h-8 text-primary shadow-sm"'));
    assert(`${name}: custom data-audit-id prop passed`, customHtml.includes(`data-audit-id="icon-${name}"`));
    assert(`${name}: custom aria-label prop passed`, customHtml.includes(`aria-label="${name} category"`));
  }

  // -------------------------------------------------------------
  // PHASE C.3: STRICT SVG XML & VIEWBOX VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- PHASE C.3: Strict SVG XML & ViewBox Verification ---');

  for (const name of requiredIcons) {
    const markup = ReactDOMServer.renderToStaticMarkup(React.createElement(icons[name]));
    assert(`${name}: has valid viewBox="0 0 24 24"`, markup.includes('viewBox="0 0 24 24"'));
    assert(`${name}: has strokeLinecap="round" and strokeLinejoin="round"`, markup.includes('stroke-linecap="round"') && markup.includes('stroke-linejoin="round"'));
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===========================================================');
  console.log(`TOTAL AUDIT ASSERTIONS: ${totalAssertions}`);
  console.log(`PASSED: ${passedAssertions}`);
  console.log(`FAILED: ${totalAssertions - passedAssertions}`);
  console.log('===========================================================');

  if (!passedAll) {
    process.exit(1);
  }
}

runIndependentAudit().catch(err => {
  console.error('Fatal error during independent audit:', err);
  process.exit(1);
});
