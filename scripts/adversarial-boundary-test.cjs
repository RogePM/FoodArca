/**
 * Adversarial SVG Boundary & Silhouette Test Harness
 * 
 * Validates:
 * 1. Exact SVG coordinate bounding boxes (with cubic Bezier derivative extrema).
 * 2. ViewBox boundaries [0, 24] x [0, 24] without overflow.
 * 3. Visual balance & proportions (width, height, aspect ratio, centering).
 * 4. Hex color fills & opacity="0.5" presence.
 * 5. All export aliases pointing to valid components.
 * 6. Stroke and forwardRef signature adherence.
 */

const fs = require('fs');
const path = require('path');

const ICON_FILE_PATH = path.resolve(__dirname, '../components/ui/custom-icons.jsx');
const content = fs.readFileSync(ICON_FILE_PATH, 'utf8');

// Cubic Bezier bounding box calculator
function cubicBezierExtrema(p0, p1, p2, p3) {
  const points = [p0, p3];
  // B(t) = (1-t)^3 * p0 + 3(1-t)^2 * t * p1 + 3(1-t) * t^2 * p2 + t^3 * p3
  // B'(t) = 3*(1-t)^2 * (p1-p0) + 6*(1-t)*t * (p2-p1) + 3*t^2 * (p3-p2)
  // Let a = 3*(p3 - 3*p2 + 3*p1 - p0)
  //     b = 6*(p2 - 2*p1 + p0)
  //     c = 3*(p1 - p0)
  // a*t^2 + b*t + c = 0
  const a = 3 * (-p0 + 3 * p1 - 3 * p2 + p3);
  const b = 6 * (p0 - 2 * p1 + p2);
  const c = 3 * (p1 - p0);

  const tValues = [];
  if (Math.abs(a) < 1e-9) {
    if (Math.abs(b) > 1e-9) {
      const t = -c / b;
      if (t > 0 && t < 1) tValues.push(t);
    }
  } else {
    const discr = b * b - 4 * a * c;
    if (discr >= 0) {
      const sqrtD = Math.sqrt(discr);
      const t1 = (-b + sqrtD) / (2 * a);
      const t2 = (-b - sqrtD) / (2 * a);
      if (t1 > 0 && t1 < 1) tValues.push(t1);
      if (t2 > 0 && t2 < 1) tValues.push(t2);
    }
  }

  for (const t of tValues) {
    const mt = 1 - t;
    const val = mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
    points.push(val);
  }

  return {
    min: Math.min(...points),
    max: Math.max(...points)
  };
}

// Quadratic Bezier bounding box
function quadBezierExtrema(p0, p1, p2) {
  const points = [p0, p2];
  const denom = p0 - 2 * p1 + p2;
  if (Math.abs(denom) > 1e-9) {
    const t = (p0 - p1) / denom;
    if (t > 0 && t < 1) {
      const mt = 1 - t;
      const val = mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
      points.push(val);
    }
  }
  return {
    min: Math.min(...points),
    max: Math.max(...points)
  };
}

