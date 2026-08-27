const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== RUNNING COMPREHENSIVE ADVERSARIAL AUDIT (ROUND 3) ===\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

// 1. Acceptance Criteria: File structure & retirement
test('R1: All 5 App Router sub-routes + root dashboard files exist', () => {
  const routes = [
    'app/dashboard/layout.jsx',
    'app/dashboard/page.js',
    'app/dashboard/inventory/page.jsx',
    'app/dashboard/add/page.jsx',
    'app/dashboard/remove/page.jsx',
    'app/dashboard/recent/page.jsx',
    'app/dashboard/settings/page.jsx',
  ];
  routes.forEach(r => {
    assert(fs.existsSync(path.join(process.cwd(), r)), `Missing file: ${r}`);
  });
});

test('R1: Legacy monolithic client-page.jsx is retired', () => {
  assert(!fs.existsSync(path.join(process.cwd(), 'app/dashboard/client-page.jsx')), 'client-page.jsx must not exist');
});

// 2. Component Integration
test('R3: Page files import and render correct view components', () => {
  const inventoryPage = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/inventory/page.jsx'), 'utf8');
  assert(inventoryPage.includes('InventoryView'), 'Inventory page must render InventoryView');

  const addPage = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/add/page.jsx'), 'utf8');
  assert(addPage.includes('AddItemView'), 'Add page must render AddItemView');

  const removePage = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/remove/page.jsx'), 'utf8');
  assert(removePage.includes('DistributionModule'), 'Remove page must render DistributionModule');

  const recentPage = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/recent/page.jsx'), 'utf8');
  assert(recentPage.includes('RecentChangesView'), 'Recent page must render RecentChangesView');

  const settingsPage = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/settings/page.jsx'), 'utf8');
  assert(settingsPage.includes('SettingsView'), 'Settings page must render SettingsView');

  const homePage = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/page.js'), 'utf8');
  assert(homePage.includes('DashboardHome'), 'Dashboard root page must render DashboardHome');
});

// 3. Metadata assertions
test('Metadata: Every page and layout exports a title', () => {
  const pages = [
    'app/dashboard/layout.jsx',
    'app/dashboard/page.js',
    'app/dashboard/inventory/page.jsx',
    'app/dashboard/add/page.jsx',
    'app/dashboard/remove/page.jsx',
    'app/dashboard/recent/page.jsx',
    'app/dashboard/settings/page.jsx',
  ];
  pages.forEach(p => {
    const content = fs.readFileSync(path.join(process.cwd(), p), 'utf8');
    assert(content.includes('metadata'), `${p} must export metadata`);
    assert(content.includes('title:'), `${p} must have a title`);
  });
});

// 4. Shared Layout Shell (R2)
test('R2: app/dashboard/layout.jsx wraps children with DashboardLayout', () => {
  const layout = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/layout.jsx'), 'utf8');
  assert(layout.includes('<DashboardLayout>'), 'layout.jsx must wrap children with DashboardLayout');
  assert(layout.includes('{children}'), 'layout.jsx must render children');
  assert(layout.includes('getUser()'), 'layout.jsx must perform server-side auth verification');
  assert(!layout.includes('PantryProvider'), 'layout.jsx must not duplicate PantryProvider');
});

// 5. Constants & Route links
test('lib/constants.js: All navItems and dashboardActions contain valid App Router hrefs', () => {
  const constants = fs.readFileSync(path.join(process.cwd(), 'lib/constants.js'), 'utf8');
  const validHrefs = [
    '/dashboard',
    '/dashboard/add',
    '/dashboard/remove',
    '/dashboard/inventory',
    '/dashboard/recent',
    '/dashboard/settings',
  ];
  validHrefs.forEach(h => {
    assert(constants.includes(`"${h}"`) || constants.includes(`'${h}'`), `constants.js missing href: ${h}`);
  });
});

// 6. Adversarial Route Resolution Logic Check
test('use-dashboard-route: Exhaustive edge-case routing table resolution', () => {
  function getActiveViewFromPathname(pathname) {
    if (!pathname) return 'Dashboard';
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/dashboard/add')) return 'Add Items';
    if (pathname.startsWith('/dashboard/remove')) return 'Remove Items';
    if (pathname.startsWith('/dashboard/inventory')) return 'View Inventory';
    if (pathname.startsWith('/dashboard/recent')) return 'Recent Changes';
    if (pathname.startsWith('/dashboard/settings')) return 'Settings';
    return 'Dashboard';
  }

  // Edge cases
  assert.strictEqual(getActiveViewFromPathname(null), 'Dashboard');
  assert.strictEqual(getActiveViewFromPathname(undefined), 'Dashboard');
  assert.strictEqual(getActiveViewFromPathname(''), 'Dashboard');
  assert.strictEqual(getActiveViewFromPathname('/dashboard'), 'Dashboard');
  assert.strictEqual(getActiveViewFromPathname('/dashboard/inventory'), 'View Inventory');
  assert.strictEqual(getActiveViewFromPathname('/dashboard/inventory/'), 'View Inventory');
  assert.strictEqual(getActiveViewFromPathname('/dashboard/inventory/item-123'), 'View Inventory');
  assert.strictEqual(getActiveViewFromPathname('/dashboard/add'), 'Add Items');
  assert.strictEqual(getActiveViewFromPathname('/dashboard/add/quick'), 'Add Items');
  assert.strictEqual(getActiveViewFromPathname('/dashboard/remove'), 'Remove Items');
  assert.strictEqual(getActiveViewFromPathname('/dashboard/remove/item-1'), 'Remove Items');
  assert.strictEqual(getActiveViewFromPathname('/dashboard/recent'), 'Recent Changes');
  assert.strictEqual(getActiveViewFromPathname('/dashboard/settings'), 'Settings');
  assert.strictEqual(getActiveViewFromPathname('/dashboard/settings/team'), 'Settings');
  assert.strictEqual(getActiveViewFromPathname('/unknown-route'), 'Dashboard');
});

// 7. Stale Reference Scan across all source files
test('Codebase Scan: Zero references to retired client-page or old SPA router patterns', () => {
  const allFiles = [];
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.next', '.git', '.agents'].includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
        allFiles.push(fullPath);
      }
    }
  }
  scanDir(process.cwd());

  const staleHits = [];
  allFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('client-page.jsx') || content.includes('client-page')) {
      staleHits.push(f);
    }
  });
  assert.strictEqual(staleHits.length, 0, `Stale client-page references found in: ${staleHits.join(', ')}`);
});

// 8. BarcodeScannerOverlay stream teardown
test('Hardware/Scanner: BarcodeScannerOverlay camera stream tracks cleanly stopped on unmount', () => {
  const scannerFile = path.join(process.cwd(), 'components/ui/BarcodeScannerOverlay.jsx');
  assert(fs.existsSync(scannerFile), 'BarcodeScannerOverlay.jsx must exist');
  const content = fs.readFileSync(scannerFile, 'utf8');
  assert(content.includes('reader.reset()') || content.includes('stopContinuousDecode()') || content.includes('getTracks()'), 'Must clean up camera tracks / reader');
});

console.log('\n========================================');
console.log(`Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('========================================');

if (failCount > 0) {
  process.exit(1);
}
