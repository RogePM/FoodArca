import React from 'react';

export function MobileGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col text-left border-b border-gray-200 pb-5 pt-4">
          {/* Image Block Skeleton */}
          <div className="w-full aspect-[4/5] bg-gray-100/80 rounded-xl mb-3 animate-pulse" />
          
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
