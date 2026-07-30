'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Info, Loader2, Check } from 'lucide-react';

const RANGE_OPTIONS = [
  { label: 'Last 7 days', key: '7d' },
  { label: 'Last 4 weeks', key: '4w' },
  { label: 'Month to date', key: 'mtd' },
  { label: 'Quarter to date', key: 'qtd' },
  { label: 'All time', key: 'all' },
];

// --- CUSTOM HOVER TOOLTIP FOR CARD INFO ICONS ---
function CardInfoTooltip({ text }) {
  return (
    <div className="group/info relative flex items-center">
      <Info className="h-3.5 w-3.5 text-[#a3acb9] hover:text-[#4f566b] transition-colors cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/info:block w-64 bg-white border border-gray-200/90 text-[#3c4257] text-xs font-normal leading-relaxed p-3 rounded-xl shadow-xl z-50 pointer-events-none transition-all text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
      </div>
    </div>
  );
}

// --- CUSTOM INTERACTIVE BRAND TOOLTIP FOR GRID CHARTS ---
const StripeGridTooltip = ({ active, payload, label, unit = 'lbs', isCurrency = false }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const val = data.value || 0;
    const formattedVal = isCurrency ? `$${val.toLocaleString()}` : `${val.toLocaleString()} ${unit}`;
    return (
      <div className="bg-white border border-gray-200/90 shadow-md rounded-md p-2 text-xs pointer-events-none transition-all min-w-[100px]">
        <p className="text-[#697386] font-medium mb-1 border-b border-gray-100 pb-1">{data.payload?.date || label || 'Date'}</p>
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <span className="text-[#4f566b] font-medium">{data.name || 'Amount'}:</span>
          <span className="font-bold text-[#1a1f36]">{formattedVal}</span>
        </div>
      </div>
    );
  }
  return null;
};

// --- EMPTY STATE: NO DATA DASHED BOX ---
function NoDataDashedBox({ label = 'No data' }) {
  return (
    <div className="w-full h-44 sm:h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-200/70 rounded-xl bg-gray-50/40 my-2">
      <span className="px-4 py-2 bg-gray-100/90 text-[#697386] text-xs font-semibold rounded-lg shadow-2xs">
        {label}
      </span>
    </div>
  );
}

// --- SKELETON SHIMMER LOADING PLACEHOLDER FOR OVERVIEW GRID ---
export function OverviewGridSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6 pt-4">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200/80">
        <div className="h-9 w-44 bg-gray-200/70 rounded-md" />
        <div className="h-8 w-36 bg-gray-200/70 rounded-full" />
      </div>
      <div className="bg-[#eef0f4] p-1.5 sm:p-2 rounded-2xl border border-gray-300/70 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200/80 space-y-4 h-76 md:h-80">
            <div className="h-5 w-32 bg-gray-200/70 rounded" />
            <div className="h-8 w-36 bg-gray-200/70 rounded" />
            <div className="h-44 w-full bg-gray-100/60 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- HELPER: DYNAMIC RELATIVE TIME FORMATTER ---
