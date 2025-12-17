'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Minus, Plus, Trash2, Check, ArrowRight,
    User, PackageOpen, Camera, Loader2, ScanBarcode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePantry } from '@/components/providers/PantryProvider';
import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';

export function DistributionCart({ cart, onUpdateQty, onRemove, onCheckoutSuccess, onAddItemByBarcode }) {
    const { pantryId, pantryDetails } = usePantry();

    // Feature Flag: Default to TRUE if settings don't exist yet
    const enableClientTracking = pantryDetails?.settings?.enable_client_tracking ?? true;

    // Checkout Form State
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientId, setClientId] = useState('');
    const [reason, setReason] = useState('distribution-individual');

    // Processing State
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState(null);

    // Scanner State
    const [showScanner, setShowScanner] = useState(false);
    const [isLookingUp, setIsLookingUp] = useState(false);

    const formatCategory = (cat) => {
        return cat ? cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'General';
    };

    // --- 1. BARCODE SCANNER (Unchanged) ---
    const handleBarcodeScanned = async (barcode) => {
        console.log('📷 Scanned barcode:', barcode);
        setShowScanner(false);
        setIsLookingUp(true);

        try {
            const res = await fetch(`/api/barcode/${encodeURIComponent(barcode)}`, {
                headers: { 'x-pantry-id': pantryId }
            });
            const data = await res.json();

            if (data.found && data.data) {
                if (onAddItemByBarcode) onAddItemByBarcode(data.data);
            } else {
                alert('Item not found in inventory');
            }
        } catch (error) {
            console.error('❌ Barcode lookup error:', error);
            alert('Error looking up barcode');
        } finally {
            setIsLookingUp(false);
        }
    };

    // --- 2. CHECKOUT LOGIC (Fixed) ---
    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // Validation: Only enforce names if we are NOT in anonymous mode AND tracking is on
        if (enableClientTracking && !isAnonymous) {
            if (!clientName.trim()) {
                alert("Please enter a Client Name or select 'Walk-in / Anonymous'");
                return;
            }
        }

        setIsCheckingOut(true);
        try {
            for (const line of cart) {
                const { item, quantity } = line;
                const newStock = item.quantity - quantity;

                // -------------------------------------------------------------
                // 🔥 CRITICAL FIX: POINT TO THE NEW API
                // -------------------------------------------------------------
                // We use /api/client-distributions because that is where we added
                // the "Auto-create Client Profile" logic.
                await fetch('/api/client-distributions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-pantry-id': pantryId },
                    body: JSON.stringify({
                        itemId: item._id,
                        itemName: item.name,
                        category: item.category,
                        quantityDistributed: quantity,
                        unit: 'units',
                        reason: reason,

                        // Smart Payload:
                        // 1. If tracking is OFF -> Send nulls (Backend handles defaults)
                        // 2. If Anonymous -> Send 'Walk-in' and NO ID (Backend sees "SYS" and skips directory save)
                        // 3. If Real Client -> Send Name and ID (Backend saves to Directory)
                        clientName: enableClientTracking
                            ? (isAnonymous ? 'Walk-in Client' : clientName)
                            : null,
                        clientId: enableClientTracking
                            ? (isAnonymous ? undefined : clientId)
                            : null
                    })
                });

                // B. Update/Delete Item (Keep existing logic)
                if (newStock <= 0) {
                    await fetch(`/api/foods/${item._id}?reason=Distributed+Full+Stock`, {
                        method: 'DELETE',
                        headers: { 'x-pantry-id': pantryId }
                    });
                } else {
                    await fetch(`/api/foods/${item._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'x-pantry-id': pantryId },
                        body: JSON.stringify({
                            name: item.name, category: item.category, quantity: newStock,
                            expirationDate: item.expirationDate, storageLocation: item.storageLocation,
                            barcode: item.barcode
                        })
                    });
                }
            }

            setCheckoutStatus('success');
            setClientName('');
            setClientId('');

            setTimeout(() => {
                setCheckoutStatus(null);
                onCheckoutSuccess();
            }, 1500);

        } catch (error) {
            console.error("Checkout Error:", error);
            alert("Error processing distribution.");
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">

            {showScanner && (
                <BarcodeScannerOverlay
                    onScan={handleBarcodeScanned}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {isLookingUp && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3">
                        <Loader2 className="animate-spin h-6 w-6 text-[#d97757]" />
                        <span className="font-medium text-gray-700">Looking up item...</span>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="p-4 border-b bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <PackageOpen className="h-5 w-5 text-[#d97757]" />
                    <h3 className="font-semibold text-lg">Distribution Cart</h3>
                    <span className="text-sm text-muted-foreground">({cart.length})</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowScanner(true)} disabled={isCheckingOut} className="gap-2">
                    <Camera className="h-4 w-4" /> Scan
                </Button>
            </div>

            {/* CART LIST */}
            {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
                    <PackageOpen className="h-16 w-16 opacity-20" />
                    <p>Cart is empty</p>
                    <Button variant="outline" onClick={() => setShowScanner(true)} className="gap-2">
                        <ScanBarcode className="h-4 w-4" /> Start Scanning
                    </Button>
                </div>
            ) : (
                <>
                    {/* SCROLLABLE ITEMS LIST */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="divide-y divide-gray-100">
                            {cart.map(line => (
                                <div key={line.item._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <p className="font-medium text-sm truncate text-gray-900">{line.item.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{formatCategory(line.item.category)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQty(line.item._id, -1)} disabled={isCheckingOut}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <Input
                                            type="number"
                                            value={line.quantity}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && val >= 0) onUpdateQty(line.item._id, val - line.quantity);
                                            }}
                                            className="w-16 h-8 p-0 text-center border-gray-200"
                                        />
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQty(line.item._id, 1)} disabled={line.quantity >= line.item.quantity || isCheckingOut}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive ml-1" onClick={() => onRemove(line.item._id)} disabled={isCheckingOut}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FIXED BOTTOM FORM */}
                    <div className="p-5 border-t bg-gray-50 pb-safe-area shrink-0">
                        <div className="space-y-5">

                            {/* 🔥 FEATURE FLAG CHECK */}
                            {enableClientTracking && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isAnonymous ? 'bg-gray-100' : 'bg-blue-50 text-blue-600'}`}>
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recipient</span>
                                                <span className="text-sm font-medium">{isAnonymous ? 'Anonymous / Walk-in' : 'Registered Client'}</span>
                                            </div>
                                        </div>
                                        <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} disabled={isCheckingOut} />
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {!isAnonymous && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                                                <Input placeholder="Client Name (Required)" value={clientName} onChange={(e) => setClientName(e.target.value)} disabled={isCheckingOut} className="bg-white" />
                                                <Input placeholder="Client ID (Optional)" value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={isCheckingOut} className="bg-white" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Reason Select */}
                            <div className="grid gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Reason</label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isCheckingOut}>
                                    <option value="distribution-individual">Individual Assistance</option>
                                    <option value="distribution-family">Family Box</option>
                                    <option value="distribution-emergency">Emergency</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Submit Button */}
                            <Button className={`w-full h-12 text-base font-semibold shadow-lg transition-all ${checkoutStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#d97757] hover:bg-[#c06245]'}`} onClick={handleCheckout} disabled={cart.length === 0 || isCheckingOut}>
                                {isCheckingOut ? "Processing..." : checkoutStatus === 'success' ? <><Check className="mr-2 h-5 w-5" /> Done!</> : <div className="flex items-center gap-2">Complete Distribution <ArrowRight className="h-4 w-4" /></div>}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}