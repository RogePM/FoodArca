const fs = require('fs');
const path = require('path');

const iconFilePath = path.resolve(__dirname, '../../components/ui/custom-icons.jsx');
const content = fs.readFileSync(iconFilePath, 'utf8');

console.log('--- FORENSIC AUDIT: STATIC CODE & AST VERIFICATION ---');

const requiredIcons = [
  'CannedGoodsIcon',
  'BeveragesIcon',
  'BakeryIcon',
  'ProduceIcon',
  'ProteinsIcon',
  'DairyIcon',
  'FrozenFoodIcon',
  'DryGoodsIcon',
  'HygieneIcon',
  'OtherIcon'
];

let allPassed = true;

// 1. Check icon exports and displayNames
console.log('\n[Check 1] Icon Definitions and DisplayNames:');
for (const iconName of requiredIcons) {
  const exportPattern = new RegExp(`export\\s+const\\s+${iconName}\\s*=\\s*forwardRef\\(`);
  const displayPattern = new RegExp(`${iconName}\\.displayName\\s*=\\s*['"]${iconName}['"]`);
  const hasExport = exportPattern.test(content);
  const hasDisplay = displayPattern.test(content);
  console.log(`- ${iconName}: exported=${hasExport}, displayName=${hasDisplay}`);
  if (!hasExport || !hasDisplay) allPassed = false;
}

// 2. Check props and default values
console.log('\n[Check 2] Props & Signatures:');
for (const iconName of requiredIcons) {
  const snippetMatch = content.match(new RegExp(`export\\s+const\\s+${iconName}[\\s\\S]*?\\n\\);`));
  if (!snippetMatch) {
    console.log(`- ${iconName}: SNIPPET NOT FOUND`);
    allPassed = false;
    continue;
  }
  const snippet = snippetMatch[0];
  const hasSizeDef = /size\s*=\s*24/.test(snippet);
  const hasStrokeWidthDef = /strokeWidth\s*=\s*1\.2/.test(snippet);
  const hasColorDef = /color\s*=\s*['"]currentColor['"]/.test(snippet);
  const hasStrokeColor = /stroke=\{color\}/.test(snippet);
  const hasStrokeWidthProp = /strokeWidth=\{strokeWidth\}/.test(snippet);
  const hasRefForwarding = /ref=\{ref\}/.test(snippet) && /,\s*ref\)/.test(snippet);
  
  console.log(`- ${iconName}: size=24: ${hasSizeDef}, strokeWidth=1.2: ${hasStrokeWidthDef}, color='currentColor': ${hasColorDef}, stroke={color}: ${hasStrokeColor}, strokeWidth={strokeWidth}: ${hasStrokeWidthProp}, ref: ${hasRefForwarding}`);
  if (!hasSizeDef || !hasStrokeWidthDef || !hasColorDef || !hasStrokeColor || !hasStrokeWidthProp || !hasRefForwarding) {
    allPassed = false;
  }
}

// 3. Check for hardcoded dark strokes or illicit stroke overrides
console.log('\n[Check 3] Hardcoded Stroke Audit:');
const strokeMatches = content.match(/stroke=(?!\{color\})["'][^"']+["']/g);
if (strokeMatches) {
  console.log(`- WARNING: Found hardcoded stroke attributes: ${JSON.stringify(strokeMatches)}`);
  allPassed = false;
} else {
  console.log('- PASS: No hardcoded stroke attributes found across entire custom-icons.jsx');
}

