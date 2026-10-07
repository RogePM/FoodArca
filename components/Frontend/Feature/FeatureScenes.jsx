'use client';

import React from 'react';
import { Activity, Check, ChevronDown, Download, FileSpreadsheet, FileText, Globe, Laptop, Minus, Package, Plus, Smartphone, Tablet } from 'lucide-react';

// Three short scenes, one per feature. Each is a few white cards that appear one
// after another, like a screen recording, but they are real markup driven by CSS
// (see "FEATURE SCENES" in globals.css): crisp at any size, a few KB, no video file.
// Mount a scene with a new `key` to replay it from the start.

const card = 'rounded-2xl border border-black/5 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.08)]';

function Step({ d, children, className = '' }) {
  return (
    <div className={`scene-in ${className}`} style={{ '--d': `${d}ms` }}>
      {children}
    </div>
  );
}

function Tick({ d }) {
  return (
    <span
      className="scene-pop flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1C1917] text-white"
      style={{ '--d': `${d}ms` }}
    >
      <Check size={12} strokeWidth={3} />
    </span>
  );
}

/* 1 · Barcode scanning: a phone scans an item, adds it, and the inventory next to it
   shows it landing at the bottom of the list. The phone is the actor, the inventory is the result. */
const BARS = [3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 1, 2];

// A product barcode on a white label, as it looks through the camera.
function BarcodeLabel() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white px-2.5 py-2">
      <div className="flex h-10 items-stretch gap-[2px]">
        {BARS.map((w, i) => (
          <span key={i} className="bg-[#1C1917]" style={{ width: `${w * 1.9}px` }} />
        ))}
      </div>
      <p className="mt-1 text-center font-mono text-[7px] tracking-[0.18em] text-[#1C1917]">0 36000 29145 2</p>
    </div>
  );
}

// The old number leaves and the new one arrives at the same moment wherever it is shown.
function Count({ from, to, d }) {
  return (
    <span className="relative inline-block min-w-[2ch] text-right tabular-nums">
      <span className="scene-out" style={{ '--d': `${d}ms` }}>{from}</span>
      <span className="scene-in absolute right-0 top-0" style={{ '--d': `${d + 200}ms` }}>{to}</span>
    </span>
  );
}

const INVENTORY_ROWS = [
  { name: 'Brown Rice, 5 lb', qty: '25' },
  { name: 'Pasta, 16 oz', qty: '36' },
  { name: 'Canned Corn, 15 oz', qty: '18' },
  { name: 'Rolled Oats, 18 oz', qty: '14' },
];

