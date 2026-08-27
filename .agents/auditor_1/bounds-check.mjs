import fs from 'node:fs';

const code = fs.readFileSync('components/ui/custom-icons.jsx', 'utf8');

const matches = code.match(/(?:d|x|y|x1|y1|x2|y2|cx|cy|r|rx|ry|width|height)="[^"]+"/g) || [];
let outOfBounds = [];
matches.forEach(attr => {
  const nums = attr.match(/[0-9]+\.?[0-9]*/g) || [];
  nums.forEach(n => {
    const val = parseFloat(n);
    if (val > 24.5) {
      outOfBounds.push({ attr, val });
    }
  });
});
console.log('Out of bounds coordinates (> 24.5):', outOfBounds);
console.log('Total coordinate attributes analyzed:', matches.length);
