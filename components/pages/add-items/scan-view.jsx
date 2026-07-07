'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Plus, History, ScanBarcode, Calendar, X } from 'lucide-react';
import { usePantry } from '@/components/providers/PantryProvider';
import { categories, getCategoryStyle, getCategoryName } from '@/lib/constants';

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

// 1. SKELETON COMPONENT
const LogSkeleton = () => (
  <div className="flex items-center gap-3.5 px-4 py-3">
    <div className="h-[38px] w-[38px] min-w-[38px] min-h-[38px] shrink-0 rounded-[12px] bg-gray-100 animate-pulse" />
    <div className="flex-1 min-w-0">
      <div className="h-4 bg-gray-100 rounded-full w-2/3 animate-pulse mb-1.5" />
      <div className="h-3 bg-gray-100 rounded-full w-1/4 animate-pulse" />
    </div>
    <div className="h-4 bg-gray-100 rounded-full w-8 animate-pulse shrink-0" />
  </div>
);

export function ScanView({ onScanClick, onManualClick, onClose }) {
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
          setRecentLogs(data.slice(0, 3));
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
    <div className="flex-1 flex flex-col w-full bg-[#f7f7f5] px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain">
      
      {/* Page Header */}
      <div className="flex items-end justify-between px-1 pb-5">
        <h1 className="text-[18px] font-semibold text-gray-900 tracking-tight leading-none">Add Item</h1>
        {onClose && (
          <button onClick={onClose} className="p-1 -mr-1.5 text-gray-400 hover:text-gray-600 transition-colors active:scale-95">
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 shrink-0">
        {/* PRIMARY ACTION: Scan Barcode */}
        <button 
          onClick={onScanClick}
          className="relative flex items-center justify-between w-full h-[120px] rounded-[24px] bg-[#d97757] p-6 overflow-hidden transition-all active:scale-[0.98] shadow-[0_8px_20px_-6px_rgba(217,119,87,0.4)] group"
        >
          {/* Background SVG Graphics */}
          <svg className="absolute bottom-0 right-0 w-40 h-40 text-white opacity-10 transform translate-x-10 translate-y-10" fill="currentColor" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="absolute top-0 right-0 w-20 h-20 text-white opacity-10 transform translate-x-5 -translate-y-5" fill="currentColor" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="50" />
          </svg>

          <div className="flex items-center gap-5 relative z-10 w-full">
            <div className="h-[64px] w-[64px] shrink-0 bg-white/20 rounded-[22px] backdrop-blur-sm shadow-inner flex items-center justify-center">
              <Camera className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            
            <div className="text-left flex-1">
              <h3 className="text-[26px] font-medium tracking-tight text-white mb-0.5">Scan Barcode</h3>
              <p className="text-[13px] font-medium opacity-80 text-white">Fastest way to add</p>
            </div>
          </div>
        </button>

        {/* SECONDARY ACTION: Manual Entry */}
        <button 
          onClick={onManualClick}
          className="flex items-center justify-between w-full h-[120px] rounded-[24px] bg-white border border-gray-100 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-5 w-full">
            <div className="h-[64px] w-[64px] shrink-0 rounded-[22px] bg-[#d97757]/15 shadow-inner flex items-center justify-center text-[#d97757]">
              <Plus className="h-7 w-7" strokeWidth={3} />
            </div>
            
            <div className="text-left flex-1">
              <h3 className="text-[22px] font-bold text-gray-900 tracking-tight mb-0.5">Manual Entry</h3>
              <p className="text-[13px] font-medium text-gray-500">Type details yourself</p>
            </div>
          </div>
        </button>
      </div>

      {/* RECENT LOGS SECTION */}
      <div className="mt-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between px-1 mb-4">
          <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Recent Activity</h4>
        </div>
        
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden divide-y divide-gray-100/80 mb-6">
          {isLoading ? (
            <>
              <LogSkeleton />
              <LogSkeleton />
              <LogSkeleton />
            </>
          ) : recentLogs.length > 0 ? (
            recentLogs.map((log, idx) => {
              const catStyle = getCategoryStyle(log.category);
              const CatIcon = categories.find(c => c.value === log.category?.toLowerCase())?.icon || History;
              const expDate = log.changes?.expirationDate || null;
              
              return (
                <div 
                  key={log.id || idx}
                  className="flex items-center gap-3.5 px-4 py-3 active:bg-gray-50/50 transition-colors"
                >
                  <div className={`h-[38px] w-[38px] min-w-[38px] min-h-[38px] shrink-0 rounded-[12px] border ${catStyle.bg} ${catStyle.border} ${catStyle.text} shadow-sm flex items-center justify-center`}>
                    <CatIcon className="h-4 w-4" strokeWidth={2.5} />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-[15px] font-semibold text-gray-900 truncate tracking-tight">
                      {log.itemName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[12px] font-medium text-gray-400 shrink-0">
                        {getRelativeTime(log.timestamp || log.createdAt)}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${catStyle.bg} ${catStyle.text}`}>
                        {getCategoryName(log.category)}
                      </span>
                      {expDate && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(expDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                
                <div className="shrink-0 text-right pl-2">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                    {log.actionType === 'added' ? 'Added' : 'Removed'}
                  </p>
                  <span className={`text-[16px] font-bold leading-none ${log.actionType === 'added' ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {log.actionType === 'added' ? '+' : ''}{log.quantityChanged || log.quantity}
                  </span>
                </div>
              </div>
            );
          })
          ) : (
            <div className="p-8 text-center bg-white">
              <p className="text-[13px] font-medium text-gray-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}