function ScanPhone() {
  return (
    <Step d={0} className="w-[46%] shrink-0 sm:w-[40%]">
      {/* an iPhone-like body (about 9:19.5) with a thin light frame, so it sits on the panel
          instead of dominating it */}
      <div className="relative flex aspect-[9/19.5] flex-col overflow-hidden rounded-[30px] border-[1.5px] border-black/15 bg-white px-3 pb-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.3)]">
        {/* status bar and dynamic island */}
        <span className="absolute left-1/2 top-[7px] h-[13px] w-[34%] -translate-x-1/2 rounded-full bg-[#1C1917]/80" />
        <div className="flex h-7 shrink-0 items-end justify-between px-1 pb-0.5 text-[8px] font-semibold text-[#1C1917]">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="flex items-end gap-[1px]">
              {[2, 4, 6, 8].map((h) => (
                <span key={h} className="w-[1.5px] rounded-sm bg-[#1C1917]" style={{ height: h }} />
              ))}
            </span>
            <span className="h-[8px] w-[15px] rounded-[2.5px] border border-[#1C1917]/50 p-[1px]">
              <span className="block h-full w-[75%] rounded-[1px] bg-[#1C1917]" />
            </span>
          </span>
        </div>

        <div className="mb-2 mt-2 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[#1C1917]">Add item</p>
          <span className="relative inline-flex h-5 min-w-[54px] items-center justify-center text-[9.5px] font-medium">
            <span className="scene-out text-[#57534E]" style={{ '--d': '1700ms' }}>Scanning…</span>
            <span
              className="scene-in absolute inset-0 inline-flex items-center justify-center gap-1 rounded-md bg-[#1A1F36] text-white"
              style={{ '--d': '1800ms' }}
            >
              <Check size={9} strokeWidth={3} /> Found
            </span>
          </span>
        </div>

        <div className="relative h-[128px] shrink-0 overflow-hidden rounded-2xl bg-[#1C1917]">
          <BarcodeLabel />
          {['left-2.5 top-2.5 border-l-2 border-t-2', 'right-2.5 top-2.5 border-r-2 border-t-2', 'bottom-2.5 left-2.5 border-b-2 border-l-2', 'bottom-2.5 right-2.5 border-b-2 border-r-2'].map((c) => (
            <span key={c} className={`absolute h-3.5 w-3.5 rounded-sm border-[#D97757] ${c}`} />
          ))}
          <span
            className="scene-scan absolute inset-x-2.5 h-[2px] rounded-full bg-[#D97757] shadow-[0_0_6px_rgba(217,119,87,0.9)]"
            style={{ '--d': '500ms', animationIterationCount: 1, animationDuration: '1.2s' }}
          />
        </div>

        <Step d={1900} className="mt-2.5 flex items-center gap-2 rounded-xl bg-[#F3F4F6] px-2 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#57534E]">
            <Package size={13} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10.5px] font-medium leading-tight text-[#1C1917]">Black Beans, 15 oz</p>
            <p className="truncate text-[8.5px] text-[#57534E]">Canned goods</p>
          </div>
        </Step>

        <Step d={2300} className="mt-1.5 flex items-center justify-between rounded-xl bg-[#F3F4F6] px-2.5 py-2">
          <span className="text-[9.5px] text-[#57534E]">Quantity</span>
          <span className="flex items-center gap-2 text-[#1C1917]">
            <Minus size={10} className="text-[#57534E]" />
            <span className="text-[12px] font-semibold">
              <Count from={1} to={12} d={2800} />
            </span>
            <Plus size={10} className="text-[#57534E]" />
          </span>
        </Step>

        <Step d={3100} className="mt-auto">
          <div className="relative">
            <div className="flex h-9 items-center justify-center rounded-xl bg-[#D97757] text-[10.5px] font-semibold text-white">
              <span className="scene-out" style={{ '--d': '4000ms' }}>Add to inventory</span>
            </div>
            <div className="scene-in absolute inset-0 flex items-center justify-center gap-1 rounded-xl bg-[#1A1F36] text-[10.5px] font-semibold text-white" style={{ '--d': '4100ms' }}>
              <Check size={11} strokeWidth={3} /> Added
            </div>
          </div>
        </Step>
        {/* home indicator */}
        <span className="mx-auto mt-2.5 h-[3px] w-14 shrink-0 rounded-full bg-black/20" />
      </div>
    </Step>
  );
}

function ScanScene() {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <ScanPhone />

      {/* the inventory loads in row by row, then the scanned item lands at the bottom */}
      <Step d={300} className={`${card} min-w-0 flex-1 p-3`}>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[13px] font-medium text-[#1C1917]">Inventory</p>
          <Step d={500}>
            <span className="whitespace-nowrap text-[11px] text-[#57534E]">
              <Count from={4} to={5} d={4600} /> items
            </span>
          </Step>
        </div>
        <ul className="text-[12.5px] text-[#57534E]">
          {INVENTORY_ROWS.map(({ name, qty }, i) => (
            <Step key={name} d={600 + i * 150}>
              <li className="flex items-center border-t border-gray-100 py-2">
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="w-6 text-right tabular-nums">{qty}</span>
              </li>
            </Step>
          ))}
          <li className="scene-in border-t border-gray-100" style={{ '--d': '4600ms' }}>
            <div className="scene-flash -mx-2 flex items-center gap-1.5 rounded-lg px-2 py-2 text-[#1C1917]" style={{ '--d': '4800ms' }}>
              <span className="min-w-0 flex-1 truncate font-medium">Black Beans, 15 oz</span>
              <span className="rounded-md bg-[#1A1F36] px-1.5 py-0.5 text-[10px] font-medium text-white">New</span>
              <span className="w-6 text-right font-semibold tabular-nums">12</span>
            </div>
          </li>
        </ul>
      </Step>
    </div>
  );
}

/* 2 · Works on any device: one change, and every device shows it at the same moment */
const DEVICES = [
  { Icon: Smartphone, label: 'Phone', d: 1500 },
  { Icon: Tablet, label: 'Tablet', d: 1650 },
  { Icon: Laptop, label: 'Laptop', d: 1800 },
];

