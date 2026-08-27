'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Package,
  Loader2,
  Calendar,
  RefreshCw,
  ScanBarcode,
  Layers,
  X,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

import { EditItemModal } from '@/components/modals/edit-item-modal';
import { MobileManualEntryView } from '@/components/pages/add-items/mobile-manual-entry-view';
import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';
import { usePantry } from '@/components/providers/PantryProvider';
import { categories } from '@/lib/constants';
import {
  groupInventoryBatches,
  getExpirationStatus,
  getCategoryName,
  getCategoryVisual,
  formatDate,
  getUrgentStatusStyles,
} from './inventory-utils';
import { MobileGridView } from './mobile-grid-view';
import { InventoryBatchSelectionSheet } from './batch-selection-sheet';

function matchesCategoryFilter(productCategory, selectedCategoryValue) {
  if (!selectedCategoryValue || selectedCategoryValue === 'ALL' || selectedCategoryValue === 'all') return true;
  const prodCat = String(productCategory || 'other').toLowerCase();
  const selected = String(selectedCategoryValue).toLowerCase();
  const catObj = categories.find((c) => c.value === selected);
  const catName = catObj?.name.toLowerCase();
  return (
    prodCat === selected ||
    (catName && prodCat === catName) ||
    prodCat.replace(/[\s&_-]/g, '') === selected.replace(/[\s&_-]/g, '')
  );
}

