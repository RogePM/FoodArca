"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { categories } from "@/lib/constants";

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

function CleanField({ label, required, optional, hint, children }) {
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between ml-1">
        <label className="text-[14px] font-semibold text-gray-700">
          {label} {required && <span className="text-[#d97757]">*</span>}
        </label>
        {optional && (
          <span className="text-[12px] font-medium text-[#a3acb9] tracking-wide">
            Optional
          </span>
        )}
      </div>
      {children}
      {hint && (
        <p className="text-[13px] text-gray-500 ml-1">{hint}</p>
      )}
    </div>
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

export function MobileManualEntryView({ onBack, initialItem, onSave, pantryId }) {
  const isEditing = !!initialItem?.id;
  const displayBarcode = initialItem?.barcode || "";

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Identify
  const [formName, setFormName] = useState(initialItem?.name || "");
  const [formCategory, setFormCategory] = useState(initialItem?.category || "");
  const [formPhotoUrl, setFormPhotoUrl] = useState(initialItem?.photoUrl || null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
    setShowSuggestions(filtered.length > 0);
  }, [formName, isTyping, dictionary, isDictionaryLoaded]);

  // Step 2: Quantify
  const [formQty, setFormQty] = useState(initialItem?.quantity || "1");
  const [formWeight, setFormWeight] = useState(
    initialItem?.weightPerUnit &&
      initialItem?.weightPerUnit !== "0" &&
      initialItem?.weightPerUnit !== "0.00"
      ? String(initialItem.weightPerUnit)
      : "",
  );
  const [formWeightUnit, setFormWeightUnit] = useState("lbs");
  const [formUnit, setFormUnit] = useState(initialItem?.unit || "units");
  
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

  const handleSave = () => {
    if (!formName.trim() || !formQty || !formCategory) return;

    const qtyNum = parseFloat(formQty) || 1;
    let perUnitLbs = 0;
    if (formWeight && formWeightUnit === "oz") {
      perUnitLbs = parseFloat(formWeight) / 16;
    } else if (formWeight) {
      perUnitLbs = parseFloat(formWeight);
    }

    const newItem = {
      id:
        initialItem?.id ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      barcode: displayBarcode,
      name: formName.trim(),
      category: formCategory,
      categoryName: getCategoryMeta(formCategory).name,
      quantity: String(qtyNum),
      unit: formUnit,
      weightPerUnit: perUnitLbs > 0 ? perUnitLbs.toFixed(2) : "0",
      totalWeightLbs: Number((perUnitLbs * qtyNum).toFixed(2)),
      intakeMode: "count",
      expirationDate: expirationDate || null,
      expirationPrecision: expirationDate ? "day" : "none",
      sourceType: formSource,
      packSize: packSize ? String(packSize) : null,
      donorName: donorName.trim() || null,
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
    if (currentStep === 2) return !formQty || parseFloat(formQty) <= 0;
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
    "w-full h-[56px] px-4 rounded-xl border-2 border-gray-200 bg-white text-[16px] font-medium text-[#1a1f36] outline-none focus:border-[#d97757] focus:ring-4 focus:ring-[#d97757]/10 transition-all placeholder:text-[#a3acb9] placeholder:font-normal";

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex flex-col overflow-hidden"
    >
      <div className="pt-safe flex flex-col shrink-0 bg-white relative z-10">
        <div className="p-4 pb-2 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 active:bg-gray-100 text-[#1a1f36] transition-colors"
          >
            {currentStep === 1 ? (
              <X className="w-5 h-5" strokeWidth={2.5} />
            ) : (
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            )}
          </button>
        </div>
        
        <div className="h-1 w-full bg-gray-100 mt-2">
          <motion.div 
            className="h-full bg-[#d97757]"
            initial={{ width: "33%" }}
            animate={{ width: `${(currentStep / 3) * 100}%` }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-[140px]">
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="mt-2">
              <h1 className="text-[28px] font-semibold text-[#1a1f36] leading-tight tracking-tight">
                {isEditing ? "Edit item" : "What are you adding?"}
              </h1>
              <p className="text-[15px] text-[#697386] mt-1">
                {isEditing ? "Update the product details below." : "Enter the product name and category."}
              </p>
              
              {displayBarcode && !initialItem?.isInternal && (
                <div className="inline-flex items-center gap-2 mt-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-[12px] font-bold text-gray-600 uppercase tracking-widest">{displayBarcode}</span>
                </div>
              )}
            </div>

            {!isEditing && displayBarcode && !initialItem?.isInternal && (
              <div className="bg-orange-50 border-l-4 border-[#d97757] p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-[#d97757] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#c06245] font-bold text-[15px]">
                    Barcode not found
                  </p>
                  <p className="text-[#c06245]/80 text-[14px] mt-1 leading-snug font-medium">
                    This item isn't in our database yet. Fill in the details below and it will be saved for future scans!
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <CleanField label="Item name" required>
                <div className="relative">
                  <input
                    type="text"
                    value={formName}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setIsTyping(true);
                      setIsSearching(true);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="e.g. Campbell's Tomato Soup"
                    className={inputClass}
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#d97757]" />
                    </div>
                  )}

                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
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
                            className="w-full px-5 py-4 text-left border-b border-gray-100 last:border-0 hover:bg-gray-50 active:bg-gray-100 flex items-center gap-4 transition-colors"
                            onClick={() => {
                              setFormName(sugg.name);
                              if (sugg.category) setFormCategory(sugg.category);
                              if (sugg.photoUrl) setFormPhotoUrl(sugg.photoUrl);
                              setIsTyping(false);
                              setShowSuggestions(false);
                              
                              if (sugg.category) {
                                setTimeout(() => setCurrentStep(2), 150);
                              }
                            }}
                          >
                            {sugg.photoUrl ? (
                              <img
                                src={sugg.photoUrl}
                                alt=""
                                className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 shrink-0 flex items-center justify-center">
                                <Search className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[16px] font-bold text-[#1a1f36] truncate">
                                {sugg.name}
                              </p>
                              <p className="text-[14px] text-[#697386] truncate font-medium mt-0.5">
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

                {formPhotoUrl && (
                  <div className="mt-4 relative w-20 h-20 rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
                    <img
                      src={formPhotoUrl}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormPhotoUrl(null)}
                      className="absolute top-1 right-1 w-6 h-6 bg-white/90 backdrop-blur border border-gray-200 rounded-full flex items-center justify-center text-gray-600 shadow-sm active:scale-95 transition-all"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={3} />
                    </button>
                  </div>
                )}
              </CleanField>

              <CleanField label="Category" required>
                <div className="relative">
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      if (e.target.value && formName.trim()) {
                         setTimeout(() => setCurrentStep(2), 150);
                      }
                    }}
                    className={`${inputClass} appearance-none pr-12 ${!formCategory ? 'text-[#a3acb9]' : 'text-[#1a1f36]'}`}
                  >
                    <option value="" disabled>Select a category...</option>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none bg-white pl-2">
                    <ChevronDown className="w-6 h-6 text-[#8792a2]" strokeWidth={2.5} />
                  </div>
                </div>
              </CleanField>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="mt-2">
              <h1 className="text-[28px] font-semibold text-[#1a1f36] leading-tight tracking-tight">
                How much is there?
              </h1>
              <p className="text-[15px] text-[#697386] mt-1">
                Enter the quantity and measurements.
              </p>
            </div>

            <div className="space-y-6">
              <CleanField label="Quantity" required>
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 h-[56px] min-w-0 focus-within:border-[#d97757] focus-within:ring-4 focus-within:ring-[#d97757]/10 transition-all overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setFormQty(String(Math.max(1, (parseInt(formQty, 10) || 1) - 1)))}
                        className="h-full w-14 shrink-0 flex items-center justify-center text-[#1a1f36] bg-gray-50 active:bg-gray-100 border-r-2 border-gray-200 transition-colors"
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
                        className="h-full w-14 shrink-0 flex items-center justify-center text-[#1a1f36] bg-gray-50 active:bg-gray-100 border-l-2 border-gray-200 transition-colors"
                      >
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  <div className="w-[140px] shrink-0">
                    <div className="relative h-[56px]">
                      <select
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        className="h-full w-full pl-4 pr-10 rounded-xl border-2 border-gray-200 bg-white text-[16px] font-medium text-[#1a1f36] outline-none appearance-none focus:border-[#d97757] focus:ring-4 focus:ring-[#d97757]/10 transition-all"
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

              <CleanField label="Items per pack" optional hint="How many come in one case or bag?">
                <div className="relative">
                  <select
                    value={packSizeMode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPackSizeMode(val);
                      if (val === "none") setPackSize("");
                      else if (val !== "custom") setPackSize(val);
                    }}
                    className={`${inputClass} appearance-none pr-12`}
                  >
                    {PACK_SIZE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none bg-white pl-2">
                    <ChevronDown className="w-6 h-6 text-[#8792a2]" strokeWidth={2.5} />
                  </div>
                </div>
                {packSizeMode === "custom" && (
                  <input
                    type="number"
                    value={packSize}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="e.g. 15"
                    className={`${inputClass} mt-3`}
                  />
                )}
              </CleanField>

              <CleanField label="Per-unit weight" optional hint="Weight of a single item">
                <div className="flex rounded-xl focus-within:ring-4 focus-within:ring-[#d97757]/10 transition-all overflow-hidden border-2 border-gray-200 focus-within:border-[#d97757] h-[56px]">
                  <input
                    type="number"
                    value={formWeight}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setFormWeight(e.target.value)}
                    placeholder="e.g. 16"
                    className="w-full h-full px-4 border-r-2 border-gray-200 bg-white text-[16px] font-medium text-[#1a1f36] outline-none relative z-10 placeholder:text-[#a3acb9] placeholder:font-normal"
                  />
                  <div className="relative bg-gray-50 shrink-0 w-[110px]">
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
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="mt-2">
              <h1 className="text-[28px] font-semibold text-[#1a1f36] leading-tight tracking-tight">
                Any extra details?
              </h1>
              <p className="text-[15px] text-[#697386] mt-1">
                Add expiration and sourcing info.
              </p>
            </div>

            <div className="space-y-6">
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

              <CleanField label="Source type">
                <div className="relative">
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className={`${inputClass} appearance-none pr-12`}
                  >
                    {SOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none bg-white pl-2">
                    <ChevronDown className="w-6 h-6 text-[#8792a2]" strokeWidth={2.5} />
                  </div>
                </div>
              </CleanField>

              <CleanField label="Donor name" optional>
                <input
                  type="text"
                  value={donorName}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Target"
                  className={inputClass}
                />
              </CleanField>
            </div>
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        <div className="bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2 pointer-events-auto">
          <button
            onClick={handleNextStep}
            disabled={isNextDisabled()}
            className="w-full h-[60px] rounded-full bg-[#d97757] hover:bg-[#c66547] text-white font-extrabold text-[16px] uppercase tracking-wider shadow-[0_8px_24px_rgba(217,119,87,0.35)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {currentStep < 3 ? (
              <>
                Continue <ArrowRight className="w-5 h-5" strokeWidth={3} />
              </>
            ) : (
               <>
                {isEditing ? <Save className="w-5 h-5" strokeWidth={3} /> : <Plus className="w-6 h-6" strokeWidth={3} />}
                {isEditing ? "Save changes" : "Add item"}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
