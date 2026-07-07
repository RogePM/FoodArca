import React from 'react';

export function InventorySkeleton() {
  return (
    <div className="w-full animate-pulse mt-4">
      {/* --- DESKTOP SKELETON (Hidden on Mobile) --- */}
      <div className="hidden md:block rounded-[24px] border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-gray-50 bg-gray-50/50 px-6 py-4 flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center px-6 py-5 border-b border-gray-50 last:border-0">
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-3 bg-gray-100 rounded w-24"></div>
            </div>
            <div className="w-[20%]">
              <div className="h-6 bg-gray-100 rounded-lg w-20"></div>
            </div>
            <div className="w-[20%] flex flex-col gap-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-100 rounded w-16"></div>
            </div>
            <div className="w-[15%] text-center">
              <div className="h-6 bg-gray-200 rounded w-12 mx-auto"></div>
            </div>
            <div className="w-[10%] flex justify-end">
              <div className="h-4 bg-gray-200 rounded w-4"></div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MOBILE SKELETON (Hidden on Desktop) --- */}
      <div className="md:hidden space-y-4">
        {[1, 2, 3].map((categoryIdx) => (
          <div key={categoryIdx} className="space-y-3">
            {/* Category Header Skeleton */}
            <div className="px-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-28"></div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-12"></div>
            </div>

            {/* Category Items Skeleton */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] divide-y divide-gray-50">
              {[1, 2].map((itemIdx) => (
                <div key={itemIdx} className="flex items-center justify-between px-5 py-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex gap-2">
                      <div className="h-3 bg-gray-100 rounded w-16"></div>
                      <div className="h-3 bg-gray-100 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <div className="h-5 bg-gray-200 rounded w-8"></div>
                    <div className="h-2 bg-gray-100 rounded w-6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
