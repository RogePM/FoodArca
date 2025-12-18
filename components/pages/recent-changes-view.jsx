'use client';

import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, History, Loader2, 
    ArrowRight, User, Calendar, Clock, RefreshCw, Layers 
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

import { usePantry } from '@/components/providers/PantryProvider';
import { categories as CATEGORY_OPTIONS } from '@/lib/constants';

// --- HELPERS ---
const getCategoryName = (value) => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === value);
    return cat ? cat.name : value;
};

const formatDateTime = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
};

const getActionStyles = (type) => {
    switch (type) {
        case 'added': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'distributed': return 'bg-orange-50 text-[#d97757] border-orange-200';
        case 'deleted': return 'bg-red-50 text-red-700 border-red-200';
        case 'updated': return 'bg-blue-50 text-blue-700 border-blue-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

const getActionLabel = (type) => {
    switch (type) {
        case 'added': return 'Restock';
        case 'distributed': return 'Distributed';
        case 'deleted': return 'Deleted';
        case 'updated': return 'Updated';
        default: return type;
    }
};

export function RecentChangesView() {
    const { pantryId } = usePantry();
    
    // Data State
    const [changes, setChanges] = useState([]);
    const [filteredChanges, setFilteredChanges] = useState([]);
    
    // Loading State
    const [isLoading, setIsLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    // --- FETCH DATA ---
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
                
                // Update filtered list immediately if no search is active
                if (!searchQuery && typeFilter === 'all') {
                    setFilteredChanges(data);
                }
            }
        } catch (error) {
            console.error('Error fetching changes:', error);
        } finally {
            setIsLoading(false);
            setIsRefetching(false);
        }
    };

    // Polling Interval (Matches Inventory Logic)
    useEffect(() => {
        if (pantryId) {
            fetchChanges(false);
            const interval = setInterval(() => fetchChanges(true), 15000);
            return () => clearInterval(interval);
        }
    }, [pantryId]);

    // --- FILTER LOGIC ---
    useEffect(() => {
        let result = changes;

        // 1. Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c => 
                c.itemName.toLowerCase().includes(q) || 
                (c.clientName && c.clientName.toLowerCase().includes(q))
            );
        }

        // 2. Type Filter
        if (typeFilter !== 'all') {
            result = result.filter(c => c.actionType === typeFilter);
        }

        setFilteredChanges(result);
    }, [searchQuery, typeFilter, changes]);

    // --- RENDER HELPERS ---
    const renderChangeDetails = (change) => {
        const unit = change.unit || 'units';

        if (change.actionType === 'distributed') {
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-[#d97757]">
                        -{change.quantityChanged || change.removedQuantity} {unit}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <User className="h-3 w-3" /> {change.clientName || 'Anonymous'}
                    </span>
                </div>
            );
        }
        if (change.actionType === 'added') {
            return (
                <span className="font-medium text-emerald-600">
                    +{change.quantityChanged} {unit}
                </span>
            );
        }
        if (change.actionType === 'updated' && change.changes) {
            return (
                <div className="flex flex-col gap-1">
                    {Object.entries(change.changes).slice(0, 2).map(([key, val]) => (
                        <div key={key} className="text-xs flex items-center gap-1 text-gray-600">
                            <span className="uppercase text-[10px] font-bold text-gray-400">{key}:</span>
                            <span className="line-through opacity-50">{val.old}</span>
                            <ArrowRight className="h-2 w-2" />
                            <span className="font-medium">{val.new}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return <span className="text-gray-400 italic text-xs">No details</span>;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white font-sans text-sm md:text-base">
            
            {/* --- HEADER --- */}
            <div className="px-4 md:px-6 py-5 bg-white z-10 sticky top-0 border-b border-gray-100">
                
                {/* Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {isRefetching ? (
                                <RefreshCw className="h-5 w-5 text-[#d97757] animate-spin" />
                            ) : (
                                <History className="h-5 w-5 text-[#d97757]" />
                            )}
                            Recent Activity
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Audit log of inventory movements</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex gap-2 items-center mt-4 md:mt-0">
                    <div className="relative flex-1 md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search item or client..." 
                            className="pl-9 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    {/* Type Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 gap-2 border-gray-200 text-gray-700 min-w-[140px] justify-between">
                                <span className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    {typeFilter === 'all' ? 'All Actions' : getActionLabel(typeFilter)}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTypeFilter('all')}>All Actions</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTypeFilter('distributed')}>Distributed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTypeFilter('added')}>Restock</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTypeFilter('updated')}>Updates</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTypeFilter('deleted')}>Deleted</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 overflow-hidden bg-gray-50 md:bg-white">
                <ScrollArea className="h-full">
                    <div className="pb-24 px-4 md:px-6 md:pt-4 pt-4">

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
                                <Loader2 className="animate-spin mr-2 h-4 w-4 text-[#d97757]" /> Loading history...
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && filteredChanges.length === 0 && (
                            <div className="py-20 text-center text-gray-400 flex flex-col items-center">
                                <History className="h-12 w-12 opacity-10 mb-3" />
                                <p>No activity found</p>
                                {searchQuery && <p className="text-xs mt-2">No match for "{searchQuery}"</p>}
                            </div>
                        )}

                        {/* --- DESKTOP TABLE --- */}
                        <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                        <TableHead className="w-[20%] font-semibold text-xs uppercase tracking-wider text-gray-500">Date & Time</TableHead>
                                        <TableHead className="w-[30%] font-semibold text-xs uppercase tracking-wider text-gray-500">Item</TableHead>
                                        <TableHead className="w-[20%] font-semibold text-xs uppercase tracking-wider text-gray-500">Action</TableHead>
                                        <TableHead className="w-[30%] font-semibold text-xs uppercase tracking-wider text-gray-500">Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredChanges.map((change) => {
                                        const { date, time } = formatDateTime(change.timestamp);
                                        return (
                                            <TableRow key={change._id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{date}</span>
                                                        <span className="text-xs text-gray-400">{time}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-gray-900">{change.itemName}</div>
                                                    <Badge variant="secondary" className="mt-1 font-normal text-[10px] bg-gray-100 text-gray-500 border-0">
                                                        {getCategoryName(change.category)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`font-medium border ${getActionStyles(change.actionType)}`}>
                                                        {getActionLabel(change.actionType)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {renderChangeDetails(change)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* --- MOBILE LIST (CARDS) --- */}
                        <div className="md:hidden space-y-3">
                            {filteredChanges.map((change) => {
                                const { date, time } = formatDateTime(change.timestamp);
                                return (
                                    <Card key={change._id} className="p-4 border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{change.itemName}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-gray-100 text-gray-600 border-0">
                                                        <Layers className="h-3 w-3 mr-1" />
                                                        {getCategoryName(change.category)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Badge className={`text-[10px] border ${getActionStyles(change.actionType)}`}>
                                                {getActionLabel(change.actionType)}
                                            </Badge>
                                        </div>
                                        
                                        <div className="py-2 border-t border-b border-gray-50 my-2">
                                            {renderChangeDetails(change)}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> {date}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {time}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}