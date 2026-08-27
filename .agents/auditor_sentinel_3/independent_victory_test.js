const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('VICTORY AUDITOR INDEPENDENT VERIFICATION TEST SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${name}`);
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${name}`);
    console.error(`         Error: ${err.message}`);
    throw err;
  }
}

const projectRoot = path.resolve(__dirname, '../..');
const customIconsPath = path.join(projectRoot, 'components/ui/custom-icons.jsx');
const constantsPath = path.join(projectRoot, 'lib/constants.js');

// ==========================================
// 1. FILE EXISTENCE & STAT CHECKS
// ==========================================
console.log('--- Phase 1: File Existence & Basic Structure ---');

test('components/ui/custom-icons.jsx exists and has content', () => {
  assert.ok(fs.existsSync(customIconsPath), 'custom-icons.jsx must exist');
  const stats = fs.statSync(customIconsPath);
  assert.ok(stats.size > 2000, `File size should be substantial (actual: ${stats.size} bytes)`);
});

test('lib/constants.js exists and has content', () => {
  assert.ok(fs.existsSync(constantsPath), 'constants.js must exist');
  const stats = fs.statSync(constantsPath);
  assert.ok(stats.size > 1000, `File size should be substantial (actual: ${stats.size} bytes)`);
});

const customIconsCode = fs.readFileSync(customIconsPath, 'utf8');
const constantsCode = fs.readFileSync(constantsPath, 'utf8');

// ==========================================
// 2. CUSTOM ICONS AST & CODE INSPECTION
// ==========================================
console.log('\n--- Phase 2: Custom Icons SVG Verification ---');

const requiredIcons = [
  { name: 'CannedGoodsIcon', category: 'Canned Goods', features: ['ellipse', 'path', 'lid', 'ribbed'] },
  { name: 'BeveragesIcon', category: 'Beverages', features: ['Cap', 'silhouette', 'wave', 'grip'] },
  { name: 'BakeryIcon', category: 'Bakery & Snacks', features: ['Loaf', 'score', 'crust'] },
  { name: 'ProduceIcon', category: 'Produce', features: ['stem', 'leaf', 'cleft', 'Apple'] },
  { name: 'ProteinsIcon', category: 'Proteins', features: ['meat', 'bone', 'Drumstick'] },
  { name: 'DairyIcon', category: 'Dairy', features: ['Seal', 'Roof', 'Carton', 'Drop'] },
  { name: 'FrozenFoodIcon', category: 'Frozen Food', features: ['Snowflake', 'Chevrons', 'Axes', 'Core'] },
  { name: 'DryGoodsIcon', category: 'Dry Goods', features: ['Sack', 'Ruffle', 'Tie', 'Wheat'] },
  { name: 'HygieneIcon', category: 'Hygiene', features: ['Soap', 'Bubbles', 'Bevel'] },
  { name: 'OtherIcon', category: 'Other', features: ['Box', 'Seam', 'Corner', 'Label'] },
];

requiredIcons.forEach(iconDef => {
  test(`Icon export '${iconDef.name}' is defined as forwardRef component with detailed paths`, () => {
    assert.ok(
      customIconsCode.includes(`export const ${iconDef.name} = forwardRef(`),
      `custom-icons.jsx must export ${iconDef.name} wrapped in forwardRef`
    );
    assert.ok(
      customIconsCode.includes(`${iconDef.name}.displayName = '${iconDef.name}';`),
      `${iconDef.name} must have displayName set`
    );
  });
});

test('All 10 icons use currentColor for stroke or fill', () => {
  const matches = customIconsCode.match(/color\s*=\s*['"]currentColor['"]/g);
  assert.ok(matches && matches.length >= 10, `Expected at least 10 default color='currentColor' definitions, found ${matches ? matches.length : 0}`);
  
  const strokeMatches = customIconsCode.match(/stroke=\{color\}/g);
  assert.ok(strokeMatches && strokeMatches.length >= 10, `Expected at least 10 stroke={color} bindings, found ${strokeMatches ? strokeMatches.length : 0}`);
});

test('All 10 icons use viewBox="0 0 24 24" and default size=24, strokeWidth=2', () => {
  const viewBoxMatches = customIconsCode.match(/viewBox="0 0 24 24"/g);
  assert.ok(viewBoxMatches && viewBoxMatches.length >= 10, `Expected at least 10 viewBox="0 0 24 24" definitions, found ${viewBoxMatches ? viewBoxMatches.length : 0}`);

  const sizeMatches = customIconsCode.match(/size\s*=\s*24/g);
  assert.ok(sizeMatches && sizeMatches.length >= 10, `Expected at least 10 size = 24 defaults, found ${sizeMatches ? sizeMatches.length : 0}`);

  const strokeWidthMatches = customIconsCode.match(/strokeWidth\s*=\s*2\b/g);
  assert.ok(strokeWidthMatches && strokeWidthMatches.length >= 10, `Expected at least 10 strokeWidth = 2 defaults, found ${strokeWidthMatches ? strokeWidthMatches.length : 0}`);
});

test('All 10 icons accept className and spread ...props', () => {
  const classNameMatches = customIconsCode.match(/className=\{className\}/g);
  assert.ok(classNameMatches && classNameMatches.length >= 10, `Expected at least 10 className={className} bindings, found ${classNameMatches ? classNameMatches.length : 0}`);

  const propsSpreadMatches = customIconsCode.match(/\{\.\.\.props\}/g);
  assert.ok(propsSpreadMatches && propsSpreadMatches.length >= 10, `Expected at least 10 {...props} spreads, found ${propsSpreadMatches ? propsSpreadMatches.length : 0}`);
});

test('Semantic aliases are exported for convenience and compatibility', () => {
  const expectedAliases = [
    'CanIcon', 'TinCanIcon',
    'WaterBottleIcon', 'BottleIcon',
    'BreadIcon', 'BakerySnacksIcon', 'LoafBreadIcon',
    'AppleIcon', 'FruitVegIcon',
    'ChickenLegIcon', 'DrumstickIcon', 'SteakIcon',
    'MilkCartonIcon',
    'SnowflakeIcon',
    'GrainSackIcon', 'SackIcon',
    'SoapIcon', 'SoapBubblesIcon',
    'BoxIcon', 'PackageIcon'
  ];

  expectedAliases.forEach(alias => {
    assert.ok(
      customIconsCode.includes(`export const ${alias} = `),
      `custom-icons.jsx should export alias ${alias}`
    );
  });
});

// ==========================================
// 3. CONSTANTS.JS WIRING INSPECTION
// ==========================================
console.log('\n--- Phase 3: lib/constants.js Wiring Verification ---');

test('lib/constants.js imports custom icons from @/components/ui/custom-icons', () => {
  assert.ok(
    constantsCode.includes("from '@/components/ui/custom-icons'"),
    "constants.js must import from '@/components/ui/custom-icons'"
  );
  requiredIcons.forEach(iconDef => {
    assert.ok(
      constantsCode.includes(iconDef.name),
      `constants.js must import ${iconDef.name}`
    );
  });
});

test('lib/constants.js does not import generic Lucide category icons in categories list', () => {
  const genericCategoryIcons = ['Cylinder', 'GlassWater', 'Croissant', 'Beef', 'MilkIcon', 'Bubbles', 'BookXIcon'];
  genericCategoryIcons.forEach(iconName => {
    const importRegex = new RegExp(`\\b${iconName}\\b.*from\\s*['"]lucide-react['"]`, 's');
    assert.ok(!importRegex.test(constantsCode), `constants.js should not import generic Lucide icon ${iconName}`);
  });
});