function getRelativeTimeString(dateString) {
  if (!dateString) return 'Updated just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000));

  if (diffInSeconds < 30) return 'Updated just now';
  if (diffInSeconds < 60) return 'Updated 30s ago';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes === 1) return 'Updated 1 min ago';
  if (diffInMinutes < 60) return `Updated ${diffInMinutes} mins ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return 'Updated 1 hour ago';
  if (diffInHours < 24) return `Updated ${diffInHours} hours ago`;

  return 'Updated recently';
}

export function OverviewGrid({ 
  stats, 
  loading, 
  gridLoading, 
  selectedRange = '7d', 
  onRangeChange, 
  setActiveView 
}) {
  const [, setTick] = useState(0);

  // Live timer tick every 15s to update relative timestamps automatically
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <OverviewGridSkeleton />;

  // Time-series arrays
  const intakeSeries = stats?.intakeTimeSeries || [];
  const distributionSeries = stats?.distributionTimeSeries || [];

  const wasteSeries = stats?.wasteTimeSeries?.length > 0 
    ? stats.wasteTimeSeries 
    : [];

  // Value time series ($1.96/lb calculation)
  const valueSeries = distributionSeries.map(item => ({
    date: item.date,
    amount: parseFloat((item.amount * 1.96).toFixed(2))
  }));

  const inventoryStatus = stats?.inventoryStatus || { expired: 0, expiringSoon: 0, good: 0, noDate: 0 };
  const totalStatusCount = inventoryStatus.expired + inventoryStatus.expiringSoon + inventoryStatus.good + inventoryStatus.noDate;

  const topItems = stats?.topItems || [];

  return (
    <div className="w-full space-y-5 pt-4 font-sans">
      
      {/* 1. HEADER ROW WITH TITLE & FUNCTIONAL STRIPE DATE RANGE DROPDOWN */}
      <div className="border-b border-gray-200/80 pb-4 mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[24px] sm:text-[26px] font-bold text-[#1a1f36] tracking-tight">Your overview</h3>
          {gridLoading && (
            <Loader2 className="h-4 w-4 text-[#d97757] animate-spin" />
          )}
        </div>
        
        {/* Date Range Selector Dropdown Row */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#4f566b] flex-wrap">
          <span className="text-[#8792a2] font-medium hidden xs:inline">Date range</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3.5 py-1.5 bg-white border border-gray-200/90 hover:border-gray-300 transition-all rounded-lg shadow-2xs flex items-center gap-2 text-xs font-semibold text-[#3c4257] outline-none cursor-pointer group">
              <span>{RANGE_OPTIONS.find(o => o.key === selectedRange)?.label || 'Last 7 days'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#a3acb9] group-hover:text-[#4f566b] transition-colors" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-48 p-1 rounded-xl bg-white border border-gray-200/90 shadow-xl z-50 animate-in fade-in-80 zoom-in-95">
              {RANGE_OPTIONS.map((opt) => {
                const isSelected = opt.key === selectedRange;
                return (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={() => onRangeChange && onRangeChange(opt.key)}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-[#f4f4f6] text-[#d97757] font-semibold' 
                        : 'text-[#3c4257] font-medium hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#d97757]" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="px-3.5 py-1.5 bg-white border border-gray-200/90 rounded-lg text-[#697386] font-medium text-xs shadow-2xs">
            Daily
          </div>
        </div>
      </div>

      {/* 2. STRIPE CLEAN GRID FRAME (HIGH-CONTRAST GRAY CANVAS WITH THIN SLIM BAND MARGIN) */}
      <div className={`bg-[#eef0f4] p-1.5 sm:p-2 rounded-2xl border border-gray-300/70 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 transition-opacity duration-200 ${gridLoading ? 'opacity-60' : 'opacity-100'}`}>

        {/* --- CARD 1: INVENTORY STATUS --- */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between min-h-[290px] sm:min-h-[310px] lg:min-h-[330px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[#1a1f36] tracking-tight">Inventory status</span>
                <CardInfoTooltip text="Breakdown of shelf stock by expiration state (Good, Expiring soon in ≤ 7 days, Expired, and No Date items)." />
              </div>
            </div>

            {totalStatusCount === 0 ? (
              <NoDataDashedBox label="No data" />
            ) : (
              <div className="space-y-4 pt-1">
                {/* Horizontal Stacked Progress Bar */}
                <div className="h-3 w-full bg-gray-100 rounded-full flex overflow-hidden">
                  <div style={{ width: `${(inventoryStatus.good / totalStatusCount) * 100}%` }} className="bg-emerald-500 h-full" />
                  <div style={{ width: `${(inventoryStatus.expiringSoon / totalStatusCount) * 100}%` }} className="bg-amber-500 h-full" />
                  <div style={{ width: `${(inventoryStatus.expired / totalStatusCount) * 100}%` }} className="bg-rose-500 h-full" />
                  <div style={{ width: `${(inventoryStatus.noDate / totalStatusCount) * 100}%` }} className="bg-gray-300 h-full" />
                </div>

                {/* Status Dot List */}
                <div className="space-y-2.5 text-xs pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="font-medium text-[#4f566b]">Good stock</span>
                    </div>
                    <span className="font-bold text-[#1a1f36]">{inventoryStatus.good.toLocaleString()} units</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="font-medium text-[#4f566b]">Expiring soon (≤ 7 days)</span>
                    </div>
                    <span className="font-bold text-amber-600">{inventoryStatus.expiringSoon.toLocaleString()} units</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <span className="font-medium text-[#4f566b]">Expired</span>
                    </div>
                    <span className="font-bold text-rose-600">{inventoryStatus.expired.toLocaleString()} units</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                      <span className="font-medium text-[#4f566b]">No expiration date</span>
                    </div>
                    <span className="font-bold text-[#4f566b]">{inventoryStatus.noDate.toLocaleString()} units</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between text-[12px] text-[#8792a2]">
            <span>{getRelativeTimeString(stats?.lastUpdated)}</span>
            <button onClick={() => setActiveView('View Inventory')} className="font-medium text-[#697386] hover:text-[#1a1f36] transition-colors cursor-pointer">
              View inventory
            </button>
          </div>
        </div>

        {/* --- CARD 2: INTAKE VOLUME --- */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between min-h-[290px] sm:min-h-[310px] lg:min-h-[330px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[#1a1f36] tracking-tight">Intake volume</span>
                <CardInfoTooltip text="Total physical weight (lbs) of food received and scanned into your pantry inventory." />
              </div>
            </div>
            <h4 className="text-[26px] font-bold text-[#1a1f36] tracking-tight mb-2">
              {(stats?.totalWeight || stats?.todayIntakeLbs || 0).toLocaleString()} <span className="text-base font-semibold text-[#697386]">lbs</span>
            </h4>

            {/* Mini Area Chart */}
            <div className="w-full h-36 sm:h-40 lg:h-44 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={intakeSeries} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="intakeBrandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97757" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d97757" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip 
                    cursor={{ stroke: '#d97757', strokeWidth: 1.5, strokeDasharray: '3 3' }} 
                    content={<StripeGridTooltip unit="lbs" />} 
                  />
                  <Area type="monotone" dataKey="amount" stroke="#d97757" strokeWidth={2.5} fill="url(#intakeBrandGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[12px] text-[#8792a2]">
            <span>{getRelativeTimeString(stats?.lastUpdated)}</span>
            <button onClick={() => setActiveView('View Add Items')} className="font-medium text-[#697386] hover:text-[#1a1f36] transition-colors cursor-pointer">
              More details
            </button>
          </div>
        </div>

        {/* --- CARD 3: DISTRIBUTION VOLUME --- */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between min-h-[290px] sm:min-h-[310px] lg:min-h-[330px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[#1a1f36] tracking-tight">Distribution volume</span>
                <CardInfoTooltip text="Total physical weight (lbs) of food distributed out to community members and partner pantries." />
              </div>
            </div>
            <h4 className="text-[26px] font-bold text-[#1a1f36] tracking-tight mb-2">
              {(stats?.totalItemsDistributed || 0).toLocaleString()} <span className="text-base font-semibold text-[#697386]">lbs</span>
            </h4>

            {/* Mini Area Chart */}
            <div className="w-full h-36 sm:h-40 lg:h-44 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={distributionSeries} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="distBrandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c86545" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c86545" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip 
                    cursor={{ stroke: '#c86545', strokeWidth: 1.5, strokeDasharray: '3 3' }} 
                    content={<StripeGridTooltip unit="lbs" />} 
                  />
                  <Area type="monotone" dataKey="amount" stroke="#c86545" strokeWidth={2.5} fill="url(#distBrandGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[12px] text-[#8792a2]">
            <span>{getRelativeTimeString(stats?.lastUpdated)}</span>
            <button onClick={() => setActiveView('View Distribution')} className="font-medium text-[#697386] hover:text-[#1a1f36] transition-colors cursor-pointer">
              More details
            </button>
          </div>
        </div>

        {/* --- CARD 4: WASTE & SHRINKAGE --- */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between min-h-[290px] sm:min-h-[310px] lg:min-h-[330px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[#1a1f36] tracking-tight">Waste & shrinkage</span>
                <CardInfoTooltip text="Total weight (lbs) of spoiled, damaged, or expired food logged during shelf audits." />
              </div>
            </div>

            {wasteSeries.length === 0 || wasteSeries.every(w => w.amount === 0) ? (
              <NoDataDashedBox label="No data" />
            ) : (
              <>
                <h4 className="text-[26px] font-bold text-[#1a1f36] tracking-tight mb-2">
                  {(stats?.totalLbsWasted || 0).toLocaleString()} <span className="text-base font-semibold text-[#697386]">lbs</span>
                </h4>
                <div className="w-full h-36 sm:h-40 lg:h-44 pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wasteSeries}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#f3f4f6' }} content={<StripeGridTooltip unit="lbs" />} />
                      <Bar dataKey="amount" fill="#d97757" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[12px] text-[#8792a2]">
            <span>{getRelativeTimeString(stats?.lastUpdated)}</span>
            <button onClick={() => setActiveView('View Inventory')} className="font-medium text-[#697386] hover:text-[#1a1f36] transition-colors cursor-pointer">
              View details
            </button>
          </div>
        </div>

        {/* --- CARD 5: ESTIMATED AID VALUE ($) --- */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between min-h-[290px] sm:min-h-[310px] lg:min-h-[330px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[#1a1f36] tracking-tight">Est. aid value</span>
                <CardInfoTooltip text="Community dollar value of food distributed based on official USDA $1.96/lb food valuation standards." />
              </div>
            </div>
            <h4 className="text-[26px] font-bold text-[#1a1f36] tracking-tight mb-1">
              ${(stats?.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
            <p className="text-xs text-[#8792a2] font-medium mb-2">Community aid provided ($1.96/lb USDA valuation)</p>

            <div className="w-full h-32 sm:h-36 lg:h-40 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={valueSeries}>
                  <defs>
                    <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97757" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d97757" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip cursor={{ stroke: '#d97757', strokeWidth: 1.5, strokeDasharray: '3 3' }} content={<StripeGridTooltip isCurrency={true} />} />
                  <Area type="monotone" dataKey="amount" stroke="#d97757" strokeWidth={2} fill="url(#valGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[12px] text-[#8792a2]">
            <span>{getRelativeTimeString(stats?.lastUpdated)}</span>
            <button onClick={() => setActiveView('View Distribution')} className="font-medium text-[#697386] hover:text-[#1a1f36] transition-colors cursor-pointer">
              View distribution
            </button>
          </div>
        </div>

        {/* --- CARD 6: TOP ITEMS BY STOCK --- */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between min-h-[290px] sm:min-h-[310px] lg:min-h-[330px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[#1a1f36] tracking-tight">Top items by stock</span>
                <CardInfoTooltip text="Your pantry's top 5 catalog items ranked by current available shelf stock quantity." />
              </div>
              <span className="text-xs font-medium text-[#8792a2]">All time</span>
            </div>

            {topItems.length === 0 ? (
              <NoDataDashedBox label="No data" />
            ) : (
              <div className="divide-y divide-gray-100">
                {topItems.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-[#3c4257] truncate max-w-[180px]">{item.name}</span>
                    <span className="font-bold text-[#1a1f36]">{item.quantity.toLocaleString()} {item.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[12px] text-[#8792a2]">
            <span>{getRelativeTimeString(stats?.lastUpdated)}</span>
            <button onClick={() => setActiveView('View Inventory')} className="font-medium text-[#697386] hover:text-[#1a1f36] transition-colors cursor-pointer">
              View all
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
