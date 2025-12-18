'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Plus, Pencil, Package, Camera, Loader2, Layers,
    Calendar, AlertTriangle, ArrowUpDown, Filter, X, RefreshCw 
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

// --- HELPERS ---
const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getExpirationColor = (dateString) => {
    if (!dateString) return 'text-gray-500 bg-gray-100 border-gray-200';
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'text-red-700 bg-red-50 border-red-200';
    if (days <= 7) return 'text-orange-700 bg-orange-50 border-orange-200';
    if (days <= 30) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-green-700 bg-green-50 border-green-200';
};

const getCategoryName = (value) => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === value);
    return cat ? cat.name : value;
};

// Removed animation variants to prevent "jumping" during silent updates
// const tableRowVariants = { ... }; 

export function InventoryView() {
    const { pantryId } = usePantry();
    
    // Data State
    const [searchQuery, setSearchQuery] = useState('');
    const [inventory, setInventory] = useState([]);
    const [filteredInventory, setFilteredInventory] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'expirationDate', order: 'asc' });

    // 🔥 FIX 1: Split Loading States
    const [isLoading, setIsLoading] = useState(true);      // Big Spinner (First Load)
    const [isRefetching, setIsRefetching] = useState(false); // Small Spinner (Background)
    
    // Modal & Scanner
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    // --- FETCH INVENTORY ---
    // 🔥 FIX 2: Accept 'isBackground' flag
    const fetchInventory = async (isBackground = false) => {
        if (!pantryId) return;
        
        if (!isBackground) setIsLoading(true);
        else setIsRefetching(true);

        try {
            const params = new URLSearchParams({ sort: sortConfig.key, order: sortConfig.order });
            const response = await fetch(`/api/foods?${params}`, { 
                headers: { 'x-pantry-id': pantryId } 
            });
            
            if (response.ok) {
                const data = await response.json();
                setInventory(data.data);
                
                // Only update the filtered list if the user IS NOT typing.
                // This prevents the list from jumping around while they search.
                if (!searchQuery) {
                    setFilteredInventory(data.data);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setIsRefetching(false);
        }
    };

    // 🔥 FIX 3: Polling Interval
    useEffect(() => {
        if (pantryId) {
            fetchInventory(false); // Initial load
            
            const interval = setInterval(() => {
                fetchInventory(true); // Silent update every 10s
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [pantryId, sortConfig]);

    // Local Filter Logic (Search)
    useEffect(() => {
        const q = searchQuery.toLowerCase();
        setFilteredInventory(inventory.filter(i => 
            i.name.toLowerCase().includes(q) || 
            (i.barcode && i.barcode.includes(q)) ||
            i.category.toLowerCase().includes(q)
        ));
    }, [searchQuery, inventory]);

    // Handlers
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
                
                {/* Title & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {/* 🔥 Live Indicator Icon */}
                            {isRefetching ? (
                                <RefreshCw className="h-5 w-5 text-[#d97757] animate-spin" />
                            ) : (
                                <Package className="h-5 w-5 text-[#d97757]" />
                            )}
                            Inventory
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Manage stock levels and track expirations</p>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                            className="h-10 bg-[#d97757] hover:bg-[#c06245] text-white shadow-sm flex-1 md:flex-none"
                            onClick={() => handleModify(null)}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Item
                        </Button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1 md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search by name, barcode, or category..." 
                            className="pl-9 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    {/* Sort Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 gap-2 border-gray-200 text-gray-700">
                                <ArrowUpDown className="h-4 w-4" />
                                <span className="hidden md:inline">Sort: {sortConfig.key === 'expirationDate' ? 'Date' : 'Name'}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSort('expirationDate')}>
                                Sort by Expiration {sortConfig.key === 'expirationDate' && (sortConfig.order === 'asc' ? '⬆️' : '⬇️')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('name')}>
                                Sort by Name {sortConfig.key === 'name' && (sortConfig.order === 'asc' ? '⬆️' : '⬇️')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('quantity')}>
                                Sort by Quantity {sortConfig.key === 'quantity' && (sortConfig.order === 'asc' ? '⬆️' : '⬇️')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setShowScanner(true)}>
                        <Camera className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 overflow-hidden bg-gray-50 md:bg-white">
                <ScrollArea className="h-full">
                    <div className="pb-24 px-4 md:px-6 md:pt-4 pt-4">
                        
                        {/* Loading (Initial Only) */}
                        {isLoading && (
                            <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
                                <Loader2 className="animate-spin mr-2 h-4 w-4 text-[#d97757]" /> Loading inventory...
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && filteredInventory.length === 0 && (
                            <div className="py-20 text-center text-gray-400 flex flex-col items-center">
                                <Package className="h-12 w-12 opacity-10 mb-3" />
                                <p>No items found</p>
                                {searchQuery && <p className="text-xs mt-2">No match for "{searchQuery}"</p>}
                            </div>
                        )}

                        {/* DESKTOP TABLE */}
                        <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500 w-[30%]">Item Name</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Category</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Expiration</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500 text-center">Stock</TableHead>
                                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-gray-500">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Removed AnimatePresence to stop table jumping on refresh */}
                                    {filteredInventory.map((item) => (
                                        <TableRow
                                            key={item._id}
                                            className="border-b last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                            onClick={() => handleModify(item)}
                                        >
                                            <TableCell>
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                {item.barcode && <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.barcode}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal bg-gray-100 text-gray-600 hover:bg-gray-200 border-0">
                                                    {getCategoryName(item.category)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getExpirationColor(item.expirationDate)}`}>
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {formatDate(item.expirationDate)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-bold text-gray-900">{item.quantity}</span>
                                                <span className="text-xs text-gray-400 ml-1">{item.unit || 'units'}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-[#d97757]">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* MOBILE LIST */}
                        <div className="md:hidden space-y-3">
                            {filteredInventory.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => handleModify(item)}
                                >
                                    <Card className="p-4 flex justify-between items-start border-gray-200 shadow-sm active:scale-[0.99] transition-transform">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-gray-100 text-gray-600 border-0">
                                                    {item.quantity} {item.unit}
                                                </Badge>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Layers className="h-3 w-3" /> {getCategoryName(item.category)}
                                                </div>
                                                <div className={`text-xs flex items-center gap-1 px-1.5 rounded ${getExpirationColor(item.expirationDate)} border-0`}>
                                                    <Calendar className="h-3 w-3" /> {formatDate(item.expirationDate)}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Button variant="outline" size="sm" className="h-8 px-3 border-gray-200">
                                            Edit
                                        </Button>
                                    </Card>
                                </div>
                            ))}
                        </div>

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