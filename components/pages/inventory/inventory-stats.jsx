import React from 'react';
import { Layers, Clock, AlertTriangle, ArrowUpDown } from 'lucide-react';

export function InventoryStats({ stats, activeFilter, setActiveFilter }) {
  const filterOptions = [
    { key: 'ALL', label: 'All Items', count: stats.total, icon: Layers, color: '#d97757', accent: 'bg-[#d97757]/8' },
    { key: 'EXPIRING', label: 'Expiring Soon', count: stats.expiring, icon: Clock, color: '#ea8c55', accent: 'bg-orange-50' },
    { key: 'EXPIRED', label: 'Expired', count: stats.expired, icon: AlertTriangle, color: '#ef4444', accent: 'bg-red-50' },
    { key: 'LOW', label: 'Low Stock', count: stats.low, icon: ArrowUpDown, color: '#059669', accent: 'bg-emerald-50' },
  ];

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <div className="flex gap-2.5 pt-3 pb-2" style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingLeft: '16px', paddingRight: '16px' }}>
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <button 
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              style={{ flex: '0 0 140px', minWidth: '140px', borderColor: isActive ? filter.color : undefined }}
              className={`relative flex flex-col items-start p-4 rounded-[22px] transition-all active:scale-[0.97] overflow-hidden ${
                isActive 
                  ? 'bg-white border-2 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]' 
                  : 'bg-white border border-gray-100 shadow-[0_1px_4px_-2px_rgba(0,0,0,0.03)]'
              }`}
            >
              {/* Background accent circle */}
              <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full opacity-40" style={{ backgroundColor: `${filter.color}15` }} />
              
              <div className={`h-8 w-8 rounded-[10px] flex items-center justify-center mb-2 transition-colors ${filter.accent}`}>
                <filter.icon className="h-4 w-4" strokeWidth={2.5} style={{ color: filter.color }} />
              </div>
              <span className="text-[11px] font-semibold text-gray-400 mb-0.5">{filter.label}</span>
              <span className="text-[22px] font-semibold tracking-tight text-gray-900 leading-none">{filter.count}</span>
            </button>
          );
        })}
        {/* Right padding spacer so last card doesn't hug the edge */}
        <div style={{ flex: '0 0 1px' }} aria-hidden="true" />
      </div>
    </div>
  );
}
