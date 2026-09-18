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
        <div className="border-b border-gray-100 py-[clamp(6px,1.2dvh,14px)] px-6 text-center">
          <p className="text-[clamp(12px,1.8dvh,14px)] font-medium text-[#1a1f36]">{helperText}</p>
        </div>
      )}

      <div className="flex items-center justify-between px-1 pt-[clamp(4px,0.8dvh,8px)] pb-[calc(env(safe-area-inset-bottom)+clamp(4px,1dvh,8px))]">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = key === activeTab;
          return (
            <button
              key={key}
              type="button"
              onClick={handlers[key]}
              className="flex flex-col items-center justify-center py-[clamp(4px,0.8dvh,8px)] px-1 flex-1 active:opacity-70 transition-opacity"
            >
              <div className="relative">
                <Icon
                  className={`w-[clamp(18px,3dvh,24px)] h-[clamp(18px,3dvh,24px)] mb-[clamp(2px,0.6dvh,6px)] ${active ? 'text-[#e27f2c]' : 'text-[#1a1f36]'}`}
                  strokeWidth={2.2}
                />
                {key === 'CART' && cartCount > 0 && (
                  <div className="absolute -top-1.5 -right-2 bg-[#FF3B30] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartCount}
                  </div>
                )}
              </div>
              <span
                className={`text-[clamp(9px,1.6dvh,11px)] leading-tight ${active ? 'font-semibold text-[#e27f2c]' : 'font-medium text-[#1a1f36]'}`}
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