function DevicesScene() {
  return (
    <>
      <Step d={0} className={`${card} w-full p-3 sm:p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-medium text-[#1C1917]">Black Beans</p>
          <Step d={400}>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1 text-[12.5px] font-medium text-[#1C1917]">
              <Smartphone size={13} /> +12 received
            </span>
          </Step>
        </div>
        <Step d={800} className="flex items-center justify-between rounded-xl bg-[#F3F4F6] px-3 py-3">
          <span className="text-[13px] text-[#57534E]">In stock</span>
          <span className="text-[24px] font-semibold leading-none text-[#1C1917]">
            <Count from={48} to={60} d={2000} />
          </span>
        </Step>
      </Step>

      <Step d={1300} className={`${card} w-[72%] self-end p-1.5`}>
        {DEVICES.map(({ Icon, label, d }) => (
          <div
            key={label}
            className="scene-flash flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] text-[#1C1917]"
            style={{ '--d': '2000ms' }}
          >
            <Icon size={16} className="text-[#57534E]" />
            <span className="scene-in flex-1" style={{ '--d': `${d}ms` }}>{label}</span>
            <span className="font-semibold">
              <Count from={48} to={60} d={2000} />
            </span>
          </div>
        ))}
      </Step>

      <Step d={2900} className={`${card} flex w-[72%] items-center gap-3 self-end px-3 py-2.5`}>
        <Globe size={16} className="text-[#57534E]" />
        <span className="flex-1 text-[13px] font-medium text-[#1C1917]">Just a browser, nothing to install</span>
        <Tick d={3300} />
      </Step>
    </>
  );
}

/* 3 · Reports: stats and the inventory list, then the three downloads */
const STATS = [
  { label: 'In stock', value: '186' },
  { label: 'Given out', value: '1,240 lb' },
  { label: 'Expiring soon', value: '9' },
];
const LIST = [
  { name: 'Black Beans, 15 oz', qty: '48' },
  { name: 'Brown Rice, 5 lb', qty: '25' },
  { name: 'Pasta, 16 oz', qty: '36' },
];
const DOWNLOADS = [
  { Icon: FileSpreadsheet, label: 'Download as CSV', d: 2300 },
  { Icon: Activity, label: 'Download activity', d: 2500 },
  { Icon: FileText, label: 'Report for grants', d: 2700, picked: true },
];

function ReportScene() {
  return (
    <>
      <Step d={0} className={`${card} w-full p-3 sm:p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-medium text-[#1C1917]">Inventory</p>
          <Step d={1700}>
            <span className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1 text-[12.5px] font-medium text-[#1C1917]">
              <Download size={13} /> Export <ChevronDown size={13} />
            </span>
          </Step>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {STATS.map(({ label, value }, i) => (
            <Step key={label} d={300 + i * 150} className="rounded-xl bg-[#F3F4F6] px-2.5 py-2">
              <p className="text-[11px] text-[#57534E]">{label}</p>
              <p className="text-[15px] font-semibold tabular-nums text-[#1C1917]">{value}</p>
            </Step>
          ))}
        </div>
        <ul className="divide-y divide-gray-100 text-[13px] text-[#1C1917]">
          {LIST.map(({ name, qty }, i) => (
            <Step key={name} d={900 + i * 200}>
              <li className="flex items-center justify-between py-1.5">
                <span>{name}</span>
                <span className="tabular-nums text-[#57534E]">{qty}</span>
              </li>
            </Step>
          ))}
        </ul>
      </Step>

      <Step d={2100} className={`${card} w-[72%] self-end p-1.5`}>
        {DOWNLOADS.map(({ Icon, label, d, picked }) => (
          <div
            key={label}
            className="relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] text-[#1C1917]"
          >
            {picked && (
              <span className="scene-in absolute inset-0 rounded-xl bg-[#F9FAFB] ring-1 ring-[#1A1F36]" style={{ '--d': '3100ms' }} />
            )}
            <Icon size={16} className="relative text-[#57534E]" />
            <span className="scene-in relative" style={{ '--d': `${d}ms` }}>{label}</span>
          </div>
        ))}
      </Step>

      <Step d={3600} className={`${card} flex w-[72%] items-center gap-3 self-end px-3 py-2.5`}>
        <FileText size={16} className="text-[#57534E]" />
        <span className="flex-1 text-[13px] font-medium text-[#1C1917]">grant-report.pdf</span>
        <Tick d={3900} />
      </Step>
    </>
  );
}

export const SCENES = [ScanScene, DevicesScene, ReportScene];

/* How it works hero: one delivery from scan to stock. The scan lands, the checklist ticks off,
   then the new count arrives on every device at the same moment, with an expiry heads-up below. */
const HERO_CHECKS = [
  { label: 'Category set: Canned goods', d: 1300 },
  { label: 'Expiration date saved', d: 1900 },
  { label: 'Added to inventory', d: 2500 },
];
const HERO_DEVICES = [
  { Icon: Smartphone, label: 'Front desk phone', d: 3800 },
  { Icon: Tablet, label: 'Warehouse tablet', d: 3950 },
  { Icon: Laptop, label: 'Office laptop', d: 4100 },
];

export function HeroScene() {
  return (
    <>
      <Step d={0} className={`${card} flex items-center gap-3 p-3 sm:p-4`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#57534E]">
          <Package size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-[#1C1917]">Black Beans, 15 oz</p>
          <p className="text-[12.5px] text-[#57534E]">Barcode scanned at the door</p>
        </div>
        <span className="scene-in rounded-md bg-[#1A1F36] px-2 py-1 text-[11px] font-medium text-white" style={{ '--d': '700ms' }}>
          Found
        </span>
      </Step>

      <ul className="flex flex-col gap-2.5 px-3 py-2">
        {HERO_CHECKS.map(({ label, d }) => (
          <Step key={label} d={d}>
            <li className="flex items-center gap-2.5 text-[13px] text-[#57534E]">
              <Tick d={d + 350} />
              {label}
            </li>
          </Step>
        ))}
      </ul>

      <Step d={3300} className={`${card} p-3 sm:p-4`}>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[14px] font-medium text-[#1C1917]">Black Beans in stock</p>
          <span className="text-[24px] font-semibold leading-none text-[#1C1917]">
            <Count from={48} to={60} d={4300} />
          </span>
        </div>
        {HERO_DEVICES.map(({ Icon, label, d }) => (
          <div
            key={label}
            className="scene-flash flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-[#1C1917]"
            style={{ '--d': '4300ms' }}
          >
            <Icon size={15} className="text-[#57534E]" />
            <span className="scene-in flex-1" style={{ '--d': `${d}ms` }}>{label}</span>
            <span className="font-semibold">
              <Count from={48} to={60} d={4300} />
            </span>
          </div>
        ))}
      </Step>

      <Step d={5000} className={`${card} flex items-center gap-3 px-3 py-2.5`}>
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
        <span className="flex-1 text-[13px] text-[#1C1917]">Pasta, 16 oz</span>
        <span className="text-[12.5px] text-[#57534E]">Expires in 6 days</span>
      </Step>
    </>
  );
}

/* Giving food out (How it works page): scan items into a cart, give them out with no names
   needed, and the stock count drops. */
const CART_LINES = [
  { name: 'Brown Rice, 5 lb', qty: 1, d: 500 },
  { name: 'Pasta, 16 oz', qty: 2, d: 900 },
  { name: 'Canned Corn, 15 oz', qty: 1, d: 1300 },
];

export function GiveOutScene() {
  return (
    <>
      <Step d={0} className={`${card} w-full p-3 sm:p-4`}>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[14px] font-medium text-[#1C1917]">Cart</p>
          <span className="text-[12px] text-[#57534E]">4 items</span>
        </div>
        <ul className="text-[13px] text-[#57534E]">
          {CART_LINES.map(({ name, qty, d }) => (
            <Step key={name} d={d}>
              <li className="flex items-center border-t border-gray-100 py-2">
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="tabular-nums text-[#1C1917]">x{qty}</span>
              </li>
            </Step>
          ))}
        </ul>
      </Step>

      <Step d={1900} className={`${card} flex w-full items-center gap-3 px-3 py-2.5`}>
        <span className="flex-1 text-[13px] text-[#57534E]">Who it is for</span>
        <span className="text-[13px] font-medium text-[#1C1917]">No name needed</span>
      </Step>

      <Step d={2500} className="w-full">
        <div className="relative">
          <div className="flex h-11 items-center justify-center rounded-xl bg-[#D97757] text-[14px] font-semibold text-white">
            <span className="scene-out" style={{ '--d': '3400ms' }}>Give out</span>
          </div>
          <div className="scene-in absolute inset-0 flex items-center justify-center gap-1.5 rounded-xl bg-[#1A1F36] text-[14px] font-semibold text-white" style={{ '--d': '3500ms' }}>
            <Check size={14} strokeWidth={3} /> Given out
          </div>
        </div>
      </Step>

      <Step d={3900} className={`${card} flex w-[72%] items-center justify-between self-end px-3 py-2.5`}>
        <span className="text-[13px] text-[#57534E]">Pasta, 16 oz in stock</span>
        <span className="text-[16px] font-semibold text-[#1C1917]">
          <Count from={36} to={34} d={4300} />
        </span>
      </Step>
    </>
  );
}

// Soft contour lines behind the cards, same idea as the page's hills.
export function SceneLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 500"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="9" strokeLinecap="round">
        <path d="M -20 120 C 150 60, 260 190, 420 140 S 700 60, 840 120" />
        <path d="M 120 -20 C 160 120, 90 260, 210 360 S 330 480, 300 540" />
        <path d="M 620 -20 C 560 130, 700 250, 640 380 S 720 480, 760 540" />
      </g>
    </svg>
  );
}
