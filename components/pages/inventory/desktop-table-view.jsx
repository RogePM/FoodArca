'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Download, ChevronDown, ChevronRight, ChevronUp,
  Calendar, Pencil, ScanBarcode, ArrowUpDown, ChevronLeft,
  LayoutGrid, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categories, getCategoryName, getCategoryStyle } from '@/lib/constants';
import { getExpirationStatus, formatDate } from './inventory-utils';

// ─── Sort Icon ───────────────────────────────────────────────────
function SortIcon({ columnKey, sortConfig }) {
  const isActive = sortConfig.key === columnKey;
  if (!isActive) return <ArrowUpDown className="h-3 w-3 text-gray-300 ml-1.5 opacity-0 group-hover/th:opacity-100 transition-opacity" />;
  return sortConfig.direction === 'asc' 
    ? <ChevronUp className="h-3.5 w-3.5 text-[#d97757] ml-1" strokeWidth={2.5} />
    : <ChevronDown className="h-3.5 w-3.5 text-[#d97757] ml-1" strokeWidth={2.5} />;
}

// ─── Pill class helper ───────────────────────────────────────────
function getStatusPillClass(expInfo, hasDate) {
  if (!hasDate) return "bg-gray-100 text-gray-500 font-medium px-2.5 py-0.5 rounded-full text-xs border border-gray-200";
  if (expInfo.isExpired) return "bg-red-50 text-red-700 font-medium px-2.5 py-0.5 rounded-full text-xs border border-red-100";
  if (expInfo.isExpiring) return "bg-amber-50 text-amber-700 font-medium px-2.5 py-0.5 rounded-full text-xs border border-amber-100";
  return "bg-emerald-50 text-emerald-700 font-medium px-2.5 py-0.5 rounded-full text-xs border border-emerald-100";
}

