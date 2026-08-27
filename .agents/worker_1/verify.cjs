const fs = require('fs');
const content = fs.readFileSync('components/ui/custom-icons.jsx', 'utf8');

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
  'OtherIcon'
];

console.log('=== 1. COMPONENT EXPORTS & DISPLAY NAMES ===');
let allExportsOk = true;
icons.forEach(name => {
  const hasExport = content.indexOf('export const ' + name + ' = forwardRef(') !== -1;
  const hasDisplayName = content.indexOf(name + '.displayName = \'' + name + '\';') !== -1;
  console.log('- ' + name + ': export=' + hasExport + ', displayName=' + hasDisplayName);
  if (!hasExport || !hasDisplayName) allExportsOk = false;
});

console.log('\n=== 2. ATTRIBUTE CHECKS ===');
const strokeColorCount = (content.match(/stroke=\{color\}/g) || []).length;
const strokeWidthCount = (content.match(/strokeWidth\s*=\s*1\.2/g) || []).length;
const opacity05Count = (content.match(/opacity="0\.5"/g) || []).length;
const allOpacityCount = (content.match(/opacity="0\.[0-9]+"/g) || []).length;

console.log('stroke={color} count: ' + strokeColorCount + ' / 10');
console.log('strokeWidth = 1.2 count: ' + strokeWidthCount + ' / 10');
console.log('opacity="0.5" count: ' + opacity05Count);
console.log('all opacity="0.x" count: ' + allOpacityCount);

console.log('\n=== 3. SEMANTIC ALIASES CHECKS ===');
const aliases = [
 'CanIcon', 'TinCanIcon', 'WaterBottleIcon', 'BottleIcon',
 'BreadIcon', 'BakerySnacksIcon', 'LoafBreadIcon',
 'AppleIcon', 'FruitVegIcon', 'ChickenLegIcon', 'DrumstickIcon', 'SteakIcon',
 'MilkCartonIcon', 'SnowflakeIcon', 'GrainSackIcon', 'SackIcon',
 'SoapIcon', 'SoapBubblesIcon', 'BoxIcon', 'PackageIcon'
];
let allAliasesOk = true;
aliases.forEach(alias => {
 const hasAlias = content.indexOf('export const ' + alias + ' = ') !== -1;
 console.log('- ' + alias + ': ' + hasAlias);
 if (!hasAlias) allAliasesOk = false;
});

console.log('\n=== 4. PRODUCE ICON MOTIF CHECK ===');
const isApple = content.includes('Apple stem') || content.includes('Apple body') || content.includes('Apple leaf');
const isCabbage = content.includes('cabbage') || content.includes('Cabbage') || content.includes('Lettuce');
console.log('Contains Apple motif: ' + isApple + ' (must be false)');
console.log('Contains Cabbage/Lettuce motif: ' + isCabbage + ' (must be true)');

if (allExportsOk && strokeColorCount === 10 && strokeWidthCount === 10 && allOpacityCount >= 10 && allAliasesOk && !isApple && isCabbage) {
 console.log('\n>>> ALL 10 ICONS VERIFIED SUCCESSFULLY! <<<');
} else {
 console.error('\n>>> VERIFICATION FAILED! <<<');
 process.exit(1);
}
