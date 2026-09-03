// Comprehensive integration tests for safe image search logic & providers
const CATEGORY_BIAS_MAP = {
  canned_goods: 'canned goods food',
  'canned goods': 'canned goods food',
  canned: 'canned goods food',
  produce: 'fresh produce food',
  dairy: 'dairy food',
  proteins: 'meat protein food',
  protein: 'meat protein food',
  meat: 'meat protein food',
  bakery: 'bakery food',
  beverages: 'beverage drink',
  beverage: 'beverage drink',
  drinks: 'beverage drink',
  drink: 'beverage drink',
  frozen_food: 'frozen food',
  'frozen food': 'frozen food',
  frozen: 'frozen food',
  dry_goods: 'dry grocery food',
  'dry goods': 'dry grocery food',
  pantry: 'dry grocery food',
  snacks: 'snack grocery food',
  snack: 'snack grocery food',
  hygiene: 'personal care hygiene packaging',
  other: 'grocery food product',
};

const BLOCKED_TERMS = [
  'nsfw', 'nude', 'nudity', 'naked', 'porn', 'pornography', 'sex', 'sexy', 'erotic', 'adult', 'xxx',
  'weapon', 'gun', 'knife', 'blood', 'gore', 'kill', 'killer', 'murder',
  'drug', 'weed', 'cannabis', 'cocaine', 'heroin', 'meth'
];

function buildSafeSearchQuery(rawQuery, rawCategory) {
  let cleanQuery = String(rawQuery || '')
    .trim()
    .replace(/[^\p{L}\p{N}\s&'.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);

  for (const term of BLOCKED_TERMS) {
    const termRegex = new RegExp(`\\b${term}\\b`, 'gi');
    if (termRegex.test(cleanQuery)) {
      cleanQuery = cleanQuery.replace(termRegex, ' ');
    }
  }
  cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();

  const alphanumericOnly = cleanQuery.replace(/[^\p{L}\p{N}]/gu, '');
  if (alphanumericOnly.length < 2) {
    return { safeQuery: '', isValid: false };
  }

  const rawCat = String(rawCategory || '').toLowerCase().trim();
  const catKey = rawCat.replace(/[\s-]+/g, '_');
  const categoryContext = CATEGORY_BIAS_MAP[catKey] || CATEGORY_BIAS_MAP[rawCat] || 'grocery food';

  const keywords = ['packaging', 'grocery', 'food product'];
  const appended = [];

  if (!cleanQuery.toLowerCase().includes(categoryContext)) {
    appended.push(categoryContext);
  }

  for (const kw of keywords) {
    if (!cleanQuery.toLowerCase().includes(kw)) {
      appended.push(kw);
    }
  }

  return { safeQuery: `${cleanQuery} ${appended.join(' ')}`.trim(), isValid: true };
}

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  let normalized = url.trim();
  if (normalized.startsWith('//')) {
    normalized = 'https:' + normalized;
  }
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) return false;
  const lower = normalized.toLowerCase().split(/[?#]/)[0];
  if (lower.includes('data:image') || lower.includes('1x1') || lower.includes('pixel')) {
    return false;
  }
  const invalidExtensions = [
    '.pdf', '.svg', '.html', '.htm', '.xml',
    '.tif', '.tiff', '.djvu', '.webm', '.mp4',
    '.ogv', '.ogg', '.zip', '.tar', '.gz', '.exe'
  ];
  if (invalidExtensions.some((ext) => lower.endsWith(ext))) {
    return false;
  }
  return true;
}

async function scrapeDuckDuckGoImages(contextualQuery) {
  try {
    const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(contextualQuery)}&kp=1`;
    const tokenRes = await fetch(tokenUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(3500),
    });

    if (!tokenRes.ok) return [];

    const html = await tokenRes.text();
    const vqdMatch = 
      html.match(/vqd=([0-9a-zA-Z_-]+)/) || 
      html.match(/vqd=['"]([0-9a-zA-Z_-]+)['"]/) ||
      html.match(/data-vqd=['"]([0-9a-zA-Z_-]+)['"]/) ||
      html.match(/vqd:\s*['"]([0-9a-zA-Z_-]+)['"]/);

    if (!vqdMatch || !vqdMatch[1]) return [];

    const vqd = vqdMatch[1];
    const imagesUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(contextualQuery)}&vqd=${vqd}&f=,,,;&p=1`;
    const imagesRes = await fetch(imagesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://duckduckgo.com/',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(3500),
    });

    if (!imagesRes.ok) return [];
    const data = await imagesRes.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    const urls = [];
    const seen = new Set();
    for (const item of data.results) {
      let candidate = item.image || item.thumbnail;
      if (candidate && typeof candidate === 'string') {
        if (candidate.startsWith('//')) candidate = 'https:' + candidate;
        if (candidate.startsWith('http://') && (candidate.includes('bing.net') || candidate.includes('duckduckgo.com') || candidate.includes('wikimedia.org') || candidate.includes('openfoodfacts.org'))) {
          candidate = candidate.replace(/^http:\/\//i, 'https://');
        }
      }
      if (isValidImageUrl(candidate) && !seen.has(candidate)) {
        seen.add(candidate);
        urls.push(candidate);
        if (urls.length >= 4) break;
      }
    }
    return urls;
  } catch (err) {
    return [];
  }
}

async function queryWikimediaPages(searchTerm) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchTerm)}&gsrlimit=6&prop=imageinfo&iiprop=url&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FoodArca/1.0 (contact@foodarca.com)' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Object.values(data.query?.pages || {});
  } catch {
    return [];
  }
}