// ─── Custom Select Component (Matches Add Page Styling) ───────────
function CustomSelect({ value, options, onChange, placeholder, minWidth = "10rem" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" style={{ minWidth }}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 h-11 bg-white border border-gray-200 rounded-[12px] hover:bg-gray-50 transition-colors shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 focus:border-[#d97757]"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={(e) => {
          if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
            e.preventDefault();
            setIsOpen(true);
            return;
          }
          if (!isOpen) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (options[highlightedIndex]) {
              onChange(options[highlightedIndex].value);
              setIsOpen(false);
            }
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <div className="flex items-center gap-2 text-[15px] font-medium text-gray-700">
          {selectedOption?.icon && <selectedOption.icon className="h-4 w-4 text-gray-500" />}
          {selectedOption ? selectedOption.label : placeholder}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-h-56 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1">
          {options.map((opt, idx) => (
            <button
              key={opt.value}
              type="button"
              className={`w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors flex items-center gap-3 ${
                idx === highlightedIndex || opt.value === value 
                  ? 'bg-[#d97757]/5 text-[#d97757]' 
                  : 'text-gray-700 hover:bg-[#d97757]/5 hover:text-[#d97757]'
              }`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
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

// ─── Pagination config ───────────────────────────────────────────
const ROWS_PER_PAGE = 15;

export function DesktopTableView({ 
  batchedInventory, 
  handleModify, 
  searchQuery, 
  setSearchQuery,
  activeFilter,
  setActiveFilter
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Sorting handler ──────────────────────────────────────────
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  }, []);

  // ─── Combined Filter + Sort pipeline ──────────────────────────
  const filteredAndSorted = useMemo(() => {
    let result = batchedInventory;

    // Category filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(item => item.category === categoryFilter);
    }

    // Status filter
    if (activeFilter === 'EXPIRING') {
      result = result.filter(item => getExpirationStatus(item.expirationDate).isExpiring);
    } else if (activeFilter === 'EXPIRED') {
      result = result.filter(item => getExpirationStatus(item.expirationDate).isExpired);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'category':
          aVal = getCategoryName(a.category).toLowerCase();
          bVal = getCategoryName(b.category).toLowerCase();
          break;
        case 'totalQuantity':
          aVal = a.totalQuantity || 0;
          bVal = b.totalQuantity || 0;
          break;
        case 'expirationDate':
          aVal = a.expirationDate ? new Date(a.expirationDate).getTime() : 9999999999999;
          bVal = b.expirationDate ? new Date(b.expirationDate).getTime() : 9999999999999;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [batchedInventory, categoryFilter, activeFilter, sortConfig]);

  // ─── Pagination ───────────────────────────────────────────────
  const totalItems = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalItems);
  const displayData = filteredAndSorted.slice(startIndex, endIndex);

  // Reset page when filters change
  useMemo(() => { setCurrentPage(1); }, [categoryFilter, activeFilter]);

  const handleExport = () => {
    // CSV Headers
    const headers = ['Item Name', 'Barcode', 'Category', 'Total Quantity', 'Unit', 'Next Expiration', 'Batches Count'];
    
    // Map the actively filtered and sorted data to CSV rows
    const rows = filteredAndSorted.map(item => {
      const expStr = item.expirationDate ? formatDate(item.expirationDate) : 'No date';
      return [
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"${item.barcode || ''}"`,
        `"${getCategoryName(item.category)}"`,
        item.totalQuantity || 0,
        `"${item.unit || 'units'}"`,
        `"${expStr}"`,
        item.batches?.length || 0
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `food_arca_inventory_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status filter options for dropdown
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses', icon: Activity },
    { value: 'EXPIRING', label: 'Expiring Soon', icon: Calendar },
    { value: 'EXPIRED', label: 'Expired', icon: Calendar }
  ];

  // Shared sortable header class
  const thBase = "py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider select-none group/th cursor-pointer hover:text-gray-700 transition-colors";

  return (
    <div className="hidden md:block w-full font-sans animate-in fade-in duration-300">
      
      {/* ══════════════════════════════════════════════
          UNIFIED CARD CONTAINER
          ══════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-[16px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* ── ACTION BAR ────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          
          {/* LEFT: Wide Search Bar */}
          <div className="relative flex-1 max-w-md mr-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" strokeWidth={2} />
            <input 
              placeholder="Search inventory..." 
              className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#d97757]/30 focus:border-[#d97757] shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04)] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* RIGHT: Category + Status + Export */}
          <div className="flex items-center gap-4">
            
            {/* Category Dropdown */}
            <CustomSelect 
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="All Categories"
              minWidth="11rem"
              options={[
                { value: 'ALL', label: 'All Categories', icon: LayoutGrid },
                ...categories.map(c => ({ value: c.value, label: c.name, icon: c.icon }))
              ]}
            />

            {/* Status Dropdown */}
            <CustomSelect 
              value={activeFilter}
              onChange={setActiveFilter}
              placeholder="All Statuses"
              minWidth="11rem"
              options={statusOptions}
            />

            {/* Separator */}
            <div className="w-px h-7 bg-gray-200" />

            {/* Export Button */}
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="h-11 px-5 rounded-[12px] border-gray-200 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04)] text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center gap-2"
            >
              <Download className="h-4 w-4" strokeWidth={2} /> Export
            </Button>
          </div>
        </div>

        {/* ── DATA TABLE ────────────────────────────── */}
        <div className="relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              
              {/* SORTABLE HEADER */}
              <thead className="bg-gray-50/80 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className={`${thBase} pl-6 pr-4 w-2/5`} onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      <span className="w-5 shrink-0"></span>
                      Item Name
                      <SortIcon columnKey="name" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th className={thBase} onClick={() => handleSort('category')}>
                    <div className="flex items-center">
                      Category
                      <SortIcon columnKey="category" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th className={`${thBase} text-center`}>Batches</th>
                  <th className={`${thBase} text-right`} onClick={() => handleSort('totalQuantity')}>
                    <div className="flex items-center justify-end">
                      Quantity
                      <SortIcon columnKey="totalQuantity" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th className={thBase} onClick={() => handleSort('expirationDate')}>
                    <div className="flex items-center">
                      Next Expiration
                      <SortIcon columnKey="expirationDate" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th className={`${thBase} pr-6 text-right cursor-default hover:text-gray-500`}>Action</th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody>
                {displayData.map((group) => {
                  const isExpanded = expandedRows.has(group._id);
                  const expInfo = getExpirationStatus(group.expirationDate);
                  const catStyle = getCategoryStyle(group.category);
                  const hasBatches = group.batches && group.batches.length > 1;
                  const pillClass = getStatusPillClass(expInfo, !!group.expirationDate);

                  return (
                    <React.Fragment key={group._id}>
                      {/* MAIN ROW */}
                      <tr 
                        onClick={() => hasBatches ? toggleRow(group._id) : handleModify(group.batches[0])}
                        className={`group border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50/50' : 'bg-white'}`}
                      >
                        {/* Name with Chevron — w-2/5 for generous width */}
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-start">
                            <div className="w-5 shrink-0 mt-0.5">
                              {hasBatches ? (
                                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                              ) : null}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900">{group.name}</span>
                              {group.barcode && (
                                <span className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                                  <ScanBarcode className="h-3 w-3" /> {group.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${catStyle.badge}`} />
                            <span className="text-sm font-medium text-gray-600">{getCategoryName(group.category)}</span>
                          </div>
                        </td>

                        {/* Batches Count — centered */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold tabular-nums">
                            {group.batches.length}
                          </span>
                        </td>

                        {/* Total Quantity — right-aligned for easy scanning */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap tabular-nums">
                          <span className={`text-sm font-semibold ${group.totalQuantity < 5 ? 'text-red-500' : 'text-gray-900'}`}>
                            {group.totalQuantity}
                          </span>
                          <span className="text-xs font-medium text-gray-400 ml-1 uppercase">
                            {group.unit || 'units'}
                          </span>
                        </td>

                        {/* Next Expiration */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-6">
                            {group.expirationDate ? (
                              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5 min-w-[100px]">
                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                {formatDate(group.expirationDate)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 font-medium italic min-w-[100px]">No date</span>
                            )}
                            <span className={pillClass}>
                              {expInfo.label}
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 pr-6 pl-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-[#d97757] hover:bg-[#d97757]/10 rounded-[8px]"
                            onClick={(e) => { e.stopPropagation(); handleModify(group.batches[0]); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>

                      {/* EXPANDABLE BATCH SUB-TABLE */}
                      <AnimatePresence>
                        {hasBatches && isExpanded && (
                          <tr>
                            <td colSpan={6} className="p-0 border-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden bg-gray-50/80 border-b border-gray-100"
                              >
                                <div className="py-3 px-8 pl-14">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr>
                                        <th className="py-2 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-16">Batch</th>
                                        <th className="py-2 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Expiration</th>
                                        <th className="py-2 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Quantity</th>
                                        <th className="py-2 px-4 w-12"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.batches.map((batch, index) => {
                                        const bExp = getExpirationStatus(batch.expirationDate);
                                        const bPill = getStatusPillClass(bExp, !!batch.expirationDate);

                                        return (
                                          <tr key={batch._id} className="hover:bg-gray-100/50 transition-colors border-t border-gray-200/40">
                                            <td className="py-2.5 px-4 font-mono text-xs font-semibold text-gray-400 tabular-nums">
                                              #{index + 1}
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">
                                              <div className="flex items-center gap-6">
                                                {batch.expirationDate ? (
                                                  <span className="text-sm font-medium text-gray-700 min-w-[90px]">
                                                    {formatDate(batch.expirationDate)}
                                                  </span>
                                                ) : (
                                                  <span className="text-sm text-gray-400 italic min-w-[90px]">No date</span>
                                                )}
                                                <span className={bPill}>
                                                  {bExp.label}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="py-2.5 px-4 text-right whitespace-nowrap tabular-nums">
                                              <span className="text-sm font-semibold text-gray-800">{batch.quantity}</span>
                                              <span className="text-xs font-medium text-gray-400 ml-1 uppercase">{batch.unit || 'units'}</span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right">
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-gray-400 hover:text-[#d97757] hover:bg-[#d97757]/10 rounded-[6px]"
                                                onClick={(e) => { e.stopPropagation(); handleModify(batch); }}
                                              >
                                                <Pencil className="h-3.5 w-3.5" />
                                              </Button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            
            {/* EMPTY STATE */}
            {filteredAndSorted.length === 0 && (
              <div className="w-full py-20 text-center flex flex-col items-center justify-center text-gray-400 bg-white">
                <ScanBarcode className="h-10 w-10 mb-3 text-gray-300" strokeWidth={1.5} />
                <p className="text-sm font-medium">No items match your criteria</p>
                {(categoryFilter !== 'ALL' || activeFilter !== 'ALL') && (
                  <button 
                    onClick={() => { setCategoryFilter('ALL'); setActiveFilter('ALL'); }}
                    className="mt-2 text-sm font-medium text-[#d97757] hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── PAGINATION FOOTER ─────────────────────── */}
        {filteredAndSorted.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 bg-white">
            <span className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{startIndex + 1}</span> to <span className="font-medium text-gray-700">{endIndex}</span> of <span className="font-medium text-gray-700">{totalItems}</span> results
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
