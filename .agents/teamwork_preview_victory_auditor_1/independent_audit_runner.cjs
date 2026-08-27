const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const swc = require('next/dist/build/swc');

console.log('=== RUNNING INDEPENDENT VICTORY AUDIT TEST RUNNER ===\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passCount++;
  } else {
    failCount++;
    failures.push(message);
    console.error(`❌ FAIL: ${message}`);
  }
}

// 1. Helper to transpile and require module with cache
const moduleCache = {};
function loadModule(filePath, moduleAliases = {}) {
  const absPath = path.resolve(filePath);
  if (moduleCache[absPath]) return moduleCache[absPath];

  const code = fs.readFileSync(absPath, 'utf8');
  const transformed = swc.transformSync(code, {
    jsc: {
      parser: {
        syntax: 'ecmascript',
        jsx: true,
      },
      transform: {
        react: {
          runtime: 'classic',
        },
      },
      target: 'es2020',
    },
    module: {
      type: 'commonjs',
    },
  });

  const m = { exports: {} };
  moduleCache[absPath] = m.exports;

  const customRequire = (id) => {
    if (id === 'react') return React;
    if (id === 'react-dom/server') return ReactDOMServer;
    if (moduleAliases[id]) return moduleAliases[id];
    if (id.startsWith('@/components/ui/custom-icons')) {
      return loadModule(path.resolve(__dirname, '../../components/ui/custom-icons.jsx'));
    }
    if (id.startsWith('@/lib/constants')) {
      return loadModule(path.resolve(__dirname, '../../lib/constants.js'));
    }
    if (id === 'lucide-react') {
      return require('lucide-react');
    }
    try {
      return require(id);
    } catch (e) {
      return {};
    }
  };

  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', transformed.code);
  fn(m, m.exports, customRequire, path.dirname(absPath), absPath);
  moduleCache[absPath] = m.exports;
  return m.exports;
}

const customIconsPath = path.resolve(__dirname, '../../components/ui/custom-icons.jsx');
const constantsPath = path.resolve(__dirname, '../../lib/constants.js');

console.log('1. Checking file existence and physical properties...');
assert(fs.existsSync(customIconsPath), 'components/ui/custom-icons.jsx exists');
assert(fs.existsSync(constantsPath), 'lib/constants.js exists');

console.log('2. Transpiling and loading custom-icons.jsx...');
const customIcons = loadModule(customIconsPath);

// Required 10 category components
const REQUIRED_COMPONENTS = [
  'CannedGoodsIcon',
  'BeveragesIcon',
  'BakeryIcon',
  'ProduceIcon',
  'ProteinsIcon',
  'DairyIcon',
  'FrozenFoodIcon',
  'DryGoodsIcon',
  'HygieneIcon',
  'OtherIcon',
];

console.log('3. Validating required 10 component exports and React properties...');
for (const compName of REQUIRED_COMPONENTS) {
  const Comp = customIcons[compName];
  assert(typeof Comp === 'object' || typeof Comp === 'function', `${compName} is exported`);
  assert(Comp.$$typeof === Symbol.for('react.forward_ref') || typeof Comp === 'function', `${compName} is a valid React component / forwardRef`);
  assert(Comp.displayName === compName, `${compName} has displayName matching ${compName}`);

  // Render with default props
  const defaultHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp));
  assert(defaultHtml.startsWith('<svg'), `${compName} renders an <svg> tag`);
  assert(defaultHtml.includes('viewBox="0 0 24 24"'), `${compName} has viewBox="0 0 24 24"`);
  assert(defaultHtml.includes('width="24"') && defaultHtml.includes('height="24"'), `${compName} has default size 24`);
  assert(defaultHtml.includes('stroke="currentColor"'), `${compName} defaults stroke to "currentColor"`);
  assert(defaultHtml.includes('fill="none"'), `${compName} defaults fill to "none"`);
  assert(defaultHtml.includes('stroke-width="2"'), `${compName} defaults stroke-width to "2"`);
  assert(defaultHtml.includes('stroke-linecap="round"'), `${compName} defaults stroke-linecap to "round"`);
  assert(defaultHtml.includes('stroke-linejoin="round"'), `${compName} defaults stroke-linejoin to "round"`);
  assert(!defaultHtml.includes('NaN'), `${compName} markup contains no NaN values`);
  assert(!defaultHtml.includes('undefined'), `${compName} markup contains no undefined attributes`);

  // Render with custom props (size, strokeWidth, color, className, data-testid, aria-label)
  const customProps = {
    size: 32,
    strokeWidth: 1.5,
    color: '#ff5500',
    className: 'w-8 h-8 text-blue-700 custom-test-class',
    'data-testid': `test-${compName}`,
    'aria-label': compName,
  };
  const customHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, customProps));
  assert(customHtml.includes('width="32"'), `${compName} accepts custom size 32 (width)`);
  assert(customHtml.includes('height="32"'), `${compName} accepts custom size 32 (height)`);
  assert(customHtml.includes('stroke-width="1.5"'), `${compName} accepts custom strokeWidth 1.5`);
  assert(customHtml.includes('stroke="#ff5500"'), `${compName} accepts custom stroke color`);
  assert(customHtml.includes('class="w-8 h-8 text-blue-700 custom-test-class"'), `${compName} inherits Tailwind className`);
  assert(customHtml.includes('data-testid="test-'), `${compName} passes data-testid`);
  assert(customHtml.includes('aria-label="'), `${compName} passes aria-label`);

  // Test ref attachment
  const ref = React.createRef();
  const refElement = React.createElement(Comp, { ref, id: `ref-${compName}` });
  const refHtml = ReactDOMServer.renderToStaticMarkup(refElement);
  assert(refHtml.includes(`id="ref-${compName}"`), `${compName} renders cleanly with attached React ref`);

  // Test dynamic strokeWidth (e.g. form-view isSelected ? 2.5 : 1.5)
  const selectedHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { strokeWidth: 2.5, className: 'text-white' }));
  assert(selectedHtml.includes('stroke-width="2.5"'), `${compName} accepts dynamic bold strokeWidth 2.5`);
  assert(selectedHtml.includes('class="text-white"'), `${compName} accepts selected text-white class`);
}

