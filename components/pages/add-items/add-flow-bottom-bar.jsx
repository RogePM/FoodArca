'use client';

import React from 'react';
import { Scan, Search, Keyboard, ShoppingBag } from 'lucide-react';

const TABS = [
  { key: 'SCANNER', label: 'Scanner', icon: Scan },
  { key: 'SEARCH', label: 'Search items', icon: Search },
  { key: 'MANUAL', label: 'Manual entry', icon: Keyboard },
  { key: 'CART', label: 'Cart', icon: ShoppingBag },
];

// Persistent bottom tab bar shared across the Add Items flow (Scanner + Cart).
// Rendered above the global bottom nav (which sits at z-[100]) so it fully
// replaces it while any Add Items screen is active.
export function AddFlowBottomBar({
  activeTab,
  cartCount = 0,
  helperText,
  onScanner,
  onSearch,
  onManual,
  onCart,
  className = '',
}) {
  const handlers = {
    SCANNER: onScanner,
    SEARCH: onSearch,
    MANUAL: onManual,
    CART: onCart,
  };

  return (
    <div
      className={`fixed bottom-0 inset-x-0 bg-white z-[110] pointer-events-auto shadow-[0_-10px_20px_rgba(0,0,0,0.05)] ${className}`}
    >
      {helperText && (
        <div className="border-b border-gray-100 py-3.5 px-6 text-center">
          <p className="text-[14px] font-medium text-[#1a1f36]">{helperText}</p>
        </div>
      )}

      <div className="flex items-center justify-between px-1 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = key === activeTab;
          return (
            <button
              key={key}
              type="button"
              onClick={handlers[key]}
              className="flex flex-col items-center justify-center py-2 px-1 flex-1 active:opacity-70 transition-opacity"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 mb-1.5 ${active ? 'text-[#e27f2c]' : 'text-[#1a1f36]'}`}
                  strokeWidth={2.2}
                />
                {key === 'CART' && cartCount > 0 && (
                  <div className="absolute -top-1.5 -right-2 bg-[#FF3B30] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartCount}
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] ${active ? 'font-semibold text-[#e27f2c]' : 'font-medium text-[#1a1f36]'}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
