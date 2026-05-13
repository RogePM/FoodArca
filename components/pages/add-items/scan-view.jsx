'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Plus, History, ScanBarcode } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return '—';
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const mins = Math.floor(diffInSeconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// 1. SKELETON COMPONENT (The "Donut Hole")
// Mirrors the exact dimensions of the real cards to prevent CLS (Layout Shifts)
const LogSkeleton = () => (
  <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-[#fbfbfc] border border-black/[0.03] shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
    {/* Icon Skeleton */}
    <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
    
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        {/* Title Skeleton */}
        <div className="h-4 bg-gray-200 rounded-full w-2/3 animate-pulse" />
        {/* Number Skeleton */}
        <div className="h-4 bg-gray-200 rounded-full w-8 animate-pulse shrink-0" />
      </div>
      {/* Time Skeleton */}
      <div className="h-3 bg-gray-100 rounded-full w-1/4 animate-pulse" />
    </div>
  </div>
);

export function ScanView({ onScanClick, onManualClick }) {
  const { pantryId } = usePantry();
  const [recentLogs, setRecentLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      if (!pantryId) return;
      try {
        const response = await fetch('/api/foods/changes/recent', {
          headers: { 'x-pantry-id': pantryId }
        });
        if (response.ok) {
          const data = await response.json();
          setRecentLogs(data.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching recent logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecent();
    const interval = setInterval(fetchRecent, 30000);
    return () => clearInterval(interval);
  }, [pantryId]);

  return (
    <div className="flex-1 flex flex-col w-full bg-[#f2f2f7] px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain">
      
      <div className="flex flex-col gap-4 shrink-0">
        {/* PRIMARY ACTION */}
        <button 
          onClick={onScanClick}
          className="relative flex flex-col items-start justify-between w-full h-44 rounded-[2.5rem] bg-[#d97757] p-8 overflow-hidden transition-all active:scale-[0.98] shadow-sm"
        >
          <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none text-white">
             <ScanBarcode className="h-48 w-48" strokeWidth={1.5} />
          </div>

          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
            <Camera className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          
          <div className="text-left relative z-10">
            <h3 className="text-2xl font-black text-white tracking-tight">Scan Barcode</h3>
            <p className="text-white/80 font-medium text-[15px] mt-0.5">Fastest way to add inventory</p>
          </div>
        </button>

        {/* SECONDARY ACTION */}
        <button 
          onClick={onManualClick}
          className="flex items-center justify-between w-full rounded-[2rem] bg-white border border-black/[0.03] p-5 shadow-sm transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Manual Entry</h3>
              <p className="text-gray-400 font-medium text-sm">Type item details yourself</p>
            </div>
          </div>
        </button>
      </div>

      {/* RECENT LOGS SECTION */}
      <div className="mt-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between px-2 mb-3">
          <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-[0.12em]">Recent Activity</h4>
        </div>
        
        <div className="flex flex-col gap-2.5 pb-6">
          {isLoading ? (
            // Render 3 exact-sized skeletons while loading to hold the UI structure
            <>
              <LogSkeleton />
              <LogSkeleton />
              <LogSkeleton />
            </>
          ) : recentLogs.length > 0 ? (
            recentLogs.map((log, idx) => (
              <div 
                key={log.id || idx} 
                className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-[#fbfbfc] border border-black/[0.03] shadow-[0_2px_10px_rgba(0,0,0,0.01)] active:scale-[0.98] transition-transform"
              >
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-black/[0.02] flex items-center justify-center shrink-0">
                  {/* Changed back to grey */}
                  <History className="h-5 w-5 text-[#d97757]" strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[16px] font-bold text-gray-900 truncate">
                      {log.itemName}
                    </p>
                    {/* Changed back to grey/dark grey */}
                    <span className="text-[16px] font-black shrink-0 text-emerald-600">
                      {log.actionType === 'added' ? '+' : ''}{log.quantityChanged || log.quantity}
                    </span>
                  </div>
                  <p className="text-[14px] text-gray-400 font-medium mt-0.5 tracking-tight">
                    {getRelativeTime(log.timestamp || log.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-[#fbfbfc] rounded-[1.5rem] border border-black/[0.03]">
              <p className="text-sm font-medium text-gray-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}