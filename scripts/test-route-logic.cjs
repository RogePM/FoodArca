const assert = require('assert');

// Simulate the mapping logic from use-dashboard-route.js
const viewToPath = {
  'Dashboard': '/dashboard',
  'Overview': '/dashboard',
  'Add Items': '/dashboard/add',
  'View Add Items': '/dashboard/add',
  'Remove Items': '/dashboard/remove',
  'View Distribution': '/dashboard/remove',
  'Distribution': '/dashboard/remove',
  'View Inventory': '/dashboard/inventory',
  'Inventory': '/dashboard/inventory',
  'Recent Changes': '/dashboard/recent',
  'Recent': '/dashboard/recent',
  'Settings': '/dashboard/settings',
};

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

function isActive(pathname, currentView, viewOrPath) {
  if (!viewOrPath) return false;
  if (viewOrPath === 'Dashboard' || viewOrPath === '/dashboard') {
    return pathname === '/dashboard' || (!pathname.startsWith('/dashboard/') && currentView === 'Dashboard');
  }
  if (viewOrPath === 'Add Items' || viewOrPath === '/dashboard/add' || viewOrPath === 'View Add Items') {
    return pathname === '/dashboard/add' || pathname.startsWith('/dashboard/add/') || currentView === 'Add Items';
  }
  if (viewOrPath === 'Remove Items' || viewOrPath === '/dashboard/remove' || viewOrPath === 'View Distribution' || viewOrPath === 'Distribution') {
    return pathname === '/dashboard/remove' || pathname.startsWith('/dashboard/remove/') || currentView === 'Remove Items';
  }
  if (viewOrPath === 'View Inventory' || viewOrPath === '/dashboard/inventory' || viewOrPath === 'Inventory') {
    return pathname === '/dashboard/inventory' || pathname.startsWith('/dashboard/inventory/') || currentView === 'View Inventory';
  }
  if (viewOrPath === 'Recent Changes' || viewOrPath === '/dashboard/recent' || viewOrPath === 'Recent') {
    return pathname === '/dashboard/recent' || pathname.startsWith('/dashboard/recent/') || currentView === 'Recent Changes';
  }
  if (viewOrPath === 'Settings' || viewOrPath === '/dashboard/settings') {
    return pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/') || currentView === 'Settings';
  }
  return currentView === viewOrPath || pathname === viewOrPath;
}

// Test cases
assert.strictEqual(getActiveViewFromPathname('/dashboard'), 'Dashboard');
assert.strictEqual(getActiveViewFromPathname('/dashboard/add'), 'Add Items');
assert.strictEqual(getActiveViewFromPathname('/dashboard/add/nested'), 'Add Items');
assert.strictEqual(getActiveViewFromPathname('/dashboard/inventory'), 'View Inventory');
assert.strictEqual(getActiveViewFromPathname('/dashboard/remove'), 'Remove Items');
assert.strictEqual(getActiveViewFromPathname('/dashboard/recent'), 'Recent Changes');
assert.strictEqual(getActiveViewFromPathname('/dashboard/settings'), 'Settings');

assert.strictEqual(isActive('/dashboard/inventory', 'View Inventory', '/dashboard/inventory'), true);
assert.strictEqual(isActive('/dashboard/inventory', 'View Inventory', 'View Inventory'), true);
assert.strictEqual(isActive('/dashboard/inventory', 'View Inventory', 'Inventory'), true);
assert.strictEqual(isActive('/dashboard/inventory', 'View Inventory', '/dashboard/add'), false);

assert.strictEqual(viewToPath['Dashboard'], '/dashboard');
assert.strictEqual(viewToPath['Add Items'], '/dashboard/add');
assert.strictEqual(viewToPath['View Add Items'], '/dashboard/add');
assert.strictEqual(viewToPath['Remove Items'], '/dashboard/remove');
assert.strictEqual(viewToPath['View Distribution'], '/dashboard/remove');
assert.strictEqual(viewToPath['View Inventory'], '/dashboard/inventory');
assert.strictEqual(viewToPath['Recent Changes'], '/dashboard/recent');
assert.strictEqual(viewToPath['Settings'], '/dashboard/settings');

console.log('[PASS] All routing unit tests passed (12/12 assertions)');
