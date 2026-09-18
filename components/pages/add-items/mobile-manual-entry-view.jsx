"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Save,
  AlertCircle,
  Plus,
  Minus,
  ChevronDown,
  Calendar,
  X,
  Loader2,
  Search,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { categories, getCategoryVisual } from "@/lib/constants";
import { ProductImagePicker, ProductImagePickerSkeleton } from "./product-image-picker";

function formatExpDateDisplay(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const parsed = new Date(y, m - 1, d);
  return isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function getCategoryMeta(catName) {
  const safeStr = String(catName || "").toLowerCase();
  const found = categories.find(
    (c) =>
      c.name.toLowerCase() === safeStr || c.value.toLowerCase() === safeStr,
  );
  if (found) return { name: found.name, value: found.value };
  return { name: "Other", value: "other" };
}

function CleanField({ label, required, optional, hint, quiet, children }) {
  return (
    <div className="space-y-1 w-full">
      <div className="flex items-center justify-between ml-0.5">
        <label className={`text-[13px] ${quiet ? "font-medium text-gray-500" : "font-semibold text-gray-700"}`}>
          {label} {required && <span className="text-[#e27f2c]">*</span>}
        </label>
        {optional && !quiet && (
          <span className="text-[11.5px] font-medium text-[#a3acb9] tracking-wide">
            Optional
          </span>
        )}
      </div>
      {children}
      {hint && (
        <p className="text-[12px] text-gray-500 ml-0.5">{hint}</p>
      )}
    </div>
  );
}

function MoreDetailsToggle({ open, onToggle, showLabel, hideLabel }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 text-[13px] font-semibold text-[#e27f2c] ml-0.5"
    >
      <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.5} />
      {open ? hideLabel : showLabel}
    </button>
  );
}

const UNIT_OPTIONS = [
  { value: "units", label: "Units" },
  { value: "cans", label: "Cans" },
  { value: "boxes", label: "Boxes" },
  { value: "bottles", label: "Bottles" },
  { value: "packets", label: "Bags" },
  { value: "cases", label: "Cases" },
];

const UNIT_SINGULAR = {
  units: "unit",
  cans: "can",
  boxes: "box",
  bottles: "bottle",
  packets: "bag",
  cases: "case",
};

// Weight units convert to lbs directly; volume units (fl_oz/ml/l/gal) have no
// reliable weight without a per-product density, so they're stored as-is and
// contribute 0 toward totalWeightLbs.
function computePerUnitLbs(weightStr, unit) {
  const val = parseFloat(weightStr);
  if (!val || val <= 0) return 0;
  if (unit === "lbs") return val;
  if (unit === "oz") return val / 16;
  if (unit === "g") return val / 453.592;
  if (unit === "kg") return val * 2.20462;
  return 0;
}

const WEIGHT_UNIT_OPTIONS = [
  { value: "lbs", label: "lbs" },
  { value: "oz", label: "oz" },
  { value: "fl_oz", label: "fl oz" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "ml", label: "mL" },
  { value: "l", label: "L" },
  { value: "gal", label: "gal" },
];

const SOURCE_OPTIONS = [
  { value: "not_specified", label: "Not specified" },
  { value: "donation", label: "Donation" },
  { value: "retail_rescue", label: "Rescue" },
  { value: "purchased", label: "Purchased" },
  { value: "usda", label: "USDA" },
];

const PACK_SIZE_PRESETS = ["3", "6", "8", "12", "24", "36", "48"];

