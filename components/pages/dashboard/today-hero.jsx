'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// --- CUSTOM INTERACTIVE STRIPE TOOLTIP ---
const StripeHeroTooltip = ({ active, payload, labelName = 'Intake' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200/90 shadow-lg rounded-lg p-2.5 text-xs pointer-events-none transition-all">
        <p className="text-[#697386] font-medium mb-1">{data.time || 'Today'}</p>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#d97757]" />
          <span className="font-semibold text-[#4f566b]">{labelName}:</span>
          <span className="font-bold text-[#1a1f36]">{data.amount || 0} lbs</span>
        </div>
      </div>
    );
  }
  return null;
};

// --- SKELETON SHIMMER LOADING PLACEHOLDER ---
export function TodayHeroSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6 pb-6">
      <div className="h-9 w-36 bg-gray-200/70 rounded-md" />
      <div className="h-px w-full bg-gray-200/80 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-2 gap-4 md:flex md:gap-12">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200/70 rounded" />
              <div className="h-8 w-32 bg-gray-200/70 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200/70 rounded" />
              <div className="h-8 w-24 bg-gray-200/70 rounded" />
            </div>
          </div>
          <div className="h-40 w-full bg-gray-200/40 rounded-xl" />
        </div>
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="h-24 w-full bg-gray-200/70 rounded-xl" />
          <div className="h-24 w-full bg-gray-200/70 rounded-xl" />
        </div>
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

const HERO_METRIC_OPTIONS = [
  { key: 'intake', label: 'Food intake' },
  { key: 'distribution', label: 'Food distributed' },
  { key: 'waste', label: 'Waste & shrinkage' }
];

