'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, UserPlus, Users, MapPin, 
    Baby, User, GraduationCap, ArrowRight, Loader2, Calendar, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ClientFormDrawer } from './Client-form';
import { usePantry } from '@/components/providers/PantryProvider';

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

// --- HELPER: Format Date for Display ---
const formatVisitDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
};

export function ClientListView() {
    const { pantryId } = usePantry();
    const [searchQuery, setSearchQuery] = useState('');
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const inputRef = useRef(null);

    useEffect(() => {
        if (pantryId) fetchClients();
    }, [pantryId]);

    const fetchClients = async () => {
        if (!pantryId) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/clients', {
                headers: { 'x-pantry-id': pantryId }
            });
            if (response.ok) {
                const data = await response.json();
                setClients(data.data || []);
                setFilteredClients(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const q = searchQuery.toLowerCase();
        const filtered = clients.filter((client) => {
            const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
            const id = (client.clientId || '').toLowerCase();
            const addr = (client.address || '').toLowerCase();
            return fullName.includes(q) || id.includes(q) || addr.includes(q);
        });
        setFilteredClients(filtered);
    }, [searchQuery, clients]);

    const handleModify = (client) => {
        setSelectedClient(client);
        setIsSheetOpen(true);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white font-sans overflow-hidden">
            {/* --- HEADER --- */}
            <div className="p-4 md:p-6 border-b bg-white shrink-0 z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-[#d97757]/10 rounded-2xl flex items-center justify-center">
                            <Users className="h-5 w-5 md:h-6 md:w-6 text-[#d97757]" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none">Directory</h2>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                {clients.length} Registered
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                ref={inputRef}
                                placeholder="Search records..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 md:h-10 bg-gray-50 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d97757]/20 focus:border-[#d97757] transition-all font-medium text-sm"
                            />
                        </div>
                        <Button
                            onClick={() => { setSelectedClient(null); setIsSheetOpen(true); }}
                            className="bg-[#d97757] hover:bg-[#c06245] h-11 md:h-10 px-4 rounded-xl font-black shadow-lg shadow-[#d97757]/20 transition-all active:scale-95"
                        >
                            <UserPlus className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Add Client</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 bg-gray-50/50 overflow-hidden">
                <ScrollArea className="h-full px-4 md:px-6 py-6">
                    <div className="max-w-7xl mx-auto">
                        
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                                <Loader2 className="h-8 w-8 animate-spin text-[#d97757]" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing Directory</p>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-300 text-gray-500 font-bold uppercase text-[10px]">
                                No Matches Found
                            </div>
                        ) : (
                            <>
                                {/* 💻 DESKTOP TABLE VERSION */}
                                <div className="hidden md:block rounded-[24px] border border-gray-200 bg-white overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50/80 border-b">
                                                <TableHead className="w-[100px] font-black text-[10px] uppercase text-gray-600 pl-6 py-4">ID</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase text-gray-600">Recipient</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase text-gray-600">Household</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase text-gray-600">Last Visit</TableHead>
                                                <TableHead className="text-right font-black text-[10px] uppercase text-gray-600 pr-6">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AnimatePresence>
                                                {filteredClients.map((client) => (
                                                    <motion.tr
                                                        key={client._id}
                                                        variants={itemVariants}
                                                        initial="hidden" animate="visible" exit="hidden"
                                                        className="group border-b last:border-0 even:bg-gray-50/40 hover:bg-[#d97757]/5 transition-colors cursor-pointer"
                                                        onClick={() => handleModify(client)}
                                                    >
                                                        <TableCell className="pl-6 font-mono text-[11px] font-bold text-gray-500 uppercase">
                                                            {client.clientId || '—'}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-gray-900 group-hover:text-[#d97757] transition-colors">
                                                                    {client.firstName} {client.lastName}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">
                                                                    <MapPin className="h-2.5 w-2.5 text-[#d97757]" /> {client.address || 'General Delivery'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-sm font-black text-gray-800">
                                                                    {client.familySize} <span className="text-[10px] font-bold text-gray-500 uppercase">Total</span>
                                                                </div>
                                                                <div className="h-4 w-[1.5px] bg-gray-200" />
                                                                <div className="flex items-center gap-2 text-gray-600 font-bold text-[10px]">
                                                                    <span className="flex items-center gap-0.5"><Baby className="h-3 w-3 text-[#d97757]/70" /> {client.childrenCount ?? 0}</span>
                                                                    <span className="flex items-center gap-0.5"><User className="h-3 w-3 text-[#d97757]/70" /> {client.adultCount ?? 1}</span>
                                                                    <span className="flex items-center gap-0.5"><GraduationCap className="h-3 w-3 text-[#d97757]/70" /> {client.seniorCount ?? 0}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        
                                                        {/* --- UPDATED RECENCY COLUMN --- */}
                                                        <TableCell>
                                                            <div className="flex flex-col items-start">
                                                                {client.lastVisit ? (
                                                                    <>
                                                                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                                                            <Calendar className="h-3 w-3 text-gray-400" />
                                                                            {formatVisitDate(client.lastVisit)}
                                                                        </span>
                                                                        <span className={`text-[9px] font-bold uppercase tracking-wide mt-0.5 px-1.5 py-0.5 rounded ${
                                                                            client.lastVisitPeriod === 'Today' ? 'bg-[#d97757]/10 text-[#d97757]' : 'text-gray-400'
                                                                        }`}>
                                                                            {client.lastVisitPeriod}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 italic">Never</span>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="pr-6 text-right">
                                                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#d97757] group-hover:translate-x-1 transition-all ml-auto" />
                                                        </TableCell>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* 📱 MOBILE VERSION */}
                                <div className="md:hidden space-y-4">
                                    <AnimatePresence>
                                        {filteredClients.map((client) => (
                                            <motion.div
                                                key={client._id}
                                                variants={itemVariants}
                                                initial="hidden" animate="visible"
                                                onClick={() => handleModify(client)}
                                            >
                                                <Card className="p-5 border-2 border-gray-200 bg-white rounded-[28px] shadow-sm active:scale-[0.98] active:bg-[#d97757]/5 transition-all">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="min-w-0">
                                                            <h4 className="font-black text-gray-900 text-lg truncate leading-tight">{client.firstName} {client.lastName}</h4>
                                                            <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-widest mt-1">#{client.clientId || 'Manual'}</p>
                                                        </div>
                                                        
                                                        {/* --- UPDATED MOBILE RECENCY --- */}
                                                        <div className="flex flex-col items-end">
                                                            {client.lastVisit ? (
                                                                <>
                                                                    <span className="text-xs font-black text-gray-900 leading-none mb-1">
                                                                        {formatVisitDate(client.lastVisit)}
                                                                    </span>
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                                        client.lastVisitPeriod === 'Today' ? 'bg-[#d97757] text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                                                                    }`}>
                                                                        {client.lastVisitPeriod}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                                                                    Never
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[12px] font-black text-gray-900 leading-none">{client.familySize}</span>
                                                                <span className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">Size</span>
                                                            </div>
                                                            <div className="h-6 w-[1px] bg-gray-300" />
                                                            <div className="flex items-center gap-3 text-gray-600 font-bold text-[10px]">
                                                                <span className="flex items-center gap-1"><Baby className="h-3 w-3 text-[#d97757]" />{client.childrenCount ?? 0}</span>
                                                                <span className="flex items-center gap-1"><User className="h-3 w-3 text-[#d97757]" />{client.adultCount ?? 1}</span>
                                                                <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3 text-[#d97757]" />{client.seniorCount ?? 0}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#d97757] border border-[#d97757]/20 shadow-sm">
                                                            <ArrowRight className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                        <div className="h-20" />
                    </div>
                </ScrollArea>
            </div>

            <ClientFormDrawer
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                client={selectedClient}
                onClientUpdated={fetchClients}
            />
        </div>
    );
}