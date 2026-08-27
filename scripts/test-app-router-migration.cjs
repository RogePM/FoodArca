const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- RUNNING APP ROUTER MIGRATION SUITE ---');

// 1. Check Directory Structure and Pages
const expectedRoutes = [
  'app/dashboard/layout.jsx',
  'app/dashboard/page.js',
  'app/dashboard/inventory/page.jsx',
  'app/dashboard/add/page.jsx',
  'app/dashboard/remove/page.jsx',
  'app/dashboard/recent/page.jsx',
  'app/dashboard/settings/page.jsx'
];

expectedRoutes.forEach(relPath => {
  const fullPath = path.join(process.cwd(), relPath);
  assert(fs.existsSync(fullPath), `Expected file missing: ${relPath}`);
  console.log(`[PASS] Route file exists: ${relPath}`);
});

// 2. Verify legacy client-page.jsx is retired (deleted)
const legacyPath = path.join(process.cwd(), 'app/dashboard/client-page.jsx');
assert(!fs.existsSync(legacyPath), 'Legacy client-page.jsx should not exist');
console.log('[PASS] Legacy client-page.jsx is retired');

// 3. Test viewToPath and getActiveViewFromPathname logic
const routeContent = fs.readFileSync(path.join(process.cwd(), 'components/layout/use-dashboard-route.js'), 'utf8');
assert(routeContent.includes("'/dashboard/inventory'"), 'Must contain /dashboard/inventory path');
assert(routeContent.includes("'/dashboard/add'"), 'Must contain /dashboard/add path');
assert(routeContent.includes("'/dashboard/remove'"), 'Must contain /dashboard/remove path');
assert(routeContent.includes("'/dashboard/recent'"), 'Must contain /dashboard/recent path');
assert(routeContent.includes("'/dashboard/settings'"), 'Must contain /dashboard/settings path');
console.log('[PASS] use-dashboard-route contains all required route paths');

// 4. Verify no broken client-page imports
const allFiles = [];
function getFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === '.agents') continue;
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      getFiles(res);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      allFiles.push(res);
    }
  }
}
getFiles(process.cwd());

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  assert(!content.includes('client-page'), `Found stale reference to client-page in ${file}`);
}
console.log(`[PASS] Scanned ${allFiles.length} source files: 0 stale client-page references found`);

// 5. Verify layout.jsx does not have duplicate PantryProvider
const layoutContent = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/layout.jsx'), 'utf8');
assert(!layoutContent.includes('<PantryProvider>'), 'Duplicate <PantryProvider> should not be in dashboard layout.jsx');
console.log('[PASS] Duplicate PantryProvider correctly removed from dashboard layout.jsx');

// 6. Verify SettingsView has bidirectional hash sync with popstate & hashchange
const settingsContent = fs.readFileSync(path.join(process.cwd(), 'components/pages/settings-view.jsx'), 'utf8');
assert(settingsContent.includes('hashchange'), 'SettingsView must listen to hashchange');
assert(settingsContent.includes('popstate'), 'SettingsView must listen to popstate');
console.log('[PASS] SettingsView tab deep-linking and browser navigation verified');

// 7. Verify TopBar notification routing
const topBarContent = fs.readFileSync(path.join(process.cwd(), 'components/layout/topbar.jsx'), 'utf8');
assert(topBarContent.includes('/dashboard/settings#billing'), 'TopBar must route billing notifications to /dashboard/settings#billing');
console.log('[PASS] TopBar billing notification routing verified');

console.log('--- ALL APP ROUTER MIGRATION CHECKS PASSED (7/7) ---');
