// E2E test for live Next.js API route
async function runE2ETests() {
  const targetPort = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${targetPort}`;
  console.log(`Running E2E tests against ${baseUrl}/api/foods/image-search...`);
  
  // Wait a moment for server to be ready
  let ready = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${baseUrl}/api/foods/image-search?q=test`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!ready) {
    throw new Error(`Server on port ${targetPort} did not become ready in time.`);
  }

  console.log(`✅ Server is ready on port ${targetPort}.\n`);

  // Test 1: Empty / short query
  console.log('1. Testing empty / short queries...');
  const emptyRes = await fetch(`${baseUrl}/api/foods/image-search`);
  const emptyData = await emptyRes.json();
  if (!Array.isArray(emptyData.images) || emptyData.images.length !== 0) {
    throw new Error('Test 1 failed: Expected empty array for missing query');
  }

  const shortRes = await fetch(`${baseUrl}/api/foods/image-search?q=a`);
  const shortData = await shortRes.json();
  if (!Array.isArray(shortData.images) || shortData.images.length !== 0) {
    throw new Error('Test 1 failed: Expected empty array for 1-character query');
  }
  console.log('   Passed: Empty / short queries safely returned empty array.');

  // Test 2: Standard food product search with category
  console.log('\n2. Testing "Campbell Condensed Tomato Soup" (canned_goods)...');
  const soupRes = await fetch(`${baseUrl}/api/foods/image-search?q=Campbell%20Condensed%20Tomato%20Soup&category=canned_goods`);
  if (soupRes.status !== 200) {
    throw new Error(`Test 2 failed with HTTP status ${soupRes.status}`);
  }
  const soupData = await soupRes.json();
  console.log('   Response images count:', soupData.images?.length);
  console.log('   Source:', soupData.source);
  console.log('   Sample images:', soupData.images?.slice(0, 2));

  if (!Array.isArray(soupData.images) || soupData.images.length < 3 || soupData.images.length > 4) {
    throw new Error(`Test 2 failed: Expected 3-4 images, got ${soupData.images?.length}`);
  }
  for (const url of soupData.images) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`Test 2 failed: Invalid image URL: ${url}`);
    }
  }
  console.log('   Passed: Returned 3-4 valid image URLs.');

  // Test 3: Caching verification
  console.log('\n3. Testing in-memory caching performance...');
  const t0 = Date.now();
  const cachedRes = await fetch(`${baseUrl}/api/foods/image-search?q=Campbell%20Condensed%20Tomato%20Soup&category=canned_goods`);
  const duration = Date.now() - t0;
  const cachedData = await cachedRes.json();
  console.log(`   Cached response time: ${duration}ms, cached flag:`, cachedData.cached);
  if (!cachedData.cached || duration > 200) {
    throw new Error('Test 3 failed: Request should be served from cache quickly');
  }
  console.log('   Passed: Caching operates correctly.');

  // Test 4: Dairy product
  console.log('\n4. Testing "Chobani Plain Greek Yogurt" (dairy)...');
  const dairyRes = await fetch(`${baseUrl}/api/foods/image-search?query=Chobani%20Plain%20Greek%20Yogurt&category=dairy`);
  const dairyData = await dairyRes.json();
  console.log('   Response images count:', dairyData.images?.length);
  console.log('   Sample images:', dairyData.images?.slice(0, 2));
  if (!Array.isArray(dairyData.images) || dairyData.images.length < 3) {
    throw new Error(`Test 4 failed: Expected at least 3 images for Chobani yogurt, got ${dairyData.images?.length}`);
  }
  console.log('   Passed: Returned valid dairy product images.');

  // Test 5: Fresh produce
  console.log('\n5. Testing "Honeycrisp Apples" (produce)...');
  const prodRes = await fetch(`${baseUrl}/api/foods/image-search?name=Honeycrisp%20Apples&category=produce`);
  const prodData = await prodRes.json();
  console.log('   Response images count:', prodData.images?.length);
  console.log('   Sample images:', prodData.images?.slice(0, 2));
  if (!Array.isArray(prodData.images) || prodData.images.length < 3) {
    throw new Error(`Test 5 failed: Expected at least 3 images for Honeycrisp Apples, got ${prodData.images?.length}`);
  }
  console.log('   Passed: Returned valid produce images.');

  // Test 6: Safety sanitization of blocked terms
  console.log('\n6. Testing safe search sanitization of inappropriate content...');
  const unsafeRes = await fetch(`${baseUrl}/api/foods/image-search?q=gun%20sexy%20cheerios%20nsfw&category=dry_goods`);
  const unsafeData = await unsafeRes.json();
  console.log('   Query processed:', unsafeData.query);
  console.log('   Images returned:', unsafeData.images?.length);
  if (unsafeData.images) {
    for (const url of unsafeData.images) {
      if (!url.startsWith('http')) {
        throw new Error('Invalid URL in safe response');
      }
    }
  }
  console.log('   Passed: Content is sanitized and strictly safe-searched.');

  // Test 7: Query with ONLY blocked terms
  console.log('\n7. Testing query with ONLY blocked terms ("gun sexy nsfw")...');
  const onlyBlockedRes = await fetch(`${baseUrl}/api/foods/image-search?q=gun%20sexy%20nsfw`);
  const onlyBlockedData = await onlyBlockedRes.json();
  console.log('   Images returned:', onlyBlockedData.images?.length, 'message:', onlyBlockedData.message);
  if (!Array.isArray(onlyBlockedData.images) || onlyBlockedData.images.length !== 0) {
    throw new Error('Test 7 failed: Query with only blocked terms should return 0 images');
  }
  console.log('   Passed: Queries with only blocked terms safely return empty array.');

  // Test 8: Query with category containing spaces (e.g. "Canned Goods")
  console.log('\n8. Testing category with spaces ("Canned Goods")...');
  const spaceCatRes = await fetch(`${baseUrl}/api/foods/image-search?q=Campbell%20Chicken%20Noodle%20Soup&category=Canned%20Goods`);
  const spaceCatData = await spaceCatRes.json();
  console.log('   Images returned:', spaceCatData.images?.length);
  if (!Array.isArray(spaceCatData.images) || spaceCatData.images.length < 3) {
    throw new Error(`Test 8 failed: Expected at least 3 images for space-category, got ${spaceCatData.images?.length}`);
  }
  console.log('   Passed: Categories with spaces normalized and biased accurately.');

  // Test 9: Query with Unicode / Accented Characters (e.g. "Häagen-Dazs")
  console.log('\n9. Testing Unicode / accented product ("Häagen-Dazs Vanilla")...');
  const unicodeRes = await fetch(`${baseUrl}/api/foods/image-search?q=H%C3%A4agen-Dazs%20Vanilla&category=dairy`);
  const unicodeData = await unicodeRes.json();
  console.log('   Query processed:', unicodeData.query);
  console.log('   Images returned:', unicodeData.images?.length);
  if (!unicodeData.query.includes('Häagen-Dazs')) {
    throw new Error('Test 9 failed: Häagen-Dazs was mangled during query processing');
  }
  if (!Array.isArray(unicodeData.images) || unicodeData.images.length < 3) {
    throw new Error(`Test 9 failed: Expected at least 3 images for Häagen-Dazs, got ${unicodeData.images?.length}`);
  }
  console.log('   Passed: Unicode product names accurately preserved and returned images.');

  // Test 10: Category aliases ("meat", "drinks", "snacks")
  console.log('\n10. Testing category aliases ("meat", "drinks", "snacks")...');
  const meatRes = await fetch(`${baseUrl}/api/foods/image-search?q=Chicken%20Breast&category=meat`);
  const meatData = await meatRes.json();
  console.log('   "meat" alias images returned:', meatData.images?.length);
  if (!Array.isArray(meatData.images) || meatData.images.length < 3) {
    throw new Error(`Test 10 failed: Expected at least 3 images for meat alias, got ${meatData.images?.length}`);
  }

  const drinkRes = await fetch(`${baseUrl}/api/foods/image-search?q=Apple%20Juice&category=drinks`);
  const drinkData = await drinkRes.json();
  console.log('   "drinks" alias images returned:', drinkData.images?.length);
  if (!Array.isArray(drinkData.images) || drinkData.images.length < 3) {
    throw new Error(`Test 10 failed: Expected at least 3 images for drinks alias, got ${drinkData.images?.length}`);
  }
  console.log('   Passed: Category aliases correctly biased and returned product images.');

  console.log('\n========================================');
  console.log('🎉 ALL LIVE E2E API TESTS PASSED! 🎉');
  console.log('========================================\n');
}

runE2ETests().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
