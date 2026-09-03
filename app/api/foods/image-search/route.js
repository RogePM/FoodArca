import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory cache to reduce external scraping requests
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Human-friendly mapping for category biasing
// Human-friendly mapping for category biasing
const CATEGORY_BIAS_MAP = {
  canned_goods: 'canned food',
  'canned goods': 'canned food',
  canned: 'canned food',
  produce: 'fresh produce',
  dairy: 'dairy food',
  proteins: 'meat protein food',
  protein: 'meat protein food',
  meat: 'meat protein food',
  bakery: 'fresh bakery',
  bakery_snacks: 'bakery snack food',
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
  snacks: 'snack food',
  snack: 'snack food',
  hygiene: 'personal care product',
  other: 'grocery food product',
};

// Strict list of prohibited terms to guard against NSFW, violence, adult slang, and non-food inappropriate queries
const BLOCKED_TERMS = [
  // Adult / explicit / NSFW / anatomy / sexual slang
  'nsfw', 'nude', 'nudity', 'naked', 'porn', 'pornography', 'sex', 'sexy', 'erotic', 'adult', 'xxx',
  'ass', 'asses', 'arse', 'butt', 'booty', 'boob', 'boobs', 'breast', 'breasts', 'tits', 'titties',
  'dick', 'cock', 'penis', 'vagina', 'pussy', 'fetish', 'bdsm', 'lingerie', 'underwear', 'panties',
  'bra', 'thong', 'bikini', 'milf', 'hentai', 'intercourse', 'masturbat', 'masturbation', 'horny', 'orgasm',
  'stripper', 'escort', 'onlyfans', 'hooker', 'prostitute', 'blowjob', 'handjob', 'anal', 'dildo', 'vibrator',
  // Non-food sexualized people search terms
  'women', 'woman', 'girl', 'girls', 'lady', 'ladies', 'babe', 'babes', 'model', 'models',
  'chick', 'chicks', 'boy', 'boys', 'guy', 'guys', 'teen', 'teens',
  // Violence, weapons & gore
  'weapon', 'weapons', 'gun', 'guns', 'knife', 'knives', 'pistol', 'rifle', 'bullet', 'ammo', 'ammunition',
  'blood', 'bloody', 'gore', 'kill', 'killer', 'murder', 'suicide', 'death', 'dead', 'corpse', 'torture', 'execution',
  // Illicit drugs & paraphernalia
  'drug', 'drugs', 'weed', 'cannabis', 'marijuana', 'cocaine', 'heroin', 'meth', 'methamphetamine', 'ecstasy', 'shrooms', 'bong', 'joint'
];

/**
 * Sanitize and enforce food context on query
 */
