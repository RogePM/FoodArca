'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, ScanBarcode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { MobileAddFlow } from '@/components/pages/add-items/mobile-add-flow';
import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';
import { usePantry } from '@/components/providers/PantryProvider';
import { getExpirationStatus } from './inventory-utils';

import { InventoryStats } from './inventory-stats';
import { DesktopTableView } from './desktop-table-view';
import { MobileListView } from './mobile-list-view';
import { InventorySkeleton } from './inventory-skeleton';
import { EditItemModal } from '@/components/modals/edit-item-modal';

export function InventoryView() {
  const { pantryId } = usePantry();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, LOW, EXPIRING, EXPIRED
  const [sortConfig, setSortConfig] = useState({ key: 'expirationDate', order: 'asc' });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  const fetchInventory = async (isBackground = false) => {
    if (!pantryId) return;
    if (!isBackground) setIsLoading(true);
    else setIsRefetching(true);

    try {
      const params = new URLSearchParams({ sort: sortConfig.key, order: sortConfig.order });
      const response = await fetch(`/api/foods?${params}`, { headers: { 'x-pantry-id': pantryId } });
      
      if (response.ok) {
        const data = await response.json();
        setInventory(data.data);
      }
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); setIsRefetching(false); }
  };

  useEffect(() => {
    if (pantryId) {
      fetchInventory(false);
      const interval = setInterval(() => fetchInventory(true), 10000);
      return () => clearInterval(interval);
    }
  }, [pantryId, sortConfig]);

  // --- FILTERING & STATS LOGIC ---
  const stats = useMemo(() => {
    const lowCount = inventory.filter(i => parseFloat(i.quantity) < 5).length;
    const expiringCount = inventory.filter(i => getExpirationStatus(i.expirationDate).isExpiring).length;
    const expiredCount = inventory.filter(i => getExpirationStatus(i.expirationDate).isExpired).length;
    return { total: inventory.length, low: lowCount, expiring: expiringCount, expired: expiredCount };
  }, [inventory]);

  const processedInventory = useMemo(() => {
    let result = inventory;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(q) || 
        (i.barcode && i.barcode.includes(q)) ||
        i.category.toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'LOW') {
      result = result.filter(i => parseFloat(i.quantity) < 5);
    } else if (activeFilter === 'EXPIRING') {
      result = result.filter(i => getExpirationStatus(i.expirationDate).isExpiring);
    } else if (activeFilter === 'EXPIRED') {
      result = result.filter(i => getExpirationStatus(i.expirationDate).isExpired);
    }

    // Sort Desktop view by explicit config
    result = [...result].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'expirationDate') {
        aVal = aVal ? new Date(aVal).getTime() : 9999999999999;
        bVal = bVal ? new Date(bVal).getTime() : 9999999999999;
      }
      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [inventory, searchQuery, activeFilter, sortConfig]);

  // Batch grouping: merge items with same name+category, sum quantities, FEFO sort batches
  const batchedInventory = useMemo(() => {
    const map = new Map();
    processedInventory.forEach(item => {
      const key = `${(item.name || '').toLowerCase().trim()}__${(item.category || 'other').toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          ...item,
          batches: [item],
          totalQuantity: parseFloat(item.quantity) || 0,
        });
      } else {
        const existing = map.get(key);
        existing.batches.push(item);
        existing.totalQuantity += parseFloat(item.quantity) || 0;
      }
    });

    // For each group, sort batches FEFO (earliest expiration first)
    return Array.from(map.values()).map(group => {
      group.batches.sort((a, b) => {
        const aDate = a.expirationDate ? new Date(a.expirationDate).getTime() : 9999999999999;
        const bDate = b.expirationDate ? new Date(b.expirationDate).getTime() : 9999999999999;
        return aDate - bDate;
      });
      // The "primary" display uses the most urgent batch
      const urgentBatch = group.batches[0];
      group.expirationDate = urgentBatch.expirationDate;
      group.quantity = group.totalQuantity;
      return group;
    });
  }, [processedInventory]);

  // Grouping for Mobile List — now uses batched items
  const groupedInventory = useMemo(() => {
    return batchedInventory.reduce((acc, item) => {
      const cat = item.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [batchedInventory]);

  const toggleExpanded = (key) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCategoryCollapse = (category) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const handleModify = (item) => {
    setSelectedItem(item);
    // TODO: Implement modify logic with the new flow
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden bg-[#fafafa] font-sans">
      
      {/* --- TOP BAR (SEARCH & STATS) --- */}
      <div className="bg-[#fafafa] z-20 pt-2 pb-3 md:pb-0 md:pt-0">
        
        {/* Search Row (Hidden on Desktop) */}
        <div className="px-4 py-2 flex gap-2 items-center md:hidden w-full max-w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" strokeWidth={2.5} />
            <Input 
              placeholder="Search items..." 
              className="pl-10 h-12 w-full bg-white border-transparent shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-[18px] focus:ring-2 focus:ring-[#d97757]/30 font-medium text-[16px] placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-[18px] border-transparent bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] shrink-0 active:scale-95 transition-transform" onClick={() => setShowScanner(true)}>
            <ScanBarcode className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        {/* Quick Stats Filter Cards (Hidden on Desktop, replaced by Action Bar) */}
        <div className="md:hidden w-full max-w-full overflow-hidden">
          <InventoryStats 
            stats={stats} 
            activeFilter={activeFilter} 
            setActiveFilter={setActiveFilter} 
          />
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="px-4 md:px-5 pb-[120px] md:pb-8 pt-3 md:pt-4 max-w-full overflow-hidden">
            
        {isLoading && <InventorySkeleton />}

        {!isLoading && processedInventory.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[28px] border border-gray-100 text-gray-400 font-medium text-[14px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] mt-2">
            No items found
          </div>
        )}

        {!isLoading && processedInventory.length > 0 && (
          <>
            <div className="hidden md:block w-full">
              <DesktopTableView 
                batchedInventory={batchedInventory} 
                handleModify={handleModify} 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
              />
            </div>
            
            <MobileListView 
              groupedInventory={groupedInventory}
              collapsedCategories={collapsedCategories}
              toggleCategoryCollapse={toggleCategoryCollapse}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              handleModify={handleModify}
            />
          </>
        )}
      </div>

      {/* --- OVERLAYS --- */}
      <EditItemModal
        isOpen={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSuccess={() => {
          setSelectedItem(null);
          fetchInventory(true); // Refetch in background
        }}
      />

      {showScanner && (
        <BarcodeScannerOverlay onScan={(code) => { setSearchQuery(code); setShowScanner(false); }} onClose={() => setShowScanner(false)} />
      )}

      {isAddMode && (
        <div className="fixed inset-0 z-[100] bg-white">
          <MobileAddFlow 
            initialView="FORM_VIEW"
            onClose={() => { 
              setIsAddMode(false); 
              fetchInventory(true); // Refetch to show newly added items
            }} 
          />
        </div>
      )}
    </div>
  );
}
