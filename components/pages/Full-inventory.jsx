'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Pencil, Package, Camera, Loader2, Layers,
  Calendar, ArrowUpDown, RefreshCw, ArrowRight, ScanBarcode,
  AlertTriangle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { InventoryFormBar } from '@/components/pages/InventoryForm';
import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';
import { usePantry } from '@/components/providers/PantryProvider';
import { categories as CATEGORY_OPTIONS } from '@/lib/constants';

// --- ANIMATION VARIANTS ---
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// --- HELPERS ---
const formatDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Logic for Status Badges (Urgency)
const getExpirationStatus = (dateString) => {
  if (!dateString) return { label: 'No Date', className: 'bg-gray-100 text-gray-500' };
  
  const target = new Date(dateString);
  const now = new Date();
  target.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  
  const diffTime = target - now;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 1. EXPIRED
  if (days < 0) return { 
    label: `Expired ${Math.abs(days)}d ago`, 
    className: 'bg-red-50 text-red-600 border-red-100' 
  };
  
  // 2. URGENT (Today)
  if (days === 0) return { 
    label: 'Expires Today', 
    className: 'bg-red-50 text-red-600 border-red-100 font-bold' 
  };

  // 3. WARNING (This Week)
  if (days <= 7) return { 
    label: `Exp in ${days} days`, 
    className: 'bg-orange-50 text-orange-600 border-orange-100' 
  };

  // 4. NOTICE (This Month)
  if (days <= 30) return { 
    label: `Exp in ${days} days`, 
    className: 'bg-yellow-50 text-yellow-700 border-yellow-100' 
  };

  // 5. SAFE
  return { 
    label: 'Good', 
    className: 'bg-green-50 text-green-600 border-green-100' 
  };
};

const getCategoryName = (value) => {
  const cat = CATEGORY_OPTIONS.find(c => c.value === value);
  return cat ? cat.name : value;
};