function buildSafeSearchQuery(rawQuery, rawCategory) {
  // Truncate and strip unwanted symbols while preserving Unicode letters & numbers
  let cleanQuery = String(rawQuery || '')
    .trim()
    .replace(/[^\p{L}\p{N}\s&'.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);

  // Safety filter: IF ANY PROHIBITED TERM IS FOUND, IMMEDIATELY REJECT THE QUERY!
  for (const term of BLOCKED_TERMS) {
    const termRegex = new RegExp(`(^|\\b|_)${term}(\\b|_|$)`, 'i');
    if (termRegex.test(cleanQuery)) {
      console.warn(`[Security Alert] Blocked prohibited query containing: "${term}"`);
      return { safeQuery: '', isValid: false, blocked: true };
    }
  }

  // Ensure query still has substance after sanitization (Unicode-aware)
  const alphanumericOnly = cleanQuery.replace(/[^\p{L}\p{N}]/gu, '');
  if (alphanumericOnly.length < 2) {
    return { safeQuery: '', isValid: false, blocked: false };
  }

  // Category context - support underscores, hyphens, and spaces
  const rawCat = String(rawCategory || '').toLowerCase().trim();
  const catKey = rawCat.replace(/[\s-]+/g, '_');

  // Per-category keyword enrichment (tailored so fresh produce gets clean isolated fruit/veggie photos, NOT packaging)
  let contextKeywords = [];
  if (catKey === 'produce') {
    // For produce: clean, fresh, isolated close-up photos. NEVER append 'packaging'!
    contextKeywords = ['fresh', 'produce', 'isolated'];
  } else if (catKey === 'bakery' || catKey === 'bakery_snacks') {
    contextKeywords = ['fresh bakery'];
  } else if (catKey === 'canned_goods' || catKey === 'canned') {
    contextKeywords = ['can', 'canned food'];
  } else if (catKey === 'beverages' || catKey === 'beverage' || catKey === 'drinks' || catKey === 'drink') {
    contextKeywords = ['bottle', 'drink'];
  } else if (catKey === 'dairy') {
    contextKeywords = ['dairy', 'food product'];
  } else if (catKey === 'proteins' || catKey === 'meat') {
    contextKeywords = ['food product'];
  } else if (catKey === 'frozen_food' || catKey === 'frozen') {
    contextKeywords = ['frozen food'];
  } else if (catKey === 'hygiene') {
    contextKeywords = ['personal care product'];
  } else {
    // General dry goods / snacks / other
    contextKeywords = ['grocery food product'];
  }

  const appended = [];
  for (const kw of contextKeywords) {
    if (!cleanQuery.toLowerCase().includes(kw)) {
      appended.push(kw);
    }
  }

  return { safeQuery: `${cleanQuery} ${appended.join(' ')}`.trim(), isValid: true, blocked: false };
}

/**
 * Validate that a URL is a legitimate http/https image URL
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  let normalized = url.trim();
  if (normalized.startsWith('//')) {
    normalized = 'https:' + normalized;
  }
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) return false;
  
  // Filter out suspicious or non-image assets by stripping query and hash fragments
  const lower = normalized.toLowerCase().split(/[?#]/)[0];
  if (lower.includes('data:image') || lower.includes('1x1') || lower.includes('pixel')) {
    return false;
  }

  // Reject known non-image formats
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

/**
 * Scrape image URLs from DuckDuckGo with strict SafeSearch enabled
 */
async function scrapeDuckDuckGoImages(contextualQuery) {
  try {
    // 1. Fetch vqd token with kp=1 (strict safe search)
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

    if (!vqdMatch || !vqdMatch[1]) {
      return [];
    }

    const vqd = vqdMatch[1];

    // 2. Fetch images with p=1 (strict safe search parameter)
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
      // Prioritize fast, high-speed edge CDN thumbnail (~20-30KB, 50ms latency), fallback to raw origin image
      let candidate = item.thumbnail || item.image;
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
    console.warn('⚠️ DuckDuckGo image scrape warning:', err?.message || err);
    return [];
  }
}

/**
 * Fallback to Open Food Facts API (100% verified food packaging images)
 */
async function fetchOpenFoodFactsImages(productName) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(productName)}&search_simple=1&action=process&json=1&page_size=10`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FoodArca/1.0 (contact@foodarca.com)' },
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.products || !Array.isArray(data.products)) return [];

    const urls = [];
    const seen = new Set();

    for (const p of data.products) {
      const img = p.image_front_url || p.image_front_small_url || p.image_url || p.image_small_url;
      if (isValidImageUrl(img) && !seen.has(img)) {
        seen.add(img);
        urls.push(img);
        if (urls.length >= 4) break;
      }
    }

    return urls;
  } catch (err) {
    console.warn('⚠️ Open Food Facts fallback warning:', err?.message || err);
    return [];
  }
}

/**
 * Helper to query Wikimedia Commons pages
 */
async function queryWikimediaPages(searchTerm) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchTerm)}&gsrlimit=6&prop=imageinfo&iiprop=url&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FoodArca/1.0 (contact@foodarca.com)' },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Object.values(data.query?.pages || {});
  } catch {
    return [];
  }
}

/**
 * Fallback to Wikimedia Commons API (free public domain images)
 */
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
  } catch (err) {
    console.warn('⚠️ Wikimedia Commons fallback warning:', err?.message || err);
    return [];
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || searchParams.get('name') || '';
    const category = searchParams.get('category') || '';

    const cleanName = query.trim();
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({
        images: [],
        message: 'Query must be at least 2 characters.',
      }, { status: 200 });
    }

    // Check cache
    const cacheKey = `${cleanName.toLowerCase()}|${category.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        images: cached.images,
        query: cleanName,
        category,
        source: cached.source,
        cached: true,
      });
    }

    // Build contextually biased and safe query
    const { safeQuery, isValid, blocked } = buildSafeSearchQuery(cleanName, category);

    if (blocked) {
      return NextResponse.json({
        images: [],
        query: cleanName,
        category,
        message: 'Prohibited or inappropriate search terms detected.',
      }, { status: 200 });
    }

    if (!isValid) {
      return NextResponse.json({
        images: [],
        query: cleanName,
        category,
        message: 'No valid food product search terms provided.',
      }, { status: 200 });
    }

    // Primary: DuckDuckGo with strict safe search
    let images = await scrapeDuckDuckGoImages(safeQuery);
    let source = 'duckduckgo';

    // Fallback 1: If DDG returns fewer than 3 images, query Open Food Facts
    if (images.length < 3) {
      const offImages = await fetchOpenFoodFactsImages(cleanName);
      if (offImages.length > 0) {
        const combined = new Set([...images, ...offImages]);
        images = Array.from(combined).slice(0, 4);
        source = images.length === offImages.length ? 'openfoodfacts' : 'combined';
      }
    }

    // Fallback 2: If still fewer than 3 images, query Wikimedia Commons
    if (images.length < 3) {
      const wikiImages = await fetchWikimediaImages(cleanName, category);
      if (wikiImages.length > 0) {
        const prevCount = images.length;
        const combined = new Set([...images, ...wikiImages]);
        images = Array.from(combined).slice(0, 4);
        if (prevCount === 0 && images.length === wikiImages.length) {
          source = 'wikimedia';
        } else {
          source = 'combined';
        }
      }
    }

    // Limit to 3-4 images as per requirements
    const finalImages = images.slice(0, 4);

    // Store in cache only if images were successfully found
    if (finalImages.length > 0) {
      cache.set(cacheKey, {
        images: finalImages,
        source,
        timestamp: Date.now(),
      });
    }

    // Prune cache if oversized
    if (cache.size > 500) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    return NextResponse.json({
      images: finalImages,
      query: cleanName,
      category,
      source,
      count: finalImages.length,
    });
  } catch (error) {
    console.error('❌ Error in /api/foods/image-search:', error);
    return NextResponse.json(
      { images: [], error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
