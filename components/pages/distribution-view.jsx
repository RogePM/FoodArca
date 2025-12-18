'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, Plus, PackageOpen, 
  ArrowRight, ChevronUp, Calendar, AlertTriangle, X, Camera, Loader2, 
  Package, ScanBarcode, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/SheetCart';
import { usePantry } from '@/components/providers/PantryProvider';
import { DistributionCart } from './distribution-cart'; 
import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';

// --- HELPERS ---
const formatDate = (dateString) => {
  if (!dateString) return 'No Date';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getExpirationStatus = (dateString) => {
  if (!dateString) return { color: 'bg-gray-100 text-gray-600', label: 'No Date', urgent: false, borderColor:'border-gray-200' };
  const today = new Date();
  const exp = new Date(dateString);
  const diffTime = exp - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { 
    color: 'bg-red-100 text-red-700 border-red-200', label: 'Expired', borderColor: 'border-red-500', urgent: true 
  };
  if (diffDays <= 7) return { 
    color: 'bg-orange-100 text-orange-800 border-orange-200', label: `${diffDays} days left`, borderColor: 'border-orange-400', urgent: true 
  };
  if (diffDays <= 14) return { 
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Expiring soon', borderColor:'border-amber-400', urgent: false 
  };
  
  return { color: 'bg-green-50 text-green-700 border-green-200', label: 'Good', urgent: false, borderColor:'border-gray-200'};
};

const formatCategory = (cat) => cat ? cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'General';

export function DistributionView() {
  const { pantryId } = usePantry();

  // Data State
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);       // Initial Load
  const [isRefetching, setIsRefetching] = useState(false); // Background Update

  // Search & Camera State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const searchInputRef = useRef(null);

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Add a ref to track if a fetch is currently happening
const isFetchingRef = useRef(false);

const fetchInventory = async (isBackground = false) => {
    if (!pantryId) return;
    
    // SAFETY GUARD: If we are already fetching, don't start another one
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true; // Lock

    if (!isBackground) setIsLoading(true);
    else setIsRefetching(true);

    try {
      const res = await fetch('/api/foods', { headers: { 'x-pantry-id': pantryId } });
      if (res.ok) {
        const data = await res.json();
        setInventory(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load inventory", error);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
      isFetchingRef.current = false; // Unlock
    }
};

  useEffect(() => { 
    if (pantryId) {
        fetchInventory(false); 
        const interval = setInterval(() => {
            fetchInventory(true); 
        }, 2000);
        return () => clearInterval(interval);
    }
  }, [pantryId]);

  useEffect(() => {
    let results = [...inventory];
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      results = results.filter(item => 
        item.name.toLowerCase().includes(lowerQ) || 
        item.barcode?.includes(lowerQ) || 
        item.category.toLowerCase().includes(lowerQ)
      );
    }
    results.sort((a, b) => {
      if (!a.expirationDate) return 1;
      if (!b.expirationDate) return -1;
      const dateA = new Date(a.expirationDate);
      const dateB = new Date(b.expirationDate);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return a.name.localeCompare(b.name);
    });
    setFilteredItems(results);
  }, [searchQuery, inventory]);

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
        const inventoryItem = inventory.find(item => item._id === data.data._id || item.barcode === barcode);
        
        if (inventoryItem) {
          addToCart(inventoryItem);
          setSearchQuery(inventoryItem.name);
        } else {
          setSearchQuery(data.data.name);
          alert('Item found in database but currently out of stock in your pantry.');
        }
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
    
    if (window.innerWidth >= 768) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
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

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(line => line.item._id !== itemId));
  };

  const handleCheckoutSuccess = () => {
    setCart([]);
    setIsCartOpen(false);
    fetchInventory(true); 
  };

  const handleAddItemByBarcode = (itemData) => {
    const inventoryItem = inventory.find(item => item._id === itemData._id);
    if (inventoryItem) {
      addToCart(inventoryItem);
    }
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-6rem)] bg-white">

      {/* --- OVERLAYS --- */}
      {showScanner && (
        <BarcodeScannerOverlay 
          onScan={handleBarcodeScanned} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {isLookingUp && (
        <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-3">
            <Loader2 className="animate-spin h-5 w-5 text-[#d97757]" />
            <span className="font-medium">Looking up item...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 h-full overflow-hidden">

        {/* LEFT: Inventory Browser */}
        <div className="lg:col-span-2 flex flex-col h-full border-r border-gray-200 overflow-hidden">

          {/* --- HEADER --- */}
          <div className="p-4 border-b bg-white z-10 shrink-0">
            <div className="max-w-4xl mx-auto w-full">

              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {isRefetching ? <RefreshCw className="h-5 w-5 text-[#d97757] animate-spin" /> : <Package className="h-5 w-5 text-[#d97757]" />}
                  Remove Item
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select items to add to outgoing packages</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  {!isSearchActive && !searchQuery ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-11 justify-start text-muted-foreground bg-gray-50 border-gray-200 hover:bg-white hover:border-[#d97757] transition-all text-base font-normal"
                        onClick={() => {
                          setIsSearchActive(true);
                          setTimeout(() => searchInputRef.current?.focus(), 50);
                        }}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Search items...
                      </Button>
                      <Button 
                        className="h-11 w-11 shrink-0 bg-[#d97757] text-white hover:bg-[#d97757]"
                        onClick={() => setShowScanner(true)}
                      >
                        <Camera className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative w-full animate-in fade-in zoom-in-95 duration-200">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        ref={searchInputRef}
                        placeholder="Search inventory..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => { if (!searchQuery) setIsSearchActive(false); }}
                        className="pl-10 pr-10 h-11 text-base bg-white border-[#d97757] ring-1 ring-[#d97757] focus:ring-[#d97757] focus:border-[#d97757] transition-colors"
                      />
                      <button 
                        onClick={() => { setSearchQuery(''); setIsSearchActive(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- GRID CONTENT --- */}
          <div className="flex-1 min-h-0 bg-gray-50/50"> 
            <ScrollArea className="h-full">
                <div className="p-4 pb-24 md:pb-4">
                  {isLoading ? (
                    <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
                        {/* 🔥 FIXED: Use self-closing Loader2 with correct classes */}
                        <Loader2 className="animate-spin mr-2 h-5 w-5 text-[#d97757]" />
                        Loading inventory...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {filteredItems.map(item => {
                        const inCart = cart.find(c => c.item._id === item._id);
                        const available = item.quantity - (inCart?.quantity || 0);
                        const isOOS = available <= 0;
                        const expStatus = getExpirationStatus(item.expirationDate);

                        return (
                          <button
                            key={item._id}
                            onClick={() => !isOOS && addToCart(item)}
                            disabled={isOOS}
                            className={`
                              group relative flex flex-col p-0 rounded-xl border text-left transition-all duration-200 overflow-hidden bg-white
                              ${isOOS 
                                ? 'opacity-60 grayscale cursor-not-allowed border-gray-200' 
                                : `${expStatus.borderColor} hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]`}
                            `}
                          >
                            <div className="p-4 w-full">
                              <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="font-normal text-[10px] text-gray-500 bg-gray-50">
                                  {formatCategory(item.category)}
                                </Badge>
                                {item.expirationDate && (
                                  <Badge variant="outline" className={`text-[10px] font-medium border ${expStatus.color}`}>
                                    {expStatus.urgent && <AlertTriangle className="h-3 w-3 mr-1" />}
                                    {expStatus.label}
                                  </Badge>
                                )}
                              </div>

                              <div className="mb-2">
                                <h3 className="font-bold text-gray-900 truncate pr-8 text-base mb-1.5">{item.name}</h3>
                                <div className="flex flex-col gap-1.5">
                                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                                    <span>Exp: {formatDate(item.expirationDate)}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <ScanBarcode className="h-3.5 w-3.5 opacity-70" />
                                    <span className="font-mono text-[10px] tracking-wide bg-gray-50 px-1 py-0.5 rounded border border-gray-100">
                                      {item.barcode || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-auto border-t bg-gray-50/50 p-3 flex items-center justify-between w-full">
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase font-bold text-gray-400">Available</span>
                                  <span className={`text-sm font-bold ${isOOS ? 'text-red-500' : 'text-gray-700'}`}>
                                    {isOOS ? "0" : Math.round(available * 100) / 100} <span className="text-[10px] font-normal text-gray-500">{item.unit || 'units'}</span>
                                  </span>
                                </div>
                                {!isOOS && (
                                  <div className="h-8 w-8 rounded-full bg-[#d97757] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <Plus className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {filteredItems.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <PackageOpen className="h-10 w-10 mb-2 opacity-20" />
                          <p>No items found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </ScrollArea>
          </div>
        </div>

        {/* RIGHT: Desktop Cart Sidebar */}
        <div className="hidden lg:flex lg:col-span-1 flex-col h-full bg-white border-l border-gray-200 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 overflow-hidden">
          <div className="p-4 border-b bg-white shrink-0">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#d97757]" />
              Current Cart
            </h3>
            <p className="text-xs text-muted-foreground">
              {cart.reduce((acc, curr) => acc + curr.quantity, 0)} Items selected
            </p>
          </div>
          <div className="flex-1 min-h-0"> 
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
              <Button size="lg" className="w-full h-14 text-lg shadow-xl bg-[#d97757] hover:bg-[#c06245] animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between w-full px-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono text-white">
                      {cart.reduce((acc, c) => acc + c.quantity, 0)}
                    </div>
                    <span className="font-medium text-white">View Cart</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-white">
                    Checkout <ChevronUp className="h-5 w-5" />
                  </div>
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] p-0 flex flex-col">
              <SheetHeader className="p-5 border-b">
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
          <div className="text-center text-xs text-muted-foreground py-2 flex items-center justify-center gap-2">
            <ArrowRight className="h-3 w-3 animate-pulse text-[#d97757]" /> Select items to build cart
          </div>
        )}
      </div>

    </div>
  );
}