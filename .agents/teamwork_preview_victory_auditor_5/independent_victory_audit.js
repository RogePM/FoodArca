// Independent Victory Audit Suite
// Author: teamwork_preview_victory_auditor_5
const http = require('http');
const fs = require('fs');
const path = require('path');

async function fetchJson(endpoint) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${endpoint}`));
    });
  });
}

async function runAudit() {
  console.log('========================================================');
  console.log('VICTORY AUDITOR 5 — INDEPENDENT VERIFICATION SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(message);
    }
    passed++;
    console.log(`✅ PASSED: ${message}`);
  }

  // Section 1: Backend API Acceptance Criteria
  console.log('\n--- Section 1: Backend API Acceptance Criteria ---');
  
  // 1.1 Standard Queries across various categories
  const testCases = [
    { q: 'Heirloom Tomatoes', cat: 'produce' },
    { q: 'Organic Black Beans', cat: 'canned_goods' },
    { q: 'Cheddar Cheese Block', cat: 'dairy' },
    { q: 'Sourdough Bread', cat: 'bakery' },
    { q: 'Orange Juice Pulp Free', cat: 'drinks' },
    { q: 'Boneless Chicken Thighs', cat: 'meat' },
    { q: 'Basmati Rice', cat: 'dry_goods' },
    { q: 'Frozen Blueberries', cat: 'frozen' },
  ];

  for (const tc of testCases) {
    const res = await fetchJson(`/api/foods/image-search?q=${encodeURIComponent(tc.q)}&category=${encodeURIComponent(tc.cat)}`);
    assert(res.status === 200, `Status 200 for ${tc.q} (${tc.cat})`);
    assert(Array.isArray(res.data.images), `Images array returned for ${tc.q}`);
    assert(res.data.images.length >= 3 && res.data.images.length <= 4, `Expected 3-4 images for ${tc.q}, got ${res.data.images.length}`);
    for (const img of res.data.images) {
      assert(img.startsWith('http://') || img.startsWith('https://'), `Valid image URL format: ${img.slice(0, 50)}...`);
    }
  }

  // 1.2 Inappropriate Content & Biasing
  console.log('\n--- Section 2: Safe-Search & Food Biasing Verification ---');
  
  // 2.1 Backend actively sanitizes and biases search toward food products
  const unsafeWithFood = await fetchJson('/api/foods/image-search?q=gun%20sexy%20corn%20flakes%20porn&category=dry_goods');
  assert(unsafeWithFood.status === 200, 'Status 200 for query with inappropriate words');
  assert(Array.isArray(unsafeWithFood.data.images) && unsafeWithFood.data.images.length >= 3, 'Returns safe packaging images even when bad words are present');
  for (const img of unsafeWithFood.data.images) {
    assert(!img.toLowerCase().includes('gun') && !img.toLowerCase().includes('porn') && !img.toLowerCase().includes('sexy'), `Image URL is safe and untainted: ${img.slice(0, 50)}`);
  }

  // 2.2 Queries containing ONLY inappropriate content
  const onlyBlocked = [
    'porn sex xxx',
    'gun weapon murder',
    'cocaine heroin meth drug'
  ];
  for (const bq of onlyBlocked) {
    const res = await fetchJson(`/api/foods/image-search?q=${encodeURIComponent(bq)}`);
    assert(res.status === 200, `Status 200 for blocked query "${bq}"`);
    assert(Array.isArray(res.data.images) && res.data.images.length === 0, `Blocked query "${bq}" returns 0 images`);
    assert(res.data.message && res.data.message.includes('No valid food product search terms'), `Friendly refusal message for "${bq}"`);
  }

  // 2.3 Short / empty queries
  const emptyQuery = await fetchJson('/api/foods/image-search');
  assert(Array.isArray(emptyQuery.data.images) && emptyQuery.data.images.length === 0, 'Empty query returns 0 images');
  const singleChar = await fetchJson('/api/foods/image-search?q=x');
  assert(Array.isArray(singleChar.data.images) && singleChar.data.images.length === 0, 'Single character query returns 0 images');

  // Section 3: Performance, Caching & Concurrency
  console.log('\n--- Section 3: Performance & Concurrency ---');
  const cacheKey = 'Organic Black Beans';
  const t0 = Date.now();
  const cachedRes = await fetchJson(`/api/foods/image-search?q=${encodeURIComponent(cacheKey)}&category=canned_goods`);
  const t1 = Date.now();
  assert(cachedRes.data.cached === true, 'Response served from cache');
  assert(t1 - t0 < 100, `Cached response served rapidly (${t1 - t0}ms)`);

  // Parallel requests
  const parItems = ['Almond Milk', 'Oat Milk', 'Soy Milk', 'Coconut Milk'];
  const parPromises = parItems.map(item => fetchJson(`/api/foods/image-search?q=${encodeURIComponent(item)}&category=dairy`));
  const parResults = await Promise.all(parPromises);
  for (let i = 0; i < parItems.length; i++) {
    assert(parResults[i].status === 200, `Parallel request ${parItems[i]} returned 200`);
    assert(parResults[i].data.images.length >= 3, `Parallel request ${parItems[i]} returned >=3 images`);
  }

  // Section 4: Frontend Architecture & Integration Static Audit
  console.log('\n--- Section 4: Frontend Architecture & Code Forensics ---');
  const rootDir = path.resolve(__dirname, '../../');
  const manualEntryPath = path.join(rootDir, 'components/pages/add-items/mobile-manual-entry-view.jsx');
  const pickerPath = path.join(rootDir, 'components/pages/add-items/product-image-picker.jsx');
  const putApiPath = path.join(rootDir, 'app/api/foods/[id]/route.js');

  const manualEntryCode = fs.readFileSync(manualEntryPath, 'utf8');
  const pickerCode = fs.readFileSync(pickerPath, 'utf8');
  const putApiCode = fs.readFileSync(putApiPath, 'utf8');

  // Check Suspense pattern
  assert(manualEntryCode.includes('<Suspense fallback={<ProductImagePickerSkeleton />}>'), 'Manual entry form implements Next.js Suspense boundary');
  assert(pickerCode.includes('export function ProductImagePickerSkeleton'), 'ProductImagePicker exports ProductImagePickerSkeleton');

  // Check two-state UI implementation
  assert(pickerCode.includes('!isExpanded') && pickerCode.includes('isExpanded'), 'Two-state UI with isExpanded toggle implemented');
  assert(pickerCode.includes('Find product image'), 'State 1 intuitive trigger button exists');
  assert(pickerCode.includes('Photo attached'), 'State 1 selected photo preview exists');
  assert(pickerCode.includes('Choose packaging image'), 'State 2 expanded options view exists');

  // Check state attachment
  assert(pickerCode.includes('onSelectPhoto(url)'), 'Selecting an image invokes onSelectPhoto callback');
  assert(manualEntryCode.includes('onSelectPhoto={(url) => setFormPhotoUrl(url)}'), 'Manual entry binds onSelectPhoto to formPhotoUrl state');
  assert(manualEntryCode.includes('photoUrl: formPhotoUrl'), 'handleSave attaches formPhotoUrl to newItem payload');

  // Check PUT endpoint persistence
  assert(putApiCode.includes('catUpdate.photo_url = data.photoUrl || null'), 'PUT endpoint saves photoUrl to catalog_items.photo_url');

  // Check referrer policy and security
  assert(pickerCode.includes('referrerPolicy="no-referrer"'), 'Referrer policy set to prevent hotlink blocking');
  assert(manualEntryCode.includes('referrerPolicy="no-referrer"'), 'Manual entry suggestions use no-referrer policy');

  console.log('\n========================================================');
  console.log(`🎉 ALL ${passed}/${total} INDEPENDENT VERIFICATION CHECKS PASSED! 🎉`);
  console.log('========================================================\n');
}

runAudit().catch(err => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