export function InventoryView() {
  const { pantryId } = usePantry();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'expirationDate', order: 'asc' });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

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
        if (!searchQuery) setFilteredInventory(data.data);
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

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredInventory(inventory.filter(i => 
      i.name.toLowerCase().includes(q) || 
      (i.barcode && i.barcode.includes(q)) ||
      i.category.toLowerCase().includes(q)
    ));
  }, [searchQuery, inventory]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleModify = (item) => {
    setSelectedItem(item);
    setIsSheetOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white font-sans text-sm md:text-base">
      
      {/* --- HEADER --- */}
      <div className="px-4 md:px-6 py-5 bg-white z-10 sticky top-0 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-0">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 md:h-12 md:w-12 bg-[#d97757]/10 rounded-2xl flex items-center justify-center">
              {isRefetching ? <RefreshCw className="h-5 w-5 text-[#d97757] animate-spin" /> : <Package className="h-5 w-5 md:h-6 md:w-6 text-[#d97757]" strokeWidth={2.5} />}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none">Inventory</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                {filteredInventory.length} Items Stocked
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              className="h-11 md:h-10 bg-[#d97757] hover:bg-[#c06245] text-white rounded-xl font-bold shadow-lg shadow-[#d97757]/20 transition-all active:scale-95 flex-1 md:flex-none"
              onClick={() => handleModify(null)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>
        </div>

        <div className="flex gap-2 items-center mt-4 md:mt-0">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search inventory..." 
              className="pl-10 h-11 md:h-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d97757]/20 focus:border-[#d97757] transition-all font-medium text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 md:h-10 px-4 rounded-xl font-bold border-2 border-gray-100 hover:border-gray-200 transition-all text-gray-600">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => handleSort('expirationDate')}>Expiration Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('name')}>Name (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('quantity')}>Quantity</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="h-11 w-11 md:h-10 md:w-10 rounded-xl border-2 border-gray-100 hover:border-gray-200 shrink-0" onClick={() => setShowScanner(true)}>
            <Camera className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-hidden bg-gray-50/50 md:bg-white">
        <ScrollArea className="h-full px-4 md:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#d97757]" />
                <p className="text-[10px] font-black uppercase tracking-widest">Syncing Stock</p>
              </div>
            )}

            {!isLoading && filteredInventory.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[28px] border-2 border-dashed border-gray-300 text-gray-500 font-bold uppercase text-[10px]">
                No Items Found
              </div>
            )}

            {!isLoading && filteredInventory.length > 0 && (
              <>
                {/* 💻 DESKTOP TABLE (Unchanged) */}
                <div className="hidden md:block rounded-[24px] border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 border-b">
                        <TableHead className="font-black text-[10px] uppercase text-gray-600 pl-6 py-4 w-[35%]">Item Name</TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-gray-600 w-[20%]">Category</TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-gray-600 w-[20%]">Expiration</TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-gray-600 text-center w-[15%]">Stock</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase text-gray-600 pr-6 w-[10%]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => {
                        const expInfo = getExpirationStatus(item.expirationDate);
                        return (
                          <TableRow
                            key={item._id}
                            className="border-b last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                            onClick={() => handleModify(item)}
                          >
                            <TableCell className="pl-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                                {item.barcode && (
                                  <span className="text-[10px] font-mono text-gray-400 mt-0.5 flex items-center gap-1">
                                    <ScanBarcode className="h-3 w-3" /> {item.barcode}
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
                                {item.expirationDate ? (
                                  <>
                                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                      <Calendar className="h-3 w-3 text-gray-400" />
                                      {formatDate(item.expirationDate)}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wide mt-0.5 px-1.5 py-0.5 rounded border ${expInfo.className}`}>
                                      {expInfo.label}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">No Date</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-black text-gray-900 text-sm">{item.quantity}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">{item.unit || 'units'}</span>
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

                {/* 📱 MOBILE LIST (CLEANER, APP-STYLE) */}
                <div className="md:hidden space-y-3">
                  <AnimatePresence>
                    {filteredInventory.map((item) => {
                      const expInfo = getExpirationStatus(item.expirationDate);
                      
                      return (
                        <motion.div
                          key={item._id}
                          variants={itemVariants}
                          initial="hidden" animate="visible"
                          onClick={() => handleModify(item)}
                          className="group"
                        >
                          <Card className="overflow-hidden border border-gray-100 bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] active:scale-[0.98] active:border-[#d97757]/30 transition-all">
                            
                            {/* Top Section: Info */}
                            <div className="p-4 relative">
                              
                              {/* Date Pill (Absolute Top Right) */}
                              <div className="absolute top-4 right-4">
                                {item.expirationDate ? (
                                  <div className={`flex flex-col items-end`}>
                                     <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${expInfo.className}`}>
                                        {expInfo.label}
                                     </div>
                                     <span className="text-[10px] text-gray-400 font-medium mt-1">
                                        {formatDate(item.expirationDate)}
                                     </span>
                                  </div>
                                ) : (
                                  <div className="px-2 py-1 rounded-md bg-gray-50 text-gray-400 text-[10px] font-bold uppercase">
                                    No Exp
                                  </div>
                                )}
                              </div>

                              <div className="pr-20"> {/* Padding Right to avoid overlapping date */}
                                <h4 className="font-bold text-gray-900 text-lg leading-tight truncate">
                                  {item.name}
                                </h4>
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                                    {getCategoryName(item.category)}
                                  </span>
                                  {item.barcode && (
                                    <span className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                                      <ScanBarcode className="h-3 w-3" />
                                      {item.barcode.slice(-4)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Bottom Section: Quantity Bar (Gray Background) */}
                            <div className="bg-gray-50/80 p-3 flex items-center justify-between border-t border-gray-100">
                                <div className="flex items-baseline gap-1.5 pl-1">
                                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">In Stock:</span>
                                  <span className="text-lg font-black text-gray-900">{item.quantity}</span>
                                  <span className="text-xs font-medium text-gray-400">{item.unit || 'units'}</span>
                                </div>

                                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-gray-300 border border-gray-200 shadow-sm group-hover:text-[#d97757] group-hover:border-[#d97757]/30 transition-colors">
                                  <ArrowRight className="h-4 w-4" />
                                </div>
                            </div>

                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </>
            )}
            <div className="h-20" />
          </div>
        </ScrollArea>
      </div>

      {/* --- OVERLAYS --- */}
      {showScanner && (
        <BarcodeScannerOverlay onScan={(code) => { setSearchQuery(code); setShowScanner(false); }} onClose={() => setShowScanner(false)} />
      )}

      <InventoryFormBar
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        item={selectedItem}
        onItemUpdated={() => { setIsSheetOpen(false); fetchInventory(true); }}
      />
    </div>
  );
}