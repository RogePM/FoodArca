'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, LayoutGrid, ArrowUpDown, Minus, Plus, SearchX, Activity, Calendar } from 'lucide-react';
import { categories, getCategoryName, getCategoryStyle } from '@/lib/constants';
import { getExpirationStatus, formatDate } from '../inventory/inventory-utils';

// ─── Sort Icon ───────────────────────────────────────────────────
function SortIcon({ columnKey, sortConfig }) {
  const isActive = sortConfig.key === columnKey;
  if (!isActive) return <ArrowUpDown className="h-3 w-3 text-gray-300 ml-1.5 opacity-0 group-hover/th:opacity-100 transition-opacity" />;
  return sortConfig.direction === 'asc' 
    ? <ChevronUp className="h-3.5 w-3.5 text-[#d97757] ml-1" strokeWidth={2.5} />
    : <ChevronDown className="h-3.5 w-3.5 text-[#d97757] ml-1" strokeWidth={2.5} />;
}

// ─── Custom Select Component ───────────
function CustomSelect({ value, options, onChange, placeholder, minWidth = "10rem" }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" style={{ minWidth }}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 h-12 bg-white border border-gray-300 rounded-[12px] hover:border-[#d97757] transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-[#d97757]/10"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      >
        <div className="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
          {selectedOption?.icon && <selectedOption.icon className="h-4 w-4 text-gray-500" />}
          {selectedOption ? selectedOption.label : placeholder}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-h-56 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors flex items-center gap-3 ${
                opt.value === value ? 'bg-[#d97757]/5 text-[#d97757]' : 'text-gray-700 hover:bg-[#d97757]/5 hover:text-[#d97757]'
              }`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.icon && <opt.icon className={`h-4 w-4 ${opt.value === value ? 'text-[#d97757]' : 'text-gray-400'}`} />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DistributionDesktopTable({ isLoading, inventory, cart, searchQuery, setSearchQuery, setGroupCartQty }) {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'expiration', direction: 'asc' });

  // 1. Group by Main Item
  const groupedInventory = useMemo(() => {
    const groups = {};
    inventory.forEach(item => {
      const key = item.barcode || item.name;
      if (!groups[key]) groups[key] = { mainItem: item, batches: [], totalQuantity: 0 };
      groups[key].batches.push(item);
      groups[key].totalQuantity += item.quantity;
    });
    
    Object.values(groups).forEach(g => {
      g.batches.sort((a, b) => (!a.expirationDate ? 1 : !b.expirationDate ? -1 : new Date(a.expirationDate) - new Date(b.expirationDate)));
    });
    return Object.values(groups);
  }, [inventory]);

  // 2. Filter & Sort
  const filteredAndSorted = useMemo(() => {
    let result = groupedInventory;

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(g => g.mainItem.name.toLowerCase().includes(q) || g.mainItem.barcode?.includes(q));
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter(g => g.mainItem.category === categoryFilter);
    }

    if (activeFilter === 'EXPIRING') {
      result = result.filter(g => getExpirationStatus(g.batches[0]?.expirationDate).isExpiring);
    } else if (activeFilter === 'EXPIRED') {
      result = result.filter(g => getExpirationStatus(g.batches[0]?.expirationDate).isExpired);
    }

    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          aVal = (a.mainItem.name || '').toLowerCase();
          bVal = (b.mainItem.name || '').toLowerCase();
          break;
        case 'category':
          aVal = getCategoryName(a.mainItem.category).toLowerCase();
          bVal = getCategoryName(b.mainItem.category).toLowerCase();
          break;
        case 'expiration':
          aVal = a.batches[0]?.expirationDate ? new Date(a.batches[0].expirationDate).getTime() : Infinity;
          bVal = b.batches[0]?.expirationDate ? new Date(b.batches[0].expirationDate).getTime() : Infinity;
          break;
        case 'totalQuantity':
          aVal = a.totalQuantity || 0;
          bVal = b.totalQuantity || 0;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [groupedInventory, searchQuery, categoryFilter, activeFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const thBase = "py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider select-none group/th cursor-pointer hover:text-gray-700 transition-colors";

  return (
    <div className="hidden md:block w-full font-sans animate-in fade-in duration-300 h-full">
      <div className="flex flex-col h-full bg-white border border-gray-200 rounded-[16px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* ── ACTION BAR ────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="relative flex-1 max-w-md mr-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" strokeWidth={2.5} />
            <input 
              placeholder="Search items by name or scan barcode..." 
              className="w-full h-12 pl-12 pr-4 bg-white border border-gray-300 rounded-[12px] text-[15px] font-semibold text-gray-900 outline-none placeholder:text-gray-500 placeholder:font-medium focus:ring-4 focus:ring-[#d97757]/10 focus:border-[#d97757] shadow-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <CustomSelect 
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="All Categories"
              minWidth="13rem"
              options={[
                { value: 'ALL', label: 'All Categories', icon: LayoutGrid },
                ...categories.map(c => ({ value: c.value, label: c.name, icon: c.icon }))
              ]}
            />
            <CustomSelect 
              value={activeFilter}
              onChange={setActiveFilter}
              placeholder="All Statuses"
              minWidth="11rem"
              options={[
                { value: 'ALL', label: 'All Statuses', icon: Activity },
                { value: 'EXPIRING', label: 'Expiring Soon', icon: Calendar },
                { value: 'EXPIRED', label: 'Expired', icon: Calendar }
              ]}
            />
          </div>
        </div>

        {/* ── DATA TABLE ────────────────────────────── */}
        <div className="flex-1 overflow-auto relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
              <tr>
                <th className={`${thBase} w-[40%]`} onClick={() => handleSort('name')}>
                  <div className="flex items-center">Item Details <SortIcon columnKey="name" sortConfig={sortConfig} /></div>
                </th>
                <th className={`${thBase} w-[20%]`} onClick={() => handleSort('expiration')}>
                  <div className="flex items-center">Next Expiration <SortIcon columnKey="expiration" sortConfig={sortConfig} /></div>
                </th>
                <th className={thBase} onClick={() => handleSort('totalQuantity')}>
                  <div className="flex items-center">Available Stock <SortIcon columnKey="totalQuantity" sortConfig={sortConfig} /></div>
                </th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Distribute Qty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-gray-50/50 last:border-0">
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-gray-100 animate-pulse shrink-0" />
                        <div className="flex flex-col gap-2 w-full max-w-[180px]">
                          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-2/3 bg-gray-50 rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-gray-200 animate-pulse shrink-0" />
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-left">
                      <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="px-5 py-4 align-middle w-[160px]">
                      <div className="flex justify-end">
                        <div className="h-[42px] w-[120px] rounded-full bg-gray-100 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {filteredAndSorted.map((group) => {
                    const isOOS = group.totalQuantity <= 0;
                    
                    // Get style and icon directly from constants
                    const cat = categories.find(c => c.value === group.mainItem.category?.toLowerCase()) || categories.find(c => c.value === 'other');
                    const Style = cat.style;
                    const Icon = cat.icon;
                    
                    // Calculate how many of this group are already in the cart
                    const groupIds = new Set(group.batches.map(b => b._id));
                    const inCartQty = cart.filter(c => groupIds.has(c.item._id)).reduce((sum, c) => sum + c.quantity, 0);

                    return (
                      <tr key={group.mainItem._id} className={`group/row hover:bg-[#fafaf9] transition-colors border-b border-gray-50/50 last:border-0 ${isOOS ? 'opacity-50 grayscale' : ''}`}>
                        
                        {/* 1. Item Name & Icon */}
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-4">
                            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${Style.bg} ${Style.text}`}>
                              <Icon className="h-5 w-5" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-[15px] text-gray-900 truncate tracking-tight">
                                {group.mainItem.name}
                              </span>
                              <div className="flex items-center gap-2 mt-1 text-[13px]">
                                <span className="font-medium text-gray-500">
                                  {getCategoryName(group.mainItem.category)}
                                </span>
                                {group.mainItem.barcode && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span className="font-mono text-[11px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md tracking-wider">
                                      {group.mainItem.barcode.slice(-6)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Next Expiration */}
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-2.5">
                            {group.batches[0]?.expirationDate ? (
                              <>
                                <div className={`h-2 w-2 rounded-full shrink-0 ${getExpirationStatus(group.batches[0].expirationDate).className.includes('red') ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : getExpirationStatus(group.batches[0].expirationDate).className.includes('yellow') ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <span className="text-[14px] font-medium text-gray-700 whitespace-nowrap">
                                  {formatDate(group.batches[0].expirationDate)}
                                </span>
                              </>
                            ) : (
                              <span className="text-[14px] text-gray-400 font-medium italic whitespace-nowrap">No expiration</span>
                            )}
                          </div>
                        </td>

                        {/* 3. Available Stock */}
                        <td className="px-4 py-4 align-middle text-left">
                          <div className="flex flex-col items-start">
                            <span className={`text-[16px] font-black tabular-nums tracking-tight ${isOOS ? 'text-red-500' : 'text-gray-900'}`}>
                              {group.totalQuantity} <span className="text-[12px] font-semibold text-gray-400 uppercase ml-0.5">{group.mainItem.unit || 'units'}</span>
                            </span>
                            {isOOS && <span className="text-[10px] uppercase font-bold text-red-500 mt-1 tracking-wider">Out of Stock</span>}
                          </div>
                        </td>

                        {/* 4. Distribute Action (INLINE STEPPER) */}
                        <td className="px-5 py-4 align-middle w-[160px]">
                          <div className="flex justify-end">
                            <div className={`flex items-center rounded-full h-[42px] overflow-hidden transition-all duration-300 ${
                              inCartQty > 0 
                                ? 'bg-[#f0fdf4] border-2 border-[#154734] shadow-[0_4px_12px_rgba(21,71,52,0.15)] scale-[1.02]' 
                                : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-white group-hover/row:shadow-sm'
                            }`}>
                              <button 
                                disabled={isOOS && inCartQty === 0}
                                onClick={() => setGroupCartQty(group, Math.max(0, inCartQty - 1))}
                                className={`h-[42px] w-10 flex items-center justify-center transition-colors ${
                                  inCartQty > 0 ? 'text-[#154734] hover:bg-[#dcfce7]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                              >
                                <Minus className="h-4 w-4" strokeWidth={2.5} />
                              </button>
                              
                              <input 
                                type="number"
                                min="0"
                                max={group.totalQuantity}
                                value={inCartQty || ''}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (e.target.value === '') { setGroupCartQty(group, 0); return; }
                                  if (!isNaN(val) && val >= 0) {
                                    setGroupCartQty(group, Math.min(val, group.totalQuantity));
                                  }
                                }}
                                className={`w-12 h-[42px] text-center text-[15px] font-black outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  inCartQty > 0 ? 'bg-[#f0fdf4] text-[#154734]' : 'bg-transparent text-gray-900 focus:bg-white'
                                }`}
                              />

                              <button 
                                disabled={isOOS || inCartQty >= group.totalQuantity}
                                onClick={() => setGroupCartQty(group, Math.min(group.totalQuantity, inCartQty + 1))}
                                className={`h-[42px] w-10 flex items-center justify-center transition-colors ${
                                  inCartQty > 0 ? 'text-[#154734] hover:bg-[#dcfce7]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                              >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        </td>

                      </tr>
                    );
                  })}

                  {filteredAndSorted.length === 0 && (
                    <tr>
                      <td colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <SearchX className="h-8 w-8 mb-3 opacity-20" />
                          <p className="text-[14px] font-medium">No items found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
