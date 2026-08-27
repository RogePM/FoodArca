'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Loader2, ChevronDown, Trash2, Calendar, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categories } from '@/lib/constants';
import { usePantry } from '@/components/providers/PantryProvider';
import { normalizeDateString } from '@/components/pages/inventory/inventory-utils';

export function EditItemModal({ isOpen, onClose, item, onSuccess, onItemUpdated }) {
  const { pantryId } = usePantry();

  // State
  const [itemName, setItemName] = useState('');
  
  const [category, setCategory] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState(0);

  const [quantity, setQuantity] = useState('');
  
  const [unit, setUnit] = useState('units');
  const [unitQuery, setUnitQuery] = useState('');
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [highlightedUnitIndex, setHighlightedUnitIndex] = useState(0);

  const [expirationDate, setExpirationDate] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const modalRef = useRef(null);

  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const handleResize = () => setIsDesktop(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
    handleResize(); // Initialize on mount
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Initialize state when item or open state changes
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setItemName(item.name || '');
        const itemCat = item.category || 'canned_goods';
        setCategory(itemCat);
        
        const catObj = categories.find(c => c.value === itemCat || c.name.toLowerCase() === String(itemCat).toLowerCase());
        setCategoryQuery(catObj ? catObj.name : itemCat);

        setQuantity(item.quantity !== undefined ? item.quantity : (item.totalQuantity !== undefined ? item.totalQuantity : ''));
        setUnit(item.unit || 'units');
        setUnitQuery(item.unit || 'units');
        
        setExpirationDate(normalizeDateString(item.expirationDate) || '');
        
        setStorageLocation(item.storageLocation || '');
        setNotes(item.notes || '');
      } else {
        // Adding new item
        setItemName('');
        const defaultCat = categories[0]?.value || 'canned_goods';
        setCategory(defaultCat);
        const defaultCatObj = categories.find(c => c.value === defaultCat);
        setCategoryQuery(defaultCatObj ? defaultCatObj.name : 'Canned Goods');
        setQuantity('');
        setUnit('units');
        setUnitQuery('units');
        setExpirationDate('');
        setStorageLocation('');
        setNotes('');
      }
      
      setErrorMessage('');
      setIsCategoryOpen(false);
      setIsUnitOpen(false);
    }
  }, [item, isOpen]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
        setIsUnitOpen(false);
      }
    };
    if (isOpen && typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSuccessCallback = () => {
    if (onSuccess) onSuccess();
    if (onItemUpdated) onItemUpdated();
  };

  // PUT Update or POST Create
  const handleSave = async () => {
    if (!itemName || quantity === '') return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const targetId = item ? (item.id || item._id || (item.rawBatchIds && item.rawBatchIds[0])) : null;
      const url = targetId ? `/api/foods/${targetId}` : '/api/foods';
      const method = targetId ? 'PUT' : 'POST';

      const body = {
        name: itemName,
        category,
        quantity: parseFloat(quantity) || 0,
        unit,
        expirationDate: expirationDate || null,
        storageLocation,
        notes
      };
      if (item?.barcode) {
        body.barcode = item.barcode;
      }

      if (item && item.rawBatchIds && item.rawBatchIds.length > 1) {
        // Update the primary record with the consolidated data
        const primaryId = item.rawBatchIds[0];
        const res = await fetch(`/api/foods/${primaryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(pantryId ? { 'x-pantry-id': pantryId } : {}) },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Update failed');
        }
        // Remove redundant merged records so quantity is not duplicated
        const excessIds = item.rawBatchIds.slice(1);
        await Promise.all(
          excessIds.map((batchId) =>
            fetch(`/api/foods/${batchId}`, {
              method: 'DELETE',
              headers: { ...(pantryId ? { 'x-pantry-id': pantryId } : {}) },
            })
          )
        );
      } else {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', ...(pantryId ? { 'x-pantry-id': pantryId } : {}) },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `${targetId ? 'Update' : 'Creation'} failed`);
        }
      }
      handleSuccessCallback();
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || `Error ${item ? 'updating' : 'creating'} item.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE Item
  const handleDelete = async () => {
    if (!item) return;
    const targetId = item.id || item._id || (item.rawBatchIds && item.rawBatchIds[0]);
    if (!targetId) return;
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    setIsDeleting(true);
    setErrorMessage('');
    try {
      if (item.rawBatchIds && item.rawBatchIds.length > 1) {
        const deletePromises = item.rawBatchIds.map((batchId) =>
          fetch(`/api/foods/${batchId}`, {
            method: 'DELETE',
            headers: { ...(pantryId ? { 'x-pantry-id': pantryId } : {}) },
          })
        );
        const results = await Promise.all(deletePromises);
        if (results.some((res) => !res.ok)) {
          throw new Error('Failed to delete some batch records');
        }
      } else {
        const res = await fetch(`/api/foods/${targetId}`, {
          method: 'DELETE',
          headers: { ...(pantryId ? { 'x-pantry-id': pantryId } : {}) },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Delete failed');
        }
      }
      handleSuccessCallback();
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Error deleting item.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Common Input Class
  const inputClass = "w-full h-10 md:h-11 px-3 md:px-4 rounded-[12px] md:rounded-[14px] border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757] outline-none transition-all text-[14px] md:text-[15px] font-semibold text-gray-900";
  const labelClass = "block text-[12px] md:text-[13px] font-medium text-gray-600 mb-1.5";

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase()));
  const unitsList = ['units', 'lbs', 'oz', 'kg', 'gal', 'box', 'pack'];
  const filteredUnits = unitsList.filter(u => u.toLowerCase().includes(unitQuery.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:flex-row md:justify-end font-sans">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            ref={modalRef}
            initial={isDesktop ? { x: '100%', opacity: 0 } : { y: '100%', opacity: 0 }}
            animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
            exit={isDesktop ? { x: '100%', opacity: 0 } : { y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full h-[100dvh] bg-[#f7f7f5] md:bg-white md:absolute md:right-0 md:h-[100dvh] md:max-h-[100dvh] md:w-[480px] md:rounded-none md:rounded-l-[32px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-2 md:px-8 py-3 md:py-5 border-b border-gray-100/60 bg-[#f7f7f5]/90 md:bg-white z-10 relative pt-[max(env(safe-area-inset-top,16px),16px)] md:pt-5">
              
              {/* Mobile Back Button */}
              <button onClick={onClose} className="flex md:hidden items-center text-[#d97757] font-medium text-[17px] active:opacity-50 transition-opacity px-2 z-20">
                <ArrowLeft className="h-6 w-6 mr-1" strokeWidth={2} /> Back
              </button>
              
              {/* Mobile Title */}
              <h2 className="md:hidden text-[17px] font-semibold text-gray-900 tracking-tight absolute inset-x-0 text-center pointer-events-none">
                {item ? 'Edit Item' : 'Add Item'}
              </h2>

              {/* Desktop Header Content */}
              <div className="hidden md:flex flex-col">
                <h2 className="text-[19px] font-bold text-gray-900 tracking-tight">
                  {item ? 'Edit Item' : 'Add Item'}
                </h2>
                <p className="text-[13px] text-gray-500 font-medium truncate max-w-[280px]">
                  {item ? `Update details for ${item?.name || 'item'}` : 'Add a new item to your inventory'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="hidden md:flex h-9 w-9 rounded-full bg-gray-50 hover:bg-gray-100 items-center justify-center text-gray-500 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 pb-20 md:pb-8">
              {errorMessage && (
                <div className="mb-4 md:mb-5 text-[13px] md:text-sm text-red-500 font-medium bg-red-50 p-2 md:p-3 rounded-[10px] md:rounded-[12px] border border-red-100">
                  {errorMessage}
                </div>
              )}

              {/* Form Fields Card */}
              <div className="space-y-4 md:space-y-5 relative bg-white md:bg-transparent rounded-[24px] md:rounded-none border border-gray-100 md:border-transparent p-4 md:p-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] md:shadow-none">
                
                {/* Row 1: Name */}
                <div>
                  <label className={labelClass}>Item Name</label>
                  <input 
                    className={inputClass}
                    placeholder="e.g. Canned Black Beans"
                    value={itemName} onChange={(e) => setItemName(e.target.value)}
                  />
                </div>

                {/* Row 2: Category */}
                <div className="relative">
                  <label className={labelClass}>Category</label>
                  <div className="relative">
                    <input 
                      className={`${inputClass} pr-10 cursor-pointer`}
                      placeholder="Search category..."
                      value={categoryQuery} 
                      onChange={(e) => {
                        setCategoryQuery(e.target.value);
                        setIsCategoryOpen(true);
                        setHighlightedCategoryIndex(0);
                      }}
                      onFocus={() => { setIsCategoryOpen(true); setHighlightedCategoryIndex(0); setIsUnitOpen(false); }}
                      onKeyDown={(e) => {
                        if (!isCategoryOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
                          e.preventDefault(); setIsCategoryOpen(true); return;
                        }
                        if (!isCategoryOpen) return;
                        
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setHighlightedCategoryIndex(prev => {
                            const next = Math.min(prev + 1, filteredCategories.length - 1);
                            document.getElementById(`cat-edit-${next}`)?.scrollIntoView({ block: 'nearest' });
                            return next;
                          });
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setHighlightedCategoryIndex(prev => {
                            const next = Math.max(prev - 1, 0);
                            document.getElementById(`cat-edit-${next}`)?.scrollIntoView({ block: 'nearest' });
                            return next;
                          });
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filteredCategories[highlightedCategoryIndex]) {
                            setCategory(filteredCategories[highlightedCategoryIndex].value);
                            setCategoryQuery(filteredCategories[highlightedCategoryIndex].name);
                            setIsCategoryOpen(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsCategoryOpen(false);
                        }
                      }}
                    />
                    <ChevronDown className={`absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Category Dropdown */}
                  {isCategoryOpen && (
                    <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-h-56 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((c, idx) => (
                          <button
                            id={`cat-edit-${idx}`}
                            key={c.value}
                            type="button"
                            className={`w-full flex items-center px-4 py-2 text-[14px] font-medium transition-colors ${idx === highlightedCategoryIndex ? 'bg-[#d97757]/5 text-[#d97757]' : 'text-gray-700 hover:bg-[#d97757]/5 hover:text-[#d97757]'}`}
                            onClick={() => {
                              setCategory(c.value);
                              setCategoryQuery(c.name);
                              setIsCategoryOpen(false);
                            }}
                            onMouseEnter={() => setHighlightedCategoryIndex(idx)}
                          >
                            {c.icon && <c.icon className="h-4 w-4 mr-2 opacity-70" strokeWidth={2} />}
                            {c.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-[13px] text-gray-500 text-center font-medium">No categories found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Row 3: Qty & Unit */}
                <div className="flex gap-4 relative z-40 min-w-0">
                  <div className="w-1/2 min-w-0">
                    <label className={labelClass}>Quantity</label>
                    <input 
                      type="number"
                      className={inputClass}
                      placeholder="1.0"
                      value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="w-1/2 relative min-w-0">
                    <label className={labelClass}>Unit</label>
                    <div className="relative min-w-0">
                      <input 
                        className={`${inputClass} pr-8 cursor-pointer`}
                        placeholder="units"
                        value={unitQuery} 
                        onChange={(e) => {
                          setUnitQuery(e.target.value);
                          setIsUnitOpen(true);
                          setHighlightedUnitIndex(0);
                        }}
                        onFocus={() => { setIsUnitOpen(true); setHighlightedUnitIndex(0); setIsCategoryOpen(false); }}
                        onKeyDown={(e) => {
                          if (!isUnitOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
                            e.preventDefault(); setIsUnitOpen(true); return;
                          }
                          if (!isUnitOpen) return;
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHighlightedUnitIndex(prev => {
                              const next = Math.min(prev + 1, filteredUnits.length - 1);
                              document.getElementById(`unit-edit-${next}`)?.scrollIntoView({ block: 'nearest' });
                              return next;
                            });
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightedUnitIndex(prev => {
                              const next = Math.max(prev - 1, 0);
                              document.getElementById(`unit-edit-${next}`)?.scrollIntoView({ block: 'nearest' });
                              return next;
                            });
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredUnits[highlightedUnitIndex]) {
                              setUnit(filteredUnits[highlightedUnitIndex]);
                              setUnitQuery(filteredUnits[highlightedUnitIndex]);
                              setIsUnitOpen(false);
                            }
                          } else if (e.key === 'Escape') {
                            setIsUnitOpen(false);
                          }
                        }}
                      />
                      <ChevronDown className={`absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none transition-transform duration-200 ${isUnitOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Unit Dropdown */}
                    {isUnitOpen && (
                      <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-h-56 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1">
                        {filteredUnits.length > 0 ? (
                          filteredUnits.map((u, idx) => (
                            <button
                              id={`unit-edit-${idx}`}
                              key={u}
                              type="button"
                              className={`w-full text-left px-4 py-2 text-[14px] font-medium transition-colors ${idx === highlightedUnitIndex ? 'bg-[#d97757]/5 text-[#d97757]' : 'text-gray-700 hover:bg-[#d97757]/5 hover:text-[#d97757]'}`}
                              onClick={() => {
                                setUnit(u);
                                setUnitQuery(u);
                                setIsUnitOpen(false);
                              }}
                              onMouseEnter={() => setHighlightedUnitIndex(idx)}
                            >
                              {u}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-[13px] text-gray-500 text-center font-medium">No units found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 4: Expiration */}
                <div className="relative z-30">
                  <label className={labelClass}>Expiration Date</label>
                  <div className="relative min-w-0">
                    <Calendar className="md:hidden absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input 
                      type="date" 
                      className={`${inputClass} pl-10 md:pl-3 lg:md:pl-4 appearance-none min-w-0 w-full`}
                      value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="h-[1px] bg-gray-100/80 w-full my-6 relative z-10" />

                {/* Row 5: Location */}
                <div className="relative z-10">
                  <label className={labelClass}>Storage Location <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input 
                    className={inputClass}
                    placeholder="e.g. Aisle 3, Top Shelf"
                    value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)}
                  />
                </div>

                <div className="relative z-10">
                  <label className={labelClass}>Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <textarea 
                    className={`${inputClass} h-auto py-3 min-h-[80px] resize-none`}
                    placeholder="Add optional notes..."
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Inline Actions */}
                <div className={`pt-6 pb-2 md:pb-4 flex items-center ${item ? 'justify-between' : 'justify-end'} gap-3 md:gap-4 border-t border-gray-100/80 mt-8`}>
                  {item && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 h-10 md:h-11 text-[13px] md:text-[14px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-[12px] md:rounded-[14px] transition-colors active:scale-[0.98]"
                    >
                      {isDeleting ? <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" strokeWidth={2.5} />}
                      Delete
                    </button>
                  )}

                  <Button
                    className={`${item ? 'flex-1 max-w-[180px] md:max-w-[200px]' : 'w-full md:w-auto md:min-w-[180px]'} h-10 md:h-12 text-[14px] md:text-[15px] font-semibold bg-[#d97757] hover:bg-[#c06245] rounded-[12px] md:rounded-[16px] transition-transform active:scale-[0.98] shadow-[0_4px_15px_-3px_rgba(217,119,87,0.3)] text-white`}
                    onClick={handleSave}
                    disabled={isSubmitting || !itemName || quantity === '' || !category}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : item ? "Save Changes" : "Add Item"}
                  </Button>
                </div>

              </div>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
