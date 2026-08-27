const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..', '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

console.log('====================================================');
console.log('INDEPENDENT VICTORY AUDITOR SUITE (v4)');
console.log('Target: FoodArca App Router Nested Routes Migration');
console.log('====================================================\n');

// ----------------------------------------------------
// Section 1: Route Directory & Page File Structure
// ----------------------------------------------------
const expectedRoutes = [
  { dir: 'app/dashboard', page: 'app/dashboard/page.js', componentName: 'DashboardHome', title: 'Overview | Food Arca' },
  { dir: 'app/dashboard/inventory', page: 'app/dashboard/inventory/page.jsx', componentName: 'InventoryView', title: 'Inventory | Food Arca' },
  { dir: 'app/dashboard/add', page: 'app/dashboard/add/page.jsx', componentName: 'AddItemView', title: 'Add Items | Food Arca' },
  { dir: 'app/dashboard/remove', page: 'app/dashboard/remove/page.jsx', componentName: 'DistributionModule', title: 'Remove Items | Food Arca' },
  { dir: 'app/dashboard/recent', page: 'app/dashboard/recent/page.jsx', componentName: 'RecentChangesView', title: 'Recent Changes | Food Arca' },
  { dir: 'app/dashboard/settings', page: 'app/dashboard/settings/page.jsx', componentName: 'SettingsView', title: 'Settings | Food Arca' },
];

for (const route of expectedRoutes) {
  runTest(`Route Directory Exists: ${route.dir}`, () => {
    const fullDir = path.join(rootDir, route.dir);
    assert(fs.existsSync(fullDir), `Directory ${route.dir} does not exist`);
    assert(fs.statSync(fullDir).isDirectory(), `${route.dir} is not a directory`);
  });

  runTest(`Route Page File Exists & Non-Empty: ${route.page}`, () => {
    const fullPage = path.join(rootDir, route.page);
    assert(fs.existsSync(fullPage), `Page file ${route.page} does not exist`);
    const content = fs.readFileSync(fullPage, 'utf8');
    assert(content.length > 50, `Page file ${route.page} is suspiciously empty or facade`);
    assert(content.includes('export default'), `Page ${route.page} missing default export`);
    assert(content.includes(route.componentName), `Page ${route.page} does not import/render ${route.componentName}`);
    assert(content.includes(route.title), `Page ${route.page} missing expected metadata title "${route.title}"`);
  });
}

// ----------------------------------------------------
// Section 2: Legacy Client-Page Retirement
// ----------------------------------------------------
runTest('Legacy client-page.jsx is physically deleted', () => {
  const legacyPath = path.join(rootDir, 'app/dashboard/client-page.jsx');
  assert(!fs.existsSync(legacyPath), `Legacy client-page.jsx still exists at ${legacyPath}`);
});

runTest('Zero references to client-page in app/, components/, lib/', () => {
  function scanDir(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git' && entry.name !== '.agents') {
          files = files.concat(scanDir(full));
        }
      } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        files.push(full);
      }
    }
    return files;
  }

  const srcDirs = ['app', 'components', 'lib'].map(d => path.join(rootDir, d)).filter(fs.existsSync);
  let allSrcFiles = [];
  for (const d of srcDirs) {
    allSrcFiles = allSrcFiles.concat(scanDir(d));
  }

  const violations = [];
  for (const file of allSrcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('client-page')) {
      violations.push(path.relative(rootDir, file));
    }
  }

  assert.strictEqual(violations.length, 0, `Stale references to client-page found in: ${violations.join(', ')}`);
});

// ----------------------------------------------------
// Section 3: Shared Layout Shell Architecture
// ----------------------------------------------------
runTest('Server Layout app/dashboard/layout.jsx verifies Auth, Org, and renders DashboardLayout', () => {
  const layoutPath = path.join(rootDir, 'app/dashboard/layout.jsx');
  assert(fs.existsSync(layoutPath), 'app/dashboard/layout.jsx does not exist');
  const content = fs.readFileSync(layoutPath, 'utf8');

  assert(content.includes('createServerClient'), 'Missing createServerClient in layout.jsx');
  assert(content.includes('supabase.auth.getUser()'), 'Missing auth user check in layout.jsx');
  assert(content.includes('user_organizations'), 'Missing user_organizations check in layout.jsx');
  assert(content.includes('<DashboardLayout>'), 'Missing DashboardLayout wrapping in layout.jsx');
  assert(content.includes('{children}'), 'Missing children rendering in layout.jsx');
});

