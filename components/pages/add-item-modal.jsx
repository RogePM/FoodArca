'use client';

import React, { useState, useEffect } from 'react';
import {
  ScanBarcode, Package, Weight, Wand2, Loader2,
  ArrowLeft, Camera, MapPin, StickyNote
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SheetHeader, SheetTitle } from '@/components/ui/SheetCart';
import { categories } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';
import { UpgradeModal } from '@/components/modals/UpgradeModal';
import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';

// 👇 IMPORT THE NEW UI SELECT COMPONENTS
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select"

export function AddItemForm({ initialCategory, onClose }) {
  const { pantryId } = usePantry();

  // --- STATE ---
  const [barcode, setBarcode] = useState('');
  const [isInternalBarcode, setIsInternalBarcode] = useState(false);

  // Form Data
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(initialCategory || categories[0]?.value || 'canned');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('units');
  const [expirationDate, setExpirationDate] = useState('');
  const [storageLocation, setStorageLocation] = useState(''); // New Field
  const [notes, setNotes] = useState(''); // New Field

  // UI States
  const [showNotes, setShowNotes] = useState(false); // Progressive Disclosure
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBarcode, setIsLoadingBarcode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- LOGIC: Internal Barcode ---
  const generateInternalBarcode = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    setBarcode(`INT-${randomCode}`);
    setIsInternalBarcode(true);
  };

  // --- LOGIC: Barcode Lookup ---
  useEffect(() => {
    const lookup = async () => {
      if (!barcode || barcode.length < 3 || isInternalBarcode) return;
      setIsLoadingBarcode(true);
      try {
        const res = await fetch(`/api/barcode/${encodeURIComponent(barcode)}`, {
          headers: { 'x-pantry-id': pantryId },
          cache: 'no-store'
        });
        const data = await res.json();
        if (data.found && data.data) {
          setItemName(data.data.name || '');
          setCategory(data.data.category || categories[0]?.value);
        }
      } catch (e) {
        console.error("Lookup failed", e);
      } finally {
        setIsLoadingBarcode(false);
      }
    };
    const timeout = setTimeout(lookup, 800);
    return () => clearTimeout(timeout);
  }, [barcode, isInternalBarcode, pantryId]);

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !quantity) return;

    setIsSubmitting(true);

    try {
      const finalBarcode = barcode.trim() || `GEN-${Date.now().toString().slice(-6)}`;
      const res = await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pantry-id': pantryId },
        body: JSON.stringify({
          barcode: finalBarcode,
          name: itemName,
          category,
          quantity: parseFloat(quantity),
          unit,
          expirationDate,
          storageLocation,
          notes,
        })
      });

      if (res.status === 403) {
        setIsSubmitting(false);
        setShowUpgradeModal(true);
        return;
      }

      if (!res.ok) throw new Error("Failed");

      onClose();
    } catch (err) {
      alert("Error adding item. Please try again.");
      setIsSubmitting(false);
    }
  };

  const focusClass = `focus-visible:ring-[#d97757] focus-visible:border-[#d97757]`;

  return (
    <div className="flex flex-col h-full bg-gray-50/50 relative">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* SCANNER OVERLAY */}
      {showScanner && (
        <BarcodeScannerOverlay
          onScan={(scannedCode) => {
            setBarcode(scannedCode);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* HEADER */}
      <SheetHeader className="px-6 py-4 bg-white border-b flex flex-row items-center gap-4 space-y-0 shrink-0">
        <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden -ml-2 text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <SheetTitle className="text-xl font-bold text-gray-900">
          Add Stock
        </SheetTitle>
      </SheetHeader>

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">

        {/* 1. BARCODE */}
        <section className="space-y-2">
          <div className="flex justify-between items-end">
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Identification</Label>
            <button type="button" onClick={generateInternalBarcode} className="text-[10px] text-[#d97757] font-medium flex items-center gap-1">
              <Wand2 className="h-3 w-3" /> No Barcode?
            </button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={barcode}
                onChange={(e) => { setBarcode(e.target.value); setIsInternalBarcode(false); }}
                placeholder="Scan or enter code..."
                className={`h-11 pl-3 pr-3 bg-white ${focusClass}`}
              />
              {isLoadingBarcode && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-[#d97757]" />}
            </div>
            <Button type="button" onClick={() => setShowScanner(true)} className="h-11 w-11 shrink-0 bg-gray-900 text-white hover:bg-[#d97757]">
              <Camera className="h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* 2. DETAILS */}
        <section className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">

          {/* Product Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-400 uppercase">Item Name</Label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Canned Beans"
              className={`h-11 bg-gray-50 border-gray-200 ${focusClass}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category - NEW SELECT */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-400 uppercase">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className={`bg-gray-50 border-gray-200 ${focusClass}`}>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200"> {/* Added bg-white */}
                  {categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expiration */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-400 uppercase">Expires</Label>
              <Input
                type="date"
                className={`h-11 bg-gray-50 border-gray-200 text-gray-600 ${focusClass}`}
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
          </div>

          {/* Storage Location */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-400 uppercase">Storage Location</Label>
            <div className="relative">
              <Input
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Aisle 3, Shelf B"
                className={`h-11 bg-gray-50 border-gray-200 ${focusClass}`}
              />
              <MapPin className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* 3. QUANTITY */}
        <section className="space-y-2">
          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Quantity</Label>
          <div className="flex gap-0 shadow-sm rounded-lg overflow-hidden border border-gray-200 bg-white">
            <Input
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`h-14 text-xl font-bold pl-4 border-0 rounded-none focus-visible:ring-inset focus-visible:ring-[#d97757] relative flex-1`}
            />

            {/* Unit Selector - NEW SELECT */}
            <div className="w-32 shrink-0 bg-gray-50 border-l border-gray-200">
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-14 w-full border-0 bg-transparent focus:ring-0 focus:ring-offset-0 rounded-none px-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectGroup>
                    <SelectLabel>Count</SelectLabel>
                    <SelectItem value="units">Units</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Weight</SelectLabel>
                    <SelectItem value="lbs">Lbs</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="oz">Oz</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* 4. NOTES */}
        <section>
          {!showNotes ? (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="text-xs font-medium text-[#d97757] flex items-center gap-1 hover:underline"
            >
              <StickyNote className="h-3 w-3" /> Add Note (Optional)
            </button>
          ) : (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <Label className="text-xs font-bold text-gray-400 uppercase flex justify-between">
                Notes
                <span onClick={() => setShowNotes(false)} className="cursor-pointer text-[#d97757] lowercase font-normal">cancel</span>
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Donated by Walmart, Dented box..."
                className="bg-white border-gray-200 min-h-[60px]"
              />
            </div>
          )}
        </section>

        {/* Spacer */}
        <div className="h-20"></div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t z-10 pb-safe">
        <Button
          size="lg"
          className="w-full h-12 text-base font-semibold bg-[#d97757] hover:bg-[#c06245] shadow-lg shadow-[#d97757]/25 transition-all active:scale-[0.98]"
          onClick={handleSubmit}
          disabled={isSubmitting || !itemName || !quantity}
        >
          {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
          {isSubmitting ? "Adding..." : "Confirm Item"}
        </Button>
      </div>
    </div>
  );
}