export function InventoryView() {
  const router = useRouter();
  const { pantryId, lastInventoryUpdate } = usePantry();

  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, EXPIRING, EXPIRED, LOW, NO_DATE, or category value
  const [sortConfig, setSortConfig] = useState({
    key: 'expirationDate',
    order: 'asc',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [batchSheetItem, setBatchSheetItem] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
    handleResize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const fetchInventory = async (isBackground = false) => {
    if (!pantryId) return;
    if (!isBackground) setIsLoading(true);
    else setIsRefetching(true);

    try {
      const params = new URLSearchParams({
        sort: sortConfig.key,
        order: sortConfig.order,
      });
      const response = await fetch(`/api/foods?${params}`, {
        headers: { 'x-pantry-id': pantryId },
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    if (pantryId) {
      fetchInventory(false);
    }
  }, [pantryId, sortConfig]);

  // Listen for real-time Postgres changes pushed from PantryProvider
  useEffect(() => {
    if (pantryId && lastInventoryUpdate) {
      fetchInventory(true);
    }
  }, [lastInventoryUpdate]);

  // Group raw inventory into logical catalog items first
  const allBatchedInventory = useMemo(() => {
    return groupInventoryBatches(inventory || []);
  }, [inventory]);

  // Filter Pills list with dynamic counts based on batched items
  const filterPillList = useMemo(() => {
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let lowStockCount = 0;
    let noDateCount = 0;

    allBatchedInventory.forEach((item) => {
      const statusStyles = getUrgentStatusStyles(item);
      if (statusStyles.isExpired) expiredCount++;
      if (statusStyles.isExpiring) expiringSoonCount++;
      if (statusStyles.isLowStock) lowStockCount++;
      if (!item.expirationDate) noDateCount++;
    });

    const list = [
      { id: 'ALL', name: 'All', count: allBatchedInventory.length },
      { id: 'EXPIRING', name: 'Expiring Soon', count: expiringSoonCount },
      { id: 'EXPIRED', name: 'Expired', count: expiredCount },
      { id: 'LOW', name: 'Low Stock', count: lowStockCount },
      { id: 'NO_DATE', name: 'No Date', count: noDateCount },
    ];

    categories.forEach((cat) => {
      const count = allBatchedInventory.filter((item) =>
        matchesCategoryFilter(item.category, cat.value)
      ).length;

      if (count > 0) {
        list.push({
          id: cat.value,
          name: cat.name,
          count,
        });
      }
    });

    return list;
  }, [allBatchedInventory]);

  // Filter and sort items based on search query, filter pill, and sort config
  const batchedInventory = useMemo(() => {
    let result = allBatchedInventory;

    // Search query match across item name, barcode, and category
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.barcode && String(i.barcode).includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q)) ||
          (i.batches &&
            i.batches.some(
              (b) => b.barcode && String(b.barcode).toLowerCase().includes(q)
            ))
      );
    }

    // Quick filter match
    const normFilter = String(activeFilter || 'ALL').toUpperCase();
    if (normFilter === 'LOW' || normFilter === 'LOW_STOCK') {
      result = result.filter((i) => getUrgentStatusStyles(i).isLowStock);
    } else if (normFilter === 'EXPIRING' || normFilter === 'EXPIRING_SOON') {
      result = result.filter((i) => getUrgentStatusStyles(i).isExpiring);
    } else if (normFilter === 'EXPIRED') {
      result = result.filter((i) => getUrgentStatusStyles(i).isExpired);
    } else if (normFilter === 'NO_DATE' || normFilter === 'NODATE') {
      result = result.filter((i) => !i.expirationDate);
    } else if (normFilter !== 'ALL') {
      result = result.filter((i) => matchesCategoryFilter(i.category, activeFilter));
    }

    // Sort Desktop view by explicit config
    result = [...result].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'expirationDate') {
        aVal = aVal ? new Date(aVal).getTime() : 9999999999999;
        bVal = bVal ? new Date(bVal).getTime() : 9999999999999;
      } else if (sortConfig.key === 'quantity' || sortConfig.key === 'totalQuantity') {
        aVal = a.totalQuantity !== undefined ? a.totalQuantity : a.quantity || 0;
        bVal = b.totalQuantity !== undefined ? b.totalQuantity : b.quantity || 0;
      } else if (sortConfig.key === 'name') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
        return sortConfig.order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [allBatchedInventory, searchQuery, activeFilter, sortConfig]);

  // Backward compatibility processedInventory
  const processedInventory = batchedInventory;

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleModify = (item) => {
    setSelectedItem(item);
    setIsSheetOpen(true);
  };

  const handleSelectItem = (item) => {
    if (item?.batches && item.batches.length > 1) {
      setBatchSheetItem(item);
    } else {
      const singleBatch = (item?.batches && item.batches[0]) || item;
      handleModify(singleBatch);
    }
  };

  const handleSelectBatch = (batch) => {
    setBatchSheetItem(null);
    handleModify(batch);
  };

  const handleMobileSave = async (payload) => {
    try {
      if (selectedItem?.id) {
        await fetch(`/api/foods/${selectedItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-pantry-id': pantryId
          },
          body: JSON.stringify({ ...payload, pantryId })
        });
      }
      setIsSheetOpen(false);
      setSelectedItem(null);
      fetchInventory(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMobileDelete = async (item) => {
    if (!item?.id) return;
    try {
      await fetch(`/api/foods/${item.id}`, {
        method: 'DELETE',
        headers: { 'x-pantry-id': pantryId }
      });
      setIsSheetOpen(false);
      setSelectedItem(null);
      fetchInventory(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden bg-white md:bg-[#fafafa] font-sans text-sm md:text-base">
      {/* --- HEADER --- */}
      <div className="z-10 sticky top-0 shrink-0">
        {/* UNIFIED BRAND HEADER (Mobile) / White header (Desktop) */}
        <div className="bg-[#d97757] md:bg-white px-4 md:px-6 pt-3 pb-0 md:py-4">

          {/* DESKTOP HEADER (Hidden on Mobile) */}
          <div className="hidden md:flex md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100/50">
                {isRefetching ? (
                  <RefreshCw className="h-5 w-5 text-[#d97757] animate-spin" />
                ) : (
                  <Package
                    className="h-5 w-5 md:h-6 md:w-6 text-[#d97757]"
                    strokeWidth={2}
                  />
                )}
              </div>
              <div>
                <h2 className="text-[22px] md:text-[24px] font-bold text-[#1a1f36] tracking-tight leading-none">
                  Inventory
                </h2>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1">
                  {batchedInventory.length} Items Stocked
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Button
                className="h-10 bg-[#d97757] hover:bg-[#c06245] text-white rounded-xl font-medium shadow-sm transition-all active:scale-95 flex-1 md:flex-none"
                onClick={() => router.push('/dashboard/add')}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>
          </div>

          {/* MOBILE FAKE SEARCH BAR */}
          <div 
            className="md:hidden relative cursor-text"
            onClick={() => setIsSearchOverlayOpen(true)}
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" strokeWidth={2.5} />
            <div className="flex items-center pl-11 pr-[52px] h-12 bg-white shadow-[0_4px_20px_-6px_rgba(0,0,0,0.15)] rounded-2xl text-[15px] font-medium overflow-hidden">
              <span className={searchQuery ? 'text-gray-900 truncate' : 'text-gray-400'}>
                {searchQuery || "Search by name or barcode..."}
              </span>
            </div>
            {searchQuery ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowScanner(true); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-[#d97757]/10 flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Scan barcode"
              >
                <ScanBarcode className="h-[18px] w-[18px] text-[#d97757]" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* DESKTOP REAL SEARCH BAR */}
          <div className="hidden md:block relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" strokeWidth={2.5} />
            <Input
              placeholder="Search by name or barcode..."
              className="pl-11 pr-[52px] h-11 bg-white border-transparent shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl focus:ring-2 focus:ring-[#d97757]/30 transition-all font-medium text-[15px] placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Scan barcode"
              >
                <ScanBarcode className="h-[18px] w-[18px] text-gray-500" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Filter Pills (inside brand block) */}
          <div className="pt-3 pb-3 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto scroll-smooth touch-pan-x overscroll-x-contain pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {filterPillList.map((pill) => {
                const isActive = activeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setActiveFilter(pill.id)}
                    className={`px-3.5 py-[7px] rounded-full text-[13px] tracking-tight whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'bg-white text-[#d97757] md:bg-[#d97757] md:text-white font-bold shadow-sm'
                        : 'bg-transparent border border-white/50 text-white md:bg-transparent md:border-gray-200 md:text-[#4f566b] hover:bg-white/10 md:hover:bg-gray-50 font-semibold'
                    }`}
                  >
                    {pill.name}
                    <span
                      className={`ml-1.5 text-[11px] font-bold ${
                        isActive ? 'text-[#d97757]/70 md:text-white/80' : 'text-white/60 md:text-gray-400'
                      }`}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="px-4 md:px-5 pb-[120px] md:pb-8 pt-3 md:pt-4 max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#d97757]" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Syncing Stock
                </p>
              </div>
            )}

            {!isLoading && batchedInventory.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[28px] border-2 border-dashed border-gray-300 text-gray-500 font-bold uppercase text-[10px]">
                No Items Found
              </div>
            )}

            {!isLoading && batchedInventory.length > 0 && (
              <>
                {/* 💻 DESKTOP TABLE (md+ screens) */}
                <div className="hidden md:block rounded-[24px] border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 border-b">
                        <TableHead className="font-black text-[10px] uppercase text-gray-600 pl-6 py-4 w-[35%]">
                          Item Name
                        </TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-gray-600 w-[20%]">
                          Category
                        </TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-gray-600 w-[20%]">
                          Expiration
                        </TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-gray-600 text-center w-[15%]">
                          Stock
                        </TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase text-gray-600 pr-6 w-[10%]">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchedInventory.map((item) => {
                        const statusStyles = getUrgentStatusStyles(item);
                        const displayDate = item.expirationDate;

                        return (
                          <TableRow
                            key={item.id || item.catalogItemId || item._id}
                            className="border-b last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                            onClick={() => handleSelectItem(item)}
                          >
                            <TableCell className="pl-6 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 text-sm">
                                    {item.name}
                                  </span>
                                  {item.batches && item.batches.length > 1 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-50 text-[#d97757] text-[10px] font-semibold border border-orange-100">
                                      <Layers className="w-2.5 h-2.5" />
                                      {item.batches.length} batches
                                    </span>
                                  )}
                                </div>
                                {item.barcode && (
                                  <span className="text-[10px] font-mono text-gray-400 mt-0.5 flex items-center gap-1">
                                    <ScanBarcode className="h-3 w-3" />{' '}
                                    {item.barcode}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-[10px] font-bold uppercase text-gray-600">
                                {getCategoryName(item.category)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-start">
                                {displayDate ? (
                                  <>
                                    <span
                                      className={`text-xs font-bold flex items-center gap-1.5 ${statusStyles.expColorClass}`}
                                    >
                                      <Calendar className="h-3 w-3 text-gray-400" />
                                      {formatDate(displayDate)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">
                                    No Date
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`text-sm tabular-nums ${statusStyles.stockColorClass}`}
                              >
                                {item.totalQuantity}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                                {item.unit || 'units'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Pencil className="h-4 w-4 text-gray-400 group-hover:text-[#d97757] ml-auto transition-colors" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* 📱 MOBILE 2-COLUMN VISUAL GRID (<md screens) */}
                <div className="block md:hidden">
                  <MobileGridView
                    inventory={batchedInventory}
                    onSelectItem={handleSelectItem}
                    handleSelectProduct={handleSelectItem}
                  />
                </div>
              </>
            )}
          </div>
        </div>

      {/* --- OVERLAYS --- */}
      {/* Batch Selection Bottom Sheet for Multi-Batch Items */}
      <InventoryBatchSelectionSheet
        isOpen={!!batchSheetItem}
        item={batchSheetItem}
        onClose={() => setBatchSheetItem(null)}
        onSelectBatch={handleSelectBatch}
      />

      {/* Edit Item Flows (Mobile vs Desktop) */}
      {isSheetOpen && !isDesktop ? (
        <MobileManualEntryView
          initialItem={selectedItem}
          pantryId={pantryId}
          onBack={() => {
            setIsSheetOpen(false);
            setSelectedItem(null);
          }}
          onSave={handleMobileSave}
          onDelete={handleMobileDelete}
        />
      ) : (
        <EditItemModal
          isOpen={isSheetOpen && isDesktop}
          onClose={() => {
            setIsSheetOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onSuccess={() => {
            setIsSheetOpen(false);
            setSelectedItem(null);
            fetchInventory(true);
          }}
          onItemUpdated={() => {
            setIsSheetOpen(false);
            setSelectedItem(null);
            fetchInventory(true);
          }}
        />
      )}



      {/* Fullscreen Barcode Scanner HUD */}
      {showScanner && (
        <BarcodeScannerOverlay
          onScan={(code) => {
            setSearchQuery(code);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* FULL SCREEN SEARCH OVERLAY (Mobile) */}
      {isSearchOverlayOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden animate-in fade-in duration-200">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100">
            <button 
              onClick={() => setIsSearchOverlayOpen(false)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
              <input
                autoFocus
                placeholder="Search inventory..."
                className="w-full pl-9 pr-9 h-10 bg-gray-100 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 font-medium text-[15px] placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-[14px] h-[14px]" strokeWidth={3} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-[#fafafa]">
             {searchQuery ? (
               batchedInventory.length > 0 ? (
                 <div className="space-y-2">
                   {batchedInventory.map(item => (
                     <div 
                       key={item.id} 
                       onClick={() => {
                         setSearchQuery(item.name);
                         setIsSearchOverlayOpen(false);
                       }}
                       className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm active:scale-[0.98] transition-transform"
                     >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryVisual(item.category).style.bg}`}>
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <img src={getCategoryVisual(item.category).imagePath} alt="" className="w-7 h-7 opacity-75" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.totalQuantity} in stock</p>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-12">
                   <p className="text-gray-500 font-medium">No results found for "{searchQuery}"</p>
                 </div>
               )
             ) : (
               <div className="text-center py-10">
                 <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                 <p className="text-gray-500 font-medium">Type to search your inventory</p>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
