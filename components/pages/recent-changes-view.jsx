'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, History, Loader2, 
    ArrowRight, User, Calendar, Clock, RefreshCw, 
    Package, Layers, ArrowUpRight, ArrowDownLeft, Trash2, Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { usePantry } from '@/components/providers/PantryProvider';
import { categories as CATEGORY_OPTIONS } from '@/lib/constants';

// --- ANIMATION VARIANTS ---
const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

// --- HELPERS ---
const getCategoryName = (value) => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === value);
    return cat ? cat.name : value;
};

const formatDateTime = (timestamp) => {
    if (!timestamp) return { date: '—', time: '—' };
    const date = new Date(timestamp);
    return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
};

// 🎨 UPDATED BADGE STYLES (Soft & Uniform)
const getActionConfig = (type) => {
    switch (type) {
        case 'added': return { 
            label: 'Restock', 
            // Soft Emerald Green
            colorClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
            icon: <ArrowDownLeft className="h-3 w-3" /> 
        };
        case 'distributed': return { 
            label: 'Distributed', 
            // Soft Brand Orange (Matches Green style now)
            colorClass: 'bg-[#d97757]/10 text-[#d97757] border border-[#d97757]/20', 
            icon: <ArrowUpRight className="h-3 w-3" /> 
        };
        case 'deleted': return { 
            label: 'Deleted', 
            // Soft Red
            colorClass: 'bg-red-50 text-red-700 border border-red-200', 
            icon: <Trash2 className="h-3 w-3" /> 
        };
        case 'updated': return { 
            label: 'Updated', 
            // Soft Blue
            colorClass: 'bg-blue-50 text-blue-700 border border-blue-200', 
            icon: <Edit className="h-3 w-3" /> 
        };
        default: return { 
            label: type, 
            colorClass: 'bg-gray-100 text-gray-600 border border-gray-200', 
            icon: <History className="h-3 w-3" /> 
        };
    }
};

