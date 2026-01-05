'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, Plus, PackageOpen, 
  ArrowRight, ChevronUp, Calendar, AlertTriangle, X, Camera, Loader2, 
  Package, ScanBarcode, RefreshCw, Layers, Check, Clock, ChevronRight
} from 'lucide-react';

// --- UI COMPONENTS ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/SheetCart';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; 

import { usePantry } from '@/components/providers/PantryProvider';
import { DistributionCart } from './distribution-cart'; 
import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';
import { categories as CATEGORY_OPTIONS } from '@/lib/constants';

// --- ANIMATION ---
const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

// --- HOOK: DETECT DESKTOP VS MOBILE ---
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

// --- HELPERS ---
const formatDate = (dateString) => {
  if (!dateString) return 'No Date';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getExpirationStatus = (dateString) => {
    if (!dateString) return { label: 'No Date', color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400', isExpired: false };
    
    const target = new Date(dateString);
    const now = new Date();
    target.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    const diffTime = target - now;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days < 0) return { label: 'Expired', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', isExpired: true };
    if (days === 0) return { label: 'Today', color: 'bg-red-50 text-red-600 border-red-200 font-bold', dot: 'bg-red-500', isExpired: false };
    if (days <= 30) return { label: `${days} Days Left`, color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', isExpired: false };
    
    return { label: 'Good', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', isExpired: false };
};

const getCategoryName = (value) => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === value);
    return cat ? cat.name : value;
};

// --- LOGIC: Group Items ---
const groupInventory = (items) => {
    const groups = {};
    items.forEach(item => {
        const key = item.barcode || item.name;
        if (!groups[key]) {
            groups[key] = { mainItem: item, batches: [], totalQuantity: 0 };
        }
        groups[key].batches.push(item);
        groups[key].totalQuantity += item.quantity;
    });
    Object.values(groups).forEach(group => {
        group.batches.sort((a, b) => {
            if (!a.expirationDate) return 1;
            if (!b.expirationDate) return -1;
            return new Date(a.expirationDate) - new Date(b.expirationDate);
        });
    });
    return Object.values(groups);
};

export function DistributionView() {
  const { pantryId } = usePantry();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Data
  const [inventory, setInventory] = useState([]);
  const [groupedItems, setGroupedItems] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const searchInputRef = useRef(null);

  // Cart
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
   
  // Batch Selection
  const [selectedGroup, setSelectedGroup] = useState(null); 
  const isFetchingRef = useRef(false);

  // --- FETCHING ---
  const fetchInventory = async (isBackground = false) => {
    if (!pantryId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isBackground) setIsLoading(true);
    else setIsRefetching(true);

    try {
      const res = await fetch('/api/foods', { headers: { 'x-pantry-id': pantryId } });
      if (res.ok) {
        const data = await res.json();
        setInventory(data.data || []);
      }
    } catch (error) { console.error(error); } 
    finally { 
        setIsLoading(false); 
        setIsRefetching(false); 
        isFetchingRef.current = false; 
    }
  };

  useEffect(() => { 
    if (pantryId) {
        fetchInventory(false); 
        const interval = setInterval(() => fetchInventory(true), 5000); 
        return () => clearInterval(interval);
    }
  }, [pantryId]);

  useEffect(() => {
    const groups = groupInventory(inventory);
    setGroupedItems(groups);

    let results = groups;
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      results = results.filter(group => 
        group.mainItem.name.toLowerCase().includes(lowerQ) || 
        group.mainItem.barcode?.includes(lowerQ) || 
        group.mainItem.category.toLowerCase().includes(lowerQ)
      );
    }
    setFilteredGroups(results);
  }, [searchQuery, inventory]);

  // --- ACTIONS ---
  const handleSmartAdd = (group, e) => {
    e.stopPropagation();
    const bestBatch = group.batches.find(batch => {
        const inCart = cart.find(c => c.item._id === batch._id);
        const cartQty = inCart ? inCart.quantity : 0;
        return (batch.quantity - cartQty) > 0;
    });

    if (!bestBatch) return;

    const expStatus = getExpirationStatus(bestBatch.expirationDate);
    if (expStatus.isExpired) {
        if (!confirm(`⚠️ WARNING: The oldest batch of ${bestBatch.name} expired on ${formatDate(bestBatch.expirationDate)}. Add anyway?`)) return;
    }
    addToCart(bestBatch);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(line => line.item._id === item._id);
      if (existing) {
        if (existing.quantity < item.quantity) {
          return prev.map(line => line.item._id === item._id ? { ...line, quantity: line.quantity + 1 } : line);
        }
        return prev;
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQty = (itemId, delta) => {
    setCart(prev => prev.map(line => {
      if (line.item._id === itemId) {
        const currentStock = inventory.find(i => i._id === itemId)?.quantity || line.item.quantity;
        const newQty = line.quantity + delta;
        const validQty = Math.max(1, Math.min(newQty, currentStock));
        return { ...line, quantity: validQty };
      }
      return line;
    }));
  };

  const removeFromCart = (itemId) => setCart(prev => prev.filter(line => line.item._id !== itemId));
  const handleCheckoutSuccess = () => { setCart([]); setIsCartOpen(false); fetchInventory(true); };

  const handleAddItemByBarcode = (itemData) => {
    let targetItem = inventory.find(item => item._id === itemData._id);
    if (!targetItem && itemData.barcode) {
        const batches = inventory.filter(i => i.barcode === itemData.barcode && i.quantity > 0)
            .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
        if (batches.length > 0) targetItem = batches[0];
    }
    if (targetItem) addToCart(targetItem);
  };

  // --- RENDER HELPERS ---
   
  // Shared Component: The Card Design
 // Shared Component: The Card Design
  const ItemCard = ({ group, isOOS, totalAvailable, expStatus }) => (
    <Card className={`
      group relative flex flex-col justify-between overflow-hidden transition-all duration-200 active:scale-[0.99] cursor-pointer
      rounded-[24px] border-2 shadow-sm
      ${isOOS ? 'border-gray-100 bg-gray-50 opacity-60 grayscale' : 'border-gray-100 bg-white hover:border-[#d97757]/30 hover:shadow-md'}
    `}>
        {/* --- TOP SECTION (Above Divider) --- */}
        <div className="p-5 pb-4 flex justify-between items-start">
            
            {/* Left: Identity (Vertical Stack to ensure Alignment) */}
            <div className="flex flex-col pr-2 w-full max-w-[65%]"> 
                {/* 1. Category */}
                <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-[0.18em] mb-1">
                    {getCategoryName(group.mainItem.category)}
                </span>
                
                {/* 2. Name (Truncated to 1 line to prevent height shifting) */}
                <h4 className="font-semibold text-[17px] text-gray-900 leading-snug tracking-tight truncate w-full" title={group.mainItem.name}>
                    {group.mainItem.name}
                </h4>

                {/* 3. Batch Badge (Always on its own line below title) */}
                <div className="mt-1.5 flex items-center h-6"> {/* Fixed height container preserves space */}
                    <div
                      className={`px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 border transition-colors
                        ${group.batches.length > 1 
                          ? 'bg-gray-100 border-gray-200' 
                          : 'bg-transparent border-transparent pl-0' /* Remove padding left for single item to align with text */
                        }
                      `}
                    >
                      <Layers 
                        className={`h-3 w-3 
                          ${group.batches.length > 1 ? 'text-gray-400' : 'text-gray-300'}
                        `} 
                      />
                      <span 
                        className={`text-[10px] font-medium 
                          ${group.batches.length > 1 ? 'text-gray-500' : 'text-gray-300'}
                        `}
                      >
                        {group.batches.length > 1 ? `${group.batches.length} Batches` : '1 Batch'}
                      </span>
                    </div>
                </div>
            </div>

            {/* Right: Quantity (Fixed width to prevent shifting) */}
            <div className="flex flex-col items-end shrink-0 pl-2">
                <span className={`text-[22px] font-semibold leading-none tracking-tight ${isOOS ? 'text-gray-300' : 'text-gray-800'}`}>
                    {Math.round(totalAvailable)}
                </span>
                <span className="text-[9px] font-medium text-gray-400 uppercase mt-0.5 tracking-wide">
                    {group.mainItem.unit}
                </span>
            </div>
        </div>

        {/* --- DIVIDER --- */}
        <div className="h-px w-full bg-gray-100" />

        {/* --- BOTTOM SECTION (Below Divider) --- */}
        <div className="p-3 pl-5 flex items-center justify-between bg-gray-50/30 grow">
            {/* Left: Expiration Status */}
            <div className="flex flex-col gap-1">
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Oldest Batch
                </span>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border w-fit ${expStatus.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${expStatus.dot}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                        {expStatus.label}
                    </span>
                </div>
            </div>

            {/* Right: Action Button */}
            <Button 
                size="icon"
                disabled={isOOS}
                onClick={(e) => handleSmartAdd(group, e)}
                className={`
                    h-11 w-11 rounded-full shadow-lg transition-transform active:scale-90
                    ${isOOS 
                        ? 'bg-gray-200 text-white' 
                        : 'bg-[#d97757] hover:bg-[#c06245] shadow-[#d97757]/20 text-white'
                    }
                `}
            >
                <Plus className="h-5 w-5" strokeWidth={2.25} />
            </Button>
        </div>
    </Card>
  );
  // Shared Component: Batch Details
  const BatchDetailContent = ({ group }) => (
    <>
      <div className="px-6 pt-8 pb-6 bg-white border-b border-gray-100 flex items-start justify-between">
          <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                  <Layers className="h-3 w-3 text-[#d97757]" /> Batch Selection
              </span>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{group.mainItem.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
                    {getCategoryName(group.mainItem.category)}
                </Badge>
                <span className="text-xs text-gray-400 font-medium">Total: {group.totalQuantity} {group.mainItem.unit}</span>
              </div>
          </div>
          <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
              <Package className="h-5 w-5 text-gray-400" />
          </div>
      </div>

      <ScrollArea className="flex-1 bg-gray-50/50 p-4 h-full">
          <div className="space-y-3 pb-6">
              {group.batches.map(batch => {
                  const inCart = cart.find(c => c.item._id === batch._id);
                  const available = batch.quantity - (inCart?.quantity || 0);
                  const expStatus = getExpirationStatus(batch.expirationDate);
                  const isOOS = available <= 0;

                  return (
                      <div key={batch._id} className={`group bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-all ${isOOS ? 'opacity-50 grayscale' : 'hover:border-[#d97757]/30 hover:shadow-md'}`}>
                          <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${expStatus.dot}`} />
                                  <span className="text-sm font-bold text-gray-900">{formatDate(batch.expirationDate)}</span>
                              </div>
                              <span className={`text-[10px] font-bold uppercase ${expStatus.isExpired ? 'text-red-500' : 'text-gray-400'} ml-4`}>
                                  {expStatus.label}
                              </span>
                          </div>

                          <div className="flex items-center gap-4">
                              <div className="text-right">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Stock</span>
                                  <span className="block text-lg font-black leading-none">{available}</span>
                              </div>
                              <Button 
                                  size="sm" 
                                  disabled={isOOS}
                                  onClick={() => addToCart(batch)}
                                  className={`h-9 px-4 rounded-lg font-bold shadow-sm ${isOOS ? 'bg-gray-100 text-gray-400' : 'bg-white border-2 border-[#d97757] text-[#d97757] hover:bg-[#d97757] hover:text-white'}`}
                              >
                                  {inCart ? `Add (+${inCart.quantity})` : 'Add'}
                              </Button>
                          </div>
                      </div>
                  )
              })}
          </div>
      </ScrollArea>
    </>
  );

  return (
    <div className="relative flex flex-col h-[calc(100vh-6rem)] bg-white">

      {/* --- OVERLAYS --- */}
      {showScanner && (
        <BarcodeScannerOverlay 
          onScan={(code) => { setSearchQuery(code); setShowScanner(false); }} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* --- RESPONSIVE BATCH DETAIL MODAL --- */}
      {isDesktop ? (
          // DESKTOP: Centered Dialog (Solves the "Half screen" issue)
          <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
              <DialogContent className="max-w-md p-0 overflow-hidden border-0 rounded-3xl gap-0 bg-white shadow-2xl">
                 {selectedGroup && <BatchDetailContent group={selectedGroup} />}
              </DialogContent>
          </Dialog>
      ) : (
          // MOBILE: Bottom Sheet
          <Sheet open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
              <SheetContent side="bottom" className="h-[65vh] rounded-t-[32px] p-0 flex flex-col border-t-0 shadow-2xl">
                  {selectedGroup && <BatchDetailContent group={selectedGroup} />}
              </SheetContent>
          </Sheet>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 h-full overflow-hidden">
        {/* LEFT: Inventory Browser */}
        <div className="lg:col-span-2 flex flex-col h-full border-r border-gray-200 overflow-hidden">
          
          {/* HEADER */}
          <div className="p-4 border-b bg-white z-10 shrink-0">
            <div className="max-w-5xl mx-auto w-full">
              <div className="flex items-center gap-4 mb-4">
                 <div className="h-10 w-10 md:h-12 md:w-12 bg-[#d97757]/10 rounded-2xl flex items-center justify-center">
                    {isRefetching ? <RefreshCw className="h-5 w-5 text-[#d97757] animate-spin" /> : <PackageOpen className="h-5 w-5 md:h-6 md:w-6 text-[#d97757]" strokeWidth={2.5} />}
                 </div>
                 <div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none">Distribute</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">FIFO Mode Active</p>
                 </div>
              </div>

              <div className="flex gap-2 relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <Input 
                    ref={searchInputRef}
                    placeholder="Search products..." 
                    className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d97757]/20 focus:border-[#d97757] transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <Button className="h-11 w-11 shrink-0 rounded-xl bg-gray-900 text-white hover:bg-black" onClick={() => setShowScanner(true)}>
                    <Camera className="h-5 w-5" />
                 </Button>
              </div>
            </div>
          </div>

          {/* LIST */}
          <div className="flex-1 min-h-0 bg-gray-50/50"> 
            <ScrollArea className="h-full">
                <div className="p-4 pb-24 md:pb-4 max-w-5xl mx-auto">
                  {isLoading ? (
                    <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
                        <Loader2 className="animate-spin mr-2 h-5 w-5 text-[#d97757]" /> Loading items...
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[28px] border-2 border-dashed border-gray-300 text-gray-500 font-bold uppercase text-[10px]">
                        No Items Found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {filteredGroups.map((group) => {
                                // Logic
                                const totalAvailable = group.batches.reduce((acc, batch) => {
                                    const inCart = cart.find(c => c.item._id === batch._id);
                                    return acc + (batch.quantity - (inCart?.quantity || 0));
                                }, 0);
                                const isOOS = totalAvailable <= 0;
                                const nextBatch = group.batches.find(b => {
                                    const inCart = cart.find(c => c.item._id === b._id);
                                    return (b.quantity - (inCart?.quantity || 0)) > 0;
                                }) || group.batches[group.batches.length - 1];
                                const expStatus = getExpirationStatus(nextBatch.expirationDate);

                                return (
                                    <motion.div
                                        key={group.mainItem._id}
                                        variants={itemVariants}
                                        initial="hidden" animate="visible"
                                        onClick={() => setSelectedGroup(group)}
                                    >
                                        <ItemCard 
                                            group={group} 
                                            isOOS={isOOS} 
                                            totalAvailable={totalAvailable} 
                                            expStatus={expStatus} 
                                        />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                  )}
                </div>
            </ScrollArea>
          </div>
        </div>

        {/* RIGHT: Cart Sidebar (Desktop) */}
        <div className="hidden lg:flex lg:col-span-1 flex-col h-full bg-white border-l border-gray-200 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 overflow-hidden">
          <div className="p-5 border-b bg-white shrink-0">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#d97757]" /> Current Cart
            </h3>
            <p className="text-xs text-muted-foreground">{cart.reduce((acc, curr) => acc + curr.quantity, 0)} Items selected</p>
          </div>
          <div className="flex-1 min-h-0 bg-gray-50/30"> 
            <DistributionCart 
              cart={cart} 
              onUpdateQty={updateCartQty} 
              onRemove={removeFromCart} 
              onCheckoutSuccess={handleCheckoutSuccess}
              onAddItemByBarcode={handleAddItemByBarcode}
            />
          </div>
        </div>
      </div>

      {/* MOBILE: Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50 pb-safe-area shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {cart.length > 0 ? (
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="w-full h-14 text-lg shadow-xl bg-[#d97757] hover:bg-[#c06245] animate-in slide-in-from-bottom-4 rounded-xl">
                <div className="flex items-center justify-between w-full px-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono text-white font-bold">{cart.reduce((acc, c) => acc + c.quantity, 0)}</div>
                    <span className="font-bold text-white text-sm uppercase tracking-wide">Items in Cart</span>
                  </div>
                  <div className="flex items-center gap-2 font-black text-white">Checkout <ChevronUp className="h-5 w-5" /></div>
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-[28px] p-0 flex flex-col overflow-hidden">
              <SheetHeader className="p-5 border-b bg-white text-left">
                  <SheetTitle>Your Cart</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                <DistributionCart 
                  cart={cart} 
                  onUpdateQty={updateCartQty} 
                  onRemove={removeFromCart} 
                  onCheckoutSuccess={handleCheckoutSuccess} 
                  onAddItemByBarcode={handleAddItemByBarcode}
                />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-3 flex items-center justify-center gap-2">
            <ArrowRight className="h-3 w-3 animate-pulse text-[#d97757]" /> Tap + to add items
          </div>
        )}
      </div>

    </div>
  );
}