runTest('Client DashboardLayout components/layout/dashboard-layout.jsx renders Sidebar, TopBar, BottomNav, and main children', () => {
  const dashLayoutPath = path.join(rootDir, 'components/layout/dashboard-layout.jsx');
  assert(fs.existsSync(dashLayoutPath), 'components/layout/dashboard-layout.jsx does not exist');
  const content = fs.readFileSync(dashLayoutPath, 'utf8');

  assert(content.includes('<Sidebar'), 'Missing Sidebar in DashboardLayout');
  assert(content.includes('<TopBar'), 'Missing TopBar in DashboardLayout');
  assert(content.includes('<BottomNav'), 'Missing BottomNav in DashboardLayout');
  assert(content.includes('<main'), 'Missing main tag in DashboardLayout');
  assert(content.includes('{children}'), 'Missing children in DashboardLayout');
});

// ----------------------------------------------------
// Section 4: Route Hook & Navigation Logic Source Audit
// ----------------------------------------------------
runTest('use-dashboard-route.js contains accurate route mappings and active view resolver', () => {
  const hookPath = path.join(rootDir, 'components/layout/use-dashboard-route.js');
  assert(fs.existsSync(hookPath), 'components/layout/use-dashboard-route.js does not exist');
  const content = fs.readFileSync(hookPath, 'utf8');

  // Verify route mapping definitions
  assert(content.includes("'/dashboard': 'Dashboard'"), 'Missing /dashboard mapping');
  assert(content.includes("'/dashboard/add': 'Add Items'"), 'Missing /dashboard/add mapping');
  assert(content.includes("'/dashboard/remove': 'Remove Items'"), 'Missing /dashboard/remove mapping');
  assert(content.includes("'/dashboard/inventory': 'View Inventory'"), 'Missing /dashboard/inventory mapping');
  assert(content.includes("'/dashboard/recent': 'Recent Changes'"), 'Missing /dashboard/recent mapping');
  assert(content.includes("'/dashboard/settings': 'Settings'"), 'Missing /dashboard/settings mapping');

  // Verify path matching logic
  assert(content.includes("pathname.startsWith('/dashboard/add')"), 'Missing startsWith /dashboard/add');
  assert(content.includes("pathname.startsWith('/dashboard/remove')"), 'Missing startsWith /dashboard/remove');
  assert(content.includes("pathname.startsWith('/dashboard/inventory')"), 'Missing startsWith /dashboard/inventory');
  assert(content.includes("pathname.startsWith('/dashboard/recent')"), 'Missing startsWith /dashboard/recent');
  assert(content.includes("pathname.startsWith('/dashboard/settings')"), 'Missing startsWith /dashboard/settings');
});

runTest('lib/constants.js navItems and dashboardActions contain valid href routes', () => {
  const constantsPath = path.join(rootDir, 'lib/constants.js');
  const content = fs.readFileSync(constantsPath, 'utf8');

  const expectedHrefs = ['/dashboard', '/dashboard/add', '/dashboard/remove', '/dashboard/inventory', '/dashboard/recent', '/dashboard/settings'];
  for (const href of expectedHrefs) {
    assert(content.includes(`"${href}"`) || content.includes(`'${href}'`), `Missing href "${href}" in constants.js`);
  }
});

// ----------------------------------------------------
// Section 5: Component Integrity & Imports
// ----------------------------------------------------
runTest('All target views exist and are valid components', () => {
  const componentPaths = [
    'components/pages/dashboard-home.jsx',
    'components/pages/inventory/index.jsx',
    'components/pages/add-items/add-item-view.jsx',
    'components/pages/distribution/index.jsx',
    'components/pages/recent-changes-view.jsx',
    'components/pages/settings-view.jsx',
  ];

  for (const compPath of componentPaths) {
    const full = path.join(rootDir, compPath);
    assert(fs.existsSync(full), `Target view ${compPath} does not exist`);
    const stat = fs.statSync(full);
    assert(stat.size > 200, `Target view ${compPath} is suspiciously small (${stat.size} bytes)`);
  }
});

// ----------------------------------------------------
// Section 6: Sidebar and BottomNav Href Integration
// ----------------------------------------------------
runTest('Sidebar and BottomNav utilize Next.js <Link> with accurate hrefs', () => {
  const sidebarPath = path.join(rootDir, 'components/layout/sidebar.jsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  assert(sidebarContent.includes('<Link'), 'Sidebar must use Next.js <Link>');
  assert(sidebarContent.includes('href={item.href}'), 'Sidebar must pass item.href to Link');

  const bottomNavPath = path.join(rootDir, 'components/layout/bottom-nav.jsx');
  const bottomNavContent = fs.readFileSync(bottomNavPath, 'utf8');
  assert(bottomNavContent.includes('<Link'), 'BottomNav must use Next.js <Link>');
  assert(bottomNavContent.includes('/dashboard/add'), 'BottomNav must link to /dashboard/add');
});

console.log('\n----------------------------------------------------');
console.log(`Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('----------------------------------------------------');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL INDEPENDENT VERIFICATION TESTS PASSED!\n');
}