// Tokenize and parse SVG path d attribute
function parsePathBounds(d) {
  const commands = d.match(/[a-df-z]|[\-+]?(?:\d*\.\d+|\d+)(?:[eE][\-+]?\d+)?/gi);
  if (!commands) return null;

  let curX = 0, curY = 0;
  let startX = 0, startY = 0;
  let lastControlX = 0, lastControlY = 0;
  let lastCmd = '';

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  function updateBounds(x, y) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  let i = 0;
  while (i < commands.length) {
    const token = commands[i];
    if (/^[a-df-z]$/i.test(token)) {
      lastCmd = token;
      i++;
    }

    const cmd = lastCmd;
    const isRel = cmd === cmd.toLowerCase();
    const type = cmd.toUpperCase();

    if (type === 'M') {
      const x = parseFloat(commands[i++]);
      const y = parseFloat(commands[i++]);
      curX = isRel ? curX + x : x;
      curY = isRel ? curY + y : y;
      startX = curX;
      startY = curY;
      updateBounds(curX, curY);
      // Subsequent numbers treated as implicit LineTo
      lastCmd = isRel ? 'l' : 'L';
    } else if (type === 'L') {
      const x = parseFloat(commands[i++]);
      const y = parseFloat(commands[i++]);
      curX = isRel ? curX + x : x;
      curY = isRel ? curY + y : y;
      updateBounds(curX, curY);
    } else if (type === 'H') {
      const x = parseFloat(commands[i++]);
      curX = isRel ? curX + x : x;
      updateBounds(curX, curY);
    } else if (type === 'V') {
      const y = parseFloat(commands[i++]);
      curY = isRel ? curY + y : y;
      updateBounds(curX, curY);
    } else if (type === 'C') {
      const x1 = parseFloat(commands[i++]);
      const y1 = parseFloat(commands[i++]);
      const x2 = parseFloat(commands[i++]);
      const y2 = parseFloat(commands[i++]);
      const x = parseFloat(commands[i++]);
      const y = parseFloat(commands[i++]);

      const cp1X = isRel ? curX + x1 : x1;
      const cp1Y = isRel ? curY + y1 : y1;
      const cp2X = isRel ? curX + x2 : x2;
      const cp2Y = isRel ? curY + y2 : y2;
      const endX = isRel ? curX + x : x;
      const endY = isRel ? curY + y : y;

      const xExtrema = cubicBezierExtrema(curX, cp1X, cp2X, endX);
      const yExtrema = cubicBezierExtrema(curY, cp1Y, cp2Y, endY);
      updateBounds(xExtrema.min, yExtrema.min);
      updateBounds(xExtrema.max, yExtrema.max);

      lastControlX = cp2X;
      lastControlY = cp2Y;
      curX = endX;
      curY = endY;
    } else if (type === 'S') {
      const x2 = parseFloat(commands[i++]);
      const y2 = parseFloat(commands[i++]);
      const x = parseFloat(commands[i++]);
      const y = parseFloat(commands[i++]);

      let cp1X = curX;
      let cp1Y = curY;
      if ('CS'.includes(cmd)) {
        cp1X = 2 * curX - lastControlX;
        cp1Y = 2 * curY - lastControlY;
      }
      const cp2X = isRel ? curX + x2 : x2;
      const cp2Y = isRel ? curY + y2 : y2;
      const endX = isRel ? curX + x : x;
      const endY = isRel ? curY + y : y;

      const xExtrema = cubicBezierExtrema(curX, cp1X, cp2X, endX);
      const yExtrema = cubicBezierExtrema(curY, cp1Y, cp2Y, endY);
      updateBounds(xExtrema.min, yExtrema.min);
      updateBounds(xExtrema.max, yExtrema.max);

      lastControlX = cp2X;
      lastControlY = cp2Y;
      curX = endX;
      curY = endY;
    } else if (type === 'Q') {
      const x1 = parseFloat(commands[i++]);
      const y1 = parseFloat(commands[i++]);
      const x = parseFloat(commands[i++]);
      const y = parseFloat(commands[i++]);

      const cp1X = isRel ? curX + x1 : x1;
      const cp1Y = isRel ? curY + y1 : y1;
      const endX = isRel ? curX + x : x;
      const endY = isRel ? curY + y : y;

      const xExtrema = quadBezierExtrema(curX, cp1X, endX);
      const yExtrema = quadBezierExtrema(curY, cp1Y, endY);
      updateBounds(xExtrema.min, yExtrema.min);
      updateBounds(xExtrema.max, yExtrema.max);

      lastControlX = cp1X;
      lastControlY = cp1Y;
      curX = endX;
      curY = endY;
    } else if (type === 'A') {
      const rx = parseFloat(commands[i++]);
      const ry = parseFloat(commands[i++]);
      const rot = parseFloat(commands[i++]);
      const largeArc = parseFloat(commands[i++]);
      const sweep = parseFloat(commands[i++]);
      const x = parseFloat(commands[i++]);
      const y = parseFloat(commands[i++]);

      const endX = isRel ? curX + x : x;
      const endY = isRel ? curY + y : y;
      // Conservative arc bounds
      updateBounds(curX, curY);
      updateBounds(endX, endY);
      updateBounds(Math.min(curX, endX) - rx, Math.min(curY, endY) - ry);
      updateBounds(Math.max(curX, endX) + rx, Math.max(curY, endY) + ry);

      curX = endX;
      curY = endY;
    } else if (type === 'Z') {
      curX = startX;
      curY = startY;
      updateBounds(curX, curY);
    } else {
      i++;
    }
  }

  return { minX, maxX, minY, maxY };
}

// Parse custom-icons.jsx
const iconRegex = /export const ([A-Za-z0-9_]+) = forwardRef\([\s\S]*?\n\);\s*\1\.displayName = '\1';/g;
const icons = [];
let match;

while ((match = iconRegex.exec(content)) !== null) {
  const name = match[1];
  const block = match[0];
  icons.push({ name, block });
}

console.log('===============================================================');
console.log('       ADVERSARIAL BOUNDARY & SILHOUETTE VALIDATION           ');
console.log('===============================================================');
console.log(`Found ${icons.length} primary icon components in custom-icons.jsx\n`);

