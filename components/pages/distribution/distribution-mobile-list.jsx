import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Minus, Plus, Camera, CheckCircle2, ScanBarcode, ShoppingCart, Trash2 } from 'lucide-react';
import { categories } from '@/lib/constants';
import { getExpirationStatus, formatDate } from '../inventory/inventory-utils';

export function DistributionMobileList({ inventory = [], cart = [], setGroupCartQty, onUpdateQty, onRemove, onOpenCart, onOpenScanner, onCheckout }) {
  // 1. State Management
  const [view] = useState('CART_VIEW');
  
  // Search State
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Group inventory for suggestions
  const suggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const q = searchInput.toLowerCase();
    
    const groups = {};
    inventory.forEach(item => {
      const key = item.barcode || item.name;
      if (!groups[key]) groups[key] = { mainItem: item, batches: [], totalQuantity: 0 };
      groups[key].batches.push(item);
      groups[key].totalQuantity += item.quantity;
    });

    Object.values(groups).forEach(g => {
      g.batches.sort((a, b) => (!a.expirationDate ? 1 : !b.expirationDate ? -1 : new Date(a.expirationDate) - new Date(b.expirationDate)));
    });

    return Object.values(groups)
      .filter(g => g.mainItem.name.toLowerCase().includes(q) || g.mainItem.barcode?.includes(q))
      .slice(0, 5); // Limit to top 5 suggestions
  }, [inventory, searchInput]);

  // Group real cart items by barcode/name for mobile display
  const groupedCart = useMemo(() => {
    const groups = {};
    cart.forEach(line => {
      const key = line.item.barcode || line.item.name;
      if (!groups[key]) {
        groups[key] = {
          mainItem: line.item,
          batches: [],
          quantity: 0
        };
      }
      groups[key].batches.push(line.item);
      groups[key].quantity += line.quantity;
    });
    return Object.values(groups);
  }, [cart]);

  // 2. Add to Cart Logic
  const handleAddSuggestion = (group) => {
    if (setGroupCartQty) {
      const groupIds = new Set(group.batches.map(b => b._id || b.id));
      const inCartQty = cart.filter(c => groupIds.has(c.item._id || c.item.id)).reduce((sum, c) => sum + c.quantity, 0);
      setGroupCartQty(group, inCartQty + 1);
    }
    setSearchInput('');
    setShowSuggestions(false);
  };

  const handleUpdateQuantity = (mainItem, newQuantity) => {
    const validQty = typeof newQuantity === 'number' && !isNaN(newQuantity) ? Math.max(0, newQuantity) : 1;
    const matchingBatches = inventory.filter(i => (i.barcode && i.barcode === mainItem.barcode) || i.name === mainItem.name);
    if (matchingBatches.length > 0 && setGroupCartQty) {
      const group = {
        mainItem: matchingBatches[0],
        batches: matchingBatches,
        totalQuantity: matchingBatches.reduce((sum, b) => sum + b.quantity, 0)
      };
      setGroupCartQty(group, validQty);
    } else if (onUpdateQty) {
      const existing = cart.find(c => (c.item.id || c.item._id) === (mainItem.id || mainItem._id));
      const currentQty = existing ? existing.quantity : 1;
      onUpdateQty(mainItem.id || mainItem._id, validQty - currentQty);
    }
  };

  const handleRemoveItem = (mainItem) => {
    const matchingBatches = inventory.filter(i => (i.barcode && i.barcode === mainItem.barcode) || i.name === mainItem.name);
    if (matchingBatches.length > 0 && setGroupCartQty) {
      const group = {
        mainItem: matchingBatches[0],
        batches: matchingBatches
      };
      setGroupCartQty(group, 0);
    } else if (onRemove) {
      onRemove(mainItem.id || mainItem._id);
    }
  };

  const getDotColor = (className) => {
    if (!className) return '#34d399'; // emerald-400
    if (className.includes('red')) return '#ef4444'; // red-500
    if (className.includes('orange')) return '#f97316'; // orange-500
    if (className.includes('yellow')) return '#fbbf24'; // amber-400
    return '#34d399'; // emerald-400
  };

  const totalItemsInCart = cart.reduce((sum, item) => sum + (typeof item.quantity === 'number' ? item.quantity : 0), 0);

  if (view !== 'CART_VIEW') return null;

  return (
    <div className="md:hidden flex flex-col h-full font-sans bg-[#fafafa] overflow-hidden relative">
      
      {/* 2. TOP BAR: Smart Manual Entry */}
      <div className="px-4 py-4 z-20 shrink-0">
        <div className="relative">
          <div className="relative flex items-center bg-white border border-gray-200 rounded-[16px] h-14 shadow-sm focus-within:ring-2 focus-within:ring-[#154734]/20 focus-within:border-[#154734] transition-all">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" strokeWidth={2.5} />
            <input 
              type="text"
              placeholder="Search by name (e.g. Beans)..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full h-full pl-12 pr-[88px] bg-transparent outline-none text-[16px] font-semibold text-gray-900 placeholder:text-gray-400 rounded-[16px]"
            />
            <button 
              onClick={onOpenScanner}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-3 bg-[#d97757] active:bg-[#c66547] rounded-[12px] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ScanBarcode className="h-4 w-4 text-white" strokeWidth={2.5} />
              <span className="text-[13px] font-bold text-white">Scan</span>
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showSuggestions && searchInput.trim() && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden"
              >
                {suggestions.length > 0 ? (
                  <div className="py-2 divide-y divide-gray-50">
                    {suggestions.map((group) => {
                      const cat = categories.find(c => c.value === group.mainItem.category?.toLowerCase()) || categories.find(c => c.value === 'other');
                      const Style = cat.style;
                      const Icon = cat.icon;
                      
                      const earliestBatch = group.batches[0];
                      const hasExp = !!earliestBatch?.expirationDate;
                      const expStatus = hasExp ? getExpirationStatus(earliestBatch.expirationDate) : null;

                      return (
                        <button
                          key={group.mainItem._id || group.mainItem.id}
                          onClick={() => handleAddSuggestion(group)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-[14px] flex items-center justify-center shrink-0 ${Style.bg} ${Style.text}`}>
                              <Icon className="h-5 w-5" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[15px] text-gray-900 leading-tight">
                                  {group.mainItem.name}
                                </span>
                                {group.mainItem.barcode && (
                                  <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md tracking-wider">
                                    {group.mainItem.barcode.slice(-6)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[12px] font-semibold text-gray-400">
                                  {group.totalQuantity} in stock
                                </span>
                                {hasExp && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <div className="flex items-center gap-1.5">
                                      <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0 mt-[1px]">
                                        <circle cx="3" cy="3" r="3" fill={getDotColor(expStatus?.className)} />
                                      </svg>
                                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                        {formatDate(earliestBatch.expirationDate)}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <Plus className="h-5 w-5 text-gray-600" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-[14px] font-medium text-gray-500">
                    No items found matching "{searchInput}"
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. MIDDLE CONTENT: The Live Cart */}
      <div className="flex-1 min-h-0 px-4 overflow-y-auto pb-6">
        <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">
          Current Cart
        </h3>

        {groupedCart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-24 w-24 bg-[#d97757]/10 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="h-10 w-10 text-[#d97757]" strokeWidth={2} />
            </div>
            <h4 className="text-[20px] font-black text-gray-900 mb-2 tracking-tight">Your Cart is Empty</h4>
            <p className="text-[15px] text-gray-500 font-medium max-w-[260px] leading-relaxed mb-8">
              Scan a barcode or search for items above to start adding to your cart.
            </p>
            <button 
              onClick={onOpenScanner}
              className="h-12 px-6 bg-[#d97757]/10 active:bg-[#d97757]/20 text-[#d97757] rounded-full flex items-center justify-center gap-2 font-bold text-[15px] transition-colors shadow-sm"
            >
              <Camera className="h-5 w-5" strokeWidth={2.5} />
              Tap to Scan
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groupedCart.map((item) => {
              const cat = categories.find(c => c.value === item.mainItem.category?.toLowerCase()) || categories.find(c => c.value === 'other');
              const Style = cat.style;
              const Icon = cat.icon;
              
              const earliestBatch = item.batches?.[0];
              const hasExp = !!earliestBatch?.expirationDate;
              const expStatus = hasExp ? getExpirationStatus(earliestBatch.expirationDate) : null;

              return (
                <div key={item.mainItem._id || item.mainItem.id} className="bg-white rounded-[20px] p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm ${Style.bg} ${Style.text}`}>
                      <Icon className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[15px] text-gray-900 leading-tight truncate max-w-[140px]">
                        {item.mainItem.name}
                      </span>
                      
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12px] font-semibold text-gray-400">
                          {item.mainItem.unit || 'units'}
                        </span>
                        {item.mainItem.barcode && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-[1px] rounded-md tracking-wider">
                              {item.mainItem.barcode.slice(-6)}
                            </span>
                          </>
                        )}
                      </div>

                      {hasExp && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0 mt-[1px]">
                            <circle cx="3" cy="3" r="3" fill={getDotColor(expStatus?.className)} />
                          </svg>
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                            {formatDate(earliestBatch.expirationDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Quantity Input & Trash */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center bg-gray-50 border border-gray-200/60 rounded-xl px-1 shadow-sm">
                      <input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={item.quantity === '' ? '' : item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.mainItem, e.target.value ? parseInt(e.target.value) : '')}
                        onBlur={(e) => {
                          if (!e.target.value || parseInt(e.target.value) < 1) handleUpdateQuantity(item.mainItem, 1);
                        }}
                        className="w-10 h-10 text-center bg-transparent text-[15px] font-bold text-gray-900 outline-none p-0 border-none focus:ring-0"
                      />
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item.mainItem)}
                      className="h-10 w-8 flex items-center justify-center text-gray-300 hover:text-red-500 active:text-red-600 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4.5 w-4.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. BOTTOM BAR: Sticky Footer - Pushed UP with pb-[90px] so it is clearly visible above mobile BottomNav */}
      <div className="shrink-0 w-full bg-white border-t border-gray-100 px-4 pt-3 pb-[90px] z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          <button 
            onClick={onOpenScanner}
            className="col-span-1 h-14 rounded-[16px] bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center gap-1.5 text-gray-700 font-bold text-[14px]"
          >
            <Camera className="h-5 w-5" strokeWidth={2.5} />
            <span>Scan</span>
          </button>
          <button 
            onClick={onCheckout || onOpenCart}
            disabled={totalItemsInCart === 0}
            className="col-span-2 h-14 rounded-[16px] bg-[#154734] active:bg-[#0f3526] transition-colors flex items-center justify-center gap-2 text-white font-bold text-[15px] shadow-[0_8px_20px_rgba(21,71,52,0.3)] disabled:opacity-50 disabled:shadow-none"
          >
            <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
            <span className="truncate">Checkout ({totalItemsInCart})</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}
