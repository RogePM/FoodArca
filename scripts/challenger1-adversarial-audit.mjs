import React, { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import * as Icons from '../components/ui/custom-icons.jsx';

console.log('======================================================================');
console.log('  CHALLENGER 1: ADVERSARIAL SVG & RENDERER COMPREHENSIVE TEST SUITE   ');
console.log('======================================================================\n');

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
    const errMsg = `[FAIL] ${description} ${detail ? `--> ${detail}` : ''}`;
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

const ALLOWED_HEX_COLORS = new Set([
  '#6b7280',
  '#595959',
  '#f97316',
  '#e5e7eb',
  '#d1d5db',
  '#ffffff',
  '#fff'
]);

// ----------------------------------------------------------------------
// 1. Module Exports & ForwardRef Audit
// ----------------------------------------------------------------------
console.log('>>> TEST SUITE 1: Module Exports & React forwardRef Structure');

for (const name of PRIMARY_ICONS) {
  const Comp = Icons[name];
  assert(Comp !== undefined, `Export exists for primary icon: ${name}`);
  assert(typeof Comp === 'object' || typeof Comp === 'function', `${name} is a valid React component`);
  assert(Comp?.displayName === name, `${name}.displayName is set to '${name}'`);
}

for (const [aliasName, targetName] of Object.entries(ALIASES)) {
  const AliasComp = Icons[aliasName];
  const TargetComp = Icons[targetName];
  assert(AliasComp !== undefined, `Export exists for alias: ${aliasName}`);
  assert(AliasComp === TargetComp, `Alias ${aliasName} strictly equals (${targetName})`);
}

// ----------------------------------------------------------------------
// 2. Source Code Static Audit
// ----------------------------------------------------------------------
console.log('\n>>> TEST SUITE 2: Source Code Static Pattern & Color Audit');

const sourcePath = path.resolve('components/ui/custom-icons.jsx');
const sourceCode = fs.readFileSync(sourcePath, 'utf8');

// Check for currentColor
const currentColorCount = (sourceCode.match(/currentColor/g) || []).length;
assert(currentColorCount === 0, `Zero occurrences of 'currentColor' in custom-icons.jsx (found: ${currentColorCount})`);

// Extract all hex colors in source code (excluding comment blocks or metadata headers)
const hexMatches = sourceCode.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
let invalidHexFound = [];
for (const hex of hexMatches) {
  const lowerHex = hex.toLowerCase();
  if (!ALLOWED_HEX_COLORS.has(lowerHex)) {
    invalidHexFound.push(hex);
  }
}
assert(
  invalidHexFound.length === 0,
  `Source code only contains permitted hex palette: ${[...ALLOWED_HEX_COLORS].join(', ')}`,
  invalidHexFound.length ? `Found disallowed hex: ${invalidHexFound.join(', ')}` : ''
);

// ----------------------------------------------------------------------
// 3. Rendered SVG Color & Attribute Audit
// ----------------------------------------------------------------------
console.log('\n>>> TEST SUITE 3: Rendered SVG Color & Stroke Audit');

for (const iconName of PRIMARY_ICONS) {
  const Comp = Icons[iconName];
  const rendered = renderToStaticMarkup(React.createElement(Comp));

  // Check for currentColor in rendered string
  assert(!rendered.includes('currentColor'), `${iconName} rendered output contains zero 'currentColor'`);

  // Extract all stroke="..." and fill="..." attributes
  const colorAttrRegex = /(?:stroke|fill)="([^"]+)"/g;
  let match;
  let iconInvalidColors = [];

  while ((match = colorAttrRegex.exec(rendered)) !== null) {
    const val = match[1].toLowerCase().trim();
    if (val === 'none') continue;
    if (!ALLOWED_HEX_COLORS.has(val)) {
      iconInvalidColors.push(val);
    }
  }

  assert(
    iconInvalidColors.length === 0,
    `${iconName} stroke and fill attributes use ONLY approved palette or 'none'`,
    iconInvalidColors.length ? `Disallowed attributes: ${iconInvalidColors.join(', ')}` : ''
  );

  // Check root svg stroke and strokeWidth
  assert(
    rendered.includes('stroke="#6b7280"') || rendered.includes('stroke="#595959"'),
    `${iconName} has root stroke="#6b7280" or "#595959"`
  );
  assert(
    rendered.includes('stroke-width="1.5"') || rendered.includes('stroke-width="2"'),
    `${iconName} has root stroke-width="1.5" or "2"`
  );
  assert(
    rendered.includes('stroke-linecap="round"'),
    `${iconName} has root stroke-linecap="round"`
  );
  assert(
    rendered.includes('stroke-linejoin="round"'),
    `${iconName} has root stroke-linejoin="round"`
  );
  assert(
    rendered.includes('viewBox="0 0 24 24"'),
    `${iconName} has root viewBox="0 0 24 24"`
  );

  // Check presence of white fill for background blocking
  assert(
    rendered.includes('fill="#ffffff"') || rendered.includes('fill="#fff"'),
    `${iconName} contains white base fill (#ffffff) for overlapping element occlusion`
  );

  // Check presence of orange accent (#f97316)
  assert(
    rendered.includes('#f97316'),
    `${iconName} contains brand orange accent (#f97316)`
  );
}