test('lib/constants.js categories array maps all 10 categories to their respective custom icons', () => {
  const categoryIconMapping = {
    'dry_goods': 'DryGoodsIcon',
    'frozen_food': 'FrozenFoodIcon',
    'produce': 'ProduceIcon',
    'proteins': 'ProteinsIcon',
    'bakery_snacks': 'BakeryIcon',
    'canned_goods': 'CannedGoodsIcon',
    'beverages': 'BeveragesIcon',
    'dairy': 'DairyIcon',
    'hygiene': 'HygieneIcon',
    'other': 'OtherIcon'
  };

  Object.entries(categoryIconMapping).forEach(([categoryValue, expectedIcon]) => {
    const regex = new RegExp(`value:\\s*['"]${categoryValue}['"].*?icon:\\s*${expectedIcon}|icon:\\s*${expectedIcon}.*?value:\\s*['"]${categoryValue}['"]`, 's');
    assert.ok(
      regex.test(constantsCode),
      `Category '${categoryValue}' must use '${expectedIcon}' in constants.js`
    );
  });
});

// ==========================================
// 4. RUNTIME REACT RENDERING VERIFICATION
// ==========================================
console.log('\n--- Phase 4: Runtime React Rendering & Prop Forwarding ---');

const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Transpile / evaluate custom-icons using next's compiled babel
const babel = require('next/dist/compiled/babel/core');
const reactPreset = require('next/dist/compiled/babel/preset-react');
const envPreset = require('next/dist/compiled/babel/preset-env');
const transformedCustomIcons = babel.transformSync(customIconsCode, {
  presets: [envPreset, reactPreset],
  filename: 'custom-icons.jsx'
});

