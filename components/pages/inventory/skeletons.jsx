import React from 'react';

export function MobileGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col text-left border-b border-gray-200 pb-5 pt-4">
          {/* Image Block Skeleton */}
          <div className="w-full aspect-square bg-gray-100/80 rounded-xl mb-3 animate-pulse" />
          
          {/* Title Skeleton */}
          <div className="w-3/4 h-4 bg-gray-200/80 rounded-md animate-pulse mb-2.5" />
          
          {/* Count Skeleton */}
          <div className="w-1/3 h-5 bg-gray-200/80 rounded-md animate-pulse mb-3" />
          
          {/* Category Skeleton */}
          <div className="w-1/2 h-3 bg-gray-100 rounded-sm animate-pulse mb-3" />
          
          {/* Expiration Badge Skeleton */}
          <div className="mt-auto">
            <div className="w-16 h-5 bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Filter-pill row placeholder — stands in for the status/category pills while
// their counts are still being computed from the not-yet-fetched inventory,
// so the row doesn't flash a misleading "0" on every pill before data lands.
export function PillRowSkeleton({ count = 6 }) {
  const widths = ['w-14', 'w-24', 'w-20', 'w-20', 'w-16', 'w-20', 'w-24', 'w-20'];
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-[31px] ${widths[i % widths.length]} shrink-0 rounded-full bg-white/30 animate-pulse`}
        />
      ))}
    </div>
  );
}

// The whole Inventory page as an outline, shown by app/dashboard/inventory/loading.jsx while the
// server draws the first page. Same frame and sizes as InventoryView, so nothing moves when it lands.
export function InventoryPageSkeleton() {
  return (
    <div className="w-full max-w-[100vw] bg-white md:bg-[#fafafa] font-sans" aria-busy="true" aria-label="Loading inventory">
      {/* Desktop title */}
      <div className="hidden md:flex bg-white px-6 pt-4 pb-0 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-orange-50 rounded-2xl border border-orange-100/50" />
          <div>
            <h2 className="text-[24px] font-bold text-[#1a1f36] tracking-tight leading-none">Inventory</h2>
            <div className="w-28 h-3 mt-1.5 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-[118px] h-10 bg-[#d97757]/80 rounded-xl" />
      </div>

      {/* Search bar */}
      <div className="sticky top-0 z-20 bg-[#d97757] md:bg-white px-4 md:px-6 pt-3 pb-2 shadow-[0_1px_0_0_#d97757] md:shadow-none">
        <div className="md:hidden h-12 bg-white rounded-2xl shadow-[0_4px_20px_-6px_rgba(0,0,0,0.15)]" />
        <div className="hidden md:block max-w-md mt-4 h-11 bg-white border border-gray-200 rounded-2xl" />
      </div>

      {/* Filter pills */}
      <div className="bg-[#d97757] md:bg-white px-4 md:px-6 pt-1 pb-3 overflow-hidden">
        <PillRowSkeleton />
      </div>

      {/* Items */}
      <div className="px-4 md:px-5 pb-[120px] md:pb-8 pt-3 md:pt-4 max-w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="md:hidden mt-2"><MobileGridSkeleton /></div>
          <div className="hidden md:block"><DesktopTableSkeleton /></div>
        </div>
      </div>
    </div>
  );
}

export function DesktopTableSkeleton() {
  return (
    <div className="bg-white rounded-[20px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-200 overflow-hidden flex flex-col mb-12">
      {/* Search / Filter header area placeholder */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
         <div className="w-64 h-11 bg-gray-100 rounded-2xl animate-pulse" />
         <div className="flex gap-2">
            <div className="w-32 h-11 bg-gray-100 rounded-[12px] animate-pulse" />
            <div className="w-32 h-11 bg-gray-100 rounded-[12px] animate-pulse" />
         </div>
      </div>

      {/* Table Header Skeleton */}
      <div className="h-12 border-b border-gray-100 bg-gray-50/50" />
      
      {/* Table Rows Skeleton */}
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center px-6 py-4">
            {/* Icon */}
            <div className="w-10 h-10 bg-gray-100 rounded-xl mr-4 shrink-0 animate-pulse" />
            
            {/* Item Name & Category */}
            <div className="flex-1 space-y-2">
              <div className="w-48 h-4 bg-gray-200/80 rounded-md animate-pulse" />
              <div className="w-24 h-3 bg-gray-100 rounded animate-pulse" />
            </div>
            
            {/* Quantity */}
            <div className="w-16 h-5 bg-gray-200/80 rounded-md mx-4 animate-pulse" />
            
            {/* Last Updated */}
            <div className="w-24 h-4 bg-gray-100 rounded animate-pulse mx-4" />
            
            {/* Status Pill */}
            <div className="w-24 h-6 bg-gray-100 rounded-full ml-auto animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