// ----------------------------------------------------------------------
// 4. Prop Flexibility & Stress Testing
// ----------------------------------------------------------------------
console.log('\n>>> TEST SUITE 4: Prop Flexibility, Scaling, ClassName, & Spread Props');

const SIZES = [16, 24, 32, 48, 64];

for (const iconName of PRIMARY_ICONS) {
  const Comp = Icons[iconName];

  // Test sizes
  for (const size of SIZES) {
    const html = renderToStaticMarkup(React.createElement(Comp, { size }));
    assert(
      html.includes(`width="${size}"`) && html.includes(`height="${size}"`),
      `${iconName} scales correctly with size=${size}`
    );
  }

  // Test strokeWidth override
  const customStrokeHtml = renderToStaticMarkup(React.createElement(Comp, { strokeWidth: 2.5 }));
  assert(
    customStrokeHtml.includes('stroke-width="2.5"'),
    `${iconName} accepts custom strokeWidth=2.5 override`
  );

  // Test custom className
  const customClass = 'w-10 h-10 custom-svg-class-test-xyz';
  const customClassHtml = renderToStaticMarkup(React.createElement(Comp, { className: customClass }));
  assert(
    customClassHtml.includes(`class="${customClass}"`),
    `${iconName} applies custom className correctly`
  );

  // Test prop spreading (data-testid, aria-*, role, id)
  const spreadProps = {
    'data-testid': `adversarial-test-${iconName}`,
    'data-category': 'test-category',
    'aria-label': `Accessible ${iconName}`,
    role: 'img',
    id: `custom-id-${iconName}`
  };
  const spreadHtml = renderToStaticMarkup(React.createElement(Comp, spreadProps));
  assert(
    spreadHtml.includes(`data-testid="adversarial-test-${iconName}"`) &&
    spreadHtml.includes('data-category="test-category"') &&
    spreadHtml.includes(`aria-label="Accessible ${iconName}"`) &&
    spreadHtml.includes('role="img"') &&
    spreadHtml.includes(`id="custom-id-${iconName}"`),
    `${iconName} passes spread props (...props) through to root <svg>`
  );

  // Test Ref attachment
  const ref = createRef();
  const elementWithRef = React.createElement(Comp, { ref });
  assert(elementWithRef.ref === ref, `${iconName} successfully attaches React forwardRef`);
}

// ----------------------------------------------------------------------
// 5. XML Well-Formedness & Strict Syntax Parser
// ----------------------------------------------------------------------
console.log('\n>>> TEST SUITE 5: SVG XML Well-Formedness & Syntax Validator');

function validateXml(xmlString, label) {
  const errors = [];
  const tagStack = [];

  // Match tags, comments, self-closing tags
  // Regex matches: <(/)?([a-zA-Z0-9_-]+)([^>]*?)(/)?>
  const tagRegex = /<(\/)?([a-zA-Z0-9_-]+)([\s\S]*?)(\/)?>/g;
  let match;
  let lastIndex = 0;

  while ((match = tagRegex.exec(xmlString)) !== null) {
    const isClosing = Boolean(match[1]);
    const tagName = match[2];
    const rawAttrs = match[3];
    const isSelfClosing = Boolean(match[4]);

    if (isClosing) {
      if (tagStack.length === 0) {
        errors.push(`Closing tag </${tagName}> found with empty stack`);
      } else {
        const top = tagStack.pop();
        if (top !== tagName) {
          errors.push(`Mismatched closing tag: expected </${top}>, found </${tagName}>`);
        }
      }
    } else if (!isSelfClosing) {
      tagStack.push(tagName);
    }

    // Validate attributes syntax
    if (rawAttrs.trim()) {
      // Check for unquoted attributes or malformed attributes
      const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
      let attrMatch;
      let parsedAttrString = '';
      while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
        const attrName = attrMatch[1];
        const doubleQuoted = attrMatch[2];
        const singleQuoted = attrMatch[3];
        const unquoted = attrMatch[4];

        if (unquoted !== undefined) {
          errors.push(`Unquoted attribute value on <${tagName}>: ${attrName}=${unquoted}`);
        }

        const attrVal = doubleQuoted !== undefined ? doubleQuoted : singleQuoted;
        if (attrVal && (attrVal.includes('NaN') || attrVal.includes('undefined') || attrVal.includes('null'))) {
          errors.push(`Invalid attribute value on <${tagName} ${attrName}="${attrVal}">`);
        }
      }
    }
  }

  if (tagStack.length > 0) {
    errors.push(`Unclosed tags remaining in stack: ${tagStack.join(', ')}`);
  }

  return errors;
}

