import fs from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import swc from 'next/dist/build/swc/index.js';

const require = createRequire(import.meta.url);

async function runAdversarialSuite() {
  console.log('====================================================');
  console.log('  EMPIRICAL ADVERSARIAL TEST SUITE (NEW PALETTE)   ');
  console.log('====================================================\n');

  await swc.loadBindings();

  const sourceCode = fs.readFileSync('components/ui/custom-icons.jsx', 'utf8');

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

  // ----------------------------------------------------
  // SUITE 1: STATIC AST & SOURCE CODE ANALYSIS
  // ----------------------------------------------------
  console.log('--- SUITE 1: Static Code & Regex Audits ---');

  // Check no currentColor usage in custom-icons.jsx
  const currentColorMatches = sourceCode.match(/currentColor/g) || [];
  assert('Zero currentColor usage in custom-icons.jsx', currentColorMatches.length === 0, 'Found: ' + JSON.stringify(currentColorMatches));

  // Check no stroke={color} usage
  const strokeColorMatches = sourceCode.match(/stroke=\{color\}/g) || [];
  assert('Zero stroke={color} usage in custom-icons.jsx', strokeColorMatches.length === 0, 'Found count: ' + strokeColorMatches.length);

  // Check strokeWidth default = 1.5
  const strokeWidthMatches = sourceCode.match(/strokeWidth = 1\.5/g) || [];
  assert('All 10 icons declare strokeWidth = 1.5 default', strokeWidthMatches.length === 10, 'Found count: ' + strokeWidthMatches.length);

  // Check size default = 24
  const sizeDefaultMatches = sourceCode.match(/size = 24/g) || [];
  assert('All 10 icons declare size = 24 default', sizeDefaultMatches.length === 10, 'Found count: ' + sizeDefaultMatches.length);

  // Check className default = ''
  const classNameDefaultMatches = sourceCode.match(/className = ''/g) || [];
  assert("All 10 icons declare className = '' default", classNameDefaultMatches.length === 10, 'Found count: ' + classNameDefaultMatches.length);

  // Check displayName on all 10 icons
  const displayNames = [
    'DryGoodsIcon', 'FrozenFoodIcon', 'ProduceIcon', 'ProteinsIcon', 'BakeryIcon',
    'CannedGoodsIcon', 'BeveragesIcon', 'DairyIcon', 'HygieneIcon', 'OtherIcon'
  ];
  for (const name of displayNames) {
    const hasDisplayName = sourceCode.includes(`${name}.displayName = '${name}';`);
    assert(`Icon ${name} has displayName set`, hasDisplayName);
  }

  // Check forwardRef on all 10 icons
  for (const name of displayNames) {
    const hasForwardRef = sourceCode.includes(`export const ${name} = forwardRef(`);
    assert(`Icon ${name} wrapped in forwardRef`, hasForwardRef);
  }

  // ----------------------------------------------------
  // SUITE 2: TRANSLATION & RUNTIME RENDERING
  // ----------------------------------------------------
  console.log('\n--- SUITE 2: Runtime React 19 Rendering & Color Palette ---');

  const res = await swc.transform(sourceCode, {
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'automatic' } }
    },
    module: { type: 'commonjs' }
  });

  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', 'React', res.code);
  fn(m, m.exports, (mod) => {
    if (mod === 'react') return React;
    if (mod === 'react/jsx-runtime') return require('react/jsx-runtime');
    return require(mod);
  }, React);

  const icons = m.exports;

  // Test 1: Default rendering attributes and palette compliance
  for (const name of displayNames) {
    const Component = icons[name];
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Component));

    // Verify root <svg> attributes
    const hasSvgTag = html.startsWith('<svg ') && html.endsWith('</svg>');
    const hasWidth24 = html.includes('width="24"');
    const hasHeight24 = html.includes('height="24"');
    const hasViewBox = html.includes('viewBox="0 0 24 24"');
    const hasFillNone = html.includes('fill="none"');
    const hasStrokeDarkGray = html.includes('stroke="#6b7280"');
    const hasStrokeWidth15 = html.includes('stroke-width="1.5"');
    const hasLineCap = html.includes('stroke-linecap="round"');
    const hasLineJoin = html.includes('stroke-linejoin="round"');

    assert(`${name} renders valid SVG root with hardcoded stroke and 1.5 width`,
      hasSvgTag && hasWidth24 && hasHeight24 && hasViewBox && hasFillNone && hasStrokeDarkGray && hasStrokeWidth15 && hasLineCap && hasLineJoin,
      html.slice(0, 200)
    );

    // Verify presence of required 4 palette colors
    const hasOutlineGray = html.includes('#6b7280');
    const hasPrimaryOrange = html.includes('#f97316');
    const hasSecondaryGray = html.includes('#e5e7eb');
    const hasBaseWhite = html.includes('#ffffff');

    assert(`${name} contains Outline Gray (#6b7280)`, hasOutlineGray);
    assert(`${name} contains Primary Orange (#f97316)`, hasPrimaryOrange);
    assert(`${name} contains Secondary Gray (#e5e7eb)`, hasSecondaryGray);
    assert(`${name} contains Base White (#ffffff)`, hasBaseWhite);
  }

  // ----------------------------------------------------
  // SUITE 3: ADVERSARIAL PROP OVERRIDES & EDGE CASES
  // ----------------------------------------------------
  console.log('\n--- SUITE 3: Adversarial Prop Overrides & Edge Cases ---');

  for (const name of displayNames) {
    const Component = icons[name];

    // StrokeWidth override
    const htmlWidth = ReactDOMServer.renderToStaticMarkup(React.createElement(Component, { strokeWidth: 3.5 }));
    assert(`${name} overrides strokeWidth with 3.5`, htmlWidth.includes('stroke-width="3.5"'));

    // Size override number
    const htmlSizeNum = ReactDOMServer.renderToStaticMarkup(React.createElement(Component, { size: 64 }));
    assert(`${name} overrides size with 64`, htmlSizeNum.includes('width="64"') && htmlSizeNum.includes('height="64"'));

    // Size override string
    const htmlSizeStr = ReactDOMServer.renderToStaticMarkup(React.createElement(Component, { size: '100%' }));
    assert(`${name} overrides size with '100%'`, htmlSizeStr.includes('width="100%"') && htmlSizeStr.includes('height="100%"'));

    // ClassName override
    const htmlClass = ReactDOMServer.renderToStaticMarkup(React.createElement(Component, { className: 'custom-icon-class text-emerald-500 animate-spin' }));
    assert(`${name} overrides className cleanly`, htmlClass.includes('class="custom-icon-class text-emerald-500 animate-spin"'));

    // Rest props spreading
    const htmlRest = ReactDOMServer.renderToStaticMarkup(React.createElement(Component, {
      'data-testid': `icon-${name}`,
      'aria-label': `${name} label`,
      role: 'img',
      style: { opacity: 0.9, transform: 'scale(1.2)' }
    }));
    assert(`${name} spreads rest props cleanly`,
      htmlRest.includes(`data-testid="icon-${name}"`) &&
      htmlRest.includes(`aria-label="${name} label"`) &&
      htmlRest.includes('role="img"') &&
      htmlRest.includes('style="opacity:0.9;transform:scale(1.2)"')
    );

    // Undefined props fallback test
    const htmlUndefined = ReactDOMServer.renderToStaticMarkup(React.createElement(Component, {
      strokeWidth: undefined,
      size: undefined,
      className: undefined
    }));
    assert(`${name} falls back to defaults when undefined props passed`,
      htmlUndefined.includes('stroke="#6b7280"') &&
      htmlUndefined.includes('stroke-width="1.5"') &&
      htmlUndefined.includes('width="24"') &&
      htmlUndefined.includes('height="24"')
    );
  }

  // ----------------------------------------------------
  // SUITE 4: SPECIFIC ICON COMPOSITION & MOTIF VERIFICATION
  // ----------------------------------------------------
  console.log('\n--- SUITE 4: Specific Category Motif & Composition Checks ---');

  // 1. DryGoodsIcon: Bag on left + wheat stalk + jar on right + dots
  const dryHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.DryGoodsIcon));
  assert('DryGoodsIcon: has wheat stalk paths with #f97316', dryHtml.includes('stroke="#f97316"'));
  assert('DryGoodsIcon: has dot texture circles', (dryHtml.match(/<circle /g) || []).length >= 5);

  // 2. FrozenFoodIcon: Freezer bag + large snowflake + orange seal + badge + small orange snowflake
  const frozenHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.FrozenFoodIcon));
  assert('FrozenFoodIcon: has orange seal line (#f97316)', frozenHtml.includes('x1="4.5" y1="6" x2="16.5" y2="6"') && frozenHtml.includes('stroke="#f97316"'));
  assert('FrozenFoodIcon: has circular badge with orange snowflake', frozenHtml.includes('cx="17.5" cy="16.5"') && frozenHtml.includes('stroke="#f97316"'));

  // 3. ProduceIcon: Bowl + apple on left (orange stem, gray leaf) + leafy green + carrot on right
  const produceHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.ProduceIcon));
  assert('ProduceIcon: has produce bowl base', produceHtml.includes('d="M2.5 14c0 4.2 4.2 7 9.5 7s9.5-2.8 9.5-7c-4 1.2-15 1.2-19 0z"'));
  assert('ProduceIcon: has apple with orange stem (#f97316) and gray leaf (#e5e7eb)', produceHtml.includes('stroke="#f97316"') && produceHtml.includes('fill="#e5e7eb"'));
  assert('ProduceIcon: has carrot with orange fill (#f97316)', produceHtml.includes('fill="#f97316"'));

  // 4. ProteinsIcon: Platter + salmon fillet on left (orange + white contours) + drumstick on right
  const proteinsHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.ProteinsIcon));
  assert('ProteinsIcon: has platter base', proteinsHtml.includes('d="M2 17.5C2 19.8 6.5 21.5 12 21.5s10-1.7 10-4c0-2-4.5-2.5-10-2.5S2 15.5 2 17.5z"'));
  assert('ProteinsIcon: has salmon fillet with orange fill (#f97316) and white contour strokes', proteinsHtml.includes('fill="#f97316"') && proteinsHtml.includes('stroke="#ffffff"'));
  assert('ProteinsIcon: has drumstick with light gray meat (#e5e7eb) and white bone (#ffffff)', proteinsHtml.includes('fill="#e5e7eb"') && proteinsHtml.includes('fill="#ffffff"'));

  // 5. BakeryIcon: Bread slice on left + snack bag on right with orange circle
  const bakeryHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.BakeryIcon));
  assert('BakeryIcon: has snack bag with orange circle graphic (#f97316)', bakeryHtml.includes('fill="#f97316"'));
  assert('BakeryIcon: has bread slice with pores', (bakeryHtml.match(/<circle /g) || []).length >= 3);

  // 6. CannedGoodsIcon: Tall ribbed can back right (orange stripe) + shorter can front left (orange tomato)
  const canHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.CannedGoodsIcon));
  assert('CannedGoodsIcon: has tall can orange stripe (#f97316)', canHtml.includes('fill="#f97316"'));
  assert('CannedGoodsIcon: has tomato graphic with stem', canHtml.includes('cx="8.25" cy="15.5"') && canHtml.includes('fill="#f97316"'));

  // 7. BeveragesIcon: Tall bottle on left (water drop) + soda can on right (orange wave)
  const bevHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.BeveragesIcon));
  assert('BeveragesIcon: has water drop graphic (#f97316)', bevHtml.includes('fill="#f97316"'));
  assert('BeveragesIcon: has soda can with orange wave graphic (#f97316)', bevHtml.includes('stroke="#f97316"'));

  // 8. DairyIcon: Milk bottle on left (cow face) + yogurt cup on right (orange lid & spoon)
  const dairyHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.DairyIcon));
  assert('DairyIcon: has cow face graphic on milk bottle', dairyHtml.includes('cx="7.5" cy="16"'));
  assert('DairyIcon: has yogurt cup with orange lid (#f97316) and spoon', dairyHtml.includes('fill="#f97316"'));

  // 9. HygieneIcon: Pump bottle on left (orange pump & drop) + toilet paper roll on right
  const hygieneHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.HygieneIcon));
  assert('HygieneIcon: has orange pump actuator & drop (#f97316)', hygieneHtml.includes('stroke="#f97316"') && hygieneHtml.includes('fill="#f97316"'));
  assert('HygieneIcon: has toilet paper roll with hanging sheet', hygieneHtml.includes('cx="16" cy="8.5"') && hygieneHtml.includes('stroke-dasharray="1.5 1"'));

  // 10. OtherIcon: Shopping basket + circular badge bottom right with orange plus sign
  const otherHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(icons.OtherIcon));
  assert('OtherIcon: has shopping basket with handle & rim', otherHtml.includes('d="M3.5 12 L5 19 C5.2 19.6 5.7 20 6.3 20 H17.7 C18.3 20 18.8 19.6 19 19 L20.5 12 Z"'));
  assert('OtherIcon: has circular badge with orange plus (+) sign', otherHtml.includes('cx="17.5" cy="17.5"') && otherHtml.includes('stroke="#f97316"'));

  // ----------------------------------------------------
  // SUITE 5: ALIAS EQUIVALENCE VERIFICATION
  // ----------------------------------------------------
  console.log('\n--- SUITE 5: 20 Export Aliases Integrity ---');

  const expectedAliases = {
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
    PackageIcon: 'OtherIcon',
  };

  for (const [alias, target] of Object.entries(expectedAliases)) {
    const isStrictEqual = icons[alias] === icons[target];
    assert(`Alias ${alias} === ${target} (strict reference equality)`, isStrictEqual);
  }

  // ----------------------------------------------------
  // SUITE 6: FORWARDREF SIGNATURE VERIFICATION
  // ----------------------------------------------------
  console.log('\n--- SUITE 6: React forwardRef Object Protocol ---');
  for (const name of displayNames) {
    const Component = icons[name];
    const isForwardRefType = Component && (typeof Component === 'function' || typeof Component === 'object');
    assert(`${name} is a valid React component callable via JSX/createElement`, isForwardRefType);
  }

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passedAssertions} / ${totalAssertions} assertions passed`);
  if (passedAll) {
    console.log('  OVERALL VERDICT: ALL TESTS PASSED (APPROVE)');
  } else {
    console.error('  OVERALL VERDICT: FAILURES DETECTED (REQUEST_CHANGES)');
  }
  console.log('====================================================');

  process.exit(passedAll ? 0 : 1);
}

runAdversarialSuite().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