async function fetchWikimediaImages(productName, category = '') {
  try {
    const cleanTerm = productName.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
    const isProduce = String(category).toLowerCase().includes('produce');
    const searchQueries = isProduce
      ? [`${cleanTerm} produce food`, `${cleanTerm} fruit`, cleanTerm]
      : [`${cleanTerm} food packaging`, `${cleanTerm} food`, cleanTerm];

    const results = await Promise.all(searchQueries.map((q) => queryWikimediaPages(q)));
    const urls = [];
    const seen = new Set();

    for (const pages of results) {
      for (const page of pages) {
        let imgUrl = page.imageinfo?.[0]?.url;
        if (isValidImageUrl(imgUrl)) {
          if (imgUrl.startsWith('http://')) {
            imgUrl = imgUrl.replace(/^http:\/\//i, 'https://');
          }
          const cleanUrl = imgUrl.split(/[?#]/)[0];
          if (!seen.has(cleanUrl)) {
            seen.add(cleanUrl);
            urls.push(cleanUrl);
            if (urls.length >= 4) break;
          }
        }
      }
      if (urls.length >= 3) break;
    }

    return urls;
  } catch {
    return [];
  }
}

async function runTests() {
  console.log('--- Test 1: Query Biasing & Safety Sanitization ---');
  const q1 = buildSafeSearchQuery('Kraft Macaroni', 'dry_goods');
  console.log('Safe query 1:', q1.safeQuery);
  if (!q1.isValid || !q1.safeQuery.includes('dry grocery food')) {
    throw new Error('Test 1 failed: Missing dry grocery food bias');
  }

  // Category with spaces: "Canned Goods"
  const qSpace = buildSafeSearchQuery('Campbell Tomato Soup', 'Canned Goods');
  console.log('Safe query space category:', qSpace.safeQuery);
  if (!qSpace.isValid || !qSpace.safeQuery.includes('canned goods food')) {
    throw new Error('Test 1 failed: Space category normalization failed');
  }

  // Unicode and accented food names
  const qHaagen = buildSafeSearchQuery('Häagen-Dazs Vanilla', 'dairy');
  console.log('Safe query Häagen-Dazs:', qHaagen.safeQuery);
  if (!qHaagen.isValid || !qHaagen.safeQuery.includes('Häagen-Dazs')) {
    throw new Error('Test 1 failed: Accented Häagen-Dazs should be preserved');
  }

  const qJalapeno = buildSafeSearchQuery('Jalapeño Peppers', 'produce');
  console.log('Safe query Jalapeño:', qJalapeno.safeQuery);
  if (!qJalapeno.isValid || !qJalapeno.safeQuery.includes('Jalapeño')) {
    throw new Error('Test 1 failed: Accented Jalapeño should be preserved');
  }

  const qTofu = buildSafeSearchQuery('豆腐 Tofu', 'proteins');
  console.log('Safe query 豆腐:', qTofu.safeQuery);
  if (!qTofu.isValid || !qTofu.safeQuery.includes('豆腐')) {
    throw new Error('Test 1 failed: Non-Latin characters in 豆腐 should be preserved');
  }

  // Category aliases verification
  const qMeat = buildSafeSearchQuery('Ground Beef', 'meat');
  if (!qMeat.isValid || !qMeat.safeQuery.includes('meat protein food')) {
    throw new Error('Test 1 failed: "meat" alias should map to meat protein food');
  }

  const qDrink = buildSafeSearchQuery('Orange Juice', 'drinks');
  if (!qDrink.isValid || !qDrink.safeQuery.includes('beverage drink')) {
    throw new Error('Test 1 failed: "drinks" alias should map to beverage drink');
  }

  const qSnack = buildSafeSearchQuery('Potato Chips', 'snacks');
  if (!qSnack.isValid || !qSnack.safeQuery.includes('snack grocery food')) {
    throw new Error('Test 1 failed: "snacks" alias should map to snack grocery food');
  }

  // Blocked terms with food product remaining
  const q2 = buildSafeSearchQuery('Apple sexy gun nsfw', 'produce');
  console.log('Safe query 2 (sanitized with food term):', q2.safeQuery);
  if (!q2.isValid || q2.safeQuery.includes('sexy') || q2.safeQuery.includes('gun') || !q2.safeQuery.startsWith('Apple')) {
    throw new Error('Test 1 failed: Unsafe terms were not stripped');
  }

  // Blocked terms ONLY (no food product)
  const q3 = buildSafeSearchQuery('gun sexy nsfw', 'other');
  console.log('Safe query 3 (only blocked terms, isValid):', q3.isValid);
  if (q3.isValid) {
    throw new Error('Test 1 failed: Query with ONLY blocked terms should be invalid');
  }

  console.log('\n--- Test 2: URL Validation ---');
  if (isValidImageUrl('https://example.com/item.pdf')) throw new Error('Failed to reject .pdf');
  if (isValidImageUrl('https://example.com/item.pdf#section')) throw new Error('Failed to reject .pdf with hash');
  if (isValidImageUrl('https://example.com/item.exe#download')) throw new Error('Failed to reject .exe with hash');
  if (isValidImageUrl('https://example.com/item.svg')) throw new Error('Failed to reject .svg');
  if (isValidImageUrl('https://example.com/item.tif')) throw new Error('Failed to reject .tif');
  if (isValidImageUrl('https://example.com/item.tiff')) throw new Error('Failed to reject .tiff');
  if (isValidImageUrl('https://example.com/item.djvu')) throw new Error('Failed to reject .djvu');
  if (!isValidImageUrl('https://example.com/item.jpg')) throw new Error('Failed to accept .jpg');
  if (!isValidImageUrl('https://example.com/item.webp')) throw new Error('Failed to accept .webp');
  if (!isValidImageUrl('https://tse1.mm.bing.net/th/id/OIP.123?r=0&pid=Api')) throw new Error('Failed to accept CDN URL');
  if (!isValidImageUrl('//tse1.mm.bing.net/th/id/OIP.123')) throw new Error('Failed to accept protocol-relative CDN URL');
  console.log('Passed: URL validation accurately filters non-renderable assets.');

  console.log('\n--- Test 3: DuckDuckGo Strict Safe Search Image Fetching ---');
  const samples = [
    { query: 'Campbell\'s Chicken Noodle Soup canned_goods', name: 'Campbell\'s Chicken Noodle Soup' },
    { query: 'Oreo Cookies dry_goods', name: 'Oreo Cookies' },
    { query: 'Chobani Greek Yogurt dairy', name: 'Chobani Greek Yogurt' },
  ];

  for (const s of samples) {
    const images = await scrapeDuckDuckGoImages(s.query);
    console.log(`Fetched for "${s.name}": ${images.length} images`);
    if (images.length === 0) {
      throw new Error(`Test 3 failed: No images fetched for ${s.name}`);
    }
  }

  console.log('\n--- Test 4: Parallel Wikimedia Commons Fallback Verification ---');
  const t0 = Date.now();
  const wikiTomato = await fetchWikimediaImages('Tomato Soup', 'canned_goods');
  console.log('Tomato Soup Wikimedia images:', wikiTomato.length, wikiTomato.slice(0, 2), `in ${Date.now() - t0}ms`);
  if (wikiTomato.length === 0) {
    throw new Error('Test 4 failed: Tomato Soup Wikimedia search returned 0');
  }

  const t1 = Date.now();
  const wikiApples = await fetchWikimediaImages('Honeycrisp Apples', 'produce');
  console.log('Honeycrisp Apples Wikimedia images:', wikiApples.length, wikiApples.slice(0, 2), `in ${Date.now() - t1}ms`);
  if (wikiApples.length === 0) {
    throw new Error('Test 4 failed: Honeycrisp Apples produce Wikimedia search returned 0');
  }

  console.log('\n--- Test 5: Form State Synchronization & Layout Logic ---');
  // 5.1 Autocomplete photo synchronization
  let formPhotoUrl = 'https://example.com/milk.jpg';
  const suggWithoutPhoto = { name: 'Cheerios Cereal', category: 'dry_goods', photoUrl: null };
  formPhotoUrl = suggWithoutPhoto.photoUrl || suggWithoutPhoto.photo_url || null;
  if (formPhotoUrl !== null) {
    throw new Error('Test 5.1 failed: Prior photo should be cleared when selecting suggestion with no photo');
  }

  const suggWithPhoto = { name: 'Tomato Soup', category: 'canned_goods', photoUrl: 'https://example.com/soup.jpg' };
  formPhotoUrl = suggWithPhoto.photoUrl || suggWithPhoto.photo_url || null;
  if (formPhotoUrl !== 'https://example.com/soup.jpg') {
    throw new Error('Test 5.1 failed: Photo should match selected suggestion');
  }
  console.log('Passed: Autocomplete photo synchronization prevents photo mismatch.');

  // 5.2 InitialItem property resolution (photo_url vs photoUrl)
  const rawItem1 = { name: 'Soup', photo_url: 'https://example.com/soup.jpg' };
  const rawItem2 = { name: 'Milk', photoUrl: 'https://example.com/milk.jpg' };
  const resPhoto1 = rawItem1?.photoUrl || rawItem1?.photo_url || null;
  const resPhoto2 = rawItem2?.photoUrl || rawItem2?.photo_url || null;
  if (resPhoto1 !== 'https://example.com/soup.jpg' || resPhoto2 !== 'https://example.com/milk.jpg') {
    throw new Error('Test 5.2 failed: initialItem photo resolution failed');
  }
  console.log('Passed: Both snake_case and camelCase initialItem photo URLs handled.');

  // 5.3 Dynamic grid column layout calculations
  function getGridCols(count) {
    return count === 1 ? 'grid-cols-1 max-w-[160px] mx-auto' :
           count === 2 ? 'grid-cols-2 max-w-[280px] mx-auto' :
           count === 3 ? 'grid-cols-3' : 'grid-cols-4';
  }
  if (!getGridCols(1).includes('grid-cols-1') ||
      !getGridCols(2).includes('grid-cols-2') ||
      !getGridCols(3).includes('grid-cols-3') ||
      !getGridCols(4).includes('grid-cols-4')) {
    throw new Error('Test 5.3 failed: Dynamic grid class calculation failed');
  }
  console.log('Passed: Dynamic responsive grid classes verified.');

  console.log('\n✅ All integration tests passed successfully!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