// Validate all 10 primary icons and all 20 aliases
const ALL_COMPONENTS = { ...Icons };
for (const [name, Comp] of Object.entries(ALL_COMPONENTS)) {
  if (typeof Comp !== 'function' && typeof Comp !== 'object') continue;
  const html = renderToStaticMarkup(React.createElement(Comp));
  const errors = validateXml(html, name);
  assert(
    errors.length === 0,
    `${name} renders strictly valid, well-formed SVG XML markup`,
    errors.length ? errors.join('; ') : ''
  );
}

// ----------------------------------------------------------------------
// 6. Composition and Specific Semantic Features
// ----------------------------------------------------------------------
console.log('\n>>> TEST SUITE 6: Semantic Composition Feature Checks');

const compositionChecks = {
  DryGoodsIcon: {
    desc: 'Flour bag on left (wheat stalk) + glass jar with dots on right',
    test: (html) => html.includes('13.5') && html.includes('#f97316') && html.includes('rx="0.6"')
  },
  FrozenFoodIcon: {
    desc: 'Freezer bag with snowflake + orange seal + bottom-right snowflake badge',
    test: (html) => html.includes('cx="17.5"') && html.includes('cy="16.5"') && html.includes('stroke="#f97316"')
  },
  ProduceIcon: {
    desc: 'Bowl at bottom + apple left + leafy green center + orange carrot right',
    test: (html) => html.includes('#f97316') && html.includes('M2.5 14') && html.includes('#e5e7eb')
  },
  ProteinsIcon: {
    desc: 'Platter at bottom + salmon fillet with white contours + chicken drumstick',
    test: (html) => html.includes('M2 17.5') && html.includes('#f97316') && html.includes('#e5e7eb')
  },
  BakeryIcon: {
    desc: 'Bread slice on left + sealed snack bag with orange circle on right',
    test: (html) => html.includes('cx="16"') && html.includes('cy="12"') && html.includes('r="2.5"')
  },
  CannedGoodsIcon: {
    desc: 'Tall ribbed can back right + shorter can front left with orange tomato graphic',
    test: (html) => html.includes('cx="8.25"') && html.includes('cy="15.5"') && html.includes('#f97316')
  },
  BeveragesIcon: {
    desc: 'Tall bottle with water drop on left + shorter soda can with wave on right',
    test: (html) => html.includes('M7.25 12.5') && html.includes('M11 14.5') && html.includes('#f97316')
  },
  DairyIcon: {
    desc: 'Milk bottle with cow face on left + yogurt cup with orange lid & spoon on right',
    test: (html) => html.includes('cx="7.5"') && html.includes('cy="16"') && html.includes('M15.5 10.5')
  },
  HygieneIcon: {
    desc: 'Pump bottle with orange pump & drop on left + toilet paper roll on right',
    test: (html) => html.includes('M4 4.5') && html.includes('stroke-dasharray="1.5 1"') && html.includes('#f97316')
  },
  OtherIcon: {
    desc: 'Shopping basket with vertical slots + circular badge with orange plus sign',
    test: (html) => html.includes('cx="17.5"') && html.includes('cy="17.5"') && html.includes('x1="15"')
  }
};

for (const [iconName, check] of Object.entries(compositionChecks)) {
  const Comp = Icons[iconName];
  const html = renderToStaticMarkup(React.createElement(Comp));
  assert(check.test(html), `${iconName} matches expected composition (${check.desc})`);
}

// ----------------------------------------------------------------------
// Summary & Verdict
// ----------------------------------------------------------------------
console.log('\n======================================================================');
console.log('                          TEST SUMMARY                                ');
console.log('======================================================================');
console.log(`Total Assertions : ${totalTests}`);
console.log(`Passed Assertions: ${passedTests}`);
console.log(`Failed Assertions: ${failedTests}`);

const verdict = failedTests === 0 ? 'APPROVE' : 'REQUEST_CHANGES';
console.log(`\nFINAL VERDICT: ${verdict}`);
console.log('======================================================================\n');

if (failureDetails.length > 0) {
  console.error('Failure Details:');
  for (const fail of failureDetails) {
    console.error(`- ${fail}`);
  }
  process.exit(1);
} else {
  process.exit(0);
}