const moduleExports = {};
const moduleScope = {
  exports: moduleExports,
  require: require,
  React: React,
  forwardRef: React.forwardRef,
};

const runFn = new Function('module', 'exports', 'require', 'React', 'forwardRef', transformedCustomIcons.code);
runFn({ exports: moduleExports }, moduleExports, require, React, React.forwardRef);

requiredIcons.forEach(iconDef => {
  test(`Runtime render: <${iconDef.name} /> produces valid SVG with default attributes`, () => {
    const Comp = moduleExports[iconDef.name];
    assert.ok(Comp, `${iconDef.name} must be exported in evaluated module`);
    
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp));
    assert.ok(html.startsWith('<svg'), `${iconDef.name} must render an <svg> tag`);
    assert.ok(html.includes('viewBox="0 0 24 24"'), `${iconDef.name} must have viewBox="0 0 24 24"`);
    assert.ok(html.includes('width="24"'), `${iconDef.name} must default width to 24`);
    assert.ok(html.includes('height="24"'), `${iconDef.name} must default height to 24`);
    assert.ok(html.includes('stroke="currentColor"'), `${iconDef.name} must default stroke to currentColor`);
    assert.ok(html.includes('stroke-width="2"'), `${iconDef.name} must default stroke-width to 2`);
    assert.ok(html.includes('fill="none"'), `${iconDef.name} must default fill to none`);
  });

  test(`Runtime render: <${iconDef.name} /> respects custom props (className, size, strokeWidth, color, aria-*)`, () => {
    const Comp = moduleExports[iconDef.name];
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Comp, {
        className: 'w-8 h-8 text-blue-700 custom-class',
        size: 32,
        strokeWidth: 3,
        color: '#ff5500',
        'aria-hidden': 'true',
        'data-testid': `test-${iconDef.name}`
      })
    );

    assert.ok(html.includes('class="w-8 h-8 text-blue-700 custom-class"'), `${iconDef.name} must forward className`);
    assert.ok(html.includes('width="32"'), `${iconDef.name} must respect custom size for width`);
    assert.ok(html.includes('height="32"'), `${iconDef.name} must respect custom size for height`);
    assert.ok(html.includes('stroke="#ff5500"'), `${iconDef.name} must respect custom color for stroke`);
    assert.ok(html.includes('stroke-width="3"'), `${iconDef.name} must respect custom strokeWidth`);
    assert.ok(html.includes('aria-hidden="true"'), `${iconDef.name} must spread aria attributes`);
    assert.ok(html.includes(`data-testid="test-${iconDef.name}"`), `${iconDef.name} must spread data attributes`);
  });

  test(`Runtime render: <${iconDef.name} /> contains non-trivial geometry paths (no stubs)`, () => {
    const Comp = moduleExports[iconDef.name];
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp));
    
    // Check that inside svg there are paths / ellipses / rects / circles with actual coordinates
    const geometryCount = (html.match(/<(path|ellipse|circle|rect|line|polyline|polygon)\b/g) || []).length;
    assert.ok(geometryCount >= 3, `${iconDef.name} must contain at least 3 distinct vector geometry elements (actual: ${geometryCount})`);
    
    // Ensure no empty stub
    assert.ok(!html.includes('d=""'), `${iconDef.name} must not contain empty path data`);
  });
});

