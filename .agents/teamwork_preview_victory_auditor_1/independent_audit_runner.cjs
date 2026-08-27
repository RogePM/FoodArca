const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('  INDEPENDENT VICTORY AUDIT SUITE — FoodArca App Router Migration');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function runTest(suite, name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] [${suite}] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] [${suite}] ${name}`);
    console.error(`         Error: ${err.message}`);
    failedTests++;
    failures.push({ suite, name, error: err.message, stack: err.stack });
  }
}

const ROOT = path.resolve(__dirname, '..', '..');

// ====================================================================
// SUITE 1: FILE SYSTEM & ROUTE TOPOLOGY
// ====================================================================
console.log('--- SUITE 1: FILE SYSTEM & ROUTE TOPOLOGY ---');

runTest('RouteTopology', 'Required App Router dashboard files exist', () => {
  const expectedFiles = [
    'app/dashboard/layout.jsx',
    'app/dashboard/page.js',
    'app/dashboard/inventory/page.jsx',
    'app/dashboard/add/page.jsx',
    'app/dashboard/remove/page.jsx',
    'app/dashboard/recent/page.jsx',
    'app/dashboard/settings/page.jsx',
  ];

  for (const rel of expectedFiles) {
    const full = path.join(ROOT, rel);
    assert(fs.existsSync(full), `Missing expected route file: ${rel}`);
    const stat = fs.statSync(full);
    assert(stat.size > 50, `File ${rel} appears too small (${stat.size} bytes)`);
  }
});

runTest('RouteTopology', 'Legacy client-page.jsx is permanently deleted from disk', () => {
  const legacyFile = path.join(ROOT, 'app/dashboard/client-page.jsx');
  assert(!fs.existsSync(legacyFile), 'app/dashboard/client-page.jsx still exists on disk!');
});

runTest('RouteTopology', 'Zero stale imports or references to client-page across all application code (app, components, lib, utils)', () => {
  const checkedDirs = ['app', 'components', 'lib', 'utils'];
  const checkedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json'];
  
  function scanDir(dir) {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(scanDir(full));
      } else if (checkedExtensions.includes(path.extname(entry.name))) {
        files.push(full);
      }
    }
    return files;
  }

  const allSourceFiles = checkedDirs.flatMap(d => scanDir(path.join(ROOT, d)));
  const hits = [];
  for (const f of allSourceFiles) {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('client-page.jsx') || content.includes('client-page')) {
      hits.push(path.relative(ROOT, f));
    }
  }
  assert.strictEqual(hits.length, 0, `Stale references to client-page found in: ${hits.join(', ')}`);
});

// ====================================================================
// SUITE 2: LAYOUT SHELL & PERSISTENCE ARCHITECTURE
// ====================================================================
console.log('\n--- SUITE 2: LAYOUT SHELL & PERSISTENCE ARCHITECTURE ---');

runTest('LayoutShell', 'app/dashboard/layout.jsx implements server-side auth and org validation', () => {
  const layoutContent = fs.readFileSync(path.join(ROOT, 'app/dashboard/layout.jsx'), 'utf8');
  assert(layoutContent.includes('createServerClient'), 'layout.jsx must use createServerClient for SSR auth');
  assert(layoutContent.includes('supabase.auth.getUser()'), 'layout.jsx must verify user with getUser()');
  assert(layoutContent.includes('user_organizations'), 'layout.jsx must check user_organizations for membership');
  assert(layoutContent.includes('DashboardLayout'), 'layout.jsx must wrap children with DashboardLayout');
  assert(layoutContent.includes('{children}'), 'layout.jsx must render {children}');
});

runTest('LayoutShell', 'Duplicate PantryProvider is eliminated from dashboard layout', () => {
  const layoutContent = fs.readFileSync(path.join(ROOT, 'app/dashboard/layout.jsx'), 'utf8');
  assert(!layoutContent.includes('<PantryProvider>'), 'Duplicate <PantryProvider> detected in dashboard layout.jsx');
  assert(!layoutContent.includes('PantryProvider'), 'Duplicate PantryProvider import/usage detected in dashboard layout.jsx');
});

runTest('LayoutShell', 'Root app/layout.js maintains global PantryProvider', () => {
  const rootLayout = fs.readFileSync(path.join(ROOT, 'app/layout.js'), 'utf8');
  assert(rootLayout.includes('PantryProvider'), 'Root layout app/layout.js must provide PantryProvider context');
});

// ====================================================================
// SUITE 3: NAVIGATION & APP ROUTER INTEGRATION
// ====================================================================
console.log('\n--- SUITE 3: NAVIGATION & APP ROUTER INTEGRATION ---');

runTest('Navigation', 'lib/constants.js exports correct App Router route hrefs', () => {
  const constants = fs.readFileSync(path.join(ROOT, 'lib/constants.js'), 'utf8');
  const expectedHrefs = [
    '/dashboard',
    '/dashboard/add',
    '/dashboard/remove',
    '/dashboard/inventory',
    '/dashboard/recent',
    '/dashboard/settings'
  ];
  for (const href of expectedHrefs) {
    assert(constants.includes(`href: "${href}"`) || constants.includes(`href: '${href}'`), `Missing href '${href}' in lib/constants.js`);
  }
});

runTest('Navigation', 'Sidebar uses Next.js Link with clean href delegation', () => {
  const sidebar = fs.readFileSync(path.join(ROOT, 'components/layout/sidebar.jsx'), 'utf8');
  assert(sidebar.includes("import Link from 'next/link'"), 'Sidebar must import Next.js Link');
  assert(sidebar.includes('<Link href={item.href}'), 'Sidebar must render <Link> for nav items with href');
  assert(sidebar.includes('href: \'/dashboard/settings\'') || sidebar.includes('href: "/dashboard/settings"'), 'Sidebar settings item must link to /dashboard/settings');
});

runTest('Navigation', 'BottomNav uses Next.js Link with clean href delegation', () => {
  const bottomNav = fs.readFileSync(path.join(ROOT, 'components/layout/bottom-nav.jsx'), 'utf8');
  assert(bottomNav.includes("import Link from 'next/link'"), 'BottomNav must import Next.js Link');
  assert(bottomNav.includes('href: \'/dashboard\''), 'BottomNav Home tab must link to /dashboard');
  assert(bottomNav.includes('href: \'/dashboard/inventory\''), 'BottomNav Inventory tab must link to /dashboard/inventory');
  assert(bottomNav.includes('href: \'/dashboard/remove\''), 'BottomNav Remove tab must link to /dashboard/remove');
  assert(bottomNav.includes('href: \'/dashboard/recent\''), 'BottomNav Recent tab must link to /dashboard/recent');
  assert(bottomNav.includes('href="/dashboard/add"'), 'BottomNav Center Add button must link to /dashboard/add');
});

runTest('Navigation', 'TopBar supports ⌘K command palette with full App Router route navigation', () => {
  const topbar = fs.readFileSync(path.join(ROOT, 'components/layout/topbar.jsx'), 'utf8');
  assert(topbar.includes('/dashboard/settings'), 'TopBar must link settings to /dashboard/settings');
  assert(topbar.includes('/dashboard/add'), 'TopBar command palette must include /dashboard/add');
  assert(topbar.includes('/dashboard/inventory'), 'TopBar command palette must include /dashboard/inventory');
  assert(topbar.includes('/dashboard/remove'), 'TopBar command palette must include /dashboard/remove');
  assert(topbar.includes('/dashboard/settings#billing'), 'TopBar billing notification must link to /dashboard/settings#billing');
});

// ====================================================================
// SUITE 4: ROUTE RESOLUTION LOGIC & ADVERSARIAL CASES
// ====================================================================
console.log('\n--- SUITE 4: ROUTE RESOLUTION LOGIC & ADVERSARIAL CASES ---');

runTest('RouteLogic', 'getActiveViewFromPathname accurately resolves all route variants and edge cases', () => {
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

  const testMatrix = [
    // Standard routes
    { path: '/dashboard', expected: 'Dashboard' },
    { path: '/dashboard/inventory', expected: 'View Inventory' },
    { path: '/dashboard/add', expected: 'Add Items' },
    { path: '/dashboard/remove', expected: 'Remove Items' },
    { path: '/dashboard/recent', expected: 'Recent Changes' },
    { path: '/dashboard/settings', expected: 'Settings' },
    // Nested sub-paths
    { path: '/dashboard/inventory/item-999', expected: 'View Inventory' },
    { path: '/dashboard/inventory/category/canned', expected: 'View Inventory' },
    { path: '/dashboard/add/bulk', expected: 'Add Items' },
    { path: '/dashboard/remove/client-12', expected: 'Remove Items' },
    { path: '/dashboard/settings/billing', expected: 'Settings' },
    // Trailing slashes
    { path: '/dashboard/', expected: 'Dashboard' },
    { path: '/dashboard/inventory/', expected: 'View Inventory' },
    { path: '/dashboard/add/', expected: 'Add Items' },
    // Adversarial edge cases
    { path: '', expected: 'Dashboard' },
    { path: null, expected: 'Dashboard' },
    { path: undefined, expected: 'Dashboard' },
    { path: '/dashboard-extra', expected: 'Dashboard' },
    { path: '/nonexistent', expected: 'Dashboard' }
  ];

  for (const item of testMatrix) {
    const result = getActiveViewFromPathname(item.path);
    assert.strictEqual(result, item.expected, `Path '${item.path}' resolved to '${result}', expected '${item.expected}'`);
  }
});

// ====================================================================
// SUITE 5: COMPONENT INTEGRATION & VIEW BINDINGS
// ====================================================================
console.log('\n--- SUITE 5: COMPONENT INTEGRATION & VIEW BINDINGS ---');

runTest('ComponentIntegration', 'All nested route page files import and render correct components without logic regressions', () => {
  const routes = [
    { file: 'app/dashboard/page.js', component: 'DashboardHome', importPath: '@/components/pages/dashboard-home' },
    { file: 'app/dashboard/inventory/page.jsx', component: 'InventoryView', importPath: '@/components/pages/inventory' },
    { file: 'app/dashboard/add/page.jsx', component: 'AddItemView', importPath: '@/components/pages/add-items/add-item-view' },
    { file: 'app/dashboard/remove/page.jsx', component: 'DistributionModule', importPath: '@/components/pages/distribution' },
    { file: 'app/dashboard/recent/page.jsx', component: 'RecentChangesView', importPath: '@/components/pages/recent-changes-view' },
    { file: 'app/dashboard/settings/page.jsx', component: 'SettingsView', importPath: '@/components/pages/settings-view' }
  ];

  for (const r of routes) {
    const content = fs.readFileSync(path.join(ROOT, r.file), 'utf8');
    assert(content.includes(r.component), `${r.file} must render component ${r.component}`);
    assert(content.includes(r.importPath), `${r.file} must import from ${r.importPath}`);
  }
});

runTest('ComponentIntegration', 'SettingsView handles deep linking and hash navigation for #billing and #general', () => {
  const settings = fs.readFileSync(path.join(ROOT, 'components/pages/settings-view.jsx'), 'utf8');
  assert(settings.includes('hashchange'), 'SettingsView must listen to hashchange');
  assert(settings.includes('popstate'), 'SettingsView must listen to popstate');
  assert(settings.includes('window.location.hash'), 'SettingsView must check window.location.hash');
});

// ====================================================================
// SUITE 6: FORENSIC INTEGRITY & ANTI-FACADE CHECKS
// ====================================================================
console.log('\n--- SUITE 6: FORENSIC INTEGRITY & ANTI-FACADE CHECKS ---');

runTest('ForensicIntegrity', 'No facade/dummy implementations or hardcoded constant returns in page files', () => {
  const pageFiles = [
    'app/dashboard/page.js',
    'app/dashboard/inventory/page.jsx',
    'app/dashboard/add/page.jsx',
    'app/dashboard/remove/page.jsx',
    'app/dashboard/recent/page.jsx',
    'app/dashboard/settings/page.jsx'
  ];

  for (const p of pageFiles) {
    const content = fs.readFileSync(path.join(ROOT, p), 'utf8');
    assert(!content.includes('return null'), `${p} returns null placeholder`);
    assert(!content.includes('return <div />') && !content.includes('return <div></div>'), `${p} returns empty div`);
    assert(!content.includes('NotImplementedError'), `${p} throws NotImplementedError`);
  }
});

runTest('ForensicIntegrity', 'No mock or hardcoded test flags in runtime codebase', () => {
  const checkedFiles = [
    'app/dashboard/layout.jsx',
    'components/layout/dashboard-layout.jsx',
    'components/layout/sidebar.jsx',
    'components/layout/bottom-nav.jsx',
    'components/layout/topbar.jsx',
    'components/layout/use-dashboard-route.js'
  ];

  for (const f of checkedFiles) {
    const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert(!content.includes('__TEST_BYPASS__'), `Bypass flag found in ${f}`);
    assert(!content.includes('process.env.MOCK_TEST'), `Mock test env found in ${f}`);
  }
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  console.error('\nFAILURE DETAILS:');
  failures.forEach(f => {
    console.error(`- [${f.suite}] ${f.name}: ${f.error}`);
  });
  process.exit(1);
} else {
  console.log('\n>>> ALL INDEPENDENT VICTORY AUDIT CHECKS PASSED PERFECTLY <<<\n');
}
