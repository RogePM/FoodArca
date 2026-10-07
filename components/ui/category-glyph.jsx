'use client';

// A category's drawing from /public/category-art: gray line, mostly white, soft natural colors
// so categories tell apart at a glance, and one small theme-orange accent each.

import React from 'react';

const ART = {
  'Canned & jarred': 'canned',
  'Dry goods': 'dry',
  'Snacks': 'snacks',
  'Drinks': 'drinks',
  'Baby food & formula': 'baby-food',
  'Produce': 'produce',
  'Meat': 'meat',
  'Dairy & eggs': 'dairy',
  'Bread & bakery': 'bakery',
  'Frozen': 'frozen',
  'Hygiene': 'hygiene',
  'Diapers & baby care': 'baby-care',
  'Household': 'household',
  'Pet food': 'pet',
  'Other / not sure': 'other',
  // Earlier names
  'Dry Goods / Grains': 'dry',
  'Meat / Protein': 'meat',
  'Meat & fish': 'meat',
  'Bakery': 'bakery',
  'Canned Goods': 'canned',
  'Beverages': 'drinks',
  'Dairy': 'dairy',
  'Baby Food': 'baby-food',
  'Diapers & Baby Supplies': 'baby-care',
  // UI slugs
  produce: 'produce',
  proteins: 'meat',
  bakery: 'bakery',
  snacks: 'snacks',
  canned_goods: 'canned',
  beverages: 'drinks',
  dairy: 'dairy',
  hygiene: 'hygiene',
  baby_infant: 'baby-food',
  dry_goods: 'dry',
  frozen_food: 'frozen',
};

/** @param {string} category - DB category name (current or earlier) or UI slug */
export function CategoryGlyph({ category, className = 'w-[26px] h-[26px]' }) {
  const name = ART[category] || ART[String(category || '').toLowerCase()] || 'other';
  return <img src={`/category-art/${name}.svg`} alt="" className={`shrink-0 ${className}`} />;
}