export function MobileManualEntryView({ onBack, initialItem, onSave, onDelete, pantryId }) {
  const isEditing = !!initialItem?.id;
  const displayBarcode = initialItem?.barcode || "";

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Identify
  const [formName, setFormName] = useState(initialItem?.name || "");
  const [formCategory, setFormCategory] = useState(initialItem?.category || "");
  const [formPhotoUrl, setFormPhotoUrl] = useState(initialItem?.photoUrl || initialItem?.photo_url || null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  // Sync state if initialItem prop changes while mounted (e.g. switching items to edit or new scan)
  useEffect(() => {
    if (initialItem) {
      setFormName(initialItem.name || "");
      setFormCategory(initialItem.category || "");
      setFormPhotoUrl(initialItem.photoUrl || initialItem.photo_url || null);
      if (initialItem.intakeMode) setIntakeMode(initialItem.intakeMode);
      
      if (initialItem.intakeMode === "weight") {
        if (initialItem.quantity) setFormWeight(String(initialItem.quantity));
        if (initialItem.unit) setFormWeightUnit(initialItem.unit);
      } else {
        if (initialItem.quantity) setFormQty(String(initialItem.quantity));
        if (initialItem.unit) setFormUnit(initialItem.unit);
      }
      
      if (initialItem.expirationDate) setExpirationDate(initialItem.expirationDate);
      if (initialItem.sourceType) setFormSource(initialItem.sourceType);
      if (initialItem.storageLocation) setFormStorageLocation(initialItem.storageLocation);
      if (initialItem.donorName) setDonorName(initialItem.donorName);
    }
  }, [initialItem]);


  // Autocomplete state — visibility is derived from isTyping + suggestions.length
  // (not tracked separately) so the dropdown's open/closed state can never
  // fall out of sync with its content and flicker.
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [dictionary, setDictionary] = useState([]);
  const [isDictionaryLoaded, setIsDictionaryLoaded] = useState(false);

  // Fetch local dictionary on mount for instant autocomplete
  useEffect(() => {
    let mounted = true;
    const fetchDictionary = async () => {
      try {
        const res = await fetch('/api/foods/dictionary', {
          headers: { 'x-pantry-id': pantryId || '' }
        });
        if (res.ok && mounted) {
          const data = await res.json();
          setDictionary(data.dictionary || []);
          setIsDictionaryLoaded(true);
        }
      } catch (error) {
        console.error("Dictionary fetch failed:", error);
      }
    };
    fetchDictionary();
    return () => { mounted = false; };
  }, [pantryId]);

  // Instantaneous 0ms local filtering
  useEffect(() => {
    if (!isTyping || formName.trim().length < 2 || !isDictionaryLoaded) {
      setSuggestions([]);
      return;
    }

    const query = formName.trim().toLowerCase();
    const filtered = dictionary
      .filter(item => item.name.toLowerCase().includes(query))
      .slice(0, 5); // Max 5 suggestions

    setSuggestions(filtered);
  }, [formName, isTyping, dictionary, isDictionaryLoaded]);

  // Step 2: Quantify
  const [intakeMode, setIntakeMode] = useState(initialItem?.intakeMode || "count");
  const [formQty, setFormQty] = useState(
    initialItem?.intakeMode !== "weight" && initialItem?.quantity 
      ? String(initialItem.quantity) 
      : "1"
  );
  const [formWeight, setFormWeight] = useState(
    initialItem?.intakeMode === "weight" && initialItem?.quantity
      ? String(initialItem.quantity)
      : ""
  );
  const [formWeightUnit, setFormWeightUnit] = useState(
    initialItem?.intakeMode === "weight" && initialItem?.unit
      ? initialItem.unit
      : "lbs"
  );
  const [formUnit, setFormUnit] = useState(
    initialItem?.intakeMode !== "weight" && initialItem?.unit
      ? initialItem.unit
      : "units"
  );
  
  // Step 3: Details
  const [formStorageLocation, setFormStorageLocation] = useState(initialItem?.storageLocation || "");
  
  const [packSize, setPackSize] = useState(initialItem?.packSize || "");
  const [packSizeMode, setPackSizeMode] = useState(() => {
    const v = initialItem?.packSize ? String(initialItem.packSize) : "";
    if (!v) return "none";
    return PACK_SIZE_PRESETS.includes(v) ? v : "custom";
  });

  const PACK_SIZE_OPTIONS = [
    { value: "none", label: "Not packaged" },
    ...PACK_SIZE_PRESETS.map((n) => ({ value: n, label: `${n} per pack` })),
    { value: "custom", label: "Custom amount…" },
  ];

  // Step 3: Details
  const [expirationDate, setExpirationDate] = useState(initialItem?.expirationDate || "");
  const [formSource, setFormSource] = useState(initialItem?.sourceType || "not_specified");
  const [donorName, setDonorName] = useState(initialItem?.donorName || "");

  // Secondary fields stay tucked away unless already filled in (editing) or the user asks for them
  const [showMoreStep2, setShowMoreStep2] = useState(!!initialItem?.packSize);
  const [showMoreStep3, setShowMoreStep3] = useState(
    !!(initialItem?.storageLocation || (initialItem?.sourceType && initialItem.sourceType !== "not_specified") || initialItem?.donorName)
  );

  const handleSave = () => {
    if (!formName.trim() || !formCategory) return;

    let finalQty, finalUnit, perUnitLbs, totalLbs;

    if (intakeMode === "weight") {
      // Bulk/loose donation — no individual count, the entered value IS the total.
      finalQty = parseFloat(formWeight) || 0;
      finalUnit = formWeightUnit;
      perUnitLbs = computePerUnitLbs(formWeight, formWeightUnit);
      totalLbs = perUnitLbs;
    } else {
      // Counted items — quantity is always required; size-per-unit is optional
      // and only contributes to totalWeightLbs when the volunteer filled it in.
      finalQty = parseFloat(formQty) || 1;
      finalUnit = formUnit;
      perUnitLbs = computePerUnitLbs(formWeight, formWeightUnit);
      totalLbs = perUnitLbs * finalQty;
    }

    if (finalQty <= 0) return;

    const newItem = {
      id:
        initialItem?.id ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      barcode: displayBarcode,
      name: formName.trim(),
      category: formCategory,
      categoryName: getCategoryMeta(formCategory).name,
      quantity: String(finalQty),
      unit: finalUnit,
      intakeMode,
      weightPerUnit: perUnitLbs > 0 ? perUnitLbs.toFixed(2) : "0",
      totalWeightLbs: Number((totalLbs > 0 ? totalLbs : 0).toFixed(2)),
      expirationDate: expirationDate || null,
      expirationPrecision: expirationDate ? "day" : "none",
      sourceType: formSource,
      packSize: packSize ? String(packSize) : null,
      donorName: donorName.trim() || null,
      storageLocation: formStorageLocation.trim() || null,
      photoUrl: formPhotoUrl,
    };

    onSave(newItem);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (formName.trim() && formCategory) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (formQty) setCurrentStep(3);
    } else if (currentStep === 3) {
      handleSave();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 1) return !formName.trim() || !formCategory;
    if (currentStep === 2) {
      if (intakeMode === "weight") return !formWeight || parseFloat(formWeight) <= 0;
      return !formQty || parseFloat(formQty) <= 0;
    }
    return false;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isNextDisabled()) {
        handleNextStep();
      }
    }
  };

  const inputClass =
    "w-full h-[48px] px-3.5 rounded-xl border border-gray-200 bg-white text-[16px] font-medium text-[#1a1f36] outline-none focus:border-[#e27f2c] focus:ring-4 focus:ring-[#e27f2c]/10 transition-all placeholder:text-[#a3acb9] placeholder:font-normal";

  const quietInputClass =
    "w-full h-[48px] px-3.5 rounded-xl border border-gray-100 bg-gray-50 text-[15px] font-medium text-[#1a1f36] outline-none focus:border-[#e27f2c] focus:ring-4 focus:ring-[#e27f2c]/10 focus:bg-white transition-all placeholder:text-[#a3acb9] placeholder:font-normal";

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex flex-col overflow-hidden"
    >
      <div className="pt-safe flex flex-col shrink-0 bg-white relative z-10">
        <div className="px-5 py-2.5 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 active:bg-gray-300 text-[#1a1f36] transition-colors shadow-sm"
          >
            {currentStep === 1 ? (
              <X className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            )}
          </button>
          {isEditing && onDelete && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this item?")) {
                  onDelete(initialItem);
                }
              }}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
        
        <div className="h-1 w-full bg-gray-100">
          <motion.div 
            className="h-full bg-[#e27f2c]"
            initial={{ width: "33%" }}
            animate={{ width: `${(currentStep / 3) * 100}%` }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 pb-24">
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="mt-0.5">
              <h1 className="text-[22px] font-semibold text-[#1a1f36] leading-tight tracking-tight">
                {isEditing ? "Edit item" : "What are you adding?"}
              </h1>
              <p className="text-[13.5px] text-[#697386] mt-0.5">
                {isEditing ? "Update the product details below." : "Enter the product name and category."}
              </p>
              
              {!isEditing && displayBarcode && !initialItem?.isInternal && (
                <div className="inline-flex items-center gap-1.5 mt-2 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">{displayBarcode}</span>
                </div>
              )}
            </div>

            {!isEditing && displayBarcode && !initialItem?.isInternal && (
              <div className="bg-orange-50 border-l-4 border-[#e27f2c] p-3 rounded-r-xl flex gap-2.5 items-start">
                <AlertCircle className="w-4 h-4 text-[#e27f2c] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#c06245] font-bold text-[13.5px]">
                    Barcode not found
                  </p>
                  <p className="text-[#c06245]/85 text-[12.5px] mt-0.5 leading-snug font-medium">
                    This item isn't in our database yet. Fill in the details below and it will be saved for future scans!
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <CleanField label="Item name" required>
                <div className="relative">
                  <input
                    type="text"
                    value={formName}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setIsTyping(true);
                    }}
                    onFocus={() => {
                      if (formName.trim().length >= 2) setIsTyping(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setIsTyping(false), 200);
                    }}
                    placeholder="e.g. Campbell's Tomato Soup"
                    className={`${inputClass} pr-12`}
                    autoFocus={!isEditing}
                  />
                  {formName.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormName("");
                        setSuggestions([]);
                        setIsTyping(false);
                        setFormPhotoUrl(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                      title="Clear name"
                    >
                      <X className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  )}

                  <AnimatePresence>
                    {isTyping && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden z-[9999]"
                      >
                        {suggestions.map((sugg) => (
                          <button
                            key={sugg.id || sugg.name}
                            type="button"
                            className="w-full px-3.5 py-2.5 text-left border-b border-gray-100 last:border-0 hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 transition-colors"
                            onClick={() => {
                              setFormName(sugg.name);
                              if (sugg.category) setFormCategory(sugg.category);
                              setFormPhotoUrl(sugg.photoUrl || sugg.photo_url || null);
                              setIsTyping(false);
                            }}
                          >
                            {sugg.photoUrl ? (
                              <img
                                src={sugg.photoUrl}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 shrink-0 flex items-center justify-center">
                                <Search className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[14.5px] font-semibold text-[#1a1f36] truncate">
                                {sugg.name}
                              </p>
                              <p className="text-[12.5px] text-[#697386] truncate font-medium mt-0.5">
                                {sugg.brand ||
                                  getCategoryMeta(sugg.category).name ||
                                  "Unknown"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CleanField>

              <CleanField label="Category" required>
                <button
                  type="button"
                  onClick={() => setCategoryPickerOpen((v) => !v)}
                  className={`${inputClass} flex items-center gap-2.5 text-left ${!formCategory ? 'text-[#a3acb9]' : 'text-[#1a1f36]'}`}
                >
                  {formCategory ? (
                    <>
                      <div className={`w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 ${getCategoryVisual(formCategory).style.bg}`}>
                        <img
                          src={getCategoryVisual(formCategory).imagePath}
                          alt=""
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ transform: `scale(${getCategoryVisual(formCategory).imageScale})` }}
                        />
                      </div>
                      <span className="flex-1 truncate">{getCategoryVisual(formCategory).name}</span>
                    </>
                  ) : (
                    <span className="flex-1">Select a category...</span>
                  )}
                  <ChevronDown
                    className={`w-5 h-5 text-[#8792a2] shrink-0 transition-transform ${categoryPickerOpen ? "rotate-180" : ""}`}
                    strokeWidth={2.5}
                  />
                </button>

              </CleanField>

              <CleanField label="Product photo" optional>
                <Suspense fallback={<ProductImagePickerSkeleton />}>
                  <ProductImagePicker
                    formName={formName}
                    formCategory={formCategory}
                    photoUrl={formPhotoUrl}
                    onSelectPhoto={(url) => setFormPhotoUrl(url)}
                  />
                </Suspense>
              </CleanField>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="mt-0.5">
              <h1 className="text-[22px] font-semibold text-[#1a1f36] leading-tight tracking-tight">
                How much is there?
              </h1>
              <p className="text-[13.5px] text-[#697386] mt-0.5">
                {intakeMode === "count"
                  ? "Count the items and, if you know it, the size of one."
                  : "For loose or bulk donations with no individual count."}
              </p>
            </div>

            <div className="flex gap-2 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (intakeMode !== "count") {
                    setFormWeight("");
                    setIntakeMode("count");
                  }
                }}
                className={`flex-1 h-9 rounded-lg text-[13.5px] font-semibold transition-colors ${
                  intakeMode === "count" ? "bg-[#fff3ea] text-[#e27f2c]" : "text-gray-500"
                }`}
              >
                Count items
              </button>
              <button
                type="button"
                onClick={() => {
                  if (intakeMode !== "weight") {
                    setFormWeight("");
                    setIntakeMode("weight");
                  }
                }}
                className={`flex-1 h-9 rounded-lg text-[13.5px] font-semibold transition-colors ${
                  intakeMode === "weight" ? "bg-[#fff3ea] text-[#e27f2c]" : "text-gray-500"
                }`}
              >
                Total weight
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {intakeMode === "count" ? (
                /* ── COUNTED ITEMS (default) — matches the Known-Item quick sheet ── */
                <div className="space-y-7">
                  <CleanField label="How many?" required>
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center bg-white rounded-xl border border-gray-200 h-[48px] min-w-0 focus-within:border-[#e27f2c] focus-within:ring-4 focus-within:ring-[#e27f2c]/10 transition-all overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setFormQty(String(Math.max(1, (parseInt(formQty, 10) || 1) - 1)))}
                            className="h-full w-14 shrink-0 flex items-center justify-center text-[#1a1f36] bg-gray-50 active:bg-gray-100 border-r border-gray-200 transition-colors"
                          >
                            <Minus className="w-5 h-5" strokeWidth={2.5} />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formQty}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setFormQty(e.target.value.replace(/[^0-9]/g, ""))}
                            className="w-0 flex-1 min-w-0 text-center text-[20px] font-bold text-[#1a1f36] bg-transparent outline-none h-full"
                          />
                          <button
                            type="button"
                            onClick={() => setFormQty(String((parseInt(formQty, 10) || 1) + 1))}
                            className="h-full w-14 shrink-0 flex items-center justify-center text-[#1a1f36] bg-gray-50 active:bg-gray-100 border-l border-gray-200 transition-colors"
                          >
                            <Plus className="w-5 h-5" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>

                      <div className="w-[130px] shrink-0">
                        <div className="relative h-[48px]">
                          <select
                            value={formUnit}
                            onChange={(e) => setFormUnit(e.target.value)}
                            className="h-full w-full pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-[16px] font-medium text-[#1a1f36] outline-none appearance-none focus:border-[#e27f2c] focus:ring-4 focus:ring-[#e27f2c]/10 transition-all"
                          >
                            {UNIT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none bg-white pl-1">
                            <ChevronDown className="w-5 h-5 text-[#8792a2]" strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CleanField>

                  <CleanField
                    label={`How big is 1 ${UNIT_SINGULAR[formUnit] || "unit"}?`}
                    optional
                    hint="Leave blank if unsure"
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0 relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formWeight}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setFormWeight(e.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder="e.g. 500 mL, 12 oz"
                          className={`${inputClass} pr-9`}
                        />
                        {formWeight && (
                          <button
                            type="button"
                            onClick={() => setFormWeight("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                            aria-label="Clear size"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                      <div className="w-[100px] shrink-0">
                        <div className="relative h-[48px]">
                          <select
                            value={formWeightUnit}
                            onChange={(e) => setFormWeightUnit(e.target.value)}
                            className="h-full w-full pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-[15px] font-medium text-[#1a1f36] outline-none appearance-none focus:border-[#e27f2c] focus:ring-4 focus:ring-[#e27f2c]/10 transition-all"
                          >
                            {WEIGHT_UNIT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-[#8792a2]" strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CleanField>

                  <div className="space-y-3">
                    <MoreDetailsToggle
                      open={showMoreStep2}
                      onToggle={() => setShowMoreStep2((v) => !v)}
                      showLabel="Add pack size"
                      hideLabel="Hide pack size"
                    />

                    {showMoreStep2 && (
                      <CleanField label="Items per pack" quiet>
                        <div className="relative">
                          <select
                            value={packSizeMode}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPackSizeMode(val);
                              if (val === "none") setPackSize("");
                              else if (val !== "custom") setPackSize(val);
                            }}
                            className={`${quietInputClass} appearance-none pr-12`}
                          >
                            {PACK_SIZE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none bg-gray-50 pl-2">
                            <ChevronDown className="w-6 h-6 text-[#8792a2]" strokeWidth={2.5} />
                          </div>
                        </div>
                        {packSizeMode === "custom" && (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={packSize}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setPackSize(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="e.g. 15"
                            className={`${quietInputClass} mt-3`}
                          />
                        )}
                      </CleanField>
                    )}
                  </div>
                </div>
              ) : (
                /* ── BULK / LOOSE WEIGHT (secondary path) — no per-unit count ── */
                <>
                  <CleanField label="Total weight" required hint="Enter the total weight of this donation">
                    <div className="flex rounded-xl focus-within:ring-4 focus-within:ring-[#e27f2c]/10 transition-all overflow-hidden border border-gray-200 focus-within:border-[#e27f2c] h-[48px]">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formWeight}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setFormWeight(e.target.value.replace(/[^0-9.]/g, ""))}
                        placeholder="e.g. 25"
                        className="w-full h-full px-4 border-r border-gray-200 bg-white text-[20px] font-bold text-[#1a1f36] outline-none relative z-10 placeholder:text-[#a3acb9] placeholder:font-normal placeholder:text-[16px]"
                        autoFocus
                      />
                      <div className="relative bg-gray-50 shrink-0 w-[100px]">
                        <select
                          value={formWeightUnit}
                          onChange={(e) => setFormWeightUnit(e.target.value)}
                          className="h-full w-full pl-4 pr-10 bg-transparent text-[16px] font-medium text-[#1a1f36] outline-none appearance-none"
                        >
                          {WEIGHT_UNIT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ChevronDown className="w-5 h-5 text-[#8792a2]" strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  </CleanField>
                </>
              )}
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="mt-0.5">
              <h1 className="text-[22px] font-semibold text-[#1a1f36] leading-tight tracking-tight">
                Any extra details?
              </h1>
              <p className="text-[13.5px] text-[#697386] mt-0.5">
                Add expiration and sourcing info.
              </p>
            </div>

            <div className="space-y-4">
              <CleanField label="Expiration date" optional>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#a3acb9] pointer-events-none z-10" />
                  <input
                    type="date"
                    value={expirationDate}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className={`${inputClass} pl-12 pr-12 text-transparent caret-transparent appearance-none box-border max-w-full`}
                    style={{ colorScheme: "light" }}
                  />
                  <span
                    className={`absolute left-12 right-12 top-1/2 -translate-y-1/2 truncate pointer-events-none text-[16px] ${expirationDate ? "font-medium text-[#1a1f36]" : "font-normal text-[#a3acb9]"}`}
                  >
                    {expirationDate ? formatExpDateDisplay(expirationDate) : "No date set"}
                  </span>
                  {expirationDate && (
                    <button
                      type="button"
                      onClick={() => setExpirationDate("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors z-10"
                    >
                      <X className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </CleanField>

              <MoreDetailsToggle
                open={showMoreStep3}
                onToggle={() => setShowMoreStep3((v) => !v)}
                showLabel="Add storage, source & donor info"
                hideLabel="Hide storage, source & donor info"
              />

              {showMoreStep3 && (
                <>
                  <CleanField label="Storage location" quiet>
                    <input
                      type="text"
                      value={formStorageLocation}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setFormStorageLocation(e.target.value)}
                      placeholder="e.g. Shelf A, Freezer, Back Room"
                      className={quietInputClass}
                    />
                  </CleanField>

                  <div className="grid grid-cols-2 gap-3">
                    <CleanField label="Source type" quiet>
                      <div className="relative">
                        <select
                          value={formSource}
                          onChange={(e) => setFormSource(e.target.value)}
                          className={`${quietInputClass} appearance-none pr-10`}
                        >
                          {SOURCE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none bg-gray-50 pl-1">
                          <ChevronDown className="w-5 h-5 text-[#8792a2]" strokeWidth={2.5} />
                        </div>
                      </div>
                    </CleanField>

                    <CleanField label="Donor name" quiet>
                      <input
                        type="text"
                        value={donorName}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="e.g. Target"
                        className={quietInputClass}
                      />
                    </CleanField>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── STILL BOTTOM ACTION BAR ── */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-5 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))] z-40">
        <button
          onClick={handleNextStep}
          disabled={isNextDisabled()}
          className="w-full h-[48px] rounded-xl bg-[#e27f2c] hover:bg-[#cf6f20] text-white font-bold text-[15.5px] shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {currentStep < 3 ? (
            <>
              Continue <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </>
          ) : (
             <>
              {isEditing ? <Save className="w-5 h-5" strokeWidth={2.5} /> : <Plus className="w-6 h-6" strokeWidth={2.5} />}
              {isEditing ? "Save changes" : "Add item"}
            </>
          )}
        </button>
      </div>

      {/* ── CATEGORY PICKER BOTTOM SHEET ── */}
      <AnimatePresence>
        {categoryPickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-[10000]"
              onClick={() => setCategoryPickerOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 right-0 bottom-0 z-[10001] bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.15)] flex flex-col"
              style={{ height: "82dvh" }}
            >
              <div className="pt-2.5 pb-1 flex justify-center shrink-0">
                <div className="w-10 h-1.5 rounded-full bg-gray-300" />
              </div>

              <div className="px-5 pt-1 pb-3 flex items-center justify-between shrink-0 border-b border-gray-100">
                <h2 className="text-[17px] font-semibold text-[#1a1f36]">
                  Select a category
                </h2>
                <button
                  type="button"
                  onClick={() => setCategoryPickerOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((c) => {
                    const isActive = formCategory === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          setFormCategory(c.value);
                          setCategoryPickerOpen(false);
                        }}
                        className={`flex flex-col items-center gap-2 py-4 px-1.5 rounded-xl border transition-colors ${
                          isActive ? "border-[#e27f2c] bg-[#fff3ea]" : "border-gray-200 bg-white active:bg-gray-50"
                        }`}
                      >
                        <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center ${c.style.bg}`}>
                          <img
                            src={c.imagePath}
                            alt=""
                            className="w-full h-full object-contain mix-blend-multiply"
                            style={{ transform: `scale(${c.imageScale ?? 1.5})` }}
                          />
                        </div>
                        <span className={`text-[12.5px] font-semibold text-center leading-tight ${isActive ? "text-[#e27f2c]" : "text-gray-600"}`}>
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