// 4. Subtle Internal Fills check
console.log('\n[Check 4] Subtle Internal Fills Check (Hex fill + Opacity):');
for (const iconName of requiredIcons) {
  const snippetMatch = content.match(new RegExp(`export\\s+const\\s+${iconName}[\\s\\S]*?\\n\\);`));
  if (!snippetMatch) continue;
  const snippet = snippetMatch[0];
  
  // Find all elements with fill
  const fills = [];
  const fillRegex = /<(path|ellipse|circle|rect|polygon)[^>]*fill=["'](#?[a-zA-Z0-9]+)["'][^>]*>/g;
  let m;
  while ((m = fillRegex.exec(snippet)) !== null) {
    const fullTag = m[0];
    const fillColor = m[2];
    const opacityMatch = fullTag.match(/opacity=["']([0-9.]+)["']/);
    const opacity = opacityMatch ? opacityMatch[1] : 'none';
    fills.push({ tag: m[1], fillColor, opacity });
  }
  console.log(`- ${iconName}: ${fills.length} fill(s) found ->`, fills);
  if (fills.length === 0) {
    console.log(`  ERROR: ${iconName} has NO subtle internal fills!`);
    allPassed = false;
  }
}

// 5. Check ProduceIcon is genuinely a leafy vegetable (cabbage/lettuce) and NOT apple
console.log('\n[Check 5] ProduceIcon Geometry & Motif Verification:');
const produceSnippetMatch = content.match(/export\s+const\s+ProduceIcon[\s\S]*?\n\);/);
if (produceSnippetMatch) {
  const pSnippet = produceSnippetMatch[0];
  const hasLeafGreenFill = /#4ade80/.test(pSnippet);
  const hasAppleKeywords = /apple|stem|fruit/i.test(pSnippet);
  const hasCabbageLettuceKeywords = /cabbage|lettuce|leaf|vein/i.test(pSnippet);
  console.log(`- Leaf green fill (#4ade80): ${hasLeafGreenFill}`);
  console.log(`- Apple keywords present in ProduceIcon: ${hasAppleKeywords}`);
  console.log(`- Cabbage/lettuce/leaf keywords: ${hasCabbageLettuceKeywords}`);
  if (!hasLeafGreenFill || !hasCabbageLettuceKeywords) {
    allPassed = false;
  }
}

// 6. Check Aliases
console.log('\n[Check 6] Semantic Export Aliases:');
const expectedAliases = [
  { alias: 'CanIcon', target: 'CannedGoodsIcon' },
  { alias: 'TinCanIcon', target: 'CannedGoodsIcon' },
  { alias: 'WaterBottleIcon', target: 'BeveragesIcon' },
  { alias: 'BottleIcon', target: 'BeveragesIcon' },
  { alias: 'BreadIcon', target: 'BakeryIcon' },
  { alias: 'BakerySnacksIcon', target: 'BakeryIcon' },
  { alias: 'LoafBreadIcon', target: 'BakeryIcon' },
  { alias: 'AppleIcon', target: 'ProduceIcon' },
  { alias: 'FruitVegIcon', target: 'ProduceIcon' },
  { alias: 'ChickenLegIcon', target: 'ProteinsIcon' },
  { alias: 'DrumstickIcon', target: 'ProteinsIcon' },
  { alias: 'SteakIcon', target: 'ProteinsIcon' },
  { alias: 'MilkCartonIcon', target: 'DairyIcon' },
  { alias: 'SnowflakeIcon', target: 'FrozenFoodIcon' },
  { alias: 'GrainSackIcon', target: 'DryGoodsIcon' },
  { alias: 'SackIcon', target: 'DryGoodsIcon' },
  { alias: 'SoapIcon', target: 'HygieneIcon' },
  { alias: 'SoapBubblesIcon', target: 'HygieneIcon' },
  { alias: 'BoxIcon', target: 'OtherIcon' },
  { alias: 'PackageIcon', target: 'OtherIcon' }
];

let aliasCount = 0;
for (const item of expectedAliases) {
  const aliasRegex = new RegExp(`export\\s+const\\s+${item.alias}\\s*=\\s*${item.target}`);
  const match = aliasRegex.test(content);
  if (match) {
    aliasCount++;
  } else {
    console.log(`- MISSING ALIAS: export const ${item.alias} = ${item.target}`);
    allPassed = false;
  }
}
console.log(`- Total valid aliases verified: ${aliasCount} / ${expectedAliases.length}`);

// 7. Check for Anti-Cheating (Facade, hardcoded pass strings, mock shims, fake returns)
console.log('\n[Check 7] Anti-Cheating & Facade Detection:');
const forbiddenPatterns = [
  /return\s+true/i,
  /return\s+false/i,
  /return\s+['"]ok['"]/i,
  /return\s+['"]pass['"]/i,
  /TODO/i,
  /FIXME/i,
  /NotImplemented/i,
  /__mock__/i,
  /mockImplementation/i,
  /jest\.fn/i
];

let foundCheat = false;
for (const pattern of forbiddenPatterns) {
  if (pattern.test(content)) {
    console.log(`- FORBIDDEN PATTERN DETECTED: ${pattern}`);
    foundCheat = true;
    allPassed = false;
  }
}
if (!foundCheat) {
  console.log('- PASS: No facade implementations, test bypass strings, or dummy mocks detected.');
}

console.log('\n========================================');
console.log(`FINAL RESULT: ${allPassed ? 'ALL CHECKS PASSED (CLEAN)' : 'FAILURES DETECTED'}`);
console.log('========================================');
