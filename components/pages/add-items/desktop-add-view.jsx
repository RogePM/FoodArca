'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Loader2, CheckCircle2,
  Search, Gift, ShoppingBag,
  Landmark, HeartHandshake, AlertCircle, Package, Barcode,
  Check, ChevronDown, ChevronLeft, ChevronRight, X, Scale, Hash,
  RotateCcw, Sparkles, Building2, PanelRight, Minus, Calendar, Info, HelpCircle, BookOpen, Trash2, Settings2, Pencil
} from 'lucide-react';
import { categories } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';

/* ─── helpers ─────────────────────────────────────────────────────────── */

function getCategoryMeta(catName) {
  const safeStr = String(catName || '').toLowerCase();
  const found = categories.find(
    (c) => c.name.toLowerCase() === safeStr || c.value.toLowerCase() === safeStr
  );
  if (found)
    return { icon: found.icon, name: found.name, value: found.value, style: found.style };
  return {
    icon: Package,
    name: String(catName || 'Other'),
    value: 'other',
    style: categories.find((c) => c.value === 'other')?.style,
  };
}

function sanitizePositiveNumber(val) {
  if (!val) return '';
  const cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return `${parts[0]}.${parts.slice(1).join('')}`;
  return cleaned;
}

/* ─── design tokens ───────────────────────────────────────────────────── */

const cls = {
  input: [
    'w-full h-[44px] px-4 rounded-xl border border-gray-200 bg-white',
    'text-[14px] font-medium text-[#1a1f36]',
    'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
    'outline-none transition-[border-color,box-shadow] duration-150',
    'focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/10',
    'placeholder:text-[#a3acb9] placeholder:font-normal',
  ].join(' '),
  pill: [
    'h-[38px] px-4 rounded-xl border text-[13px] font-semibold',
    'transition-all duration-150 cursor-pointer',
    'flex items-center gap-2 select-none whitespace-nowrap',
  ].join(' '),
  pillOn: 'bg-gray-100/90 border-gray-300 text-[#1a1f36] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
  pillOff:
    'bg-white border-gray-200 text-[#697386] hover:border-gray-300 hover:bg-gray-50/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
};

/* ─── info hover tooltip ──────────────────────────────────────────────── */

