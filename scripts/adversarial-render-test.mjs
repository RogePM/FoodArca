import React, { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as Icons from '../components/ui/custom-icons.jsx';

console.log('===============================================================');
console.log('       ADVERSARIAL REACT RENDERING & PROP TEST HARNESS        ');
console.log('===============================================================');

const PRIMARY_ICONS = [
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

let allPassed = true;

// 1. Check Primary Icons existence & displayName
console.log('1. Validating 10 Primary Icon Components:');
for (const iconName of PRIMARY_ICONS) {
  const Component = Icons[iconName];
  if (!Component) {
    console.error(`  FAIL: ${iconName} is missing from exports!`);
    allPassed = false;
    continue;
  }
  if (Component.displayName !== iconName) {
    console.error(`  FAIL: ${iconName}.displayName is '${Component.displayName}' instead of '${iconName}'!`);
    allPassed = false;
    continue;
  }
  console.log(`  PASS: ${iconName} exported with displayName='${iconName}'`);
}

// 2. Check Aliases
console.log('\n2. Validating 20 Aliases Reference Equality:');
for (const [aliasName, targetName] of Object.entries(ALIASES)) {
  const AliasComp = Icons[aliasName];
  const TargetComp = Icons[targetName];
  if (!AliasComp) {
    console.error(`  FAIL: Alias ${aliasName} is not exported!`);
    allPassed = false;
  } else if (AliasComp !== TargetComp) {
    console.error(`  FAIL: Alias ${aliasName} does not strictly equal ${targetName}!`);
    allPassed = false;
  } else {
    console.log(`  PASS: ${aliasName} === ${targetName}`);
  }
}

// 3. Render each icon with default props
console.log('\n3. Validating Default Prop Static Rendering:');
for (const iconName of PRIMARY_ICONS) {
  const Component = Icons[iconName];
  const html = renderToStaticMarkup(React.createElement(Component));

  // Check for viewBox="0 0 24 24"
  if (!html.includes('viewBox="0 0 24 24"')) {
    console.error(`  FAIL: ${iconName} rendered without viewBox="0 0 24 24"`);
    allPassed = false;
  }
  // Check for stroke="currentColor" default
  if (!html.includes('stroke="currentColor"')) {
    console.error(`  FAIL: ${iconName} rendered without stroke="currentColor"`);
    allPassed = false;
  }
  // Check for stroke-width="1.2" (or strokeWidth) default
  if (!html.includes('stroke-width="1.2"')) {
    console.error(`  FAIL: ${iconName} rendered without stroke-width="1.2"`);
    allPassed = false;
  }
  // Check for width="24" height="24"
  if (!html.includes('width="24"') || !html.includes('height="24"')) {
    console.error(`  FAIL: ${iconName} rendered without default width=24 / height=24`);
    allPassed = false;
  }
  // Check for opacity="0.5" or soft fill
  if (!html.includes('opacity="0.5"') && !html.includes('opacity="0.4"') && !html.includes('opacity="0.6"')) {
    console.error(`  FAIL: ${iconName} rendered without soft fill opacity`);
    allPassed = false;
  }
  // Check for NaN or undefined in output
  if (html.includes('NaN') || html.includes('undefined')) {
    console.error(`  FAIL: ${iconName} rendered with NaN/undefined values!`);
    allPassed = false;
  }

  console.log(`  PASS: ${iconName} rendered valid SVG markup (${html.length} chars)`);
}

// 4. Render each icon with custom overridden props
console.log('\n4. Validating Custom Prop Overrides:');
for (const iconName of PRIMARY_ICONS) {
  const Component = Icons[iconName];
  const customProps = {
    size: 48,
    strokeWidth: 2.5,
    color: '#ff0055',
    className: 'custom-test-class',
    'data-testid': `test-${iconName}`,
    'aria-label': `${iconName} label`
  };
  const html = renderToStaticMarkup(React.createElement(Component, customProps));

  if (!html.includes('width="48"') || !html.includes('height="48"')) {
    console.error(`  FAIL: ${iconName} failed custom size override`);
    allPassed = false;
  }
  if (!html.includes('stroke-width="2.5"')) {
    console.error(`  FAIL: ${iconName} failed custom strokeWidth override`);
    allPassed = false;
  }
  if (!html.includes('stroke="#ff0055"')) {
    console.error(`  FAIL: ${iconName} failed custom stroke color override`);
    allPassed = false;
  }
  if (!html.includes('class="custom-test-class"')) {
    console.error(`  FAIL: ${iconName} failed custom className override`);
    allPassed = false;
  }
  if (!html.includes('data-testid="test-' + iconName + '"')) {
    console.error(`  FAIL: ${iconName} failed props spreading (data-testid)`);
    allPassed = false;
  }
  if (!html.includes('aria-label="' + iconName + ' label"')) {
    console.error(`  FAIL: ${iconName} failed props spreading (aria-label)`);
    allPassed = false;
  }

  console.log(`  PASS: ${iconName} correctly respects size=48, strokeWidth=2.5, color='#ff0055', className, and spread props`);
}

console.log('\n===============================================================');
console.log(`REACT RENDERING & PROPS VERDICT: ${allPassed ? 'PASSED (APPROVE)' : 'FAILED (REQUEST_CHANGES)'}`);
console.log('===============================================================');

if (!allPassed) process.exit(1);
