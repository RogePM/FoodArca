'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, ScanBarcode, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';
import { usePantry } from '@/components/providers/PantryProvider';
import { getCategoryVisual } from '@/components/pages/inventory/inventory-utils';

export function MobileInventorySearch({ 
  initialQuery = '', 
  onQueryChange, 
  inventoryData = null, 
  autoFocus = false,
  onItemSelect,
  forceOpen = false,
  onClose,
  onOpenScanner
}) {
  const router = useRouter();
  const { pantryId } = usePantry();
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(forceOpen);
  const [showScanner, setShowScanner] = useState(false);
  const [localInventory, setLocalInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync external query changes
  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  // If inventoryData is not provided, fetch it when the overlay opens
  useEffect(() => {
    if (isSearchOverlayOpen && !inventoryData && localInventory.length === 0 && pantryId) {
      const fetchInventory = async () => {
        setIsLoading(true);
        try {
          const res = await fetch('/api/foods', {
            headers: { 'x-pantry-id': pantryId }
          });
          if (res.ok) {
            const data = await res.json();
            // simple grouping for display
            setLocalInventory(data.data || []);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInventory();
    }
  }, [isSearchOverlayOpen, inventoryData, pantryId, localInventory.length]);

  const activeInventory = inventoryData || localInventory;

  // Filter inventory
  const filteredInventory = React.useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase().trim();
    return activeInventory.filter((i) =>
      (i.name && i.name.toLowerCase().includes(q)) ||
      (i.barcode && String(i.barcode).includes(q)) ||
      (i.category && i.category.toLowerCase().includes(q))
    );
  }, [activeInventory, searchQuery]);

  const handleQueryChange = (val) => {
    setSearchQuery(val);
    if (onQueryChange) onQueryChange(val);
  };

  const handleSelect = (item) => {
    if (onItemSelect) {
        onItemSelect(item);
    } else {
        handleQueryChange(item.name);
    }
    setIsSearchOverlayOpen(false);
  };

  return (
    <>
      {/* FAKE SEARCH BAR */}
      <div 
        className="md:hidden relative cursor-text"
        onClick={() => setIsSearchOverlayOpen(true)}
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" strokeWidth={2.5} />
        <div className="flex items-center pl-11 pr-[52px] h-12 bg-white shadow-[0_4px_20px_-6px_rgba(0,0,0,0.15)] rounded-2xl text-base font-medium overflow-hidden">
          <span className={searchQuery ? 'text-gray-900 truncate' : 'text-gray-400'}>
            {searchQuery || "Search by name or barcode..."}
          </span>
        </div>
        {searchQuery ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleQueryChange(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (onOpenScanner) onOpenScanner();
              else setShowScanner(true); 
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-[#e27f2c]/10 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Scan barcode"
          >
            <ScanBarcode className="h-[18px] w-[18px] text-[#e27f2c]" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* FULL SCREEN SEARCH OVERLAY (Mobile) */}
      {isSearchOverlayOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden animate-in fade-in duration-200">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100">
            <button 
              onClick={() => {
                if (forceOpen && onClose) onClose();
                else setIsSearchOverlayOpen(false);
              }}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
              <input
                autoFocus
                placeholder="Search inventory..."
                className="w-full pl-9 pr-12 h-10 bg-gray-100 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e27f2c]/30 font-medium text-base placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
              />
              {searchQuery ? (
                <button
                  onClick={() => handleQueryChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-[14px] h-[14px]" strokeWidth={3} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenScanner) onOpenScanner();
                    else setShowScanner(true);
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-[#e27f2c]/10 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ScanBarcode className="h-4 w-4 text-[#e27f2c]" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 bg-white">
             {isLoading ? (
                <div className="text-center py-10 text-gray-400 font-medium text-[14px]">
                    Loading inventory...
                </div>
             ) : searchQuery ? (
               filteredInventory.length > 0 ? (
                 <div className="flex flex-col">
                   {filteredInventory.map(item => (
                     <div 
                       key={item.id} 
                       onClick={() => handleSelect(item)}
                       className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 active:scale-[0.98] transition-transform cursor-pointer px-2"
                     >
                        <div className={`w-[50px] h-[50px] shrink-0 rounded-md flex items-center justify-center border border-gray-100 ${getCategoryVisual(item.category).style.bg}`}>
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt="" className="w-full h-full object-cover rounded-md" />
                          ) : (
                            <img src={getCategoryVisual(item.category).imagePath} alt="" className="w-7 h-7 opacity-75 mix-blend-multiply" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[15px] text-[#1a1f36] truncate">{item.name}</h4>
                          <p className="text-[13px] font-normal text-gray-500">
                            {getCategoryVisual(item.category).name} <span className="text-gray-300 mx-0.5">|</span> Stock: {(item.totalQuantity !== undefined ? item.totalQuantity : item.quantity) || 0}
                          </p>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-12">
                   <p className="text-gray-500 font-normal text-[14px]">No results found for "{searchQuery}"</p>
                 </div>
               )
             ) : (
               <div className="text-center py-10">
                 <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
                 <p className="text-gray-400 font-normal text-[14px]">Type to search your inventory</p>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Fullscreen Barcode Scanner HUD */}
      {showScanner && (
        <BarcodeScannerOverlay
          onScan={(code) => {
            handleQueryChange(code);
            setShowScanner(false);
            setIsSearchOverlayOpen(true);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
