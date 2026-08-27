const fs = require('fs');
const path = require('path');

const filePath = path.resolve('components/ui/custom-icons.jsx');
const content = fs.readFileSync(filePath, 'utf8');

const icons = [
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

const aliases = [
  'CanIcon',
  'TinCanIcon',
  'WaterBottleIcon',
  'BottleIcon',
  'BreadIcon',
  'BakerySnacksIcon',
  'LoafBreadIcon',
  'AppleIcon',
  'FruitVegIcon',
  'ChickenLegIcon',
  'DrumstickIcon',
  'SteakIcon',
  'MilkCartonIcon',
  'SnowflakeIcon',
  'GrainSackIcon',
  'SackIcon',
  'SoapIcon',
  'SoapBubblesIcon',
  'BoxIcon',
  'PackageIcon',
];

console.log('=== VERIFYING ICON COMPONENTS ===');
let iconFailures = 0;
for (const icon of icons) {
  const hasForwardRef = content.includes(`export const ${icon} = forwardRef(`);
  const hasDisplayName = content.includes(`${icon}.displayName = '${icon}';`);
  const hasViewBox = content.includes('viewBox="0 0 24 24"');
  const hasStrokeColor = content.includes('stroke={color}');
  const hasStrokeWidth = content.includes('strokeWidth={strokeWidth}');
  const hasFillNone = content.includes('fill="none"');
  const hasLinecap = content.includes('strokeLinecap="round"');
  const hasLinejoin = content.includes('strokeLinejoin="round"');
  const hasProps = content.includes('{...props}');
  const hasRef = content.includes('ref={ref}');

  const valid = hasForwardRef && hasDisplayName;
  console.log(`[${valid ? 'PASS' : 'FAIL'}] ${icon}: forwardRef=${hasForwardRef}, displayName=${hasDisplayName}`);
  if (!valid) iconFailures++;
}

console.log('\n=== VERIFYING ALIASES ===');
let aliasFailures = 0;
for (const alias of aliases) {
  const hasAlias = content.includes(`export const ${alias} = `);
  console.log(`[${hasAlias ? 'PASS' : 'FAIL'}] Alias ${alias}`);
  if (!hasAlias) aliasFailures++;
}

console.log('\n=== CHECKING ATTRIBUTE OCCURRENCES ===');
const countOccurrences = (str, pattern) => (content.match(new RegExp(pattern, 'g')) || []).length;

console.log('forwardRef count:', countOccurrences(content, 'forwardRef\\('));
console.log('displayName count:', countOccurrences(content, '\\.displayName = '));
console.log('viewBox="0 0 24 24" count:', countOccurrences(content, 'viewBox="0 0 24 24"'));
console.log('stroke={color} count:', countOccurrences(content, 'stroke=\\{color\\}'));
console.log('strokeWidth={strokeWidth} count:', countOccurrences(content, 'strokeWidth=\\{strokeWidth\\}'));
console.log('opacity="0.5" count:', countOccurrences(content, 'opacity="0.5"'));

console.log('\n=== SUMMARY ===');
if (iconFailures === 0 && aliasFailures === 0) {
  console.log('STATUS: ALL VERIFICATIONS PASSED');
  process.exit(0);
} else {
  console.error(`STATUS: FAILED (${iconFailures} icon failures, ${aliasFailures} alias failures)`);
  process.exit(1);
}