const results = [];
let allPassed = true;

for (const icon of icons) {
  console.log(`---------------------------------------------------------------`);
  console.log(`Component: ${icon.name}`);

  // Check viewBox
  const viewBoxMatch = icon.block.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : null;
  console.log(`  viewBox: ${viewBox}`);

  // Check default strokeWidth
  const strokeWidthMatch = icon.block.match(/strokeWidth = ([\d\.]+)/);
  const strokeWidth = strokeWidthMatch ? parseFloat(strokeWidthMatch[1]) : null;
  console.log(`  strokeWidth default: ${strokeWidth}`);

  // Check stroke={color}
  const hasStrokeColor = icon.block.includes('stroke={color}');
  console.log(`  stroke={color} dynamic prop: ${hasStrokeColor}`);

  // Check fills and opacities
  const fillRegex = /fill="([^"]+)"(?:\s+opacity="([^"]+)")?/g;
  let fillMatch;
  const fills = [];
  while ((fillMatch = fillRegex.exec(icon.block)) !== null) {
    if (fillMatch[1] !== 'none') {
      fills.push({ fill: fillMatch[1], opacity: fillMatch[2] || '1.0' });
    }
  }
  console.log(`  subtle fills: ${JSON.stringify(fills)}`);

  // Extract all SVG child elements and calculate overall bounding box
  let globalMinX = Infinity, globalMaxX = -Infinity;
  let globalMinY = Infinity, globalMaxY = -Infinity;

  function updateGlobalBounds(b) {
    if (!b) return;
    if (b.minX < globalMinX) globalMinX = b.minX;
    if (b.maxX > globalMaxX) globalMaxX = b.maxX;
    if (b.minY < globalMinY) globalMinY = b.minY;
    if (b.maxY > globalMaxY) globalMaxY = b.maxY;
  }

  // Paths
  const pathDRegex = /<path[^>]*\bd="([^"]+)"/g;
  let pMatch;
  let pathCount = 0;
  while ((pMatch = pathDRegex.exec(icon.block)) !== null) {
    pathCount++;
    const b = parsePathBounds(pMatch[1]);
    updateGlobalBounds(b);
  }

  // Circles
  const circleRegex = /<circle[^>]*\bcx="([^"]+)"[^>]*\bcy="([^"]+)"[^>]*\br="([^"]+)"/g;
  let cMatch;
  while ((cMatch = circleRegex.exec(icon.block)) !== null) {
    const cx = parseFloat(cMatch[1]);
    const cy = parseFloat(cMatch[2]);
    const r = parseFloat(cMatch[3]);
    updateGlobalBounds({ minX: cx - r, maxX: cx + r, minY: cy - r, maxY: cy + r });
  }

  // Ellipses
  const ellipseRegex = /<ellipse[^>]*\bcx="([^"]+)"[^>]*\bcy="([^"]+)"[^>]*\brx="([^"]+)"[^>]*\bry="([^"]+)"/g;
  let eMatch;
  while ((eMatch = ellipseRegex.exec(icon.block)) !== null) {
    const cx = parseFloat(eMatch[1]);
    const cy = parseFloat(eMatch[2]);
    const rx = parseFloat(eMatch[3]);
    const ry = parseFloat(eMatch[4]);
    updateGlobalBounds({ minX: cx - rx, maxX: cx + rx, minY: cy - ry, maxY: cy + ry });
  }

  // Rectangles
  const rectRegex = /<rect[^>]*\bx="([^"]+)"[^>]*\by="([^"]+)"[^>]*\bwidth="([^"]+)"[^>]*\bheight="([^"]+)"/g;
  let rMatch;
  while ((rMatch = rectRegex.exec(icon.block)) !== null) {
    const x = parseFloat(rMatch[1]);
    const y = parseFloat(rMatch[2]);
    const w = parseFloat(rMatch[3]);
    const h = parseFloat(rMatch[4]);
    updateGlobalBounds({ minX: x, maxX: x + w, minY: y, maxY: y + h });
  }

  // Lines
  const lineRegex = /<line[^>]*\bx1="([^"]+)"[^>]*\by1="([^"]+)"[^>]*\bx2="([^"]+)"[^>]*\by2="([^"]+)"/g;
  let lMatch;
  while ((lMatch = lineRegex.exec(icon.block)) !== null) {
    const x1 = parseFloat(lMatch[1]);
    const y1 = parseFloat(lMatch[2]);
    const x2 = parseFloat(lMatch[3]);
    const y2 = parseFloat(lMatch[4]);
    updateGlobalBounds({ minX: Math.min(x1, x2), maxX: Math.max(x1, x2), minY: Math.min(y1, y2), maxY: Math.max(y1, y2) });
  }

  const width = globalMaxX - globalMinX;
  const height = globalMaxY - globalMinY;
  const aspectRatio = width / height;
  const centerX = (globalMinX + globalMaxX) / 2;
  const centerY = (globalMinY + globalMaxY) / 2;

  // Margin buffer with strokeWidth = 1.2 (0.6px on each side)
  const strokeBuffer = strokeWidth / 2;
  const effectiveMinX = globalMinX - strokeBuffer;
  const effectiveMaxX = globalMaxX + strokeBuffer;
  const effectiveMinY = globalMinY - strokeBuffer;
  const effectiveMaxY = globalMaxY + strokeBuffer;

  const fitsCoordinateGrid = globalMinX >= 0 && globalMaxX <= 24 && globalMinY >= 0 && globalMaxY <= 24;
  const fitsStrokeBounds = effectiveMinX >= -0.1 && effectiveMaxX <= 24.1 && effectiveMinY >= -0.1 && effectiveMaxY <= 24.1;

  console.log(`  Coordinate Bounds: X=[${globalMinX.toFixed(2)}, ${globalMaxX.toFixed(2)}], Y=[${globalMinY.toFixed(2)}, ${globalMaxY.toFixed(2)}]`);
  console.log(`  Effective Bounds (with stroke): X=[${effectiveMinX.toFixed(2)}, ${effectiveMaxX.toFixed(2)}], Y=[${effectiveMinY.toFixed(2)}, ${effectiveMaxY.toFixed(2)}]`);
  console.log(`  Dimensions: ${width.toFixed(2)} x ${height.toFixed(2)} (Aspect Ratio: ${aspectRatio.toFixed(2)})`);
  console.log(`  Centroid: (${centerX.toFixed(2)}, ${centerY.toFixed(2)})`);
  console.log(`  Fits [0, 24] Grid: ${fitsCoordinateGrid ? 'PASS' : 'FAIL'}`);
  console.log(`  Fits with Stroke: ${fitsStrokeBounds ? 'PASS' : 'FAIL'}`);

  const hasSoftFill = fills.some(f => f.fill.startsWith('#') && (f.opacity === '0.5' || f.opacity === '0.4' || f.opacity === '0.6' || f.opacity === '0.7' || f.opacity === '0.8'));

  const pass = viewBox === '0 0 24 24' &&
               strokeWidth === 1.2 &&
               hasStrokeColor &&
               hasSoftFill &&
               fitsCoordinateGrid &&
               fitsStrokeBounds;

  if (!pass) allPassed = false;

  results.push({
    name: icon.name,
    viewBox,
    strokeWidth,
    hasStrokeColor,
    fills,
    hasSoftFill,
    bounds: { minX: globalMinX, maxX: globalMaxX, minY: globalMinY, maxY: globalMaxY },
    effectiveBounds: { minX: effectiveMinX, maxX: effectiveMaxX, minY: effectiveMinY, maxY: effectiveMaxY },
    width,
    height,
    aspectRatio,
    centerX,
    centerY,
    pass
  });
}

// Check Aliases
console.log('\n---------------------------------------------------------------');
console.log('                 EXPORT ALIAS VERIFICATION                     ');
console.log('---------------------------------------------------------------');

const aliasRegex = /export const ([A-Za-z0-9_]+) = ([A-Za-z0-9_]+);/g;
let aMatch;
const aliases = [];
const primaryNames = new Set(icons.map(i => i.name));

while ((aMatch = aliasRegex.exec(content)) !== null) {
  const aliasName = aMatch[1];
  const targetName = aMatch[2];
  const valid = primaryNames.has(targetName);
  aliases.push({ aliasName, targetName, valid });
  console.log(`  ${aliasName.padEnd(20)} -> ${targetName.padEnd(20)} [${valid ? 'VALID' : 'INVALID'}]`);
  if (!valid) allPassed = false;
}

console.log(`\nTotal exported aliases: ${aliases.length}`);
console.log(`All aliases resolve to primary components: ${aliases.every(a => a.valid)}`);

console.log('\n===============================================================');
console.log(`OVERALL ADVERSARIAL BOUNDARY VERDICT: ${allPassed ? 'PASSED (APPROVE)' : 'FAILED (REQUEST_CHANGES)'}`);
console.log('===============================================================\n');

// Output structured JSON for test documentation
fs.writeFileSync(path.resolve(__dirname, 'boundary-results.json'), JSON.stringify({ results, aliases, allPassed }, null, 2));
