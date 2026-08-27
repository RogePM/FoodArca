import fs from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import swc from 'next/dist/build/swc/index.js';

const require = createRequire(import.meta.url);

async function performDeepForensicAudit() {
  console.log('================================================================');
  console.log('        FORENSIC INTEGRITY AUDIT - INDEPENDENT VERIFIER         ');
  console.log('================================================================\n');

  await swc.loadBindings();
  const filePath = 'components/ui/custom-icons.jsx';
  const sourceCode = fs.readFileSync(filePath, 'utf8');

  let passedAll = true;
  let checksTotal = 0;
  let checksPassed = 0;
  const failureList = [];

  function recordCheck(section, name, pass, detail = '') {
    checksTotal++;
    if (pass) {
      checksPassed++;
      console.log(`[PASS] [${section}] ${name}`);
    } else {
      passedAll = false;
      failureList.push({ section, name, detail });
      console.error(`[FAIL] [${section}] ${name} ${detail ? '--> ' + detail : ''}`);
    }
  }

  // =========================================================================
  // 1. PROHIBITED PATTERNS & ANTI-CHEAT FORENSICS
  // =========================================================================
  console.log('--- 1. Prohibited Patterns & Anti-Cheat Forensics ---');

  // Check 1.1: No hardcoded test result strings or test-circumvention tokens
  const cheatTokens = ['// bypass', '/* bypass */', '__CHEAT__', 'test-result:pass', 'MOCK_', 'FACADE_'];
  for (const token of cheatTokens) {
    recordCheck('AntiCheat', `Absence of bypass token "${token}"`, !sourceCode.includes(token));
  }

  // Check 1.2: No facade functions returning empty or static placeholder strings
  const lines = sourceCode.split('\n');
  const returnConstantRegex = /return\s+["'`][^"'`]*["'`]\s*;/;
  const hasReturnConstant = lines.some(l => returnConstantRegex.test(l));
  recordCheck('AntiCheat', 'Zero static string return facade implementations', !hasReturnConstant);

  // Check 1.3: No placeholder text inside components (e.g., "TODO", "FIXME", "Placeholder", "dummy")
  const placeholderRegex = /(TODO|FIXME|Placeholder|placeholder|dummy|temporary|mock)/i;
  const placeholderMatches = lines.filter((l, i) => placeholderRegex.test(l) && !l.includes('Custom SVG Icon Library'));
  recordCheck('AntiCheat', 'Zero placeholder comments or identifiers', placeholderMatches.length === 0, `Matches: ${JSON.stringify(placeholderMatches)}`);

  // Check 1.4: No currentColor or stroke={color} usage
  recordCheck('AntiCheat', 'Absolute zero currentColor tokens', !sourceCode.includes('currentColor'));
  recordCheck('AntiCheat', 'Absolute zero stroke={color} tokens', !sourceCode.includes('stroke={color}'));

  // =========================================================================
  // 2. AST, PARSING & COMPILATION
  // =========================================================================
  console.log('\n--- 2. AST, Parsing & Compilation ---');

  let transformOutput;
  try {
    transformOutput = await swc.transform(sourceCode, {
      jsc: {
        parser: { syntax: 'ecmascript', jsx: true },
        transform: { react: { runtime: 'automatic' } }
      },
      module: { type: 'commonjs' }
    });
    recordCheck('AST', 'SWC AST Parsing and JSX Transpilation succeeds with 0 errors', true);
  } catch (err) {
    recordCheck('AST', 'SWC AST Parsing and JSX Transpilation', false, err.message);
    process.exit(1);
  }

  const mod = { exports: {} };
  const execFn = new Function('module', 'exports', 'require', 'React', transformOutput.code);
  execFn(mod, mod.exports, (reqName) => {
    if (reqName === 'react') return React;
    if (reqName === 'react/jsx-runtime') {
      return require('react/jsx-runtime');
    }
    return require(reqName);
  }, React);

  const icons = mod.exports;

  // =========================================================================
  // 3. COLOR PALETTE FORENSIC ANALYSIS
  // =========================================================================
  console.log('\n--- 3. Color Palette Forensic Analysis ---');

  const allowedPalette = new Set([
    '#6b7280', // Outline Gray
    '#f97316', // Primary Brand Orange
    '#e5e7eb', // Secondary Light Gray
    '#ffffff', // Base White
    'none'     // none
  ]);

  // Extract all hex colors present in source code
  const allHexColors = sourceCode.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
  const uniqueColors = Array.from(new Set(allHexColors.map(c => c.toLowerCase())));
  console.log('  Detected unique colors in source code:', uniqueColors);

  for (const c of uniqueColors) {
    const isApproved = allowedPalette.has(c);
    recordCheck('Palette', `Color ${c} is in approved palette`, isApproved, `Color: ${c}`);
  }

  // =========================================================================
  // 4. MATHEMATICAL & GEOMETRIC VERIFICATION OF 10 MOTIFS
  // =========================================================================
  console.log('\n--- 4. Mathematical & Geometric Verification of 10 Motifs ---');

  const MOTIFS = [
    {
      name: 'DryGoodsIcon',
      desc: 'Grain bag on left (orange wheat stalk) overlapping glass jar with dot texture on right',
      verify: (html) => {
        const hasJar = html.includes('d="M14.5 10h4.5a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V12a2 2 0 0 1 2.5-2z"');
        const hasJarLid = html.includes('width="6.5" height="2"');
        const hasBagBody = html.includes('d="M4 5.5h7.5l1 13.5a1.8 1.8 0 0 1-1.8 1.8H4.8a1.8 1.8 0 0 1-1.8-1.8L4 5.5z"');
        const hasBagTop = html.includes('d="M3.5 3.5h8.5a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z"');
        const hasWheatStalk = html.includes('d="M7.8 9.5v7"') && html.includes('stroke="#f97316"');
        const hasWheatGrains = html.includes('d="M6.3 8l1.5 1.5 1.5-1.5"') && html.includes('d="M5.8 11.8l2-1.5 2 1.5"');
        const dotCount = (html.match(/<circle /g) || []).length;
        const hasDotTexture = dotCount >= 5;
        return {
          pass: hasJar && hasJarLid && hasBagBody && hasBagTop && hasWheatStalk && hasWheatGrains && hasDotTexture,
          details: `Jar: ${hasJar}, Bag: ${hasBagBody}, Wheat: ${hasWheatStalk && hasWheatGrains}, Dots: ${dotCount}`
        };
      }
    },
    {
      name: 'FrozenFoodIcon',
      desc: 'Freezer bag with center dark gray snowflake, orange seal line, badge with small orange snowflake',
      verify: (html) => {
        const hasBag = html.includes('d="M4.5 5.5L5 19.5a1.8 1.8 0 0 0 1.8 1.8h7.4a1.8 1.8 0 0 0 1.8-1.8L16.5 5.5H4.5z"');
        const hasSeal = html.includes('x1="4.5" y1="6" x2="16.5" y2="6"') && html.includes('stroke="#f97316"');
        const hasCenterSnowflake = html.includes('x1="9.5" y1="9" x2="9.5" y2="17"') && html.includes('d="M8.5 10.2l1-1 1 1"');
        const hasBadge = html.includes('cx="17.5" cy="16.5" r="4.5"');
        const hasSmallSnowflake = html.includes('x1="17.5" y1="13.5" x2="17.5" y2="19.5"') && html.includes('stroke="#f97316"');
        return {
          pass: hasBag && hasSeal && hasCenterSnowflake && hasBadge && hasSmallSnowflake,
          details: `Bag: ${hasBag}, Seal: ${hasSeal}, CenterSnowflake: ${hasCenterSnowflake}, Badge: ${hasBadge}, SmallSnowflake: ${hasSmallSnowflake}`
        };
      }
    },
    {
      name: 'ProduceIcon',
      desc: 'Bowl at bottom, apple on left (orange stem, gray leaf), leafy green center back, carrot diagonally up right',
      verify: (html) => {
        const hasBowl = html.includes('d="M2.5 14c0 4.2 4.2 7 9.5 7s9.5-2.8 9.5-7c-4 1.2-15 1.2-19 0z"');
        const hasLeafyGreen = html.includes('d="M12 2.5C10.2 4 9 6.2 9 8.5c0 2.5.8 4.5 1.5 5.5h3c.7-1 1.5-3 1.5-5.5 0-2.3-1.2-4.5-3-6z"');
        const hasApple = html.includes('d="M6.5 8.8C5.2 8 3.5 9 3.5 11c0 2.6 1.7 4.5 3 4.5s3-1.9 3-4.5c0-2-1.7-3-3-2.2z"');
        const hasAppleStemLeaf = html.includes('d="M6.5 8.8c0-1.5.6-2.5 1.5-3"') && html.includes('d="M7.5 6.5c1-.8 2.2-.6 2.5.3 0 .8-1.2 1-2.5-.3z"');
        const hasCarrot = html.includes('d="M13 14.2L17.5 6c.6-.9 1.9-.6 2.3.4.4.9 0 1.9-.9 2.5l-4.7 6.6c-.7.6-1.5.3-1.8-.3-.2-.4-.3-.7.6-1z"') && html.includes('fill="#f97316"');
        const hasCarrotGreens = html.includes('d="M18.8 6l1.2-2.5M19.2 6.5l2-.8M18.5 5.8l-.5-2.3"');
        return {
          pass: hasBowl && hasLeafyGreen && hasApple && hasAppleStemLeaf && hasCarrot && hasCarrotGreens,
          details: `Bowl: ${hasBowl}, LeafyGreen: ${hasLeafyGreen}, Apple: ${hasApple}, StemLeaf: ${hasAppleStemLeaf}, Carrot: ${hasCarrot}, Greens: ${hasCarrotGreens}`
        };
      }
    },
    {
      name: 'ProteinsIcon',
      desc: 'Platter at bottom, round salmon fillet on left (orange fill, white contour lines), chicken drumstick on right',
      verify: (html) => {
        const hasPlatter = html.includes('d="M2 17.5C2 19.8 6.5 21.5 12 21.5s10-1.7 10-4c0-2-4.5-2.5-10-2.5S2 15.5 2 17.5z"');
        const hasSalmon = html.includes('d="M4.5 11.5C4.5 8.8 6.5 7.5 8.5 7.5s4 1.3 4 4c0 3-1.8 5-4 5s-4-2-4-5z"') && html.includes('fill="#f97316"');
        const hasSalmonContours = html.includes('d="M5.5 10c1.5 1 4.5 1 6 0M5.5 13c1.5 1 4.5 1 6 0"') && html.includes('stroke="#ffffff"');
        const hasSalmonBone = html.includes('cx="8.5" cy="11.5" r="1"');
        const hasDrumstickBone = html.includes('x1="17" y1="10.5" x2="19.5" y2="8"') && html.includes('d="M19.5 6.5a1 1 0 0 1 1.4 1.4 1 1 0 0 1-1.4 1.4"');
        const hasDrumstickMeat = html.includes('d="M12.5 13.5c-1-2.2.5-4.5 2.8-4.5 1.8 0 3 1 3.7 2.5l-1 3.5c-1 1.5-3.5 1.5-4.7 0a2.5 2.5 0 0 1-.8-1.5z"') && html.includes('fill="#e5e7eb"');
        return {
          pass: hasPlatter && hasSalmon && hasSalmonContours && hasSalmonBone && hasDrumstickBone && hasDrumstickMeat,
          details: `Platter: ${hasPlatter}, Salmon: ${hasSalmon}, Contours: ${hasSalmonContours}, Bone: ${hasSalmonBone}, Drumstick: ${hasDrumstickMeat}`
        };
      }
    },
    {
      name: 'BakeryIcon',
      desc: 'Slice of white bread on left with crumb texture, sealed snack bag on right with orange circle graphic',
      verify: (html) => {
        const hasSnackBag = html.includes('d="M11.5 3.5h9v2h-9z"') && html.includes('d="M11.5 5.5h9v13h-9z"');
        const hasOrangeCircle = html.includes('cx="16" cy="12" r="2.5" fill="#f97316"');
        const hasBreadCrust = html.includes('d="M3.5 10.5C2.5 8 5 6.5 7 7c.8.2 1.5.7 1.5.7s.7-.5 1.5-.7c2-.5 4.5 1 3.5 3.5l-.5 8a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 18.5l.5-8z"');
        const hasBreadCrumb = html.includes('d="M4.8 11.5c-.5-1.5.8-2.5 2-2.2.6.2 1.2.6 1.2.6s.6-.4 1.2-.6c1.2-.3 2.5.7 2 2.2l-.4 6H5.2l-.4-6z"');
        const circleCount = (html.match(/<circle /g) || []).length; // 1 orange circle + 3 crumb pores
        const hasCrumbPores = circleCount >= 4;
        return {
          pass: hasSnackBag && hasOrangeCircle && hasBreadCrust && hasBreadCrumb && hasCrumbPores,
          details: `SnackBag: ${hasSnackBag}, OrangeCircle: ${hasOrangeCircle}, BreadCrust: ${hasBreadCrust}, BreadCrumb: ${hasBreadCrumb}, Pores: ${circleCount}`
        };
      }
    },
    {
      name: 'CannedGoodsIcon',
      desc: 'Tall ribbed can back right (orange stripe near top), shorter can front left (orange tomato graphic)',
      verify: (html) => {
        const hasTallCan = html.includes('d="M12 4.5 C12 3.5 21 3.5 21 4.5 V19 C21 20.2 12 20.2 12 19 Z"');
        const hasTallLid = html.includes('cx="16.5" cy="4.5" rx="4.5" ry="1.2"');
        const hasOrangeStripe = html.includes('d="M12 7.5 H21 V9.5 H12 Z"') && html.includes('fill="#f97316"');
        const hasRibs = html.includes('x1="12" y1="12" x2="21" y2="12"') && html.includes('x1="12" y1="14.5" x2="21" y2="14.5"') && html.includes('x1="12" y1="17" x2="21" y2="17"');
        const hasShortCan = html.includes('d="M3 10 C3 9 13.5 9 13.5 10 V19.5 C13.5 21 3 21 3 19.5 Z"');
        const hasShortLid = html.includes('cx="8.25" cy="10" rx="5.25" ry="1.4"');
        const hasTomato = html.includes('cx="8.25" cy="15.5" r="2.3" fill="#f97316"') && html.includes('d="M8.25 13.2 V12.4 M7.2 13.6 L8.25 13 L9.3 13.6"');
        return {
          pass: hasTallCan && hasTallLid && hasOrangeStripe && hasRibs && hasShortCan && hasShortLid && hasTomato,
          details: `TallCan: ${hasTallCan}, Lid: ${hasTallLid}, Stripe: ${hasOrangeStripe}, Ribs: ${hasRibs}, ShortCan: ${hasShortCan}, Tomato: ${hasTomato}`
        };
      }
    },
    {
      name: 'BeveragesIcon',
      desc: 'Tall bottle on left (orange water drop), shorter soda can on right (orange wave graphic)',
      verify: (html) => {
        const hasBottle = html.includes('d="M6.2 4.5 V6.5 L3 9.5 V19.5 C3 20.5 4 21.5 5 21.5 H9.5 C10.5 21.5 11.5 20.5 11.5 19.5 V9.5 L8.3 6.5 V4.5"');
        const hasBottleCap = html.includes('x="5.5" y="2.5" width="3.5" height="2"');
        const hasWaterDrop = html.includes('d="M7.25 12.5 C6.2 14 5.5 15.2 5.5 16.3 C5.5 17.5 6.3 18.5 7.25 18.5 C8.2 18.5 9 17.5 9 16.3 C9 15.2 8.3 14 7.25 12.5 Z"') && html.includes('fill="#f97316"');
        const hasSodaCan = html.includes('d="M12.5 7.5 H19.5 L21 9 V19.5 C21 20.5 20 21.5 19 21.5 H13 C12 21.5 11 20.5 11 19.5 V9 L12.5 7.5 Z"');
        const hasSodaLid = html.includes('cx="16" cy="7.5" rx="3.5" ry="1"');
        const hasWaveGraphic = html.includes('d="M11 14.5 C13 13 14.5 16 17 14.5 C18.5 13.5 19.8 14 21 14.5 V16.5 C19.8 16 18.5 15.5 17 16.5 C14.5 18 13 15 11 16.5 Z"') && html.includes('fill="#f97316"');
        return {
          pass: hasBottle && hasBottleCap && hasWaterDrop && hasSodaCan && hasSodaLid && hasWaveGraphic,
          details: `Bottle: ${hasBottle}, Cap: ${hasBottleCap}, WaterDrop: ${hasWaterDrop}, SodaCan: ${hasSodaCan}, Lid: ${hasSodaLid}, Wave: ${hasWaveGraphic}`
        };
      }
    },
    {
      name: 'DairyIcon',
      desc: 'Tall milk bottle on left (cow face graphic), yogurt cup on right (orange lid & spoon)',
      verify: (html) => {
        const hasMilkBottle = html.includes('d="M6 4 V6 L3 9 V19.5 C3 20.5 4 21.5 5 21.5 H10 C11 21.5 12 20.5 12 19.5 V9 L9 6 V4"');
        const hasCowFace = html.includes('cx="7.5" cy="16" rx="2" ry="1.2"') && html.includes('d="M6 14.5 C5.8 13.2 9.2 13.2 9 14.5"');
        const hasYogurtCup = html.includes('d="M12 11.5 L13.5 19.8 C13.7 20.6 14.2 21.2 15 21.2 H18.5 C19.3 21.2 19.8 20.6 20 19.8 L21.5 11.5 Z"');
        const hasOrangeLid = html.includes('d="M11 10 C11 9.5 11.5 9 12 9 H21.5 C22 9 22.5 9.5 22.5 10 V11.5 H11 Z"') && html.includes('fill="#f97316"');
        const hasSpoon = html.includes('d="M15.5 10.5 L18.5 5 C19.2 3.8 21 4.8 20.2 6.2 L17.5 11"');
        return {
          pass: hasMilkBottle && hasCowFace && hasYogurtCup && hasOrangeLid && hasSpoon,
          details: `MilkBottle: ${hasMilkBottle}, CowFace: ${hasCowFace}, YogurtCup: ${hasYogurtCup}, OrangeLid: ${hasOrangeLid}, Spoon: ${hasSpoon}`
        };
      }
    },
    {
      name: 'HygieneIcon',
      desc: 'Pump bottle on left (orange pump & drop), toilet paper roll on right with hanging sheet',
      verify: (html) => {
        const hasPumpMechanism = html.includes('d="M4 4.5 H8.5 C9 4.5 9.5 4 9.5 3.5 V2.5 H6.5"') && html.includes('stroke="#f97316"');
        const hasPumpDrop = html.includes('d="M4 6.5 C3.3 7.5 3 8.2 3 8.8 C3 9.5 3.5 10 4 10 C4.5 10 5 9.5 5 8.8 C5 8.2 4.7 7.5 4 6.5 Z"') && html.includes('fill="#f97316"');
        const hasPumpBottle = html.includes('d="M6 8 L2.5 10 V19.5 C2.5 20.5 3.5 21.5 4.5 21.5 H10 C11 21.5 12 20.5 12 19.5 V10 L8.5 8 Z"');
        const hasBodyDrop = html.includes('d="M7.25 13.5 C6.2 15 5.5 16.2 5.5 17.3 C5.5 18.5 6.3 19.5 7.25 19.5 C8.2 19.5 9 18.5 9 17.3 C9 16.2 8.3 15 7.25 13.5 Z"') && html.includes('fill="#f97316"');
        const hasTPRoll = html.includes('d="M11.5 8.5 V17 C11.5 19 20.5 19 20.5 17 V8.5 Z"') && html.includes('cx="16" cy="8.5" rx="4.5" ry="2"');
        const hasHangingSheet = html.includes('d="M20.5 10 V20.5 C20.5 20.8 20.2 21 19.8 21 H14.5"') && html.includes('stroke-dasharray="1.5 1"');
        return {
          pass: hasPumpMechanism && hasPumpDrop && hasPumpBottle && hasBodyDrop && hasTPRoll && hasHangingSheet,
          details: `Pump: ${hasPumpMechanism}, PumpDrop: ${hasPumpDrop}, Bottle: ${hasPumpBottle}, BodyDrop: ${hasBodyDrop}, TPRoll: ${hasTPRoll}, Sheet: ${hasHangingSheet}`
        };
      }
    },
    {
      name: 'OtherIcon',
      desc: 'Shopping basket with vertical slots, circular badge bottom right with orange plus (+) sign',
      verify: (html) => {
        const hasHandle = html.includes('d="M6 9.5 V5 C6 4.2 6.8 3.5 7.6 3.5 H16.4 C17.2 3.5 18 4.2 18 5 V9.5"');
        const hasRim = html.includes('x="2" y="9.5" width="20" height="2.5"');
        const hasBasketBody = html.includes('d="M3.5 12 L5 19 C5.2 19.6 5.7 20 6.3 20 H17.7 C18.3 20 18.8 19.6 19 19 L20.5 12 Z"');
        const hasSlots = html.includes('x1="7.5" y1="13.5" x2="8" y2="18.5"') && html.includes('x1="10.5" y1="13.5" x2="10.7" y2="18.5"');
        const hasBadge = html.includes('cx="17.5" cy="17.5" r="4.5"');
        const hasPlusSign = html.includes('x1="15" y1="17.5" x2="20" y2="17.5"') && html.includes('x1="17.5" y1="15" x2="17.5" y2="20"') && html.includes('stroke="#f97316"');
        return {
          pass: hasHandle && hasRim && hasBasketBody && hasSlots && hasBadge && hasPlusSign,
          details: `Handle: ${hasHandle}, Rim: ${hasRim}, Body: ${hasBasketBody}, Slots: ${hasSlots}, Badge: ${hasBadge}, Plus: ${hasPlusSign}`
        };
      }
    }
  ];

  for (const motif of MOTIFS) {
    const Component = icons[motif.name];
    if (!Component) {
      recordCheck('Motifs', `${motif.name} export exists`, false, 'Not exported');
      continue;
    }
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Component));
    const result = motif.verify(html);
    recordCheck('Motifs', `${motif.name}: ${motif.desc}`, result.pass, result.details);
  }

  // =========================================================================
  // 5. LAYER OCCLUSION & OVERLAP INTEGRITY (WHITE FILLS)
  // =========================================================================
  console.log('\n--- 5. Layer Occlusion & Overlap Integrity (White Base Fills) ---');

  for (const motif of MOTIFS) {
    const Component = icons[motif.name];
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Component));
    const hasWhiteFill = html.includes('fill="#ffffff"');
    recordCheck('Occlusion', `${motif.name} contains white (#ffffff) blocking fill for layer occlusion`, hasWhiteFill);
  }

  // =========================================================================
  // 6. PROP PROTOCOL & FORWARDREF SANITY
  // =========================================================================
  console.log('\n--- 6. Prop Protocol & ForwardRef Sanity ---');

  for (const motif of MOTIFS) {
    const Component = icons[motif.name];
    const htmlOverridden = ReactDOMServer.renderToStaticMarkup(React.createElement(Component, {
      size: 32,
      strokeWidth: 2,
      className: 'auditor-test-class',
      id: `icon-${motif.name}`
    }));

    const hasWidth32 = htmlOverridden.includes('width="32"') && htmlOverridden.includes('height="32"');
    const hasStrokeWidth2 = htmlOverridden.includes('stroke-width="2"');
    const hasClass = htmlOverridden.includes('class="auditor-test-class"');
    const hasId = htmlOverridden.includes(`id="icon-${motif.name}"`);

    recordCheck('Props', `${motif.name} respects size=32, strokeWidth=2, className, and rest props`,
      hasWidth32 && hasStrokeWidth2 && hasClass && hasId,
      `width: ${hasWidth32}, strokeWidth: ${hasStrokeWidth2}, class: ${hasClass}, id: ${hasId}`
    );
  }

  // =========================================================================
  // 7. BACKWARDS COMPATIBILITY ALIASES STRICT EQUALITY
  // =========================================================================
  console.log('\n--- 7. Backwards Compatibility Aliases ---');

  const ALIAS_MAP = {
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

  for (const [alias, target] of Object.entries(ALIAS_MAP)) {
    const isStrictEqual = icons[alias] !== undefined && icons[alias] === icons[target];
    recordCheck('Aliases', `Alias ${alias} strictly equals ${target}`, isStrictEqual);
  }

  console.log('\n================================================================');
  console.log(`  TOTAL CHECKS: ${checksTotal}`);
  console.log(`  PASSED CHECKS: ${checksPassed}`);
  console.log(`  FAILED CHECKS: ${failureList.length}`);
  if (passedAll) {
    console.log('  FINAL VERDICT: CLEAN (ALL INTEGRITY CHECKS PASSED)');
  } else {
    console.error('  FINAL VERDICT: INTEGRITY VIOLATION DETECTED');
    console.error(JSON.stringify(failureList, null, 2));
  }
  console.log('================================================================');

  return { passedAll, checksTotal, checksPassed, failureList };
}

performDeepForensicAudit().catch(err => {
  console.error('FATAL AUDIT ERROR:', err);
  process.exit(1);
});
