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
} from "lucide-react";
import { categories } from "@/lib/constants";

function getCategoryVisual(value) {
  const cat =
    categories.find((c) => c.value === value) ||
    categories[categories.length - 1];
  return { Icon: cat.icon, style: cat.style, name: cat.name };
}

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
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState("");
  const [cartError, setCartError] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={
        cartItems.length > 0
          ? "fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex flex-col"
          : "flex-1 w-full relative bg-white flex flex-col min-h-full"
      }
    >
      {/* HEADER */}
      <div className="px-6 pt-safe pb-3 bg-white border-b border-gray-100 shrink-0 flex items-center justify-between z-10">
        <h1 className="text-[17px] font-semibold text-[#1a1f36] mt-2 tracking-tight">
          {cartItems.length > 0 ? "Ready to add" : "Add items"}
        </h1>
        {cartItems.length > 0 && (
          <span className="text-[13px] font-semibold text-[#d97757] mt-2">
            {cartItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)} items
          </span>
        )}
      </div>

      {/* ITEM LIST */}
      <div
        className={`flex-1 overflow-y-auto px-6 space-y-4 relative pt-6 ${
          cartItems.length > 0 ? "pb-[240px]" : "pb-16"
        }`}
      >
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-16 pt-4">
            {/* Clean Empty Illustration */}
            <div className="w-36 h-36 mb-8 flex items-center justify-center relative">
              {/* Outer soft ring */}
              <div className="absolute w-36 h-36 rounded-full border-2 border-dashed border-gray-200" />
              {/* Inner soft ring */}
              <div className="absolute w-24 h-24 rounded-full bg-orange-50" />
              {/* Icon */}
              <ShoppingBag className="w-10 h-10 text-[#d97757] relative z-10" strokeWidth={1.5} />
            </div>

            <h2 className="text-[20px] font-semibold text-[#1a1f36] mb-2 tracking-tight text-center">
              Your cart is empty
            </h2>
            <p className="text-gray-400 text-[15px] text-center px-8 leading-relaxed mb-6">
              Scan a barcode or type in an item to get started.
            </p>
            <button
              onClick={() => setShowHowItWorks(true)}
              className="text-[#d97757] text-[14px] font-semibold active:opacity-70 transition-opacity"
            >
              How it works →
            </button>
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
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 ${catVisual.style.border} ${catVisual.style.bg}`}
                      >
                        <catVisual.Icon
                          className={`h-6 w-6 ${catVisual.style.text}`}
                          strokeWidth={2}
                        />
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
      <div
        className={`absolute right-4 flex flex-col gap-4 z-40 transition-all duration-300 ${cartItems.length > 0 ? "bottom-[calc(120px+env(safe-area-inset-bottom))]" : "bottom-[calc(42px+env(safe-area-inset-bottom))]"}`}
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
      </div>

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