console.log('4. Validating category-specific visual icon metaphors...');
// CannedGoods: Tin can (body + rim + ribs + pull-tab)
const cannedHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(customIcons.CannedGoodsIcon));
assert(cannedHtml.includes('<ellipse') && cannedHtml.includes('<path'), 'CannedGoodsIcon has ellipse rim and path body/ribs');

// Beverages: Water Bottle / Jug (cap + neck + wave)
const bevHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(customIcons.BeveragesIcon));
assert(bevHtml.includes('M10 2h4v2.5h-4z') || bevHtml.includes('M10 4.5'), 'BeveragesIcon has bottle cap and contour');

// Bakery: Loaf of Bread (crust + score slashes)
const bakeryHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(customIcons.BakeryIcon));
assert(bakeryHtml.includes('M7 10l2 4') || bakeryHtml.includes('14.5'), 'BakeryIcon has loaf contour and score slashes');

// Produce: Apple (stem + leaf + apple body)
const produceHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(customIcons.ProduceIcon));
assert(produceHtml.includes('M12 7.5') && produceHtml.includes('M13.5 4.5'), 'ProduceIcon has apple stem and leaf');

// Proteins: Roasted chicken leg / steak (drumstick bulb + knuckle bone)
const proteinHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(customIcons.ProteinsIcon));
assert(proteinHtml.includes('15.4 4.2') && proteinHtml.includes('14.5'), 'ProteinsIcon has drumstick bulb and knuckle');

// Dairy: Gable-top milk carton (gable roof + carton body + milk drop)
const dairyHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(customIcons.DairyIcon));
assert(dairyHtml.includes('M8 2h8v2.5H8z') && dairyHtml.includes('M12 11.5'), 'DairyIcon has gable roof and milk droplet');

// Frozen Food: Snowflake crystal (6-branch axes + chevrons + core)
const frozenHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(customIcons.FrozenFoodIcon));
assert(frozenHtml.includes('M12 2v20') && frozenHtml.includes('<circle'), 'FrozenFoodIcon has multi-axis snowflake crystal and center core');

// Dry Goods: Burlap grain sack (ruffle top + tie + sack body + grain stalk)
const dryHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(customIcons.DryGoodsIcon));
assert(dryHtml.includes('M8.5 2.5') && dryHtml.includes('M12 11v7'), 'DryGoodsIcon has burlap ruffle top, tie, and grain stalk');

// Hygiene: Soap bar (soap body + bubbles + contour)
const hygieneHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(customIcons.HygieneIcon));
assert(hygieneHtml.includes('<rect') && hygieneHtml.includes('<circle'), 'HygieneIcon has soap bar rect and circular suds/bubbles');

// Other: Cardboard parcel box (isometric contour + top seams + tape line + label)
const otherHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(customIcons.OtherIcon));
assert(otherHtml.includes('21 8a2 2 0 0 0-1-1.73') && otherHtml.includes('M12 22V12'), 'OtherIcon has isometric parcel box contour and seams');

console.log('5. Validating alias exports in custom-icons.jsx...');
const EXPECTED_ALIASES = [
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
  ['PackageIcon', 'OtherIcon'],
];

for (const [alias, canonical] of EXPECTED_ALIASES) {
  assert(customIcons[alias] === customIcons[canonical], `Alias ${alias} references ${canonical}`);
}

console.log('6. Validating lib/constants.js wiring...');
const constants = loadModule(constantsPath);

assert(Array.isArray(constants.categories), 'constants.categories is an array');
assert(constants.categories.length === 10, `constants.categories has length 10 (got ${constants.categories.length})`);

