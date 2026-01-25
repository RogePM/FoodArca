'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Minus, Plus, Trash2, Check, ArrowRight,
    User, Loader2, UserPlus, X, ShoppingBag, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePantry } from '@/components/providers/PantryProvider';

import { UpgradeModal } from '@/components/modals/UpgradeModal';

export function DistributionCart({ cart, onUpdateQty, onRemove, onCheckoutSuccess }) {
    const { pantryId, pantryDetails } = usePantry();
    const enableClientTracking = pantryDetails?.settings?.enable_client_tracking ?? true;

    // --- State Management ---
    const [isAnonymous, setIsAnonymous] = useState(!enableClientTracking);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isNewClient, setIsNewClient] = useState(false);

    // State for Upgrade Modal
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Quick Demographics for New Client
    const [newClientData, setNewClientData] = useState({
        firstName: '', lastName: '', clientId: '', address: '',
        kids: 0, adults: 1, seniors: 0
    });

    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState(null);


    // --- 1. SEARCH LOGIC ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2 && !selectedClient && !isNewClient && !isAnonymous) {
                try {
                    const res = await fetch(`/api/clients/search?query=${encodeURIComponent(searchQuery)}`, {
                        headers: { 'x-pantry-id': pantryId }
                    });
                    const data = await res.json();
                    setSearchResults(data.data || []);
                } catch (e) { console.error("Search failed", e); }
            } else { setSearchResults([]); }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedClient, isNewClient, isAnonymous, pantryId]);

    // --- 2. HANDLERS ---
    const handleToggleNewClient = () => {
        if (!isNewClient) {
            const generatedId = `CL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            setNewClientData({
                firstName: '',
                lastName: '',
                clientId: generatedId,
                address: '',
                kids: 0, adults: 1, seniors: 0
            });
            setSearchQuery('');
        }
        setIsNewClient(!isNewClient);
        setSelectedClient(null);
        setSearchResults([]);
    };

    const handleSelectClient = (c) => {
        setSelectedClient(c);
        setSearchQuery(`${c.firstName} ${c.lastName}`);
        setSearchResults([]);
    };

    const resetRecipient = () => {
        setSelectedClient(null);
        setIsNewClient(false);
        setSearchQuery('');
        setSearchResults([]);
    };
    useEffect(() => {
        if (!enableClientTracking) {
            setIsAnonymous(true);
            resetRecipient(); // Clear any typed data if they switch modes
        } else {
            // Optional: If you want it to default back to tracking when setting changes
            setIsAnonymous(false);
        }
    }, [enableClientTracking]);

    // --- NEW: Handle Manual Type Input for Quantity ---
    const handleManualQtyChange = (itemId, currentQty, newValString) => {
        const newVal = parseFloat(newValString);
        if (isNaN(newVal) || newVal < 0) return; // Prevent invalid inputs

        const diff = newVal - currentQty;
        if (diff !== 0) {
            onUpdateQty(itemId, diff);
        }
    };

    // --- 3. CHECKOUT LOGIC ---
    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // 🛑 VALIDATION 🛑
        if (isNewClient && !isAnonymous) {
            if (!newClientData.firstName.trim()) { alert("Please enter a First Name."); return; }
            if (!newClientData.lastName.trim()) { alert("Please enter a Last Name."); return; }
            if (!newClientData.address.trim()) { alert("Please enter a Zip Code or Address."); return; }
            const totalFamily = newClientData.kids + newClientData.adults + newClientData.seniors;
            if (totalFamily < 1) { alert("Please ensure at least 1 person is in the household."); return; }
        }

        setIsCheckingOut(true);

        const cartItems = cart.map(line => ({
            itemId: line.item._id,
            itemName: line.item.name,
            category: line.item.category,
            quantityDistributed: line.quantity,
            unit: line.item.unit || 'units',
            reason: 'distribution-regular'
        }));

        const payload = {
            cart: cartItems,
            clientName: isAnonymous ? 'Walk-in' : (isNewClient ? `${newClientData.firstName} ${newClientData.lastName}` : searchQuery),
            clientId: isAnonymous ? 'SYS' : (isNewClient ? newClientData.clientId : selectedClient?.clientId),
            isNewClient,
            address: isNewClient ? newClientData.address : (selectedClient?.address || ''),
            childrenCount: isNewClient ? newClientData.kids : (selectedClient?.childrenCount || 0),
            adultCount: isNewClient ? newClientData.adults : (selectedClient?.adultCount || 1),
            seniorCount: isNewClient ? newClientData.seniors : (selectedClient?.seniorCount || 0)
        };

        try {
            const response = await fetch('/api/client-distributions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-pantry-id': pantryId },
                body: JSON.stringify(payload)
            });

            if (response.status === 403) {
                const errorData = await response.json();
                if (errorData.error === 'LIMIT_REACHED' || errorData.message?.includes('Limit Reached')) {
                    setIsCheckingOut(false);
                    setShowUpgradeModal(true);
                    return;
                }
            }

            if (!response.ok) throw new Error("Checkout failed");

            setCheckoutStatus('success');
            setTimeout(() => {
                setCheckoutStatus(null);
                resetRecipient();
                onCheckoutSuccess();
            }, 1000);

        } catch (e) {
            console.error("Checkout error:", e);
            alert(`Error: ${e.message}`);
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] md:h-full bg-gray-50 relative font-sans overflow-hidden">

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />

            {/* 1. RECIPIENT SECTION */}
            <div className="p-4 bg-white border-b border-gray-200 z-10 shrink-0 shadow-sm">

                {/* HEADER ROW */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {/* ✅ UI TWEAK: Change text based on mode */}
                        {!enableClientTracking ? "Fast Mode Active" : "Recipient"}
                    </h3>

                    <div className="flex items-center gap-2">
                        {/* Only show the toggle text if we are allowed to switch */}
                        {enableClientTracking && (
                            <span className={`text-[10px] font-bold uppercase transition-colors ${isAnonymous ? 'text-gray-900' : 'text-gray-300'}`}>
                                Walk-in
                            </span>
                        )}

                        {/* ✅ LOGIC: If Fast Mode is ON (tracking disabled), we disable the switch or hide it. 
                            Here I am keeping it but disabling it so they see why it's locked. */}
                        <Switch
                            checked={isAnonymous}
                            onCheckedChange={(val) => {
                                // Prevent turning off anonymous mode if global settings enforce it
                                if (!enableClientTracking) return;
                                setIsAnonymous(val);
                                resetRecipient();
                            }}
                            disabled={!enableClientTracking} // Lock it if Fast Mode is on
                            className="data-[state=checked]:bg-[#d97757]"
                        />
                    </div>
                </div>

                {!isAnonymous && (
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={isNewClient ? "Creating New Client..." : "Search Client..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`pl-9 h-11 bg-white border-2 rounded-xl transition-all font-medium text-base md:text-sm ${selectedClient
                                        ? 'border-green-500 bg-green-50/20 text-green-900'
                                        : isNewClient
                                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                            : 'border-gray-200 focus:border-[#d97757]'
                                        }`}
                                    disabled={!!selectedClient || isNewClient}
                                />
                                {selectedClient && (
                                    <button onClick={resetRecipient} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-green-100 rounded-full text-green-600 hover:bg-green-200">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                            <Button
                                type="button"
                                onClick={handleToggleNewClient}
                                className={`h-11 w-11 p-0 rounded-xl border-2 transition-all shrink-0 ${isNewClient
                                    ? 'bg-[#d97757] border-[#d97757] text-white'
                                    : 'bg-white border-[#d97757] text-[#d97757] hover:bg-[#d97757]/10'
                                    }`}
                            >
                                {isNewClient ? <X className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                            </Button>
                        </div>


                        {/* Search Dropdown */}
                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {searchResults.map(c => (
                                        <button key={c._id} onClick={() => handleSelectClient(c)} className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between items-center group">
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{c.firstName} {c.lastName}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">#{c.clientId}</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#d97757]" />
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {(!enableClientTracking || isAnonymous) && (
                            <div className="text-sm text-gray-400 italic bg-gray-50 p-2 rounded-lg border border-dashed border-gray-200 text-center">
                                Recording as <strong>"Walk-in"</strong> (No client data required)
                            </div>
                        )}

                        {/* New Client Form */}
                        <AnimatePresence>
                            {isNewClient && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="pt-3 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                placeholder="First Name *"
                                                value={newClientData.firstName}
                                                onChange={(e) => setNewClientData({ ...newClientData, firstName: e.target.value })}
                                                className={`h-10 bg-white border-gray-200 rounded-lg text-base md:text-sm ${!newClientData.firstName && 'border-l-4 border-l-[#d97757]'}`}
                                            />
                                            <Input
                                                placeholder="Last Name *"
                                                value={newClientData.lastName}
                                                onChange={(e) => setNewClientData({ ...newClientData, lastName: e.target.value })}
                                                className={`h-10 bg-white border-gray-200 rounded-lg text-base md:text-sm ${!newClientData.lastName && 'border-l-4 border-l-[#d97757]'}`}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Zip Code / Address *"
                                                value={newClientData.address}
                                                onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                                                className={`h-10 bg-white border-gray-200 rounded-lg text-base md:text-sm w-[70%] ${!newClientData.address && 'border-l-4 border-l-[#d97757]'}`}
                                            />
                                            <Input
                                                placeholder="ID"
                                                value={newClientData.clientId}
                                                onChange={(e) => setNewClientData({ ...newClientData, clientId: e.target.value })}
                                                className="h-10 bg-white border-gray-200 rounded-lg text-base md:text-sm w-[30%] font-mono text-gray-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <MiniCounter label="Kids" val={newClientData.kids} set={(v) => setNewClientData({ ...newClientData, kids: v })} />
                                            <MiniCounter label="Adults" val={newClientData.adults} set={(v) => setNewClientData({ ...newClientData, adults: v })} />
                                            <MiniCounter label="Seniors" val={newClientData.seniors} set={(v) => setNewClientData({ ...newClientData, seniors: v })} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* 2. THE RECEIPT (Cart Items) */}
            {/* ADDED: pb-32 to list so items are visible above fixed footer */}
            <div className="flex-1 overflow-y-auto overscroll-none p-4 pb-32 md:pb-4">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                        <ShoppingBag className="h-12 w-12 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-wide">Cart is Empty</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {cart.map((line, index) => (
                            <div key={line.item._id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 group">
                                <div className="flex items-center bg-white rounded-lg border border-gray-200 h-10 w-32 overflow-hidden shrink-0 shadow-sm">
                                    <button
                                        onClick={() => onUpdateQty(line.item._id, -1)}
                                        className="h-full w-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors border-r border-gray-100"
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <input
                                        type="number"
                                        value={line.quantity}
                                        onChange={(e) => handleManualQtyChange(line.item._id, line.quantity, e.target.value)}
                                        className="flex-1 w-full h-full text-center text-gray-900 font-bold text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d97757]/20 appearance-none m-0"
                                    />
                                    <button
                                        onClick={() => onUpdateQty(line.item._id, 1)}
                                        className="h-full w-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-900 transition-colors border-l border-gray-100"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-gray-900 truncate leading-tight">{line.item.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{line.item.unit}</span>
                                        {line.item.category && (
                                            <span className="text-[9px] font-medium text-gray-400 bg-gray-50 px-1.5 rounded uppercase tracking-wider">
                                                {line.item.category.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => onRemove(line.item._id)}
                                    className="h-8 w-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. CHECKOUT FOOTER */}
            {/* ADDED: fixed bottom-0 left-0 right-0 md:static. This pins it to the bottom on mobile. */}
            <div className="p-4 border-t bg-white z-50 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.05)] shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] fixed bottom-0 left-0 right-0 md:static md:w-auto">
                <div className="flex justify-between items-end mb-4 px-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Items</span>
                    <span className="text-2xl font-black text-gray-900 leading-none">
                        {cart.reduce((acc, curr) => acc + curr.quantity, 0)}
                    </span>
                </div>

                <Button
                    className={`w-full h-14 text-lg font-black rounded-xl shadow-xl transition-all active:scale-[0.98] ${checkoutStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#d97757] hover:bg-[#c06245]'
                        }`}
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isCheckingOut || (!isAnonymous && !isNewClient && !selectedClient)}
                >
                    {isCheckingOut ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin h-5 w-5" /> Processing...
                        </div>
                    ) : checkoutStatus === 'success' ? (
                        <div className="flex items-center gap-2">
                            <Check className="h-6 w-6" /> Success!
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>Complete Distribution</span>
                            <ArrowRight className="h-5 w-5 opacity-50" />
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}

function MiniCounter({ label, val, set }) {
    return (
        <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-lg p-1.5">
            <span className="text-[8px] font-bold text-gray-400 uppercase mb-1">{label}</span>
            <div className="flex items-center gap-2">
                <button onClick={() => set(Math.max(0, val - 1))} className="h-5 w-5 flex items-center justify-center bg-white rounded text-gray-500 border hover:bg-gray-100">-</button>
                <span className="text-xs font-bold text-gray-900 w-3 text-center">{val}</span>
                <button onClick={() => set(val + 1)} className="h-5 w-5 flex items-center justify-center bg-white rounded text-gray-900 border hover:bg-gray-100">+</button>
            </div>
        </div>
    )
}