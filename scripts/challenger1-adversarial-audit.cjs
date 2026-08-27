/**
 * Challenger 1: Comprehensive Adversarial SVG & Renderer Test Suite
 *
 * Target: components/ui/custom-icons.jsx
 *
 * Requirements Tested:
 * 1. 10 primary icon exports + 20 aliases (all exported, correct displayName, forwardRef, reference equality)
 * 2. Color Audit:
 *    - Zero occurrences of 'currentColor' in source code and rendered markup
 *    - Only allowed palette used: #6b7280, #595959, #f97316, #e5e7eb, #d1d5db, #ffffff, or 'none'
 *    - Required colors present: Brand Orange (#f97316), Outline Gray (#6b7280/#595959), Base White (#ffffff), Light Gray (#e5e7eb/#d1d5db)
 * 3. Stroke Audit:
 *    - Root <svg> strokeWidth default is 1.5 or 2
 *    - Root <svg> strokeLinecap="round" and strokeLinejoin="round"
 *    - Root stroke color is #6b7280 or #595959
 * 4. ViewBox & Dimensions:
 *    - Root <svg> viewBox="0 0 24 24"
 *    - Default width="24" height="24"
 * 5. Prop Flexibility:
 *    - Varied sizes: 16, 24, 32, 48, 64
 *    - Custom strokeWidth overrides: e.g. 2.5
 *    - Custom className strings
 *    - Custom spread props: data-testid, data-*, aria-*, role, id
 *    - React forwardRef attachment
 * 6. SVG XML Well-Formedness:
 *    - Strict tag matching, nesting stack, quoted attributes, zero NaN/undefined/null coordinates
 * 7. Compositions:
 *    - 10 distinct category compositions matching the visual reference prompt
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const swc = require('next/dist/build/swc');

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

async function runAdversarialSuite() {
  // Transpile custom-icons.jsx
  await swc.loadBindings();
  const sourcePath = path.resolve('components/ui/custom-icons.jsx');
  const sourceCode = fs.readFileSync(sourcePath, 'utf8');

  const transformed = await swc.transform(sourceCode, {
    module: { type: 'commonjs' },
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'classic' } }
    }
  });

  const customIconsModule = { exports: {} };
  const moduleRunner = vm.runInThisContext(
    '(function(exports, require, module, __filename, __dirname, React) {\n' +
      transformed.code +
      '\n})'
  );
  moduleRunner(
    customIconsModule.exports,
    require,
    customIconsModule,
    sourcePath,
    path.dirname(sourcePath),
    React
  );

  const Icons = customIconsModule.exports;

  // ----------------------------------------------------------------------
  // 1. Module Exports & ForwardRef Audit
  // ----------------------------------------------------------------------
  console.log('>>> TEST SUITE 1: Module Exports & React forwardRef Structure');

  for (const name of PRIMARY_ICONS) {
    const Comp = Icons[name];
    assert(Comp !== undefined, `Primary icon exported: ${name}`);
    assert(typeof Comp === 'object' || typeof Comp === 'function', `${name} is a valid React component`);
    assert(Comp?.displayName === name, `${name}.displayName is '${name}'`);
    assert(
      Comp?.$$typeof === Symbol.for('react.forward_ref') || typeof Comp?.render === 'function',
      `${name} is wrapped with React.forwardRef`
    );
  }

  for (const [aliasName, targetName] of Object.entries(ALIASES)) {
    const AliasComp = Icons[aliasName];
    const TargetComp = Icons[targetName];
    assert(AliasComp !== undefined, `Alias exported: ${aliasName}`);
    assert(AliasComp === TargetComp, `Alias ${aliasName} strictly equals target (${targetName})`);
  }

  const allExportKeys = Object.keys(Icons);
  assert(
    allExportKeys.length === 30,
    `Total export count is exactly 30 (10 primary + 20 aliases). Found: ${allExportKeys.length}`
  );

  // ----------------------------------------------------------------------
  // 2. Source Code Static Audit
  // ----------------------------------------------------------------------
  console.log('\n>>> TEST SUITE 2: Source Code Static Pattern & Color Audit');

  const currentColorCount = (sourceCode.match(/currentColor/g) || []).length;
  assert(
    currentColorCount === 0,
    `Zero occurrences of 'currentColor' in custom-icons.jsx (found: ${currentColorCount})`
  );

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
  // 3. Rendered SVG Color & Stroke Audit
  // ----------------------------------------------------------------------
  console.log('\n>>> TEST SUITE 3: Rendered SVG Color & Stroke Audit');

  for (const iconName of PRIMARY_ICONS) {
    const Comp = Icons[iconName];
    const rendered = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp));

    // Zero currentColor
    assert(!rendered.includes('currentColor'), `${iconName} rendered SVG contains zero 'currentColor'`);

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

    // Root svg stroke color
    assert(
      rendered.includes('stroke="#6b7280"') || rendered.includes('stroke="#595959"'),
      `${iconName} has root stroke="#6b7280" or "#595959"`
    );

    // Root strokeWidth
    assert(
      rendered.includes('stroke-width="1.5"') || rendered.includes('stroke-width="2"'),
      `${iconName} has root stroke-width="1.5" or "2"`
    );

    // Root strokeLinecap & strokeLinejoin
    assert(
      rendered.includes('stroke-linecap="round"'),
      `${iconName} has root stroke-linecap="round"`
    );
    assert(
      rendered.includes('stroke-linejoin="round"'),
      `${iconName} has root stroke-linejoin="round"`
    );

    // Root viewBox
    assert(
      rendered.includes('viewBox="0 0 24 24"'),
      `${iconName} has root viewBox="0 0 24 24"`
    );

    // White base fill for overlapping occlusion
    assert(
      rendered.includes('fill="#ffffff"') || rendered.includes('fill="#fff"'),
      `${iconName} contains white base fill (#ffffff) for overlapping element occlusion`
    );

    // Primary orange accent
    assert(
      rendered.includes('#f97316'),
      `${iconName} contains brand orange accent (#f97316)`
    );

    // Secondary fill shading
    assert(
      rendered.includes('#e5e7eb') || rendered.includes('#d1d5db'),
      `${iconName} contains secondary light-gray shading fill (#e5e7eb or #d1d5db)`
    );
  }

  // ----------------------------------------------------------------------
  // 4. Prop Flexibility & Stress Testing
  // ----------------------------------------------------------------------
  console.log('\n>>> TEST SUITE 4: Prop Flexibility, Scaling, ClassName, & Spread Props');

  const SIZES = [16, 24, 32, 48, 64];

  for (const iconName of PRIMARY_ICONS) {
    const Comp = Icons[iconName];

    // Varied sizes
    for (const size of SIZES) {
      const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { size }));
      assert(
        html.includes(`width="${size}"`) && html.includes(`height="${size}"`),
        `${iconName} scales accurately with size=${size}`
      );
    }

    // Custom strokeWidth override
    const strokeOverrideHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Comp, { strokeWidth: 2.5 })
    );
    assert(
      strokeOverrideHtml.includes('stroke-width="2.5"'),
      `${iconName} accepts custom strokeWidth=2.5 override`
    );

    // Custom className
    const customClass = 'h-8 w-8 text-orange-500 hover:scale-105 transition-all shadow-md';
    const classOverrideHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Comp, { className: customClass })
    );
    assert(
      classOverrideHtml.includes(`class="${customClass}"`),
      `${iconName} applies custom className correctly`
    );

    // Spread props
    const spreadProps = {
      'data-testid': `adversarial-test-${iconName}`,
      'data-category': 'grocery-item',
      'aria-label': `FoodArca ${iconName}`,
      role: 'img',
      id: `custom-dom-id-${iconName}`
    };
    const spreadHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, spreadProps));
    assert(
      spreadHtml.includes(`data-testid="adversarial-test-${iconName}"`) &&
        spreadHtml.includes('data-category="grocery-item"') &&
        spreadHtml.includes(`aria-label="FoodArca ${iconName}"`) &&
        spreadHtml.includes('role="img"') &&
        spreadHtml.includes(`id="custom-dom-id-${iconName}"`),
      `${iconName} passes spread props (...props) through to root <svg>`
    );

    // ForwardRef attachment
    const ref = React.createRef();
    const elementWithRef = React.createElement(Comp, { ref });
    assert(elementWithRef.ref === ref, `${iconName} accepts and binds React ref`);
  }

  // ----------------------------------------------------------------------
  // 5. XML Well-Formedness & Strict Syntax Parser
  // ----------------------------------------------------------------------
  console.log('\n>>> TEST SUITE 5: SVG XML Well-Formedness & Syntax Validator');

  function validateXml(xmlString, label) {
    const errors = [];
    const tagStack = [];

    // Tag matching regex
    const tagRegex = /<(\/)?([a-zA-Z0-9_-]+)([\s\S]*?)(\/)?>/g;
    let match;

    while ((match = tagRegex.exec(xmlString)) !== null) {
      const isClosing = Boolean(match[1]);
      const tagName = match[2];
      const rawAttrs = match[3];
      const isSelfClosing = Boolean(match[4]);

      if (isClosing) {
        if (tagStack.length === 0) {
          errors.push(`Closing tag </${tagName}> found with empty stack in ${label}`);
        } else {
          const top = tagStack.pop();
          if (top !== tagName) {
            errors.push(`Mismatched closing tag in ${label}: expected </${top}>, found </${tagName}>`);
          }
        }
      } else if (!isSelfClosing) {
        tagStack.push(tagName);
      }

      if (rawAttrs.trim()) {
        const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
          const attrName = attrMatch[1];
          const doubleQuoted = attrMatch[2];
          const singleQuoted = attrMatch[3];
          const unquoted = attrMatch[4];

          if (unquoted !== undefined) {
            errors.push(`Unquoted attribute value on <${tagName}> in ${label}: ${attrName}=${unquoted}`);
          }

          const attrVal = doubleQuoted !== undefined ? doubleQuoted : singleQuoted;
          if (attrVal && (attrVal.includes('NaN') || attrVal.includes('undefined') || attrVal.includes('null'))) {
            errors.push(`Corrupt numeric attribute value in ${label}: <${tagName} ${attrName}="${attrVal}">`);
          }
        }
      }
    }

    if (tagStack.length > 0) {
      errors.push(`Unclosed tags remaining in stack for ${label}: ${tagStack.join(', ')}`);
    }

    return errors;
  }

  // Validate all 30 exports
  for (const [name, Comp] of Object.entries(Icons)) {
    if (typeof Comp !== 'function' && typeof Comp !== 'object') continue;
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp));
    const errors = validateXml(html, name);
    assert(
      errors.length === 0,
      `${name} renders strictly valid, well-formed SVG XML markup`,
      errors.length ? errors.join('; ') : ''
    );
  }

  // ----------------------------------------------------------------------
  // 6. Composition & Semantic Design Checks
  // ----------------------------------------------------------------------
  console.log('\n>>> TEST SUITE 6: Semantic Composition Feature Checks');

  const compositionChecks = {
    DryGoodsIcon: {
      desc: 'Flour bag on left with orange wheat stalk + glass jar with dot texture on right',
      test: (html) => html.includes('rx="0.6"') && html.includes('stroke="#f97316"') && html.includes('fill="#ffffff"')
    },
    FrozenFoodIcon: {
      desc: 'Freezer bag with snowflake + orange seal line + circular badge bottom right with orange snowflake',
      test: (html) => html.includes('cx="17.5"') && html.includes('cy="16.5"') && html.includes('stroke="#f97316"')
    },
    ProduceIcon: {
      desc: 'Bowl at bottom + apple on left + tall leafy green center back + orange carrot right',
      test: (html) => html.includes('M2.5 14') && html.includes('#f97316') && html.includes('#e5e7eb')
    },
    ProteinsIcon: {
      desc: 'Platter at bottom + salmon fillet with white contour lines + chicken drumstick with light gray meat',
      test: (html) => html.includes('M2 17.5') && html.includes('#f97316') && html.includes('#e5e7eb')
    },
    BakeryIcon: {
      desc: 'Slice of white bread on left + sealed snack bag with orange circle graphic on right',
      test: (html) => html.includes('cx="16"') && html.includes('cy="12"') && html.includes('r="2.5"') && html.includes('#f97316')
    },
    CannedGoodsIcon: {
      desc: 'Tall ribbed can in back right + shorter can in front left with orange tomato graphic',
      test: (html) => html.includes('cx="8.25"') && html.includes('cy="15.5"') && html.includes('#f97316')
    },
    BeveragesIcon: {
      desc: 'Tall bottle with orange water drop on left + shorter soda can with orange wave on right',
      test: (html) => html.includes('M7.25 12.5') && html.includes('M11 14.5') && html.includes('#f97316')
    },
    DairyIcon: {
      desc: 'Tall milk bottle with cow face on left + yogurt cup with orange lid & spoon sticking out',
      test: (html) => html.includes('cx="7.5"') && html.includes('cy="16"') && html.includes('M15.5 10.5') && html.includes('#f97316')
    },
    HygieneIcon: {
      desc: 'Pump bottle with orange pump & drop on left + toilet paper roll on right',
      test: (html) => html.includes('M4 4.5') && html.includes('stroke-dasharray="1.5 1"') && html.includes('#f97316')
    },
    OtherIcon: {
      desc: 'Shopping basket with vertical slots + circular badge with orange plus sign on right',
      test: (html) => html.includes('cx="17.5"') && html.includes('cy="17.5"') && html.includes('x1="15"') && html.includes('#f97316')
    }
  };

  for (const [iconName, check] of Object.entries(compositionChecks)) {
    const Comp = Icons[iconName];
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp));
    assert(check.test(html), `${iconName} satisfies composition specification (${check.desc})`);
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
}

runAdversarialSuite().catch((err) => {
  console.error('Fatal execution error in test suite:', err);
  process.exit(1);
});
