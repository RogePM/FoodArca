'use client';

import React, { useState, useEffect } from 'react';
import {
  Trash2, Loader2, Save, Package, Weight,
  MapPin, ScanBarcode, Tag, ChevronDown, X, Camera,
  StickyNote // Imported Icon
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Ensure you have this component
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@/components/ui/SheetCart';

import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';
import { categories as CATEGORY_OPTIONS } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';

const noSpinnerClass = "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function InventoryFormBar({ isOpen, onOpenChange, item, onItemUpdated }) {
  const { pantryId } = usePantry();
  const focusClass = `focus-visible:ring-[#d97757] focus-visible:border-[#d97757]`;

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    quantity: '',
    unit: 'units',
    expirationDate: '',
    storageLocation: '',
    notes: '', // ✅ Added Notes State
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  
  // UI States
  const [showScanner, setShowScanner] = useState(false);
  const [showNotes, setShowNotes] = useState(false); // ✅ Toggle for Notes UI

  // --- LOAD DATA ---
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      if (item) {
        setFormData({
          name: item.name || '',
          barcode: item.barcode || '',
          category: item.category || CATEGORY_OPTIONS[0].value,
          quantity: item.quantity?.toString() || '',
          unit: item.unit || 'units',
          expirationDate: item.expirationDate
            ? format(new Date(item.expirationDate), 'yyyy-MM-dd')
            : '',
          storageLocation: item.storageLocation || '',
          notes: item.notes || '', // ✅ Load existing notes
        });
        // ✅ Automatically show the notes box if notes exist
        setShowNotes(!!item.notes);
      } else {
        setFormData({
          name: '',
          barcode: '',
          category: CATEGORY_OPTIONS[0].value,
          quantity: '',
          unit: 'units',
          expirationDate: '',
          storageLocation: '',
          notes: '', // Reset
        });
        setShowNotes(false);
      }
    }
  }, [item, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScan = (code) => {
    console.log("Scanned:", code);
    setFormData(prev => ({ ...prev, barcode: code }));
    setShowScanner(false);
  };

  // --- ACTIONS ---
  const handleSubmit = async () => {
    if (!pantryId) return;
    if (!formData.name) {
      alert("Item name is required");
      return;
    }

    const url = item?._id ? `/api/foods/${item._id}` : '/api/foods';
    const method = item?._id ? 'PUT' : 'POST';

    setIsSaving(true);
    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'x-pantry-id': pantryId
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity) || 0
        }),
      });

      if (res.ok) {
        setMessage('✅ Saved');
        setTimeout(() => {
          onItemUpdated?.();
          onOpenChange(false);
        }, 500);
      } else {
        setMessage('Failed to save.');
      }
    } catch (error) {
      console.error('Error saving:', error);
      setMessage('Error saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item?._id) return;
    if (!confirm("Delete this item permanently?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/foods/${item._id}`, {
        method: 'DELETE',
        headers: { 'x-pantry-id': pantryId }
      });
      if (res.ok) {
        onOpenChange(false);
        onItemUpdated?.();
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* CAMERA OVERLAY */}
      {showScanner && (
        <BarcodeScannerOverlay
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col h-[100dvh] p-0 bg-[#f9fafb] border-l-0 sm:border-l"
        >
          {/* HEADER */}
          <SheetHeader className="px-5 py-4 bg-white border-b border-gray-100 flex flex-row items-center justify-between shrink-0 space-y-0">
            <SheetTitle className="text-xl font-bold text-gray-900">
              {item ? 'Edit Item' : 'New Item'}
            </SheetTitle>
            {message ? (
              <span className={`text-xs font-bold px-3 py-1 rounded-full animate-in fade-in zoom-in ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {message}
              </span>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="md:hidden text-gray-400 -mr-2">
                {/* <X className="h-5 w-5" /> */}
              </Button>
            )}
          </SheetHeader>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">

            {/* IDENTIFICATION CARD */}
            <section className="space-y-3">
              <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 ml-1">
                <ScanBarcode className="h-3.5 w-3.5 text-[#d97757]" /> Identification
              </Label>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-gray-500 uppercase">Item Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`h-12 bg-gray-50 border-gray-200 ${focusClass} text-base`}
                    required
                    placeholder="e.g. Organic Milk"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="barcode" className="text-xs font-semibold text-gray-500 uppercase">Barcode / SKU</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="barcode"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleChange}
                        className={`h-12 pl-4 pr-10 bg-gray-50 border-gray-200 font-mono text-base ${focusClass}`}
                        placeholder="Scan or enter code"
                      />
                      <ScanBarcode className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                    <Button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      className="h-12 w-12 shrink-0 bg-gray-900 text-white hover:bg-black"
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* DETAILS CARD */}
            <section className="space-y-3">
              <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 ml-1">
                <Tag className="h-3.5 w-3.5 text-[#d97757]" /> Details
              </Label>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs font-semibold text-gray-500 uppercase">Category</Label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className={`appearance-none w-full h-12 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d97757] focus:border-transparent`}
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-4 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="expirationDate" className="text-xs font-semibold text-gray-500 uppercase">Expires</Label>
                    <Input
                      id="expirationDate"
                      name="expirationDate"
                      type="date"
                      value={formData.expirationDate}
                      onChange={handleChange}
                      className={`h-12 bg-gray-50 border-gray-200 text-gray-600 ${focusClass} text-base`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="storageLocation" className="text-xs font-semibold text-gray-500 uppercase">Storage</Label>
                  <div className="relative">
                    <Input
                      id="storageLocation"
                      name="storageLocation"
                      value={formData.storageLocation}
                      onChange={handleChange}
                      placeholder="e.g. Shelf A"
                      className={`h-12 bg-gray-50 border-gray-200 ${focusClass} text-base`}
                    />
                    <MapPin className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* INVENTORY LEVEL CARD */}
            <section className="space-y-3">
              <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 ml-1">
                <Package className="h-3.5 w-3.5 text-[#d97757]" /> Inventory Level
              </Label>

              <div className="flex gap-0 shadow-sm rounded-lg overflow-hidden border border-gray-200 bg-white ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-[#d97757] focus-within:ring-offset-2 focus-within:border-[#d97757]">
                <div className="relative flex-1">
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="any"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    className={`h-14 text-xl font-bold pl-4 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 z-10 relative bg-transparent text-base ${noSpinnerClass}`}
                  />
                </div>
                <div className="relative bg-gray-50 border-l border-gray-200 w-32 shrink-0">
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full h-full appearance-none bg-transparent pl-4 pr-8 text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <optgroup label="Count">
                      <option value="units">Units</option>
                    </optgroup>
                    <optgroup label="Weight">
                      <option value="lbs">Lbs</option>
                      <option value="kg">Kg</option>
                      <option value="oz">Oz</option>
                    </optgroup>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#d97757]">
                    {formData.unit === 'units' ? <Package className="h-4 w-4" /> : <Weight className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            </section>

            {/* 📝 NEW: NOTES SECTION (Collapsible) */}
            <section className="space-y-3">
              {!showNotes ? (
                <button
                  type="button"
                  onClick={() => setShowNotes(true)}
                  className="text-xs font-medium text-[#d97757] flex items-center gap-1.5 hover:underline py-2"
                >
                  <StickyNote className="h-3.5 w-3.5" /> 
                  {formData.notes ? "Edit Note" : "Add Note (Optional)"}
                </button>
              ) : (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="notes" className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                      <StickyNote className="h-3.5 w-3.5 text-[#d97757]" /> Item Notes
                    </Label>
                    <span onClick={() => setShowNotes(false)} className="cursor-pointer text-xs text-[#d97757] font-medium">
                      Hide
                    </span>
                  </div>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="E.g. Donated by Walmart, dented packaging..."
                    className="bg-white border-gray-200 min-h-[80px] text-base resize-none focus-visible:ring-[#d97757]"
                  />
                </div>
              )}
            </section>

            <div className="h-24"></div>
          </div>

          {/* FOOTER */}
          <SheetFooter className="px-5 py-5 border-t bg-white flex flex-row items-center justify-between gap-3 z-20 shrink-0 pb-safe">
            {item ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-12 w-12 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
              >
                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              </Button>
            ) : (
              <div className="w-2"></div>
            )}

            <div className="flex gap-3 flex-1 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-12 px-6 text-base font-medium border-gray-200 hover:bg-gray-50 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving || isDeleting || !pantryId}
                className="h-12 flex-1 text-base font-semibold bg-[#d97757] hover:bg-[#c06245] text-white shadow-md shadow-[#d97757]/20 transition-all active:scale-[0.98] rounded-xl"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </SheetFooter>

        </SheetContent>
      </Sheet>
    </>
  );
}