export function TodayHero({ stats, loading, setActiveView }) {
  const [metricType, setMetricType] = useState('intake'); // 'intake' | 'distribution' | 'waste'
  const [, setTick] = useState(0);

  // Live timer tick every 15s to update relative timestamps automatically
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <TodayHeroSkeleton />;

  // Select metric calculations based on dropdown state
  let primaryValue = 0;
  let compareValue = 0;
  let timelineData = [];
  let tooltipLabel = 'Intake';

  if (metricType === 'distribution') {
    primaryValue = stats?.todayDistributedLbs || 0;
    compareValue = stats?.yesterdayDistributedLbs || 0;
    timelineData = stats?.todayDistributionTimeline || [];
    tooltipLabel = 'Distributed';
  } else if (metricType === 'waste') {
    primaryValue = stats?.todayWasteLbs || 0;
    compareValue = stats?.yesterdayWasteLbs || 0;
    timelineData = stats?.todayWasteTimeline || [];
    tooltipLabel = 'Wasted';
  } else {
    // Default: 'intake'
    primaryValue = stats?.todayIntakeLbs || 0;
    compareValue = stats?.yesterdayIntakeLbs || 0;
    timelineData = stats?.todayHeroTimeline || [];
    tooltipLabel = 'Intake';
  }

  // Fallback timeline data if 0 entries exist
  if (!timelineData || timelineData.length === 0) {
    timelineData = [
      { time: '12 AM', amount: 0 },
      { time: '4 AM', amount: 0 },
      { time: '8 AM', amount: 0 },
      { time: '12 PM', amount: 0 },
      { time: '4 PM', amount: 0 },
      { time: '8 PM', amount: 0 }
    ];
  }

  const selectedOption = HERO_METRIC_OPTIONS.find(o => o.key === metricType) || HERO_METRIC_OPTIONS[0];

  return (
    <div className="w-full pb-8 font-sans">
      {/* 1. SECTION TITLE & SOFT DIVIDER LINE */}
      <div className="border-b border-gray-200/80 pb-4 mb-6">
        <h2 className="text-[26px] font-bold text-[#1a1f36] tracking-tight">Today</h2>
      </div>

      {/* 2. MAIN LAYOUT (OPEN HERO ON LEFT, 2 SIDE-BY-SIDE STAT CARDS ON MOBILE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* LEFT COLUMN: Open Metric Sparkline Area */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4 pt-1">
          
          {/* Header Metric Row (Equal 2-Column Grid on Mobile, Flex on Desktop) */}
          <div className="grid grid-cols-2 items-start gap-4 md:flex md:items-baseline md:gap-14">
            
            {/* Primary Selected Metric Dropdown */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 text-[13px] font-semibold text-[#4f566b] mb-1 cursor-pointer group outline-none">
                  <span>{selectedOption.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#a3acb9] group-hover:text-[#4f566b] transition-colors" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-44 p-1 rounded-xl bg-white border border-gray-200/90 shadow-xl z-50 animate-in fade-in-80 zoom-in-95">
                  {HERO_METRIC_OPTIONS.map((opt) => {
                    const isSelected = opt.key === metricType;
                    return (
                      <DropdownMenuItem
                        key={opt.key}
                        onClick={() => setMetricType(opt.key)}
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

              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[26px] md:text-[28px] font-bold text-[#1a1f36] tracking-tight">
                  {primaryValue.toLocaleString()}
                </span>
                <span className="text-sm md:text-base font-semibold text-[#697386]">lbs</span>
              </div>
              <p className="text-[11px] text-[#8792a2] font-medium mt-0.5">{getRelativeTimeString(stats?.lastUpdated)}</p>
            </div>

            {/* Yesterday Comparison Metric */}
            <div>
              <span className="text-[13px] font-medium text-[#697386] mb-1 block">
                Yesterday
              </span>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xl md:text-2xl font-semibold text-[#4f566b] tracking-tight">
                  {compareValue.toLocaleString()}
                </span>
                <span className="text-xs md:text-sm font-normal text-[#8792a2]">lbs</span>
              </div>
            </div>

          </div>

          {/* Sparkline Interactive Chart */}
          <div className="w-full h-36 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="brandHeroGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97757" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#d97757" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8792a2', fontSize: 11 }}
                  dy={5}
                />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip 
                  cursor={{ stroke: '#d97757', strokeWidth: 1.5, strokeDasharray: '3 3' }} 
                  content={<StripeHeroTooltip labelName={tooltipLabel} />} 
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#d97757" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#brandHeroGradient)" 
                  activeDot={{ r: 5, fill: '#d97757', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* RIGHT COLUMN: Two Side-by-Side Stat Cards on Mobile, Stacked on Desktop */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
          
          {/* Stat Card 1: Current Stock */}
          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200/80 shadow-none flex flex-col justify-between hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-[14px] font-semibold text-[#1a1f36] truncate">Current stock</span>
              <button 
                onClick={() => setActiveView('View Inventory')}
                className="text-xs md:text-[13px] font-medium text-[#697386] hover:text-[#1a1f36] transition-colors cursor-pointer"
              >
                View
              </button>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-[#1a1f36] tracking-tight">
                {(stats?.currentStockUnits || 0).toLocaleString()} <span className="text-xs md:text-sm font-normal text-[#697386]">units</span>
              </h3>
              <p className="text-[11px] md:text-xs text-[#8792a2] font-medium mt-1 truncate">
                ≈ {(stats?.currentStockWeightLbs || 0).toLocaleString()} lbs available
              </p>
            </div>
          </div>

          {/* Stat Card 2: Distributed Today */}
          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200/90 shadow-none flex flex-col justify-between hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-[14px] font-semibold text-[#1a1f36] truncate">Distributed today</span>
              <button 
                onClick={() => setActiveView('View Distribution')}
                className="text-xs md:text-[13px] font-medium text-[#697386] hover:text-[#1a1f36] transition-colors cursor-pointer"
              >
                View
              </button>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-[#1a1f36] tracking-tight">
                {(stats?.todayDistributedLbs || 0).toLocaleString()} <span className="text-xs md:text-sm font-normal text-[#697386]">lbs</span>
              </h3>
              <p className="text-[11px] md:text-xs text-[#8792a2] font-medium mt-1 truncate">
                Outflow to community
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