// ==========================================
// 5. CONSTANTS LOGIC & RUNTIME COMPATIBILITY
// ==========================================
console.log('\n--- Phase 5: constants.js Logic & Runtime Evaluation ---');

// Transform constants.js to test runtime helper functions
const transformedConstants = babel.transformSync(constantsCode, {
  presets: [envPreset, reactPreset],
  filename: 'constants.js'
});

const constantsExports = {};
const constantsRunFn = new Function('module', 'exports', 'require', 'React', transformedConstants.code);

// Mock lucide icons and custom-icons in require resolver
const customRequire = (id) => {
  if (id === '@/components/ui/custom-icons') {
    return moduleExports;
  }
  if (id === 'lucide-react') {
    // Return dummy components for other icons
    const dummyIcon = (name) => {
      const c = (props) => React.createElement('svg', props);
      c.displayName = name;
      return c;
    };
    return new Proxy({}, {
      get: (target, prop) => dummyIcon(prop)
    });
  }
  return require(id);
};

constantsRunFn({ exports: constantsExports }, constantsExports, customRequire, React);

test('constants.categories array has exactly 10 categories', () => {
  assert.strictEqual(constantsExports.categories.length, 10, 'categories must have length 10');
});

test('All categories in constants.categories have valid React icon components', () => {
  constantsExports.categories.forEach(cat => {
    assert.ok(typeof cat.icon === 'object' || typeof cat.icon === 'function', `Category ${cat.name} icon must be a valid React component`);
    const rendered = ReactDOMServer.renderToStaticMarkup(React.createElement(cat.icon, { className: cat.style.text }));
    assert.ok(rendered.startsWith('<svg'), `Category ${cat.name} icon must render SVG`);
    assert.ok(rendered.includes(cat.style.text), `Category ${cat.name} icon must inherit style.text class`);
  });
});

test('getCategoryStyle helper returns correct styles for all categories and fallback', () => {
  constantsExports.categories.forEach(cat => {
    const style = constantsExports.getCategoryStyle(cat.value);
    assert.deepStrictEqual(style, cat.style, `getCategoryStyle('${cat.value}') must return matching style`);
    
    const uppercaseStyle = constantsExports.getCategoryStyle(cat.value.toUpperCase());
    assert.deepStrictEqual(uppercaseStyle, cat.style, `getCategoryStyle('${cat.value.toUpperCase()}') should be case-insensitive`);
  });

  const unknownStyle = constantsExports.getCategoryStyle('unknown_value');
  const otherStyle = constantsExports.categories.find(c => c.value === 'other').style;
  assert.deepStrictEqual(unknownStyle, otherStyle, 'getCategoryStyle with unknown value must fallback to other style');
});

test('getCategoryName helper returns correct names for all categories and fallback', () => {
  constantsExports.categories.forEach(cat => {
    const name = constantsExports.getCategoryName(cat.value);
    assert.strictEqual(name, cat.name, `getCategoryName('${cat.value}') must return matching name`);
  });

  const unknownName = constantsExports.getCategoryName('non_existent');
  assert.strictEqual(unknownName, 'non_existent', 'getCategoryName with unknown value should return the value string');
});

console.log('\n====================================================');
console.log(`AUDIT RESULTS: ${passedTests}/${totalTests} TESTS PASSED WITH ZERO FAILURES`);
console.log('====================================================\n');
