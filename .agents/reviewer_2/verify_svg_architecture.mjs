import fs from 'fs';

const code = fs.readFileSync('components/ui/custom-icons.jsx', 'utf8');

console.log('=== Reviewer 2: SVG Architecture & Integrity Verification ===\n');

// 1. Check currentColor
const hasCurrentColor = /currentColor/i.test(code);
console.log('1. Check currentColor: ' + (hasCurrentColor ? 'FAIL (found currentColor)' : 'PASS (no currentColor found)'));

// 2. Extract all color hex codes
const hexMatches = code.match(/#[0-9a-fA-F]{3,8}/g) || [];
const uniqueHexes = [...new Set(hexMatches.map(h => h.toLowerCase()))];
console.log('2. Unique hex codes used:', uniqueHexes);

const validPalette = ['#6b7280', '#f97316', '#e5e7eb', '#ffffff'];
const invalidHexes = uniqueHexes.filter(h => !validPalette.includes(h));
console.log('   Palette conformance: ' + (invalidHexes.length === 0 ? 'PASS (all hex colors are within authorized palette)' : `FAIL (unauthorized: ${invalidHexes.join(', ')})`));

// 3. Check for unauthorized named colors
const namedColorRegex = /(stroke|fill)="((?!none|#)[a-zA-Z]+)"/g;
let match;
const namedColors = [];
while ((match = namedColorRegex.exec(code)) !== null) {
  namedColors.push(match[0]);
}
console.log('3. Named color attributes: ' + (namedColors.length === 0 ? 'PASS (none)' : `FAIL (${namedColors.join(', ')})`));

// 4. Verify all 10 components and displayNames
const expectedIcons = [
  'DryGoodsIcon', 'FrozenFoodIcon', 'ProduceIcon', 'ProteinsIcon', 'BakeryIcon',
  'CannedGoodsIcon', 'BeveragesIcon', 'DairyIcon', 'HygieneIcon', 'OtherIcon'
];

for (const name of expectedIcons) {
  const hasExport = code.includes(`export const ${name} = forwardRef`);
  const hasDisplayName = code.includes(`${name}.displayName = '${name}';`);
  const hasViewBox = code.includes('viewBox="0 0 24 24"');
  console.log(`4. Icon ${name}: export=${hasExport}, displayName=${hasDisplayName}, viewBox24x24=${hasViewBox}`);
}

// 5. Verify aliases
const expectedAliases = [
  'CanIcon', 'TinCanIcon', 'WaterBottleIcon', 'BottleIcon', 'BreadIcon',
  'BakerySnacksIcon', 'LoafBreadIcon', 'AppleIcon', 'FruitVegIcon', 'ChickenLegIcon',
  'DrumstickIcon', 'SteakIcon', 'MilkCartonIcon', 'SnowflakeIcon', 'GrainSackIcon',
  'SackIcon', 'SoapIcon', 'SoapBubblesIcon', 'BoxIcon', 'PackageIcon'
];

const missingAliases = expectedAliases.filter(name => !code.includes(`export const ${name} =`));
console.log('5. Aliases check: ' + (missingAliases.length === 0 ? 'PASS (all 20 aliases present)' : `FAIL (missing: ${missingAliases.join(', ')})`));

// 6. Check for White Fills in All Overlapping Multi-Object Icons
const iconsWithWhiteFills = expectedIcons.filter(name => {
  const iconCode = code.slice(code.indexOf(`export const ${name}`), code.indexOf(`${name}.displayName`));
  return iconCode.includes('fill="#ffffff"');
});
console.log(`6. Icons with solid white (#ffffff) occlusion fills: ${iconsWithWhiteFills.length} / ${expectedIcons.length}`);

// 7. Check for integrity cheats / hardcoded facade mocks
const isFacade = code.includes('__MOCK__') || code.includes('dummy') || code.includes('test-result');
console.log('7. Facade / Integrity Cheat Check: ' + (isFacade ? 'FAIL (cheat detected)' : 'PASS (authentic implementation)'));
