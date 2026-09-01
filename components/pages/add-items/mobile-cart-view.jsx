"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Trash2,
  Edit3,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Scan,
  Keyboard,
  Smartphone,
  Minus,
  Plus,
  ShoppingCart,
  Search,
  PlusCircle,
} from "lucide-react";
import { categories, getCategoryVisual } from "@/lib/constants";
import { usePantry } from "@/components/providers/PantryProvider";
function formatItemExpiration(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MobileCartView({
  onBack,
  cartItems,
  setCartItems,
  pantryId,
  onEdit,
}) {
  const { pantryDetails } = usePantry();
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState("");
  const [cartError, setCartError] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [localInventory, setLocalInventory] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (cartItems.length === 0 && pantryId) {
      fetch('/api/foods', { headers: { 'x-pantry-id': pantryId } })
        .then(res => res.json())
        .then(data => {
          if (data && data.data) {
            // Sort by quantity or recent to mock "Frequent items"
            setLocalInventory(data.data.slice(0, 8));
          }
        })
        .catch(console.error);
    }
  }, [cartItems.length, pantryId]);

  const clearBatch = () => {
    setCartItems([]);
    try {
      sessionStorage.removeItem("foodarca_staged_batch");
    } catch (_) {}
    // Emptying the cart already reverts this view to its inline (non-fullscreen)
    // layout on its own, which brings the bottom nav back — no navigation needed.
    // The old onBack() call here was a no-op anyway (add-item-view.jsx never
    // passes an onClose down), which is why this dialog used to stay stuck open.
    setShowClearConfirm(false);
  };

  const removeFromBatch = (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItemQty = (id, delta) => {
    setCartItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next = Math.max(1, (parseInt(i.quantity, 10) || 1) + delta);
        return { ...i, quantity: String(next) };
      }),
    );
  };

  const submitBatch = async () => {
    if (cartItems.length === 0 || !pantryId) return;
    setIsSubmittingCart(true);
    setCartError("");
    setCartSuccess("");

    try {
      const response = await fetch("/api/foods/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pantry-id": pantryId,
        },
        body: JSON.stringify({ items: cartItems }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || data.error || "Failed to submit batch");

      setCartSuccess("Batch successfully added!");
      setCartItems([]);
      try {
        sessionStorage.removeItem("foodarca_staged_batch");
      } catch (_) {}

      setTimeout(() => {
        setCartSuccess("");
        onBack();
      }, 2000);
    } catch (err) {
      setCartError(err.message);
    } finally {
      setIsSubmittingCart(false);
    }
  };

  const quickAddToCart = (item) => {
    const newItem = {
      id: crypto.randomUUID(),
      barcode: item.barcode || `INT-${Math.floor(100000 + Math.random() * 900000)}`,
      name: item.name,
      category: item.category,
      categoryName: getCategoryVisual(item.category).name,
      quantity: "1",
      unit: item.unit || "units",
      weightPerUnit: "0",
      totalWeightLbs: 0,
      intakeMode: 'count',
      expirationDate: null,
      expirationPrecision: 'none',
      sourceType: 'donation',
      photoUrl: item.photoUrl || null
    };
    setCartItems(prev => [newItem, ...prev]);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={
        cartItems.length > 0
          ? "fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex flex-col"
          : "flex-1 w-full relative bg-[#f4f4f6] flex flex-col min-h-full"
      }
    >
      {/* SAMS CLUB HEADER */}
      <div className="px-5 pt-safe pb-5 bg-white shrink-0 flex flex-col gap-4 z-10 shadow-sm relative overflow-hidden rounded-b-[24px]">
         <div className="relative z-10 flex flex-col mt-2">
           <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">Your Pantry</span>
           <div className="flex items-center justify-between">
              <h1 className="text-[26px] font-extrabold text-[#1a1f36] tracking-tight leading-none">
                 {pantryDetails?.name || 'Food Arca'}
              </h1>
              <button className="text-[13px] font-bold text-[#1a1f36] underline underline-offset-4 decoration-gray-300 active:text-[#d97757] transition-colors">
                 Change
              </button>
           </div>
           <p className="text-[13px] font-medium text-gray-500 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Active | Manage Pantry
           </p>
         </div>
         
         {/* SEARCH BAR (NO EMBEDDED SCANNER) */}
         <div 
           className="relative flex items-center w-full h-[52px] bg-white rounded-full shadow-[0_6px_20px_-10px_rgba(0,0,0,0.12)] border border-gray-100 cursor-text active:scale-[0.98] transition-transform z-10"
           onClick={() => onBack("MANUAL_ENTRY")}
         >
           <div className="pl-5 pr-3 flex items-center justify-center text-gray-400">
              <Search className="w-5 h-5" strokeWidth={2.5} />
           </div>
           <div className="flex-1 text-[16px] font-medium text-gray-400 select-none">
              Find an item in the pantry
           </div>
         </div>
      </div>

      {/* ITEM LIST */}
      <div
        className={`flex-1 overflow-y-auto px-4 space-y-4 relative pt-5 ${
          cartItems.length > 0 ? "pb-[240px] bg-white" : "pb-16"
        }`}
      >
        {cartItems.length === 0 ? (
          <div className="flex flex-col h-full gap-4">
             {/* SCAN & GO CARD */}
             <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] border border-gray-100">
                <div className="p-6 flex items-start justify-between">
                   <div className="flex flex-col gap-1.5 max-w-[60%]">
                      <h2 className="text-[20px] font-extrabold text-[#1a1f36] tracking-tight">Intake Scanner</h2>
                      <p className="text-[13px] text-gray-500 font-medium leading-snug">Add new stock instantly using your camera.</p>
                      <button 
                        onClick={() => setShowHowItWorks(true)}
                        className="text-[13px] font-bold text-[#1a1f36] underline underline-offset-4 decoration-gray-300 mt-1 w-fit hover:text-[#d97757]"
                      >
                        How it works
                      </button>
                   </div>
                   
                   {/* SCAN GRAPHIC */}
                   <div className="w-[84px] h-[84px] rounded-full bg-orange-50 flex items-center justify-center relative border-[6px] border-white shadow-sm shrink-0">
                      <Smartphone className="w-8 h-8 text-[#d97757]" strokeWidth={1.5} />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-8 h-[3px] bg-[#d97757] rounded-full shadow-[0_0_8px_rgba(217,119,87,0.8)] opacity-80"></div>
                      </div>
                   </div>
                </div>
                
                <div className="bg-gray-50/80 px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                   <span className="text-[13px] font-semibold text-gray-500">Camera access required</span>
                   <button 
                     onClick={() => onBack("CAMERA")}
                     className="bg-[#1a1f36] text-white px-5 py-2.5 rounded-full text-[13px] font-bold shadow-md active:scale-95 transition-transform"
                   >
                     Open Scanner
                   </button>
                </div>
             </div>

             <div className="px-2 mt-4 mb-2">
                <h2 className="text-[16px] font-bold text-[#1a1f36] tracking-tight">Frequent Items</h2>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Quickly add from your inventory</p>
             </div>

             <div className="flex flex-col gap-2">
                {localInventory.map((item) => {
                  const catVisual = getCategoryVisual(item.category);
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      {item.photoUrl ? (
                        <img src={item.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${catVisual.style.bg} overflow-hidden`}>
                          <img src={catVisual.imagePath} alt="" className="w-full h-full object-contain mix-blend-multiply scale-[1.35]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold text-[#1a1f36] truncate">{item.name}</h4>
                        <p className="text-[12px] text-gray-500 truncate">{item.categoryName || catVisual.name}</p>
                      </div>
                      <button 
                        onClick={() => quickAddToCart(item)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[#d97757] active:bg-orange-50 transition-colors shrink-0"
                      >
                        <PlusCircle className="w-6 h-6" strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}
             </div>

             {localInventory.length === 0 && (
                <div className="text-center py-12 px-6">
                   <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                     <Search className="w-6 h-6 text-gray-300" />
                   </div>
                   <p className="text-[14px] font-medium text-gray-400">Search above or scan a barcode to add your first items.</p>
                </div>
             )}
          </div>
        ) : (
          <>
            <AnimatePresence>
              {cartItems.map((item) => {
                const catVisual = getCategoryVisual(item.category);
                const expLabel = formatItemExpiration(item.expirationDate);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-3 flex gap-3 items-center"
                  >
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-50 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 overflow-hidden ${catVisual.style.border} ${catVisual.style.bg}`}
                      >
                        <img src={catVisual.imagePath} alt="" className="w-full h-full object-contain mix-blend-multiply scale-[1.35]" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[#1a1f36] text-[15px] leading-snug truncate">
                        {item.name}
                      </h4>
                      <p className="text-[12px] font-medium text-gray-500 mt-0.5 truncate">
                        {item.categoryName || catVisual.name}
                        {expLabel && (
                          <span className="text-[#a3acb9] font-normal">
                            {" "}
                            · Exp {expLabel}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <button
                          onClick={() => onEdit(item)}
                          className="flex items-center gap-1 text-[12px] font-semibold text-gray-400 hover:text-gray-600 active:text-[#d97757] transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" strokeWidth={2.5} /> Edit
                        </button>
                        <button
                          onClick={() => removeFromBatch(item.id)}
                          className="flex items-center gap-1 text-[12px] font-semibold text-gray-400 hover:text-gray-600 active:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />{" "}
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl h-12 min-w-0">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.id, -1)}
                          className="h-full w-9 shrink-0 flex items-center justify-center text-gray-500 bg-gray-50 active:bg-gray-100 border-r-2 border-gray-200 rounded-l-xl transition-colors"
                        >
                          <Minus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                        <span className="w-10 text-center text-[16px] font-semibold text-[#1a1f36]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.id, 1)}
                          className="h-full w-9 shrink-0 flex items-center justify-center text-gray-500 bg-gray-50 active:bg-gray-100 border-l-2 border-gray-200 rounded-r-xl transition-colors"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                      </div>
                      {item.unit && item.unit !== "units" && (
                        <span className="text-[11px] font-semibold text-[#a3acb9] uppercase tracking-wide">
                          {item.unit}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-6 py-2.5 rounded-full border-2 border-gray-100 text-gray-500 text-[14px] font-semibold bg-white active:bg-gray-50 transition-colors"
              >
                Empty cart
              </button>
            </div>
          </>
        )}
      </div>

      {/* FLOATING ACTION BUTTONS */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute right-4 bottom-[calc(120px+env(safe-area-inset-bottom))] flex flex-col gap-4 z-40"
          >
            <button
              type="button"
              onClick={() => onBack("MANUAL_ENTRY")}
              className="w-14 h-14 rounded-full bg-white text-[#1a1f36] shadow-[0_4px_14px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-all border border-gray-200"
            >
              <Keyboard className="w-6 h-6" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => onBack("CAMERA")}
              className="w-14 h-14 rounded-full bg-[#d97757] text-white shadow-[0_4px_14px_rgba(217,119,87,0.25)] flex items-center justify-center active:scale-95 transition-all"
            >
              <Scan className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER BUTTON (ONLY VISIBLE IF ITEMS IN CART) */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[10000] bg-white px-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            {cartError && (
              <p className="text-rose-600 text-[13px] text-center mb-3 font-medium bg-rose-50 py-2 rounded-xl">
                {cartError}
              </p>
            )}

            <button
              type="button"
              disabled={
                (cartItems.length === 0 && !cartSuccess) || isSubmittingCart
              }
              onClick={
                cartSuccess ? undefined : () => setShowSubmitConfirm(true)
              }
              className={`w-full h-[56px] rounded-2xl text-[16px] font-bold transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-2 ${
                cartSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-[#d97757] text-white"
              }`}
            >
              {isSubmittingCart ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting…
                </>
              ) : cartSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />{" "}
                  {cartSuccess}
                </>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5" strokeWidth={2.5} /> Add to inventory
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLEAR CONFIRMATION MODAL */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[10001] flex items-end justify-center" style={{ isolation: "isolate" }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowClearConfirm(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative bg-white rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] w-full max-w-lg"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h3 className="text-[18px] font-semibold text-center text-[#1a1f36] tracking-tight mb-2">
                Empty your cart?
              </h3>
              <p className="text-center text-gray-400 text-[14px] leading-relaxed mb-6">
                This removes all {cartItems.length}{" "}
                {cartItems.length === 1 ? "item" : "items"}. You can't undo
                this.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 h-[52px] bg-gray-100 text-[#1a1f36] font-semibold text-[15px] rounded-2xl active:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearBatch}
                  className="flex-1 h-[52px] bg-rose-500 text-white font-semibold text-[15px] rounded-2xl active:bg-rose-600 transition-colors"
                >
                  Empty cart
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBMIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-[10001] flex items-end justify-center" style={{ isolation: "isolate" }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowSubmitConfirm(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative bg-white rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] w-full max-w-lg flex flex-col items-center"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

              <h3 className="text-[18px] font-semibold text-center text-[#1a1f36] tracking-tight mb-2">
                Add to inventory?
              </h3>
              <p className="text-center text-gray-400 text-[15px] leading-relaxed mb-8">
                You're about to add{" "}
                <span className="font-semibold text-[#1a1f36]">
                  {cartItems.reduce(
                    (sum, item) => sum + Number(item.quantity || 1),
                    0,
                  )}{" "}
                  {cartItems.reduce(
                    (sum, item) => sum + Number(item.quantity || 1),
                    0,
                  ) === 1
                    ? "item"
                    : "items"}
                </span>{" "}
                to your inventory.
              </p>

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    submitBatch();
                  }}
                  className="w-full h-[52px] bg-[#d97757] text-white font-semibold text-[15px] rounded-2xl active:bg-[#c66547] transition-colors"
                >
                  Add to inventory
                </button>
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="w-full h-[52px] bg-transparent text-gray-400 font-medium text-[15px] rounded-2xl active:bg-gray-50 transition-colors"
                >
                  Go back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOW IT WORKS MODAL */}
      {mounted
        ? createPortal(
            <AnimatePresence>
              {showHowItWorks && (
                <div
                  className="fixed inset-0 z-[9999] flex flex-col justify-end"
                  style={{ isolation: "isolate" }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/30"
                    onClick={() => setShowHowItWorks(false)}
                  />
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 300 }}
                    className="relative bg-white rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col items-center"
                  >
                    <div className="w-10 h-1 bg-gray-200 rounded-full mb-5" />

                    <h2 className="text-[18px] font-semibold text-[#1a1f36] mb-6 text-center">
                      How to add items
                    </h2>

                    <div className="w-full space-y-5 mb-8 px-2">
                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#d97757] shrink-0">
                          <Scan className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1f36] text-[15px] mb-0.5">
                            Tap scan
                          </p>
                          <p className="text-gray-400 text-[14px] leading-snug">
                            Press the orange scanner button on the bottom right.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#d97757] shrink-0">
                          <Smartphone className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1f36] text-[15px] mb-0.5">
                            Point your camera
                          </p>
                          <p className="text-gray-400 text-[14px] leading-snug">
                            Aim at any food product's barcode.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#d97757] shrink-0">
                          <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1f36] text-[15px] mb-0.5">
                            Done!
                          </p>
                          <p className="text-gray-400 text-[14px] leading-snug">
                            We'll identify the item and add it to your cart.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowHowItWorks(false)}
                      className="w-full h-[52px] bg-[#d97757] text-white text-[15px] font-semibold rounded-2xl active:scale-[0.97] transition-transform"
                    >
                      Got it
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </motion.div>
  );
}
