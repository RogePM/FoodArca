const fs = require('fs');
const file = 'C:/Users/COMP1/.gemini/antigravity/worktrees/FoodArca/migrate-supabase-realtime-inventory/components/pages/distribution/mobile-checkout-cart-view.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Z-index container
content = content.replace(
  /\? 'fixed inset-0 z-\[9999\] w-full h-\[100dvh\] bg-white flex flex-col'/,
  "? 'absolute inset-0 z-50 bg-white flex flex-col'"
);

// 2. Padding of scrollable content
content = content.replace(
  /className={\lex-1 overflow-y-auto w-full \\$\\{[\s\S]*?\]'\\}[\s\S]*?\}/,
  'className="flex-1 overflow-y-auto w-full pb-[calc(120px+env(safe-area-inset-bottom))]"'
);

// 3. Remove Sticky footer
const stickyRegex = /\{\/\* STICKY FOOTER BUTTON \(ONLY VISIBLE IF ITEMS IN CART\) \*\/\}\s*<AnimatePresence>[\s\S]*?<\/AnimatePresence>\s*<AnimatePresence>/;
content = content.replace(stickyRegex, '<AnimatePresence>');

// 4. Update the item mapping container for borders
// The map looks like this: eturn ( <motion.div key={item.id}
content = content.replace(
  /return \(\s*<motion\.div\s*key={item\.id}[\s\S]*?border-b border-gray-100/g,
  (match) => match.replace('border-b border-gray-100', '')
);

// We need to find the </motion.div> that closes the item.
// Let's just fix the whole Cart Items section.
// It's safer if I just write a proper targeted script.
fs.writeFileSync('C:/Users/COMP1/.gemini/antigravity/worktrees/FoodArca/migrate-supabase-realtime-inventory/emergency_fix.js', content);
