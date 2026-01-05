'use client';

import React, { useState, useEffect } from 'react';
import {
  Trash2, Loader2, Save, Package, Weight,
  MapPin, ScanBarcode, Tag, ChevronDown, X, Camera,
  StickyNote, Calendar, Layers
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';

import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';
import { categories as CATEGORY_OPTIONS } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';

// Remove browser default spinners on number inputs
const noSpinnerClass = "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function InventoryFormBar({ isOpen, onOpenChange, item, onItemUpdated }) {
  const { pantryId } = usePantry();

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    quantity: '',
    unit: 'units',
    expirationDate: '',
    storageLocation: '',
    notes: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // UI States
  const [showScanner, setShowScanner] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // --- LOAD DATA ---
  useEffect(() => {
    if (isOpen) {
      setMessage({ type: '', text: '' });
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
          notes: item.notes || '',
        });
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
          notes: '',
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
    setFormData(prev => ({ ...prev, barcode: code }));
    setShowScanner(false);
  };

  // --- ACTIONS ---
  const handleSubmit = async () => {
    if (!pantryId) return;
    if (!formData.name) {
      setMessage({ type: 'error', text: 'Item name is required' });
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
        setMessage({ type: 'success', text: 'Item saved successfully!' });
        setTimeout(() => {
          onItemUpdated?.();
          onOpenChange(false);
        }, 500);
      } else {
        setMessage({ type: 'error', text: 'Failed to save item.' });
      }
    } catch (error) {
      console.error('Error saving:', error);
      setMessage({ type: 'error', text: 'Network error occurred.' });
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
        onItemUpdated?.();
        onOpenChange(false);
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
          className="w-full sm:max-w-md flex flex-col h-full p-0 bg-white shadow-2xl border-l border-gray-200"
        >
          {/* HEADER (Fixed) */}
          <SheetHeader className="px-6 py-5 border-b bg-gray-50/50 flex flex-row items-center justify-between space-y-0">
            <div className="flex flex-col gap-1">
              <SheetTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-[#d97757]" strokeWidth={3} />
                {item ? 'Edit Inventory' : 'Add Item'}
              </SheetTitle>
              {message.text && (
                <div className={`text-[10px] font-bold uppercase tracking-wide ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {message.text}
                </div>
              )}
            </div>
            
            {/* Custom X Button */}
            <button 
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>

          {/* BODY (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

            {/* 1. STOCK LEVEL (Redesigned: Clean Input Group) */}
            <section className="space-y-4">
               <Label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                  <Weight className="h-3.5 w-3.5 text-[#d97757]" /> Stock Level
               </Label>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <Label className="text-[10px] font-black text-gray-400 uppercase">Quantity</Label>
                     <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        step="any"
                        placeholder="0"
                        value={formData.quantity}
                        onChange={handleChange}
                        className={`h-11 text-lg font-bold border-2 border-gray-100 rounded-xl focus:border-[#d97757] focus:ring-0 ${noSpinnerClass}`}
                     />
                  </div>
                  <div className="space-y-1">
                     <Label className="text-[10px] font-black text-gray-400 uppercase">Unit</Label>
                     <div className="relative">
                        <select
                           name="unit"
                           value={formData.unit}
                           onChange={handleChange}
                           className="w-full h-11 appearance-none rounded-xl border-2 border-gray-100 bg-white pl-3 pr-8 text-sm font-medium shadow-sm focus:border-[#d97757] focus:outline-none"
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
                        <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                     </div>
                  </div>
               </div>
            </section>

            {/* 2. IDENTIFICATION (Card Style) */}
            <section className="space-y-4 bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 shadow-inner">
              <Label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-[#d97757]" /> Identification
              </Label>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-gray-400 uppercase">Item Name</Label>
                  <Input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className="h-11 border-2 border-gray-100 bg-white rounded-xl focus:border-[#d97757] focus:ring-0 transition-all font-medium" 
                    placeholder="e.g. Canned Corn"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-gray-400 uppercase">Barcode / SKU</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ScanBarcode className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                      <Input 
                        name="barcode" 
                        value={formData.barcode} 
                        onChange={handleChange} 
                        className="h-11 pl-9 border-2 border-gray-100 bg-white rounded-xl font-mono text-sm focus:border-[#d97757] focus:ring-0 transition-all" 
                        placeholder="Scan or type..."
                      />
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => setShowScanner(true)}
                      className="h-11 w-11 rounded-xl bg-gray-900 hover:bg-black text-white shrink-0"
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. LOGISTICS (Card Style) */}
            <section className="space-y-4 bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 shadow-inner">
               <Label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-[#d97757]" /> Logistics
               </Label>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <Label className="text-[10px] font-black text-gray-400 uppercase">Category</Label>
                     <div className="relative">
                        <select
                           name="category"
                           value={formData.category}
                           onChange={handleChange}
                           className="w-full h-11 appearance-none rounded-xl border-2 border-white bg-white pl-3 pr-8 text-sm font-medium shadow-sm focus:border-[#d97757] focus:outline-none"
                        >
                           {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat.value} value={cat.value}>{cat.name}</option>
                           ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                     </div>
                  </div>

                  <div className="space-y-1">
                     <Label className="text-[10px] font-black text-gray-400 uppercase">Expiration</Label>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                        <Input 
                           name="expirationDate" 
                           type="date" 
                           value={formData.expirationDate} 
                           onChange={handleChange} 
                           className="h-11 pl-9 border-2 border-white bg-white rounded-xl shadow-sm text-sm focus:border-[#d97757] focus:ring-0" 
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-1">
                  <Label className="text-[10px] font-black text-gray-400 uppercase">Storage Location</Label>
                  <div className="relative">
                     <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                     <Input 
                        name="storageLocation" 
                        value={formData.storageLocation} 
                        onChange={handleChange} 
                        placeholder="e.g. Shelf A, Bin 2"
                        className="h-11 pl-9 border-2 border-white bg-white rounded-xl shadow-sm focus:border-[#d97757] focus:ring-0 transition-all" 
                     />
                  </div>
               </div>
            </section>

            {/* 4. NOTES (Collapsible) */}
            <section className="space-y-3">
              {!showNotes ? (
                <button
                  type="button"
                  onClick={() => setShowNotes(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-[#d97757] hover:text-[#d97757] transition-all"
                >
                  <StickyNote className="h-4 w-4" /> 
                  {formData.notes ? "View Notes" : "Add Note"}
                </button>
              ) : (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                      <StickyNote className="h-3.5 w-3.5 text-[#d97757]" /> Item Notes
                    </Label>
                    <button onClick={() => setShowNotes(false)} className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase">
                      Close
                    </button>
                  </div>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="E.g. Donated by Walmart, dented packaging..."
                    className="bg-white border-2 border-gray-100 rounded-xl min-h-[100px] text-sm resize-none focus-visible:ring-0 focus-visible:border-[#d97757]"
                  />
                </div>
              )}
            </section>

            <div className="h-24"></div>
          </div>

          {/* FOOTER (Fixed) */}
          <SheetFooter className="px-6 py-5 border-t bg-white flex flex-row items-center justify-between gap-3 z-20 shrink-0 pb-safe">
            {item ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 px-4 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
              >
                <Trash2 className="h-5 w-5 mr-2 md:mr-0" /> <span className="md:hidden">Delete</span>
              </Button>
            ) : (
              <div className="w-2"></div>
            )}

            <div className="flex gap-3 flex-1 justify-end">
              <SheetClose asChild>
                 <Button type="button" variant="outline" className="h-11 px-6 rounded-xl font-bold border-2">Cancel</Button>
              </SheetClose>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving || isDeleting || !pantryId}
                className="h-11 flex-1 text-base font-bold bg-[#d97757] hover:bg-[#c06245] text-white shadow-md shadow-[#d97757]/20 transition-all active:scale-[0.98] rounded-xl"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {isSaving ? 'Saving...' : 'Save Item'}
              </Button>
            </div>
          </SheetFooter>

        </SheetContent>
      </Sheet>
    </>
  );
}