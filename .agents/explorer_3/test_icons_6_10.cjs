const React = require('react');
const ReactDOMServer = require('react-dom/server');

const CannedGoodsIcon = React.forwardRef(({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
  React.createElement('svg', {
    ref,
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#6b7280',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    ...props
  },
    // Back tall ribbed can
    React.createElement('path', { d: 'M12 4.5 C12 3.5 21 3.5 21 4.5 V19 C21 20.2 12 20.2 12 19 Z', fill: '#ffffff', stroke: '#6b7280' }),
    React.createElement('ellipse', { cx: '16.5', cy: '4.5', rx: '4.5', ry: '1.2', fill: '#e5e7eb', stroke: '#6b7280' }),
    React.createElement('path', { d: 'M12 7.5 H21 V9.5 H12 Z', fill: '#f97316', stroke: 'none' }),
    React.createElement('line', { x1: '12', y1: '12', x2: '21', y2: '12', stroke: '#6b7280' }),
    React.createElement('line', { x1: '12', y1: '14.5', x2: '21', y2: '14.5', stroke: '#6b7280' }),
    React.createElement('line', { x1: '12', y1: '17', x2: '21', y2: '17', stroke: '#6b7280' }),
    // Front shorter can (overlapping)
    React.createElement('path', { d: 'M3 10 C3 9 13.5 9 13.5 10 V19.5 C13.5 21 3 21 3 19.5 Z', fill: '#ffffff', stroke: '#6b7280' }),
    React.createElement('ellipse', { cx: '8.25', cy: '10', rx: '5.25', ry: '1.4', fill: '#e5e7eb', stroke: '#6b7280' }),
    React.createElement('ellipse', { cx: '8.25', cy: '9.8', rx: '1.5', ry: '0.6', stroke: '#6b7280' }),
    React.createElement('line', { x1: '8.25', y1: '9.2', x2: '8.25', y2: '8.2', stroke: '#6b7280' }),
    // Tomato graphic
    React.createElement('circle', { cx: '8.25', cy: '15.5', r: '2.3', fill: '#f97316', stroke: '#f97316' }),
    React.createElement('path', { d: 'M8.25 13.2 V12.4 M7.2 13.6 L8.25 13 L9.3 13.6', stroke: '#6b7280', strokeWidth: '1' })
  )
));
CannedGoodsIcon.displayName = 'CannedGoodsIcon';

const BeveragesIcon = React.forwardRef(({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
  React.createElement('svg', {
    ref,
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#6b7280',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    ...props
  },
    // Bottle cap
    React.createElement('rect', { x: '5.5', y: '2.5', width: '3.5', height: '2', rx: '0.5', fill: '#e5e7eb', stroke: '#6b7280' }),
    // Bottle body
    React.createElement('path', { d: 'M6.2 4.5 V6.5 L3 9.5 V19.5 C3 20.5 4 21.5 5 21.5 H9.5 C10.5 21.5 11.5 20.5 11.5 19.5 V9.5 L8.3 6.5 V4.5', fill: '#ffffff', stroke: '#6b7280' }),
    React.createElement('path', { d: 'M4 19 H10.5', stroke: '#e5e7eb' }),
    // Orange water drop graphic
    React.createElement('path', { d: 'M7.25 12.5 C6.2 14 5.5 15.2 5.5 16.3 C5.5 17.5 6.3 18.5 7.25 18.5 C8.2 18.5 9 17.5 9 16.3 C9 15.2 8.3 14 7.25 12.5 Z', fill: '#f97316', stroke: '#f97316' }),
    // Shorter soda can (overlapping)
    React.createElement('path', { d: 'M12.5 7.5 H19.5 L21 9 V19.5 C21 20.5 20 21.5 19 21.5 H13 C12 21.5 11 20.5 11 19.5 V9 L12.5 7.5 Z', fill: '#ffffff', stroke: '#6b7280' }),
    React.createElement('ellipse', { cx: '16', cy: '7.5', rx: '3.5', ry: '1', fill: '#e5e7eb', stroke: '#6b7280' }),
    React.createElement('path', { d: 'M15 7.5 H17', stroke: '#6b7280' }),
    React.createElement('line', { x1: '11', y1: '9', x2: '21', y2: '9', stroke: '#6b7280' }),
    React.createElement('line', { x1: '11', y1: '19.5', x2: '21', y2: '19.5', stroke: '#e5e7eb' }),
    // Orange wave graphic
    React.createElement('path', { d: 'M11 14.5 C13 13 14.5 16 17 14.5 C18.5 13.5 19.8 14 21 14.5 V16.5 C19.8 16 18.5 15.5 17 16.5 C14.5 18 13 15 11 16.5 Z', fill: '#f97316', stroke: 'none' }),
    React.createElement('path', { d: 'M11 14.5 C13 13 14.5 16 17 14.5 C18.5 13.5 19.8 14 21 14.5', stroke: '#f97316', fill: 'none' })
  )
));
BeveragesIcon.displayName = 'BeveragesIcon';

const DairyIcon = React.forwardRef(({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
  React.createElement('svg', {
    ref,
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#6b7280',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    ...props
  },
    // Milk bottle cap & body
    React.createElement('path', { d: 'M5.5 2.5 H9.5 V4 H5.5 Z', fill: '#e5e7eb', stroke: '#6b7280' }),
    React.createElement('path', { d: 'M6 4 V6 L3 9 V19.5 C3 20.5 4 21.5 5 21.5 H10 C11 21.5 12 20.5 12 19.5 V9 L9 6 V4', fill: '#ffffff', stroke: '#6b7280' }),
    React.createElement('path', { d: 'M3 10.5 C5 10 7 11 12 10.5', stroke: '#e5e7eb' }),
    // Cow face outline graphic
    React.createElement('ellipse', { cx: '7.5', cy: '16', rx: '2', ry: '1.2', fill: '#e5e7eb', stroke: '#6b7280', strokeWidth: '1' }),
    React.createElement('circle', { cx: '6.8', cy: '16', r: '0.35', fill: '#6b7280', stroke: 'none' }),
    React.createElement('circle', { cx: '8.2', cy: '16', r: '0.35', fill: '#6b7280', stroke: 'none' }),
    React.createElement('path', { d: 'M6 14.5 C5.8 13.2 9.2 13.2 9 14.5', stroke: '#6b7280', strokeWidth: '1' }),
    React.createElement('path', { d: 'M6.3 13.2 L5.8 12.2 M8.7 13.2 L9.2 12.2', stroke: '#6b7280', strokeWidth: '1' }),
    React.createElement('path', { d: 'M5.6 13.8 C4.8 13.4 5 14.4 5.6 14.5 M9.4 13.8 C10.2 13.4 10 14.4 9.4 14.5', stroke: '#6b7280', strokeWidth: '1' }),
    React.createElement('circle', { cx: '6.6', cy: '14', r: '0.3', fill: '#6b7280', stroke: 'none' }),
    React.createElement('circle', { cx: '8.4', cy: '14', r: '0.3', fill: '#6b7280', stroke: 'none' }),
    // Spoon sticking out from yogurt cup
    React.createElement('path', { d: 'M15.5 10.5 L18.5 5 C19.2 3.8 21 4.8 20.2 6.2 L17.5 11', fill: '#ffffff', stroke: '#6b7280' }),
    // Yogurt cup body
    React.createElement('path', { d: 'M12 11.5 L13.5 19.8 C13.7 20.6 14.2 21.2 15 21.2 H18.5 C19.3 21.2 19.8 20.6 20 19.8 L21.5 11.5 Z', fill: '#ffffff', stroke: '#6b7280' }),
    // Orange lid
    React.createElement('path', { d: 'M11 10 C11 9.5 11.5 9 12 9 H21.5 C22 9 22.5 9.5 22.5 10 V11.5 H11 Z', fill: '#f97316', stroke: '#f97316' }),
    React.createElement('path', { d: 'M22.5 11.5 L23 13', stroke: '#f97316', strokeWidth: '1.5' }),
    React.createElement('path', { d: 'M12.7 15.5 H20.8', stroke: '#e5e7eb', strokeWidth: '1.5' })
  )
));
DairyIcon.displayName = 'DairyIcon';

const HygieneIcon = React.forwardRef(({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
  React.createElement('svg', {
    ref,
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#6b7280',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    ...props
  },
    // Orange pump mechanism
    React.createElement('path', { d: 'M4 4.5 H8.5 C9 4.5 9.5 4 9.5 3.5 V2.5 H6.5', fill: 'none', stroke: '#f97316', strokeWidth }),
    React.createElement('line', { x1: '7.5', y1: '4.5', x2: '7.5', y2: '7', stroke: '#f97316', strokeWidth }),
    React.createElement('path', { d: 'M4 6.5 C3.3 7.5 3 8.2 3 8.8 C3 9.5 3.5 10 4 10 C4.5 10 5 9.5 5 8.8 C5 8.2 4.7 7.5 4 6.5 Z', fill: '#f97316', stroke: '#f97316' }),
    // Bottle collar
    React.createElement('rect', { x: '5.5', y: '6.5', width: '4', height: '1.5', rx: '0.5', fill: '#e5e7eb', stroke: '#6b7280' }),
    // Bottle body
    React.createElement('path', { d: 'M6 8 L2.5 10 V19.5 C2.5 20.5 3.5 21.5 4.5 21.5 H10 C11 21.5 12 20.5 12 19.5 V10 L8.5 8 Z', fill: '#ffffff', stroke: '#6b7280' }),
    React.createElement('path', { d: 'M7.25 13.5 C6.2 15 5.5 16.2 5.5 17.3 C5.5 18.5 6.3 19.5 7.25 19.5 C8.2 19.5 9 18.5 9 17.3 C9 16.2 8.3 15 7.25 13.5 Z', fill: '#f97316', stroke: '#f97316' }),
    // TP roll body & top
    React.createElement('path', { d: 'M11.5 8.5 V17 C11.5 19 20.5 19 20.5 17 V8.5 Z', fill: '#ffffff', stroke: '#6b7280' }),
    React.createElement('ellipse', { cx: '16', cy: '8.5', rx: '4.5', ry: '2', fill: '#e5e7eb', stroke: '#6b7280' }),
    React.createElement('ellipse', { cx: '16', cy: '8.5', rx: '1.8', ry: '0.8', fill: '#ffffff', stroke: '#6b7280' }),
    React.createElement('path', { d: 'M11.5 17 C11.5 19 20.5 19 20.5 17', stroke: '#6b7280' }),
    // Hanging sheet
    React.createElement('path', { d: 'M20.5 10 V20.5 C20.5 20.8 20.2 21 19.8 21 H14.5', fill: '#ffffff', stroke: '#6b7280' }),
    React.createElement('line', { x1: '14.5', y1: '16', x2: '20.5', y2: '16', stroke: '#e5e7eb', strokeDasharray: '1.5 1' })
  )
));
HygieneIcon.displayName = 'HygieneIcon';

const OtherIcon = React.forwardRef(({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
  React.createElement('svg', {
    ref,
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#6b7280',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    ...props
  },
    // Basket handle
    React.createElement('path', { d: 'M6 9.5 V5 C6 4.2 6.8 3.5 7.6 3.5 H16.4 C17.2 3.5 18 4.2 18 5 V9.5', fill: 'none', stroke: '#6b7280' }),
    React.createElement('rect', { x: '10', y: '2.75', width: '4', height: '1.5', rx: '0.5', fill: '#e5e7eb', stroke: '#6b7280' }),
    // Basket rim
    React.createElement('rect', { x: '2', y: '9.5', width: '20', height: '2.5', rx: '1', fill: '#e5e7eb', stroke: '#6b7280' }),
    // Basket body
    React.createElement('path', { d: 'M3.5 12 L5 19 C5.2 19.6 5.7 20 6.3 20 H17.7 C18.3 20 18.8 19.6 19 19 L20.5 12 Z', fill: '#ffffff', stroke: '#6b7280' }),
    // Vertical slots
    React.createElement('line', { x1: '7.5', y1: '13.5', x2: '8', y2: '18.5', stroke: '#6b7280' }),
    React.createElement('line', { x1: '10.5', y1: '13.5', x2: '10.7', y2: '18.5', stroke: '#6b7280' }),
    React.createElement('line', { x1: '13.5', y1: '13.5', x2: '13.3', y2: '18.5', stroke: '#6b7280' }),
    React.createElement('line', { x1: '16.5', y1: '13.5', x2: '16', y2: '18.5', stroke: '#6b7280' }),
    // Circular badge overlapping bottom right
    React.createElement('circle', { cx: '17.5', cy: '17.5', r: '4.5', fill: '#ffffff', stroke: '#6b7280', strokeWidth }),
    React.createElement('line', { x1: '15', y1: '17.5', x2: '20', y2: '17.5', stroke: '#f97316', strokeWidth: 2, strokeLinecap: 'round' }),
    React.createElement('line', { x1: '17.5', y1: '15', x2: '17.5', y2: '20', stroke: '#f97316', strokeWidth: 2, strokeLinecap: 'round' })
  )
));
OtherIcon.displayName = 'OtherIcon';

const icons = { CannedGoodsIcon, BeveragesIcon, DairyIcon, HygieneIcon, OtherIcon };

console.log('--- TEST RESULTS FOR ICONS 6-10 ---');
for (const [name, Comp] of Object.entries(icons)) {
  const markup = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp));
  console.log(`[PASS] ${name}: length = ${markup.length}`);
  console.log(`       Outline #6b7280: ${markup.includes('#6b7280')}`);
  console.log(`       Orange #f97316:  ${markup.includes('#f97316')}`);
  console.log(`       Shading #e5e7eb: ${markup.includes('#e5e7eb')}`);
  console.log(`       White #ffffff:   ${markup.includes('#ffffff')}`);
}