export function RecentChangesView() {
    const { pantryId } = usePantry();
    
    const [changes, setChanges] = useState([]);
    const [filteredChanges, setFilteredChanges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const fetchChanges = async (isBackground = false) => {
        if (!pantryId) return;
        if (!isBackground) setIsLoading(true);
        else setIsRefetching(true);

        try {
            const response = await fetch('/api/foods/changes/recent', {
                headers: { 'x-pantry-id': pantryId }
            });
            if (response.ok) {
                const data = await response.json();
                setChanges(data);
                if (!searchQuery && typeFilter === 'all') setFilteredChanges(data);
            }
        } catch (error) { console.error('Error fetching changes:', error); } 
        finally { setIsLoading(false); setIsRefetching(false); }
    };

    useEffect(() => {
        if (pantryId) {
            fetchChanges(false);
            const interval = setInterval(() => fetchChanges(true), 15000);
            return () => clearInterval(interval);
        }
    }, [pantryId]);

    useEffect(() => {
        let result = changes;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c => 
                c.itemName.toLowerCase().includes(q) || 
                (c.clientName && c.clientName.toLowerCase().includes(q))
            );
        }
        if (typeFilter !== 'all') {
            result = result.filter(c => c.actionType === typeFilter);
        }
        setFilteredChanges(result);
    }, [searchQuery, typeFilter, changes]);

    // Helper for Quantity Column
    const renderQuantityChange = (change) => {
        const unit = change.unit || 'units';
        const isNegative = change.actionType === 'distributed' || change.actionType === 'deleted';
        const qty = change.quantityChanged || change.removedQuantity || 0;
        
        return (
            <span className={`font-black text-sm ${isNegative ? 'text-[#d97757]' : 'text-emerald-600'}`}>
                {isNegative ? '-' : '+'}{Math.abs(qty)} <span className="text-[10px] uppercase text-gray-400">{unit}</span>
            </span>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white font-sans overflow-hidden">
            
            {/* --- HEADER --- */}
            <div className="p-4 md:p-6 border-b bg-white shrink-0 z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-[#d97757]/10 rounded-2xl flex items-center justify-center">
                            {isRefetching ? <RefreshCw className="h-5 w-5 text-[#d97757] animate-spin" /> : <History className="h-5 w-5 md:h-6 md:w-6 text-[#d97757]" strokeWidth={2.5} />}
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none">History</h2>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                {filteredChanges.length} Activities Logged
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input 
                                placeholder="Search logs..." 
                                className="pl-10 h-11 md:h-10 bg-gray-50 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d97757]/20 focus:border-[#d97757] transition-all font-medium text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-11 md:h-10 px-4 rounded-xl font-bold border-2 border-gray-100 hover:border-gray-200 transition-all text-gray-600">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <span className="hidden md:inline">{typeFilter === 'all' ? 'All' : typeFilter}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => setTypeFilter('all')}>All Actions</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTypeFilter('distributed')}>Distributed</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTypeFilter('added')}>Restock</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTypeFilter('updated')}>Updates</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="flex-1 bg-gray-50/50 overflow-hidden">
                <ScrollArea className="h-full px-4 md:px-6 py-6">
                    <div className="max-w-7xl mx-auto">

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                                <Loader2 className="h-8 w-8 animate-spin text-[#d97757]" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Loading History</p>
                            </div>
                        ) : filteredChanges.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[28px] border-2 border-dashed border-gray-300 text-gray-500 font-bold uppercase text-[10px]">
                                No Records Found
                            </div>
                        ) : (
                            <>
                                {/* 💻 DESKTOP TABLE (REARRANGED LAYOUT) */}
                                <div className="hidden md:block rounded-[24px] border border-gray-200 bg-white overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50/80 border-b">
                                                {/* Col 1: Time */}
                                                <TableHead className="w-[15%] font-black text-[10px] uppercase text-gray-600 pl-6 py-4">Time</TableHead>
                                                {/* Col 2: Item */}
                                                <TableHead className="w-[30%] font-black text-[10px] uppercase text-gray-600">Item Details</TableHead>
                                                {/* Col 3: Quantity */}
                                                <TableHead className="w-[20%] font-black text-[10px] uppercase text-gray-600">Quantity</TableHead>
                                                {/* Col 4: Action (Far Right) */}
                                                <TableHead className="w-[35%] text-right font-black text-[10px] uppercase text-gray-600 pr-6">Distribution / Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredChanges.map((change) => {
                                                const { date, time } = formatDateTime(change.timestamp);
                                                const config = getActionConfig(change.actionType);
                                                return (
                                                    <TableRow key={change._id} className="group border-b last:border-0 hover:bg-gray-50/50">
                                                        
                                                        {/* 1. Time */}
                                                        <TableCell className="pl-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-900 text-xs">{date}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold">{time}</span>
                                                            </div>
                                                        </TableCell>

                                                        {/* 2. Item */}
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-900">{change.itemName}</span>
                                                                <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
                                                                    <Layers className="h-3 w-3" /> {getCategoryName(change.category)}
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        {/* 3. Quantity (Moved to Middle) */}
                                                        <TableCell>
                                                            {renderQuantityChange(change)}
                                                        </TableCell>

                                                        {/* 4. Action/Client (Far Right) */}
                                                        <TableCell className="text-right pr-6">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${config.colorClass}`}>
                                                                    {config.icon} {config.label}
                                                                </div>
                                                                {/* Show Client Name if it exists */}
                                                                {change.clientName && (
                                                                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                                                        <User className="h-3 w-3" /> {change.clientName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* 📱 MOBILE LIST (Unchanged from previous style) */}
                                <div className="md:hidden space-y-4">
                                    <AnimatePresence>
                                        {filteredChanges.map((change) => {
                                            const { date, time } = formatDateTime(change.timestamp);
                                            const config = getActionConfig(change.actionType);
                                            
                                            return (
                                                <motion.div
                                                    key={change._id}
                                                    variants={itemVariants}
                                                    initial="hidden" animate="visible"
                                                >
                                                    <Card className="p-5 border-2 border-gray-200 bg-white rounded-[28px] shadow-sm">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="min-w-0 pr-2">
                                                                <h4 className="font-black text-gray-900 text-lg truncate leading-tight">{change.itemName}</h4>
                                                                <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest mt-1">
                                                                    {getCategoryName(change.category)}
                                                                </p>
                                                            </div>
                                                            {/* Soft Badge on Mobile too */}
                                                            <div className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${config.colorClass}`}>
                                                                {config.icon} {config.label}
                                                            </div>
                                                        </div>

                                                        {change.clientName && (
                                                            <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-xl">
                                                                <div className="h-6 w-6 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                                                                    <User className="h-3 w-3 text-gray-400" />
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-700">{change.clientName}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[12px] font-black text-gray-900 leading-none">{date}</span>
                                                                    <span className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{time}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                                <Package className="h-3.5 w-3.5 text-gray-400" />
                                                                {renderQuantityChange(change)}
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
        </div>
    );
}