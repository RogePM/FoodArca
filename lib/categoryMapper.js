// We use an array of objects so we can strictly control the ORDER of evaluation.
// Specific items (like pasta) must be checked before broad tags (like beverage)!
const CATEGORY_RULES = [
  { id: 'hygiene', keywords: ['hygiene', 'soap', 'shampoo', 'toothpaste', 'deodorant'] },
  { id: 'frozen_food', keywords: ['frozen', 'ice cream', 'sorbet', 'pizza'] },
  { id: 'canned_goods', keywords: ['canned', 'tin', 'jar', 'soup', 'beans'] },
  
  // Dry goods evaluated early to catch pasta/rice before the generic 'beverages' tag
  { id: 'dry_goods', keywords: ['pasta', 'spaghetti', 'macaroni', 'noodle', 'rice', 'cereal', 'oat', 'flour', 'baking', 'lentil', 'nut', 'seed'] },
  
  { id: 'bakery_snacks', keywords: ['snack', 'sweet', 'candy', 'biscuit', 'chocolate', 'crisp', 'bread', 'bakery', 'cookie', 'pastry', 'chip', 'cracker'] },
  { id: 'proteins', keywords: ['meat', 'beef', 'poultry', 'chicken', 'fish', 'seafood', 'pork', 'tuna', 'egg'] },
  { id: 'dairy', keywords: ['dairy', 'milk', 'cheese', 'yogurt', 'butter'] },
  { id: 'produce', keywords: ['vegetable', 'fruit', 'fresh', 'salad', 'apple', 'tomato', 'potato'] },
  
  // Beverages is evaluated LAST to avoid false positives from the "plant-based-foods-and-beverages" tag
  { id: 'beverages', keywords: ['beverage', 'drink', 'water', 'juice', 'soda', 'coffee', 'tea', 'cola'] }
];

export function mapOpenFoodFactsCategory(offTags) {
  // 1. Check if tags exist
  if (!offTags || !Array.isArray(offTags)) {
    console.log("⚠️ [MAPPER] No tags found for this item from Open Food Facts.");
    return 'Other';
  }

  // 2. Convert tags to a single lowercase string and replace hyphens with spaces
  // This turns "plant-based-foods-and-beverages" into "plant based foods and beverages"
  const cleanTags = offTags.join(' ').toLowerCase().replace(/-/g, ' ');

  console.log("🔍 [MAPPER] CLEANED TAGS:", cleanTags);

  // 3. Loop through our rules in order
  for (const rule of CATEGORY_RULES) {
    // If the cleanTags string includes any of the keywords for this specific rule
    if (rule.keywords.some(keyword => cleanTags.includes(keyword))) {
      console.log(`🎯 [MAPPER] Matched category: ${rule.id}`);
      return rule.id;
    }
  }

  // 4. Fallback
  console.log("⚠️ [MAPPER] No keywords matched! Falling back to 'Other'");
  return 'Other';
}