const EXPECTED_CATEGORIES = [
  { value: 'dry_goods', name: 'Dry Goods', icon: customIcons.DryGoodsIcon, text: 'text-orange-700' },
  { value: 'frozen_food', name: 'Frozen Food', icon: customIcons.FrozenFoodIcon, text: 'text-cyan-700' },
  { value: 'produce', name: 'Produce', icon: customIcons.ProduceIcon, text: 'text-emerald-700' },
  { value: 'proteins', name: 'Proteins', icon: customIcons.ProteinsIcon, text: 'text-rose-700' },
  { value: 'bakery_snacks', name: 'Bakery & Snacks', icon: customIcons.BakeryIcon, text: 'text-yellow-700' },
  { value: 'canned_goods', name: 'Canned Goods', icon: customIcons.CannedGoodsIcon, text: 'text-stone-700' },
  { value: 'beverages', name: 'Beverages', icon: customIcons.BeveragesIcon, text: 'text-blue-700' },
  { value: 'dairy', name: 'Dairy', icon: customIcons.DairyIcon, text: 'text-indigo-700' },
  { value: 'hygiene', name: 'Hygiene', icon: customIcons.HygieneIcon, text: 'text-teal-700' },
  { value: 'other', name: 'Other', icon: customIcons.OtherIcon, text: 'text-gray-700' },
];

for (const exp of EXPECTED_CATEGORIES) {
  const found = constants.categories.find(c => c.value === exp.value);
  assert(!!found, `Category ${exp.value} exists in constants.categories`);
  if (found) {
    assert(found.name === exp.name, `Category ${exp.value} has name "${exp.name}"`);
    assert(found.icon === exp.icon, `Category ${exp.value} has correct custom icon wired`);
    assert(found.style && found.style.text === exp.text, `Category ${exp.value} has expected text style "${exp.text}"`);
    assert(found.style.bg && found.style.border && found.style.badge, `Category ${exp.value} has full style definition`);

    // Verify rendering category icon with category style
    const renderedCatIcon = ReactDOMServer.renderToStaticMarkup(
      React.createElement(found.icon, { className: found.style.text })
    );
    assert(renderedCatIcon.includes(`class="${exp.text}"`), `Category ${exp.value} icon correctly applies Tailwind color class "${exp.text}"`);
  }
}

console.log('7. Validating helper functions in lib/constants.js...');
assert(typeof constants.getCategoryStyle === 'function', 'getCategoryStyle is a function');
assert(typeof constants.getCategoryName === 'function', 'getCategoryName is a function');

// Test known values
for (const exp of EXPECTED_CATEGORIES) {
  const style = constants.getCategoryStyle(exp.value);
  const name = constants.getCategoryName(exp.value);
  assert(style && style.text === exp.text, `getCategoryStyle('${exp.value}') returns style with text '${exp.text}'`);
  assert(name === exp.name, `getCategoryName('${exp.value}') returns '${exp.name}'`);

  // Test uppercase / mixed case
  const styleUpper = constants.getCategoryStyle(exp.value.toUpperCase());
  const nameUpper = constants.getCategoryName(exp.value.toUpperCase());
  assert(styleUpper && styleUpper.text === exp.text, `getCategoryStyle('${exp.value.toUpperCase()}') handles case insensitivity`);
  assert(nameUpper === exp.name, `getCategoryName('${exp.value.toUpperCase()}') handles case insensitivity`);
}

// Test unknown/fallback values
const fallbackStyle = constants.getCategoryStyle('non_existent_category');
const otherStyle = constants.categories.find(c => c.value === 'other').style;
assert(JSON.stringify(fallbackStyle) === JSON.stringify(otherStyle), "getCategoryStyle fallback returns 'other' style");

const fallbackName = constants.getCategoryName('Custom Unmapped');
assert(fallbackName === 'Custom Unmapped', "getCategoryName('Custom Unmapped') returns original value 'Custom Unmapped'");

const nullName = constants.getCategoryName(null);
assert(nullName === 'Other', "getCategoryName(null) returns 'Other'");

const undefinedName = constants.getCategoryName(undefined);
assert(undefinedName === 'Other', "getCategoryName(undefined) returns 'Other'");

console.log('8. Validating codebase has no lingering generic Lucide category imports in lib/constants.js...');
const constantsRaw = fs.readFileSync(constantsPath, 'utf8');
const obsoleteLucideIcons = ['Archive', 'Croissant', 'Cylinder', 'Beef', 'GlassWater', 'BookXIcon', 'MilkIcon', 'Bubbles'];
for (const iconName of obsoleteLucideIcons) {
  assert(!constantsRaw.includes(iconName), `lib/constants.js does not contain obsolete Lucide import ${iconName}`);
}

console.log(`\n=== AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);

if (failCount > 0) {
  console.error('\nFailures:\n' + failures.join('\n'));
  process.exit(1);
} else {
  console.log('\n✅ ALL INDEPENDENT ASSERTIONS PASSED CLEANLY.');
  process.exit(0);
}