function FieldInfoTooltip({ text }) {
  if (!text) return null;
  return (
    <div className="group/info relative inline-flex items-center">
      <Info className="h-3.5 w-3.5 text-[#a3acb9] hover:text-[#d97757] transition-colors cursor-help shrink-0 ml-1" strokeWidth={2} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/info:block w-64 bg-white border border-gray-200/90 text-[#1a1f36] text-[11px] font-medium leading-relaxed p-3 rounded-xl shadow-xl z-50 pointer-events-none transition-all text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-200/90 -z-10" />
      </div>
    </div>
  );
}

/* ─── intake guide modal ──────────────────────────────────────────────── */

function IntakeGuideModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('start');
  const [searchQuery, setSearchQuery] = useState('');
  if (!isOpen) return null;

  const guideSections = [
    {
      id: 'start',
      title: 'How to Fill Out Form',
      badge: 'Start Here',
      icon: BookOpen,
      summary: '7 simple steps to log items',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#1a1f36] flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#d97757]" />
              How to Fill Out the Intake Form (Step-by-Step)
            </h3>
            <p className="text-[13px] text-[#697386] mt-1 leading-relaxed">
              Follow these simple steps from top to bottom to log your items into Food Arca.
            </p>
          </div>

          <div className="space-y-2.5 text-[12px]">
            {/* Step 1 */}
            <div className="p-3 rounded-xl border border-gray-200/90 bg-white flex items-start gap-3 shadow-2xs">
              <span className="h-6 w-6 rounded-full bg-[#fff0eb] text-[#d97757] text-[12px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <strong className="font-semibold text-[#1a1f36] text-[13px]">Scan or Type Barcode (Top Field)</strong>
                <p className="text-[#697386] mt-0.5">Scan product UPC with your scanner or type it in. <em>If the item has no barcode, leave it blank and Food Arca auto-generates one!</em></p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-xl border border-gray-200/90 bg-white flex items-start gap-3 shadow-2xs">
              <span className="h-6 w-6 rounded-full bg-[#fff0eb] text-[#d97757] text-[12px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <strong className="font-semibold text-[#1a1f36] text-[13px]">Item Name & Category (*)</strong>
                <p className="text-[#697386] mt-0.5">Type the item name (e.g. <code>Organic Black Beans</code>) and select a Category (e.g. <code>Canned Goods</code>). <em>Required!</em></p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-xl border border-gray-200/90 bg-white flex items-start gap-3 shadow-2xs">
              <span className="h-6 w-6 rounded-full bg-[#fff0eb] text-[#d97757] text-[12px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <strong className="font-semibold text-[#1a1f36] text-[13px]">Quantity & Container Type</strong>
                <p className="text-[#697386] mt-0.5">Type how many you received (e.g. <code>5</code>) and select what you are counting as (e.g. <code>Boxes</code>, <code>Packs</code>, or <code>Units</code>).</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 rounded-xl border border-gray-200/90 bg-white flex items-start gap-3 shadow-2xs">
              <span className="h-6 w-6 rounded-full bg-[#fff0eb] text-[#d97757] text-[12px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">4</span>
              <div>
                <strong className="font-semibold text-[#1a1f36] text-[13px]">Package Size (Weight / Volume)</strong>
                <p className="text-[#697386] mt-0.5">Enter package size printed on label (e.g. <code>16 oz</code> or <code>12 fl oz</code>).</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-3 rounded-xl border border-gray-200/90 bg-white flex items-start gap-3 shadow-2xs">
              <span className="h-6 w-6 rounded-full bg-[#fff0eb] text-[#d97757] text-[12px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">5</span>
              <div>
                <strong className="font-semibold text-[#1a1f36] text-[13px]">Select Expiration Date & Source</strong>
                <p className="text-[#697386] mt-0.5">Choose date precision (<code>Exact Date</code>, <code>Month/Year</code>, or <code>No Expiration</code>) and click the Source card (<code>Donation</code>, <code>Rescue</code>, <code>Purchased</code>, <code>USDA</code>).</p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start gap-3 shadow-2xs">
              <span className="h-6 w-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">6</span>
              <div>
                <strong className="font-semibold text-[#1a1f36] text-[13px]">Click "Add to batch"</strong>
                <p className="text-[#697386] mt-0.5">Food Arca notifies you that the item is staged! The form resets for your next item while staging it in your cart.</p>
              </div>
            </div>

            {/* Step 7 — Highlighted Dark Card */}
            <div className="p-4 rounded-xl bg-[#1a1f36] text-white flex items-start gap-3 shadow-md">
              <span className="h-6 w-6 rounded-full bg-[#d97757] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">7</span>
              <div>
                <strong className="font-bold text-white text-[13px] block">Final Step: Click "View Batch" & Save to Inventory!</strong>
                <p className="text-gray-300 mt-0.5 text-[11px] leading-relaxed">Whether adding 1 item or 50 items, open <strong>View Batch</strong> and click <strong>"Save Batch to Inventory"</strong> to finalize and commit all staged items into your inventory at once.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'weight',
      title: 'Weight & Measurements',
      badge: 'Popular',
      icon: Scale,
      summary: 'By Count vs By Weight modes',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#1a1f36] flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#d97757]" />
              Weight & Measurement Modes
            </h3>
            <p className="text-[13px] text-[#697386] mt-1 leading-relaxed">
              Food Arca supports two measurement modes depending on whether you are logging pre-packaged retail products or bulk unpackaged produce.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* By Count */}
            <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#1a1f36] flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-[#d97757]" /> By Count
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#f8fafb] text-[#3c4257] border border-gray-200">
                  Standard
                </span>
              </div>
              <p className="text-[12px] text-[#697386] leading-relaxed">
                Use for packaged retail goods that are counted by unit (cans, boxes, bags, jars).
              </p>
              <div className="text-[11px] text-[#3c4257] bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1 font-mono">
                <div>• Quantity: 10</div>
                <div>• Counting as: Boxes</div>
                <div>• Package size: 16 oz</div>
              </div>
            </div>

            {/* By Weight */}
            <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#1a1f36] flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-[#d97757]" /> By Weight (Bulk)
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#f8fafb] text-[#3c4257] border border-gray-200">
                  Scale Mode
                </span>
              </div>
              <p className="text-[12px] text-[#697386] leading-relaxed">
                Use for unpackaged produce, Gaylord bulk bins, or salvage weighed on a scale.
              </p>
              <div className="text-[11px] text-[#3c4257] bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1 font-mono">
                <div>• Scale Weight: 450 lbs</div>
                <div>• Container: 1 Gaylord</div>
                <div>• Category: Produce</div>
              </div>
            </div>
          </div>

          <div className="bg-[#f8fafb] border border-gray-200/90 rounded-xl p-3.5 space-y-1.5 text-[12px]">
            <span className="font-semibold text-[#1a1f36] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#d97757]" /> Quick Unit Guide
            </span>
            <div className="grid grid-cols-2 gap-2 text-[#3c4257] text-[11px] pt-1">
              <div><strong>fl oz:</strong> Liquid volumes (Soda, Juice, Milk)</div>
              <div><strong>oz / lbs:</strong> Solid weights (Canned soup, Flour)</div>
              <div><strong>gal:</strong> Large liquids (Gallon jugs)</div>
              <div><strong>units:</strong> Miscellaneous unweighted items</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'packs',
      title: 'Packs, Boxes & Cases',
      icon: Package,
      summary: 'Multi-pack unit calculations',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#1a1f36] flex items-center gap-2">
              <Package className="h-5 w-5 text-[#d97757]" />
              Logging Multi-Pack Cases & Boxes
            </h3>
            <p className="text-[13px] text-[#697386] mt-1 leading-relaxed">
              Log wholesale cases without manual math. Food Arca tracks both box counts and total individual items.
            </p>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-xl p-4 space-y-3 text-[12px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-semibold text-[#1a1f36] text-[13px]">Example: 5 Fridge Packs (12 Soda Cans each)</span>
              <span className="text-[10px] font-medium text-[#3c4257] bg-[#f8fafb] px-2 py-0.5 rounded-md border border-gray-200">Automated</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#f8fafb] p-2.5 rounded-lg border border-gray-200/80">
                <span className="text-[11px] text-[#697386] block">Quantity</span>
                <strong className="text-[14px] text-[#1a1f36]">5</strong>
              </div>
              <div className="bg-[#f8fafb] p-2.5 rounded-lg border border-gray-200/80">
                <span className="text-[11px] text-[#697386]">Counting as</span>
                <strong className="text-[14px] text-[#1a1f36] block">Packs</strong>
              </div>
              <div className="bg-[#f8fafb] p-2.5 rounded-lg border border-gray-200/80">
                <span className="text-[11px] text-[#697386]">Items per pack</span>
                <strong className="text-[14px] text-[#1a1f36] block">12</strong>
              </div>
            </div>
            <div className="p-3 bg-[#f8fafb] border border-gray-200/80 rounded-lg text-[#1a1f36] text-[12px] font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>System logs 5 packs = 60 individual cans staged for clients!</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'scanning',
      title: 'Barcode Scanning',
      icon: Barcode,
      summary: 'Auto-fill & smart memory lookup',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#1a1f36] flex items-center gap-2">
              <Barcode className="h-5 w-5 text-[#d97757]" />
              UPC Barcode Scanning & Memory
            </h3>
            <p className="text-[13px] text-[#697386] mt-1 leading-relaxed">
              Plug in any USB/Bluetooth scanner and scan barcodes directly into the intake form.
            </p>
          </div>

          <div className="space-y-2.5 text-[12px]">
            <div className="p-3.5 rounded-xl border border-gray-200/90 bg-white flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-[#d97757] shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-[#1a1f36] text-[13px]">OpenFoodFacts Integration</strong>
                <p className="text-[#697386] mt-0.5">Automatically pulls product name, category, image, and size for millions of items worldwide.</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-200/90 bg-white flex items-start gap-3">
              <RotateCcw className="h-5 w-5 text-[#1a1f36] shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-[#1a1f36] text-[13px]">Zero-Latency Smart Memory</strong>
                <p className="text-[#697386] mt-0.5">Re-scanning an item previously added in your pantry restores your custom pack size, category, and weight in 0 milliseconds.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'expiration',
      title: 'Expiration Dates',
      icon: Calendar,
      summary: 'Exact day, Month/Year, or No Date',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#1a1f36] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#d97757]" />
              Expiration Precision Options
            </h3>
            <p className="text-[13px] text-[#697386] mt-1 leading-relaxed">
              Not all food items require exact day precision. Choose the date level that matches the product.
            </p>
          </div>

          <div className="space-y-2.5 text-[12px]">
            <div className="p-3.5 rounded-xl border border-gray-200/90 bg-white flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#1a1f36] block">Exact Date</span>
                <span className="text-[#697386] text-[11px]">Select calendar day</span>
              </div>
              <span className="text-[11px] font-medium text-[#3c4257] bg-[#f8fafb] px-2.5 py-1 rounded-md border border-gray-200">
                Dairy, Fresh Meat, Bakery
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-200/90 bg-white flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#1a1f36] block">Month & Year</span>
                <span className="text-[#697386] text-[11px]">Select Month and Year</span>
              </div>
              <span className="text-[11px] font-medium text-[#3c4257] bg-[#f8fafb] px-2.5 py-1 rounded-md border border-gray-200">
                Canned Goods, Dry Pasta, Cereal
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-200/90 bg-white flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#1a1f36] block">No Expiration</span>
                <span className="text-[#697386] text-[11px]">Skip date tracking</span>
              </div>
              <span className="text-[11px] font-medium text-[#3c4257] bg-[#f8fafb] px-2.5 py-1 rounded-md border border-gray-200">
                Hygiene, Paper Goods, Cleaning
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sources',
      title: 'Acquisition Sources',
      icon: HeartHandshake,
      summary: 'Donations, Rescue, USDA, Purchased',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#1a1f36] flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-[#d97757]" />
              Tracking Acquisition Sources
            </h3>
            <p className="text-[13px] text-[#697386] mt-1 leading-relaxed">
              Selecting the inventory source helps generate required TEFAP and grant compliance reports.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]">
            <div className="p-3.5 rounded-xl border border-gray-200/90 bg-white">
              <strong className="text-[#1a1f36] font-semibold text-[13px] block">Donation</strong>
              <p className="text-[#697386] text-[11px] mt-0.5">Community food drives and individual donor contributions.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-200/90 bg-white">
              <strong className="text-[#1a1f36] font-semibold text-[13px] block">Retail Rescue</strong>
              <p className="text-[#697386] text-[11px] mt-0.5">Grocery store pickups (Target, Trader Joe's, Walmart).</p>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-200/90 bg-white">
              <strong className="text-[#1a1f36] font-semibold text-[13px] block">Purchased</strong>
              <p className="text-[#697386] text-[11px] mt-0.5">Items bought using organization funds.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-200/90 bg-white">
              <strong className="text-[#1a1f36] font-semibold text-[13px] block">USDA Commodity</strong>
              <p className="text-[#697386] text-[11px] mt-0.5">TEFAP and government commodity allocations.</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = guideSections.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSection = guideSections.find((s) => s.id === activeTab) || guideSections[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white border border-gray-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[620px] max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#f8fafb]">
          <div className="flex items-center gap-2.5">
            <div className="h-8.5 w-8.5 rounded-xl bg-[#fff0eb] border border-[#d97757]/20 flex items-center justify-center shrink-0">
              <HelpCircle className="h-4.5 w-4.5 text-[#d97757]" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#1a1f36]">Inventory Intake Guide</h2>
              <p className="text-[12px] text-[#697386]">Step-by-step instructions for logging food items</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8.5 w-8.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Main Content Area — Sidebar Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar Navigation */}
          <div className="w-[240px] shrink-0 border-r border-gray-100 bg-[#f8fafb]/60 p-3.5 flex flex-col gap-1.5 overflow-y-auto">
            <div className="relative mb-1">
              <Search className="h-3.5 w-3.5 text-[#a3acb9] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter topics…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2 text-[11px] bg-white border border-gray-200 rounded-lg outline-none focus:border-[#d97757]"
              />
            </div>

            <div className="text-[10px] font-bold text-[#8792a2] uppercase tracking-wider px-2 pt-1 pb-0.5">
              Topics
            </div>

            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 flex items-start gap-2.5 cursor-pointer ${
                    isActive
                      ? 'bg-white border border-gray-200/90 text-[#1a1f36] shadow-2xs font-bold'
                      : 'text-[#697386] hover:bg-white/80 hover:text-[#1a1f36]'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? 'text-[#d97757]' : 'text-[#a3acb9]'}`} strokeWidth={2} />
                  <div className="min-w-0">
                    <div className="text-[12px] leading-snug flex items-center justify-between">
                      <span className="truncate">{sec.title}</span>
                      {sec.badge && (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ml-1 shrink-0 ${
                          isActive ? 'bg-[#fff0eb] text-[#d97757]' : 'bg-gray-100 text-[#3c4257]'
                        }`}>
                          {sec.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] font-normal truncate mt-0.5 ${isActive ? 'text-gray-300' : 'text-[#8792a2]'}`}>{sec.summary}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Topic Details Pane */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            {currentSection.content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#8792a2]">Need more help? Hover any info icon on the form.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1a1f36] text-white text-[12px] font-bold hover:bg-[#2d3452] transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── custom dropdown component ──────────────────────────────────────── */

function CustomSelect({ value, onChange, options, placeholder = 'Select…', className = 'w-full', buttonClassName = '', menuAlign = 'left', menuVerticalAlign = 'bottom' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const ref = useRef(null);
  const listRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(options.findIndex((o) => o.value === value));
    }
  }, [isOpen, value, options]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchString = useRef('');
  const searchTimeout = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
        onChange(options[highlightedIndex].value);
        setIsOpen(false);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchString.current += e.key.toLowerCase();
      searchTimeout.current = setTimeout(() => {
        searchString.current = '';
      }, 500);

      const matchIndex = options.findIndex((opt) => {
        const lbl = (opt.label || opt.name || '').toLowerCase();
        return lbl.startsWith(searchString.current);
      });

      if (matchIndex >= 0) {
        if (isOpen) {
          setHighlightedIndex(matchIndex);
        } else {
          onChange(options[matchIndex].value);
          setHighlightedIndex(matchIndex);
        }
      }
    }
  };

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const defaultBtnClass = `w-full ${cls.input} cursor-pointer flex items-center justify-between ${selectedOption ? 'font-semibold text-[#3c4257]' : 'font-normal text-[#a3acb9]'}`;

  const labelToDisplay = selectedOption?.label || selectedOption?.name || placeholder;

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || defaultBtnClass}
      >
        <span className="truncate text-left flex items-center gap-2">
          {selectedOption?.icon && <selectedOption.icon className="h-4 w-4 text-[#697386]" strokeWidth={1.8} />}
          {labelToDisplay}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[#a3acb9] shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          className={`absolute ${
            menuVerticalAlign === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            menuAlign === 'right' ? 'right-0 min-w-[120px]' : 'left-0 right-0'
          } max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] z-50 py-1 px-1`}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === highlightedIndex;
            const Icon = opt.icon;
            const optLabel = opt.label || opt.name;
            
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2 text-[13px] rounded-lg cursor-pointer transition-colors duration-100 ${
                  isHighlighted || isSelected
                    ? 'bg-gray-100/90 text-[#1a1f36] font-bold'
                    : 'text-[#3c4257] hover:bg-gray-50 font-medium'
                }`}
              >
                <span className="truncate flex items-center gap-2.5">
                  {Icon && <Icon className="h-4 w-4 text-[#697386]" strokeWidth={1.8} />}
                  {optLabel}
                </span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-[#d97757] shrink-0 ml-2" strokeWidth={2.5} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const unitOptions = [
  { value: 'units', label: 'Units / Items' },
  { value: 'cans', label: 'Cans' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'packets', label: 'Packets / Bags' },
  { value: 'cases', label: 'Cases' },
];

const weightUnitOptions = [
  { value: 'lbs', label: 'lbs' },
  { value: 'oz', label: 'oz' },
  { value: 'fl_oz', label: 'fl oz' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'mL' },
  { value: 'l', label: 'L' },
  { value: 'gal', label: 'gal' },
];

const containerTypeOptions = [
  { value: 'boxes', label: 'Boxes / Gaylords' },
  { value: 'pallets', label: 'Pallets' },
  { value: 'bins', label: 'Bins / Crates' },
  { value: 'bags', label: 'Bulk Bags' },
];

const monthOptions = [
  { value: '01', label: '01 - January' },
  { value: '02', label: '02 - February' },
  { value: '03', label: '03 - March' },
  { value: '04', label: '04 - April' },
  { value: '05', label: '05 - May' },
  { value: '06', label: '06 - June' },
  { value: '07', label: '07 - July' },
  { value: '08', label: '08 - August' },
  { value: '09', label: '09 - September' },
  { value: '10', label: '10 - October' },
  { value: '11', label: '11 - November' },
  { value: '12', label: '12 - December' },
];

/* ─── modern custom date picker ──────────────────────────────────────── */

function ModernDatePicker({ value, onChange, placeholder = 'Select date…', menuVerticalAlign = 'bottom' }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth());

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((v) => v - 1);
    } else {
      setViewMonth((v) => v - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((v) => v + 1);
    } else {
      setViewMonth((v) => v + 1);
    }
  };

  const formattedDisplay = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-[44px] px-4 rounded-xl border border-gray-200 bg-white text-[14px] font-medium ${
          value ? 'text-[#1a1f36] font-semibold' : 'text-[#a3acb9]'
        } flex items-center gap-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:bg-gray-50/80 transition-colors cursor-pointer outline-none focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/10`}
      >
        <Calendar className="h-4 w-4 text-[#d97757] shrink-0" strokeWidth={2} />
        <span>{formattedDisplay || placeholder}</span>
      </button>

      {isOpen && (
        <div className={`absolute ${
          menuVerticalAlign === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        } left-0 w-[280px] bg-white border border-gray-200/90 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] z-50 p-4`}>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-[#697386] transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="text-[13px] font-bold text-[#1a1f36]">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-[#697386] transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center mb-1">
            {daysOfWeek.map((d) => (
              <span key={d} className="text-[11px] font-semibold text-[#a3acb9] py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 text-center gap-y-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => {
                    onChange(dateStr);
                    setIsOpen(false);
                  }}
                  className={`h-8 w-8 mx-auto rounded-lg text-[12px] font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#d97757] text-white shadow-xs'
                      : 'text-[#3c4257] hover:bg-gray-100'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── reusable field label ────────────────────────────────────────────── */

function FieldLabel({ label, required, optional, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1f36] leading-none">
          <span>{label}</span>
          {required && (
            <span className="text-[#d97757] text-[13px] leading-none">*</span>
          )}
          {optional && (
            <span className="text-[11px] font-normal text-[#a3acb9]">Optional</span>
          )}
          {hint && <FieldInfoTooltip text={hint} />}
        </label>
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

export function DesktopAddView() {
  const { pantryId } = usePantry();
  const generateBarcode = () =>
    `INT-${Math.floor(100000 + Math.random() * 900000)}`;

  /* ── state ────────────────────────────────────────────────────────── */
  const [intakeMode, setIntakeMode] = useState('count');

  const [barcode, setBarcode] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupSource, setLookupSource] = useState(null);

  // Count mode
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('units');
  const [packSize, setPackSize] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('lbs');

  // Convert any weight or volume unit input to lbs for database & calculation
  const convertToLbs = useCallback((valStr, unitStr) => {
    const val = parseFloat(valStr) || 0;
    if (!val) return 0;
    switch (unitStr) {
      case 'oz': return val / 16;
      case 'fl_oz': return val * 0.065;
      case 'kg': return val * 2.20462;
      case 'g': return val / 453.592;
      case 'ml': return val * 0.0022;
      case 'l': return val * 2.20462;
      case 'gal': return val * 8.34;
      default: return val; // 'lbs'
    }
  }, []);

  // Bulk mode
  const [bulkWeight, setBulkWeight] = useState('');
  const [containerCount, setContainerCount] = useState('1');
  const [containerType, setContainerType] = useState('boxes');

  // Metadata — defaults to "Not specified" / "none"
  const [sourceType, setSourceType] = useState('not_specified');
  const [donorName, setDonorName] = useState('');
  const [expirationPrecision, setExpirationPrecision] = useState('none');
  const [expDay, setExpDay] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');

  // Collapsible sections
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = sessionStorage.getItem('foodarca_staged_batch');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isMoreDetailsOpen, setIsMoreDetailsOpen] = useState(false);
  const [isClearingBatch, setIsClearingBatch] = useState(false);

  // Add button animation state
  const [addedState, setAddedState] = useState(false); // true = showing green "Added!"
  const addedTimerRef = useRef(null);

  // Slide-out panel (fallback for mobile/tablet)
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const barcodeTimerRef = useRef(null);
  const barcodeRef = useRef(null);

  // Sync cartItems to sessionStorage on updates
  useEffect(() => {
    try {
      sessionStorage.setItem('foodarca_staged_batch', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to sync cart to sessionStorage:', e);
    }
  }, [cartItems]);

  useEffect(() => {
    barcodeRef.current?.focus();
    return () => {
      clearTimeout(barcodeTimerRef.current);
      clearTimeout(addedTimerRef.current);
    };
  }, []);

  // Close panel on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isPanelOpen) setIsPanelOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isPanelOpen]);

  const catMeta = category ? getCategoryMeta(category) : null;

  /* ── barcode lookup ───────────────────────────────────────────────── */
  const handleBarcodeLookup = async (codeToSearch) => {
    const code = (codeToSearch || barcode || '').trim();
    if (!code || code.length < 4 || !pantryId || code.startsWith('INT-')) return;

    // 1. Fast local cache check for instant complete restoration
    try {
      const cachedStr = localStorage.getItem(`foodarca_cache_${code}`);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached.name) setItemName(cached.name);
        if (cached.category) {
          const meta = getCategoryMeta(cached.category);
          setCategory(meta.value);
        }
        if (cached.unit) setUnit(cached.unit);
        if (cached.packSize) setPackSize(String(cached.packSize));
        if (cached.rawWeight) setTotalWeight(String(cached.rawWeight));
        if (cached.weightUnit) setWeightUnit(cached.weightUnit);
        setLookupSource('cache');
        return;
      }
    } catch (_) { /* no-op */ }

    setIsLookingUp(true);
    setError('');
    setLookupSource(null);
    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`, {
        headers: { 'x-pantry-id': pantryId },
      });
      if (res.ok) {
        const result = await res.json();
        if (result?.found && result.data) {
          const d = result.data;
          if (d.name) setItemName(d.name);
          if (d.category) {
            const meta = getCategoryMeta(d.category);
            setCategory(meta.value);
          }
          if (d.unit && ['units', 'boxes', 'bags', 'pallets', 'crates', 'cans', 'bottles', 'packs', 'cases'].includes(d.unit)) {
            setUnit(d.unit);
          }
          if (d.inputUnitValue) {
            setTotalWeight(String(d.inputUnitValue));
          } else if (d.weightPerUnit) {
            if (intakeMode === 'bulk') setBulkWeight(String(d.weightPerUnit));
            else setTotalWeight(String(d.weightPerUnit));
          }
          if (d.unit && ['fl oz', 'oz', 'lbs', 'kg', 'gal'].includes(d.unit)) {
            setWeightUnit(d.unit);
          }
          if (d.photoUrl) setPhotoUrl(d.photoUrl);
          setLookupSource(result.source || 'catalog');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleBarcodeChange = (val) => {
    setBarcode(val);
    clearTimeout(barcodeTimerRef.current);
    if (val.trim().length >= 4 && !val.startsWith('INT-')) {
      barcodeTimerRef.current = setTimeout(
        () => handleBarcodeLookup(val.trim()),
        400
      );
    }
  };

  /* ── form helpers ─────────────────────────────────────────────────── */
  const handleClearForm = () => {
    setBarcode('');
    setItemName('');
    setCategory('');
    setPhotoUrl(null);
    setLookupSource(null);
    setQty('1');
    setPackSize('');
    setTotalWeight('');
    setWeightUnit('lbs');
    setBulkWeight('');
    setContainerCount('1');
    setDonorName('');
    setSourceType('not_specified');
    setExpirationPrecision('none');
    setExpDay('');
    setExpMonth('');
    setExpYear('');
  };

  const getExpirationDate = () => {
    switch (expirationPrecision) {
      case 'day':   return expDay;
      case 'month': return expMonth ? `${expMonth}-01` : '';
      case 'year':  return expYear ? `${expYear}-01-01` : '';
      default:      return '';
    }
  };

  const parsedQty = parseFloat(qty) || 0;
  const parsedBulkWeight = parseFloat(bulkWeight) || 0;

  const isExpirationValid =
    expirationPrecision === 'none' ||
    (expirationPrecision === 'day' && expDay.trim() !== '') ||
    (expirationPrecision === 'month' && expMonth.trim() !== '' && expMonth.includes('-')) ||
    (expirationPrecision === 'year' && expYear.trim() !== '');

  const isFormValid =
    intakeMode === 'count'
      ? itemName.trim().length > 0 && Boolean(category) && parsedQty > 0 && isExpirationValid
      : itemName.trim().length > 0 && Boolean(category) && parsedBulkWeight > 0 && isExpirationValid;

  /* ── add to batch ─────────────────────────────────────────────────── */
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!itemName.trim()) {
        setError('Item name is required.');
      } else if (!category) {
        setError('Please select a Category before adding to batch.');
      } else if (intakeMode === 'count' && parsedQty <= 0) {
        setError('Please enter a valid quantity.');
      } else if (intakeMode === 'bulk' && parsedBulkWeight <= 0) {
        setError('Please enter a valid scale weight.');
      } else if (!isExpirationValid) {
        setError('Please complete the Expiration Date or set it to "No expiration".');
      } else {
        setError('Please fill in all required fields (*).');
      }
      return;
    }
    setError('');
    setSuccess('');

    let itemQuantity = '1';
    let itemUnit = 'units';
    let itemWeightLbs = 0;
    let weightPerUnit = '0';

    if (intakeMode === 'count') {
      itemQuantity = String(Math.abs(parsedQty));
      itemUnit = unit;
      const convertedLbsPerUnit = convertToLbs(totalWeight, weightUnit);
      const perUnitLbs = Math.abs(convertedLbsPerUnit || 0);
      itemWeightLbs = Number((perUnitLbs * parsedQty).toFixed(2));
      weightPerUnit = perUnitLbs > 0 ? perUnitLbs.toFixed(2) : '0';
    } else {
      const cnt = Math.abs(parseFloat(containerCount) || 1);
      itemQuantity = String(cnt);
      itemUnit = containerType;
      itemWeightLbs = Math.abs(parsedBulkWeight);
      weightPerUnit =
        itemWeightLbs > 0 && cnt > 0
          ? (itemWeightLbs / cnt).toFixed(2)
          : '0';
    }

    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      barcode: barcode.trim() || generateBarcode(),
      name: itemName.trim(),
      category: category || 'other',
      categoryName: catMeta?.name || 'Other',
      quantity: itemQuantity,
      packSize: packSize ? parseFloat(packSize) : null,
      weightPerUnit,
      totalWeightLbs: itemWeightLbs,
      rawWeight: totalWeight || null,
      weightUnit: weightUnit || 'lbs',
      unit: itemUnit,
      intakeMode,
      expirationDate: getExpirationDate(),
      expirationPrecision,
      sourceType,
      donorName: donorName.trim(),
      photoUrl,
    };

    setCartItems((prev) => [...prev, newItem]);

    // Save to local browser cache for instant future lookup restoration
    if (newItem.barcode && !newItem.barcode.startsWith('INT-')) {
      try {
        const cacheObj = {
          name: newItem.name,
          category: newItem.category,
          unit: newItem.unit,
          packSize: newItem.packSize,
          rawWeight: newItem.rawWeight,
          weightUnit: newItem.weightUnit,
        };
        localStorage.setItem(`foodarca_cache_${newItem.barcode}`, JSON.stringify(cacheObj));
      } catch (_) { /* no-op */ }
    }

    // ── inline "Added!" animation + haptic ──
    setAddedState(true);
    clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setAddedState(false), 1500);

    // Haptic vibration (tablets / Android — graceful no-op elsewhere)
    try {
      if (navigator.vibrate) navigator.vibrate(80);
    } catch (_) { /* no-op */ }

    handleClearForm();
    barcodeRef.current?.focus();
  };

  const handleRemoveItem = (id) =>
    setCartItems((prev) => prev.filter((i) => i.id !== id));

  const handleEditItem = (id) => {
    const itemToEdit = cartItems.find((i) => i.id === id);
    if (!itemToEdit) return;

    handleRemoveItem(id);

    setBarcode(itemToEdit.barcode || '');
    setItemName(itemToEdit.name || '');
    setCategory(itemToEdit.category || '');
    setPhotoUrl(itemToEdit.photoUrl || null);
    
    if (itemToEdit.intakeMode === 'count') {
      setIntakeMode('count');
      setQty(String(itemToEdit.quantity || '1'));
      setUnit(itemToEdit.unit || 'Units');
      setPackSize(itemToEdit.packSize ? String(itemToEdit.packSize) : '');
      setTotalWeight(itemToEdit.rawWeight ? String(itemToEdit.rawWeight) : '');
      setWeightUnit(itemToEdit.weightUnit || 'lbs');
    } else {
      setIntakeMode('bulk');
      setBulkWeight(itemToEdit.totalWeightLbs ? String(itemToEdit.totalWeightLbs) : '');
      setContainerCount(String(itemToEdit.quantity || '1'));
    }
    
    setSourceType(itemToEdit.sourceType || 'not_specified');
    setDonorName(itemToEdit.donorName || '');
    
    const prec = itemToEdit.expirationPrecision || 'none';
    setExpirationPrecision(prec);
    if (prec === 'day') {
      setExpDay(itemToEdit.expirationDate || '');
      setExpMonth('');
      setExpYear('');
    } else if (prec === 'month') {
      setExpDay('');
      setExpMonth(itemToEdit.expirationDate ? itemToEdit.expirationDate.slice(0, 7) : '');
      setExpYear('');
    } else if (prec === 'year') {
      setExpDay('');
      setExpMonth('');
      setExpYear(itemToEdit.expirationDate ? itemToEdit.expirationDate.slice(0, 4) : '');
    } else {
      setExpDay('');
      setExpMonth('');
      setExpYear('');
    }

    if (barcodeRef.current) barcodeRef.current.focus();
    setIsPanelOpen(false);
  };

  const executeClearBatch = () => {
    if (cartItems.length === 0) return;
    setCartItems([]);
    setIsClearingBatch(false);
    try {
      sessionStorage.removeItem('foodarca_staged_batch');
    } catch (_) {}
  };

  /* ── submit batch ─────────────────────────────────────────────────── */
  const handleSubmitBatch = async () => {
    if (cartItems.length === 0 || !pantryId) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/foods/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pantry-id': pantryId },
        body: JSON.stringify({ items: cartItems }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || data.error || 'Failed to submit batch');
      setSuccess('Batch successfully added!');
      setCartItems([]);
      try {
        sessionStorage.removeItem('foodarca_staged_batch');
      } catch (_) {}
      
      setTimeout(() => {
        setSuccess('');
        setIsPanelOpen(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── derived ──────────────────────────────────────────────────────── */
  const totalStagedProducts = cartItems.length;
  const totalStagedUnits = cartItems.reduce(
    (a, i) => a + (parseFloat(i.quantity) || 0),
    0
  );
  const totalStagedWeightLbs = cartItems
    .reduce((a, i) => a + (i.totalWeightLbs || 0), 0)
    .toFixed(1);

  const currentYear = new Date().getFullYear();

  const sourceOptions = [
    { key: 'not_specified', label: 'Not specified', icon: Package },
    { key: 'donation',      label: 'Donation',      icon: HeartHandshake },
    { key: 'retail_rescue', label: 'Rescue',         icon: Gift },
    { key: 'purchased',     label: 'Purchased',      icon: ShoppingBag },
    { key: 'usda',          label: 'USDA',           icon: Landmark },
  ];

  const expirationOptions = [
    { key: 'none',  label: 'No expiration' },
    { key: 'day',   label: 'Exact date' },
    { key: 'month', label: 'Month & year' },
    { key: 'year',  label: 'Year only' },
  ];

  const needsDonor =
    sourceType === 'donation' ||
    sourceType === 'retail_rescue' ||
    sourceType === 'purchased';

  /* ═══════════════════════════  RENDER  ═══════════════════════════════ */

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-3 md:px-8 md:py-4 font-['Inter',system-ui,sans-serif] relative">

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="w-full mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1f36] tracking-[-0.02em] leading-tight">
            Add Items
          </h1>
          <p className="text-[13px] text-[#697386] mt-0.5 leading-relaxed">
            Log new items into inventory. Fill in the essentials and add to your batch.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Mobile/Tablet Batch trigger button */}
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="xl:hidden h-[36px] px-3.5 rounded-xl bg-white border border-[#d97757]/40 text-[#1a1f36] hover:bg-[#fff7f5] text-[12px] font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-2"
          >
            <PanelRight className="h-4 w-4 text-[#d97757]" strokeWidth={2.2} />
            <span>View Batch</span>
            {cartItems.length > 0 && (
              <span className="h-4.5 px-1.5 rounded-full bg-[#d97757] text-white text-[11px] font-extrabold flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="h-[36px] px-3.5 rounded-xl bg-white border border-gray-200 text-[#3c4257] hover:bg-gray-50/90 text-[12px] font-semibold flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer transition-all duration-150 shrink-0"
          >
            <HelpCircle className="h-4 w-4 text-[#d97757]" strokeWidth={2} />
            <span>Intake Guide</span>
          </button>
        </div>
      </div>
      <div className="w-full h-px bg-gradient-to-r from-gray-200 via-gray-200/60 to-transparent mb-4" />

      {/* ── ALERTS ──────────────────────────────────────────────────── */}
      {error && (
        <div className="w-full mb-6 p-3.5 text-[13px] font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}


      {/* ── TWO-COLUMN LAYOUT GRID ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: HERO FORM CARD */}
        <div className="xl:col-span-7 2xl:col-span-8 min-w-0">
          <form
            onSubmit={handleAddItem}
            className="w-full relative"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (isFormValid) handleAddItem(e);
              }
            }}
          >
            <div className="bg-white border border-gray-200/80 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04)]">

              {/* ── TOP UTILITY BAR: BATCH CART TRIGGER (Mobile/Tablet Only) ────────── */}
              <div className="px-5 py-1.5 bg-[#f8fafb] border-b border-gray-100 rounded-t-2xl flex items-center justify-between xl:hidden">
                <span className="text-[11px] font-medium text-[#8792a2] tracking-wide">
                  Inventory Intake
                </span>

                <button
                  type="button"
                  onClick={() => setIsPanelOpen(true)}
                  className="h-[30px] px-3 rounded-lg bg-white border border-[#d97757]/40 text-[#1a1f36] hover:bg-[#fff7f5] text-[12px] font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <PanelRight className="h-3.5 w-3.5 text-[#d97757] group-hover:scale-110 transition-transform" strokeWidth={2.2} />
                  <span>View Batch</span>
                  {cartItems.length > 0 ? (
                    <span className="h-4.5 px-1.5 rounded-full bg-[#d97757] text-white text-[11px] font-extrabold flex items-center justify-center animate-pulse">
                      {cartItems.length}
                    </span>
                  ) : (
                    <span className="h-4.5 px-1.5 rounded-full bg-gray-100 text-[#8792a2] text-[10px] font-bold flex items-center justify-center">
                      0
                    </span>
                  )}
                </button>
              </div>

          {/* ── ROW 1: BARCODE QUICK SCAN ────────────────────────── */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-[#8792a2] uppercase tracking-[0.06em] flex items-center gap-1.5">
                <Barcode className="h-3.5 w-3.5" strokeWidth={2} />
                Barcode
              </span>
              <span className="text-[11px] text-[#a3acb9]">
                Leave blank to auto-generate
              </span>
            </div>
            <div className="flex gap-2">
              <input
                ref={barcodeRef}
                type="text"
                onFocus={(e) => e.target.select()}
                className={`flex-1 ${cls.input} font-mono !font-semibold`}
                placeholder="Scan UPC or type barcode…"
                value={barcode}
                onChange={(e) => handleBarcodeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeLookup(barcode);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setBarcode(generateBarcode())}
                className="h-[40px] px-3 rounded-[10px] bg-white border border-gray-200 text-[#3c4257] text-[13px] font-semibold flex items-center gap-1.5 hover:border-gray-300 hover:bg-gray-50/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer transition-colors duration-150"
                title="Generate internal barcode"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#d97757]" strokeWidth={2} />
                Auto
              </button>
              <button
                type="button"
                onClick={() => handleBarcodeLookup(barcode)}
                disabled={isLookingUp || barcode.trim().length < 4}
                className="h-[40px] px-3.5 rounded-[10px] bg-white border border-gray-200 text-[#3c4257] text-[13px] font-semibold flex items-center gap-1.5 hover:border-gray-300 hover:bg-gray-50/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-default"
              >
                {isLookingUp ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d97757]" />
                ) : (
                  <Search className="h-3.5 w-3.5 text-[#697386]" strokeWidth={2} />
                )}
                Lookup
              </button>
              {lookupSource && (
                <span className="h-[40px] text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 rounded-[10px] border border-emerald-200/80 flex items-center gap-1.5 shrink-0">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Matched
                </span>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-6" />

          {/* ── ROW 2: PRODUCT INFORMATION ────────────────────────── */}
          <div className="px-6 pt-5 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8792a2] mb-4 select-none">
              Product Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-x-5 gap-y-5">
              <div className="sm:col-span-3">
                <FieldLabel
                  label={intakeMode === 'count' ? 'Item name' : 'Batch description'}
                  required
                >
                  <input
                    required
                    onFocus={(e) => e.target.select()}
                    className={cls.input}
                    placeholder={
                      intakeMode === 'count'
                        ? 'e.g. Organic Tomato Soup'
                        : 'e.g. Mixed Canned Goods (Gaylord)'
                    }
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </FieldLabel>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel label="Category" required>
                  <CustomSelect
                    value={category}
                    onChange={setCategory}
                    options={categories.map((c) => ({
                      value: c.value,
                      label: c.name,
                      icon: c.icon,
                    }))}
                    placeholder="Select category…"
                  />
                </FieldLabel>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-6" />

          {/* ── ROW 3: MEASUREMENTS + MODE TOGGLE ────────────────── */}
          <div className="px-6 pt-5 pb-5">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8792a2] select-none">
                Measurements
              </p>
              {/* Intake mode toggle — prominent */}
              <div className="bg-[#f6f8fa] p-1 rounded-xl border border-gray-200/70 flex gap-1">
                {[
                  { key: 'count', icon: Hash, label: 'By count' },
                  { key: 'bulk', icon: Scale, label: 'By weight' },
                ].map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIntakeMode(key)}
                    className={[
                      'h-[34px] px-4 rounded-lg text-[13px] font-semibold',
                      'flex items-center gap-2 transition-all duration-150 cursor-pointer',
                      intakeMode === key
                        ? 'bg-white text-[#1a1f36] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-gray-200/70'
                        : 'text-[#8792a2] hover:text-[#3c4257]',
                    ].join(' ')}
                  >
                    <Icon
                      className={`h-4 w-4 ${intakeMode === key ? 'text-[#d97757]' : 'text-[#a3acb9]'}`}
                      strokeWidth={2}
                    />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {intakeMode === 'count' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                  <FieldLabel label="Quantity" required hint="Number of packages or containers being added.">
                    <input
                      type="text"
                      required
                      className={cls.input}
                      placeholder="e.g. 10"
                      value={qty}
                      onChange={(e) =>
                        setQty(sanitizePositiveNumber(e.target.value))
                      }
                    />
                  </FieldLabel>

                  <FieldLabel label="Counting as" hint="Choose how items are grouped (e.g. Boxes, Cases, Packs, Units).">
                    <CustomSelect
                      value={unit}
                      onChange={setUnit}
                      options={unitOptions}
                    />
                  </FieldLabel>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                <FieldLabel label="Scale weight" required hint="Total weight on the scale in pounds (lbs).">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      className={`${cls.input} pr-11 !font-bold`}
                      placeholder="e.g. 400"
                      value={bulkWeight}
                      onChange={(e) =>
                        setBulkWeight(sanitizePositiveNumber(e.target.value))
                      }
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#d97757] pointer-events-none">
                      lbs
                    </span>
                  </div>
                </FieldLabel>

                <FieldLabel label="Container count" hint="Number of gaylords, pallets, or bins being weighed.">
                  <input
                    type="text"
                    className={cls.input}
                    placeholder="1"
                    value={containerCount}
                    onChange={(e) =>
                      setContainerCount(sanitizePositiveNumber(e.target.value))
                    }
                  />
                </FieldLabel>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100 mx-6" />

          {/* ── ROW 4: EXPIRATION DATE ───────────────────────────── */}
          <div className="px-6 pt-5 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8792a2] mb-3 select-none flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#8792a2]" strokeWidth={2} />
              Expiration Date <span className="text-rose-500 font-bold ml-0.5">*</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1.5 flex-wrap">
                {expirationOptions.map((opt) => {
                  const on = expirationPrecision === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setExpirationPrecision(opt.key)}
                      className={`${cls.pill} ${on ? cls.pillOn : cls.pillOff}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {expirationPrecision !== 'none' && (
                <>
                  <div className="h-6 w-px bg-gray-200 shrink-0 hidden sm:block" />
                  <div className="shrink-0">
                    {expirationPrecision === 'day' && (
                      <ModernDatePicker
                        value={expDay}
                        onChange={setExpDay}
                        menuVerticalAlign="top"
                      />
                    )}
                    {expirationPrecision === 'month' && (
                      <div className="flex items-center gap-2">
                        <CustomSelect
                          value={expMonth ? expMonth.split('-')[1] : ''}
                          onChange={(m) => {
                            const yr = expMonth ? expMonth.split('-')[0] : String(currentYear);
                            setExpMonth(`${yr}-${m}`);
                          }}
                          options={monthOptions}
                          placeholder="Select month…"
                          className="w-[170px]"
                          menuVerticalAlign="top"
                        />
                        <CustomSelect
                          value={expMonth ? expMonth.split('-')[0] : String(currentYear)}
                          onChange={(yr) => {
                            const m = expMonth ? expMonth.split('-')[1] : '01';
                            setExpMonth(`${yr}-${m}`);
                          }}
                          options={Array.from({ length: 6 }, (_, i) => ({
                            value: String(currentYear + i),
                            label: String(currentYear + i),
                          }))}
                          placeholder="Select year…"
                          className="w-[110px]"
                          menuVerticalAlign="top"
                        />
                      </div>
                    )}
                    {expirationPrecision === 'year' && (
                      <CustomSelect
                        value={expYear}
                        onChange={setExpYear}
                        options={Array.from({ length: 6 }, (_, i) => ({
                          value: String(currentYear + i),
                          label: String(currentYear + i),
                        }))}
                        placeholder="Select year…"
                        className="w-[130px]"
                        menuVerticalAlign="top"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-6" />

          {/* ── MORE DETAILS ACCORDION TOGGLE ─────────────────────── */}
          <div className="px-6 py-4">
            <button
              type="button"
              onClick={() => setIsMoreDetailsOpen(!isMoreDetailsOpen)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#f8fafb] border border-gray-200/80 hover:bg-gray-50 text-[13px] font-semibold text-[#3c4257] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] group"
            >
              <div className="flex items-center gap-2.5">
                <Settings2 className="h-4.5 w-4.5 text-[#8792a2] group-hover:text-[#3c4257] transition-colors" strokeWidth={2} />
                <div className="flex items-center flex-wrap gap-x-1.5">
                  <span>More Details</span>
                  <span className="text-[#a3acb9] font-normal text-[12px] mt-[1px]">
                    (Donation Source, Package Size)
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`h-4.5 w-4.5 text-[#8792a2] transition-transform duration-250 ${
                  isMoreDetailsOpen ? 'rotate-180' : ''
                }`}
                strokeWidth={2}
              />
            </button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isMoreDetailsOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {/* ── SECONDARY MEASUREMENTS ──────────────────────────── */}
            <div className="px-6 pb-5">
              {intakeMode === 'count' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                    <FieldLabel label="Items per pack" optional hint="e.g. 15 diapers per bag">
                      <input
                        type="text"
                        className={cls.input}
                        placeholder="e.g. 15"
                        value={packSize}
                        onChange={(e) =>
                          setPackSize(sanitizePositiveNumber(e.target.value))
                        }
                      />
                    </FieldLabel>

                    <FieldLabel label="Weight / Volume" optional hint="Total package weight or size">
                      <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-[#d97757] focus-within:ring-2 focus-within:ring-[#d97757]/10 transition-all duration-150">
                        <input
                          type="text"
                          className="flex-1 min-w-0 h-[44px] px-3.5 bg-transparent text-[14px] font-medium text-[#1a1f36] outline-none placeholder:text-[#a3acb9] placeholder:font-normal"
                          placeholder="e.g. 16"
                          value={totalWeight}
                          onChange={(e) =>
                            setTotalWeight(sanitizePositiveNumber(e.target.value))
                          }
                        />
                        <div className="h-6 w-px bg-gray-200/80 my-auto shrink-0" />
                        <CustomSelect
                          value={weightUnit}
                          onChange={setWeightUnit}
                          options={weightUnitOptions}
                          className="!w-auto shrink-0"
                          buttonClassName="h-[44px] px-3 text-[13px] font-semibold text-[#1a1f36] hover:bg-gray-50/80 rounded-r-xl cursor-pointer outline-none transition-colors flex items-center justify-between gap-1"
                          menuAlign="right"
                        />
                      </div>
                    </FieldLabel>
                  </div>
                  {parseFloat(packSize) > 0 && parseFloat(qty) > 0 && (
                    <div className="text-[12px] font-semibold text-[#1a1f36] bg-[#fffaf8] border border-[#d97757]/30 rounded-lg px-3.5 py-2 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-[#d97757] shrink-0" />
                      <span>
                        Total count: <strong className="text-[#d97757] font-bold">{parsedQty * parseFloat(packSize)} individual items</strong> ({parsedQty} {unit} &times; {packSize} per {unit.endsWith('s') ? unit.slice(0, -1) : unit})
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <FieldLabel label="Container type">
                    <CustomSelect
                      value={containerType}
                      onChange={setContainerType}
                      options={containerTypeOptions}
                    />
                  </FieldLabel>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 mx-6" />

            {/* ── ROW 4: ACQUISITION SOURCE ────────────────────────── */}
            <div className="px-6 pt-5 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8792a2] mb-3 select-none flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#8792a2]" strokeWidth={2} />
              Acquisition Source
            </p>
            <div className="space-y-3">
              <div className="flex gap-1.5 flex-wrap">
                {sourceOptions.map((s) => {
                  const on = sourceType === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSourceType(s.key)}
                      className={`${cls.pill} ${on ? cls.pillOn : cls.pillOff}`}
                    >
                      <s.icon
                        className={`h-[15px] w-[15px] ${on ? 'text-[#1a1f36]' : 'text-[#a3acb9]'}`}
                        strokeWidth={2}
                      />
                      {s.label}
                    </button>
                  );
                })}
              </div>
              {needsDonor && (
                <div className="relative max-w-md pt-0.5">
                  <Building2
                    className="h-4 w-4 text-[#a3acb9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    strokeWidth={1.8}
                  />
                  <input
                    type="text"
                    className={`${cls.input} !pl-10`}
                    placeholder={
                      sourceType === 'donation'
                        ? "Donor name (e.g. Trader Joe's)"
                        : sourceType === 'retail_rescue'
                          ? 'Store name (e.g. Whole Foods)'
                          : 'Supplier (e.g. Costco)'
                    }
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          </div> {/* End More Details Accordion */}

          {/* ── ACTION FOOTER ────────────────────────────────────── */}
          <div className="px-6 py-4 bg-[#f8fafb] border-t border-gray-100/80 rounded-b-2xl flex items-center justify-between">
            <button
              type="button"
              onClick={handleClearForm}
              className="h-[44px] px-5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-[#3c4257] text-[14px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors duration-150 cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4 text-[#a3acb9]" strokeWidth={2} />
              Clear
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={[
                'h-[44px] px-7 rounded-xl text-[14px] font-bold text-white',
                'shadow-[0_2px_8px_rgba(217,119,87,0.25)] transition-all duration-200',
                'flex items-center gap-2.5 cursor-pointer active:scale-[0.98]',
                'disabled:opacity-40 disabled:shadow-none disabled:cursor-default',
                addedState
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[#d97757] hover:bg-[#c86545]',
              ].join(' ')}
            >
              {addedState ? (
                <>
                  <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={2} />
                  Added!
                </>
              ) : (
                <>
                  <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
                  Add to batch
                  <span className="hidden sm:inline-flex items-center gap-0.5 ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-medium tracking-wide">
                    <kbd>Ctrl</kbd>+<kbd>Enter</kbd>
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>

        {/* RIGHT COLUMN: PERSISTENT BATCH SIDEBAR (Desktop) */}
        <div className="hidden xl:block xl:col-span-5 2xl:col-span-4 sticky top-6">
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col max-h-[calc(100vh-48px)]">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 shrink-0 flex items-center justify-between min-h-[64px]">
              {isClearingBatch && totalStagedProducts > 0 ? (
                <div className="w-full flex items-center justify-between bg-rose-50 -mx-3 -my-2 px-3 py-2 rounded-xl border border-rose-100/50">
                  <span className="text-[12px] font-bold text-rose-700 flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4" strokeWidth={2} /> Clear all items?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsClearingBatch(false)}
                      className="text-[12px] font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200/80 hover:bg-gray-50 px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={executeClearBatch}
                      className="text-[12px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg shadow-[0_1px_3px_rgba(225,29,72,0.3)] transition-all cursor-pointer"
                    >
                      Yes, clear
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8792a2] select-none flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-[#a3acb9]" strokeWidth={2} />
                      Batch Preview
                    </p>
                    {totalStagedProducts > 0 ? (
                      <span className="h-4.5 px-2 rounded-full bg-[#1a1f36] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                        {totalStagedProducts}
                      </span>
                    ) : (
                      <span className="h-4.5 px-2 rounded-full bg-gray-100 text-[#8792a2] text-[10px] font-bold flex items-center justify-center tabular-nums">
                        0
                      </span>
                    )}
                  </div>
                  {totalStagedProducts > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsClearingBatch(true)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                      title="Discard entire batch"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Clear Batch
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="h-px bg-gray-100 mx-6 shrink-0" />

            {/* Body: Staged items list */}
            <div className="px-6 py-4 overflow-y-auto min-h-[120px]">
              {cartItems.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-50 border border-gray-200/60 flex items-center justify-center mb-3">
                    <Package className="h-5 w-5 text-[#a3acb9]" strokeWidth={1.5} />
                  </div>
                  <p className="text-[13px] font-semibold text-[#3c4257]">No items staged</p>
                  <p className="text-[12px] text-[#8792a2] mt-1 max-w-[220px] leading-relaxed">
                    Scan a barcode or fill out the form to add items to this batch.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5 pb-2">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-[#f8fafb] transition-colors duration-100 cursor-default"
                    >
                      <div className="flex items-baseline gap-2.5 min-w-0 pr-2">
                        <span className="text-[12px] font-bold text-[#1a1f36] tabular-nums shrink-0 bg-gray-100/80 border border-gray-200/50 px-1.5 py-0.5 rounded-md">
                          {item.quantity}&times;
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#1a1f36] truncate leading-snug">
                            {item.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-[#8792a2] truncate">
                              {item.categoryName}
                            </span>
                            {item.packSize > 0 && (
                              <>
                                <span className="text-[11px] text-[#d4d8e0]">·</span>
                                <span className="text-[11px] font-semibold text-[#d97757] truncate">
                                  {item.packSize} per {item.unit.endsWith('s') ? item.unit.slice(0, -1) : item.unit}
                                </span>
                              </>
                            )}
                            {item.donorName && (
                              <>
                                <span className="text-[11px] text-[#d4d8e0]">·</span>
                                <span className="text-[11px] text-[#8792a2] truncate">
                                  via {item.donorName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <span className="text-[12px] font-semibold text-[#3c4257] tabular-nums">
                          {item.totalWeightLbs > 0
                            ? `${item.totalWeightLbs} lbs`
                            : `${item.quantity} ${item.unit}`}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                          <button
                            type="button"
                            onClick={() => handleEditItem(item.id)}
                            className="h-6 w-6 rounded-md flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-100 cursor-pointer"
                            title="Edit Item"
                          >
                            <Pencil className="h-3 w-3" strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-6 w-6 rounded-md flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-100 cursor-pointer"
                            title="Remove"
                          >
                            <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 mx-6 shrink-0" />

            {/* Footer */}
            <div className="px-6 py-5 shrink-0 bg-[#fafbfc]/50 rounded-b-2xl">
              <div className="space-y-2 text-[12px] mb-5">
                <div className="flex justify-between text-[#697386]">
                  <span>Products</span>
                  <span className="font-semibold text-[#1a1f36] tabular-nums">{totalStagedProducts}</span>
                </div>
                <div className="flex justify-between text-[#697386]">
                  <span>Total Units</span>
                  <span className="font-semibold text-[#1a1f36] tabular-nums">{totalStagedUnits}</span>
                </div>
                {totalStagedWeightLbs !== '0.0' && (
                  <div className="flex justify-between text-[#697386]">
                    <span>Est. weight</span>
                    <span className="font-semibold text-[#1a1f36] tabular-nums">{totalStagedWeightLbs} lbs</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t border-gray-100 mt-2">
                  <span className="text-[13px] font-bold text-[#1a1f36]">Total</span>
                  <span className="text-[13px] font-bold text-[#1a1f36] tabular-nums">
                    {totalStagedWeightLbs !== '0.0' ? `${totalStagedWeightLbs} lbs` : `${totalStagedUnits} units`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={(cartItems.length === 0 && !success) || isSubmitting}
                onClick={success ? undefined : handleSubmitBatch}
                className={`w-full h-11 text-[13px] font-bold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-2 ${
                  success 
                    ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 cursor-default shadow-md' 
                    : 'text-[#d97757] bg-[#fff0eb] hover:bg-[#ffe4db] border border-[#ffdbce] cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#d97757]/70" /> Submitting…
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} /> {success}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#d97757]/70" strokeWidth={2} /> Submit batch to inventory
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div> {/* end grid */}



      {/* ═══════  SLIDE-OUT BATCH PANEL  ══════════════════════════════ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/8 transition-opacity duration-250 ${
          isPanelOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsPanelOpen(false)}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[400px] max-w-[90vw] bg-white border-l border-gray-200 shadow-[0_0_40px_rgba(0,0,0,0.08)] transform transition-transform duration-250 ease-out flex flex-col ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 min-h-[72px]">
          {isClearingBatch && totalStagedProducts > 0 ? (
            <div className="w-full flex items-center justify-between bg-rose-50 -mx-2 -my-1 px-3 py-2.5 rounded-xl border border-rose-100/50">
              <span className="text-[13px] font-bold text-rose-700 flex items-center gap-1.5">
                <Trash2 className="h-4 w-4" strokeWidth={2} /> Clear all items?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearingBatch(false)}
                  className="text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200/80 hover:bg-gray-50 px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeClearBatch}
                  className="text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg shadow-[0_1px_3px_rgba(225,29,72,0.3)] transition-all cursor-pointer"
                >
                  Yes, clear
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-[15px] font-bold text-[#1a1f36] tracking-[-0.01em]">
                  Batch Preview
                </h3>
                {totalStagedProducts > 0 && (
                  <p className="text-[12px] text-[#697386] mt-0.5">
                    {totalStagedProducts} item{totalStagedProducts !== 1 ? 's' : ''} staged
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalStagedProducts > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsClearingBatch(true)}
                    className="text-[12px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Discard entire batch"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear Batch
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPanelOpen(false)}
                  className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-[#697386] hover:text-[#1a1f36] transition-colors duration-150 cursor-pointer"
                  title="Close panel"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Panel Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cartItems.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-gray-50 border border-gray-200/60 flex items-center justify-center mb-4">
                <Package className="h-5 w-5 text-[#a3acb9]" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-semibold text-[#3c4257]">
                No items staged
              </p>
              <p className="text-[12px] text-[#a3acb9] mt-1 max-w-[220px] leading-relaxed">
                Fill out the form and click &quot;Add to batch&quot; to stage items here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-gray-50/70 transition-colors duration-100"
                >
                  <div className="flex items-baseline gap-2.5 min-w-0 pr-3">
                    <span className="text-[13px] font-bold text-[#1a1f36] tabular-nums shrink-0">
                      {item.quantity}&times;
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#1a1f36] truncate leading-snug">
                        {item.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-[#8792a2] truncate">
                          {item.categoryName}
                        </span>
                        {item.packSize > 0 && (
                          <>
                            <span className="text-[11px] text-[#d4d8e0]">·</span>
                            <span className="text-[11px] font-semibold text-[#d97757] truncate">
                              {item.packSize} per {item.unit.endsWith('s') ? item.unit.slice(0, -1) : item.unit}
                            </span>
                          </>
                        )}
                        {item.donorName && (
                          <>
                            <span className="text-[11px] text-[#d4d8e0]">·</span>
                            <span className="text-[11px] text-[#8792a2] truncate">
                              via {item.donorName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <span className="text-[13px] font-semibold text-[#3c4257] tabular-nums">
                      {item.totalWeightLbs > 0
                        ? `${item.totalWeightLbs} lbs`
                        : `${item.quantity} ${item.unit}`}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                      <button
                        type="button"
                        onClick={() => handleEditItem(item.id)}
                        className="h-6 w-6 rounded-md flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-100 cursor-pointer"
                        title="Edit Item"
                      >
                        <Pencil className="h-3 w-3" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-6 w-6 rounded-md flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-100 cursor-pointer"
                        title="Remove"
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Footer — breakdown + submit */}
        <div className="border-t border-gray-100 px-6 py-5 shrink-0 bg-[#fafbfc]">
          <div className="space-y-2 text-[13px] mb-5">
            <div className="flex justify-between text-[#697386]">
              <span>Products</span>
              <span className="font-semibold text-[#1a1f36] tabular-nums">
                {totalStagedProducts}
              </span>
            </div>
            <div className="flex justify-between text-[#697386]">
              <span>Units</span>
              <span className="font-semibold text-[#1a1f36] tabular-nums">
                {totalStagedUnits}
              </span>
            </div>
            {totalStagedWeightLbs !== '0.0' && (
              <div className="flex justify-between text-[#697386]">
                <span>Est. weight</span>
                <span className="font-semibold text-[#1a1f36] tabular-nums">
                  {totalStagedWeightLbs} lbs
                </span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2.5 border-t border-gray-200/80 mt-1">
              <span className="text-[14px] font-bold text-[#1a1f36]">Total</span>
              <span className="text-[14px] font-bold text-[#d97757] tabular-nums">
                {totalStagedWeightLbs !== '0.0'
                  ? `${totalStagedWeightLbs} lbs`
                  : `${totalStagedUnits} units`}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={(cartItems.length === 0 && !success) || isSubmitting}
            onClick={success ? undefined : handleSubmitBatch}
            className={`w-full h-11 text-[13px] font-bold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-2 ${
              success 
                ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 cursor-default shadow-md' 
                : 'text-[#d97757] bg-[#fff0eb] hover:bg-[#ffe4db] border border-[#ffdbce] cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#d97757]/70" />
                Submitting…
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} /> {success}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-[#d97757]/70" strokeWidth={2} />
                Submit batch to inventory
              </>
            )}
          </button>
        </div>
      </div>
      {/* ── INTAKE GUIDE TUTORIAL MODAL ──────────────────────────────── */}
      <IntakeGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}