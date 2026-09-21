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
  Check,
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

function CleanField({ label, id, required, optional, hint, quiet, children }) {
  return (
    <div className="space-y-1 w-full">
      <div className="flex items-center justify-between ml-0.5">
        <label htmlFor={id} className={`text-[13px] ${quiet ? "font-medium text-gray-600" : "font-semibold text-gray-700"}`}>
          {label} {required && <span className="text-[#c96a1f]">*</span>}
        </label>
        {optional && !quiet && (
          <span className="text-[11.5px] font-medium text-gray-500 tracking-wide">
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
      className="flex items-center gap-1.5 min-h-11 -ml-0.5 pl-0.5 pr-3 text-[13px] font-bold text-[#c96a1f]"
    >
      <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.5} />
      {open ? hideLabel : showLabel}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared field building blocks — used by BOTH the single-screen edit form
// and the 3-step add wizard, so a fix or behavior change only has to be
// made once. Each field's own layout (single input vs. input+select, etc.)
// lives here; the surrounding heading/card/step chrome is owned by whoever
// renders it (add vs. edit render totally different chrome around the same
// fields).
// ─────────────────────────────────────────────────────────────────────────

function ItemNameField({
  id,
  formName,
  setFormName,
  suggestions,
  setSuggestions,
  isTyping,
  setIsTyping,
  setFormCategory,
  setFormPhotoUrl,
  handleKeyDown,
  inputClass,
  clearPhotoOnClear,
  autoFocus,
}) {
  return (
    <div className="relative">
      <input
        id={id}
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
        autoFocus={autoFocus}
      />
      {formName.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setFormName("");
            setSuggestions([]);
            setIsTyping(false);
            // A fresh add-new-item has no saved photo to protect. Editing an
            // existing item already has a real, saved photo attached, so
            // clearing the name there (e.g. to fix a typo) must not silently
            // discard it — only the add flow passes clearPhotoOnClear.
            if (clearPhotoOnClear) setFormPhotoUrl(null);
          }}
          aria-label="Clear name"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors"
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
                    {sugg.brand || getCategoryMeta(sugg.category).name || "Unknown"}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryField({ id, formCategory, categoryPickerOpen, setCategoryPickerOpen, inputClass }) {
  return (
    <button
      id={id}
      type="button"
      onClick={() => setCategoryPickerOpen((v) => !v)}
      className={`${inputClass} flex items-center gap-2.5 text-left ${!formCategory ? 'text-[#6b7280]' : 'text-[#1a1f36]'}`}
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
  );
}

function ProductPhotoFieldContent({ formName, formCategory, formPhotoUrl, setFormPhotoUrl }) {
  return (
    <Suspense fallback={<ProductImagePickerSkeleton />}>
      <ProductImagePicker
        formName={formName}
        formCategory={formCategory}
        photoUrl={formPhotoUrl}
        onSelectPhoto={(url) => setFormPhotoUrl(url)}
      />
    </Suspense>
  );
}

function ExpirationField({ id, expirationDate, setExpirationDate, handleKeyDown, inputClass }) {
  return (
    <div className="relative">
      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6b7280] pointer-events-none z-10" />
      <input
        id={id}
        type="date"
        aria-label="Expiration date"
        value={expirationDate}
        onKeyDown={handleKeyDown}
        onChange={(e) => setExpirationDate(e.target.value)}
        className={`${inputClass} pl-12 pr-12 text-transparent caret-transparent appearance-none box-border max-w-full`}
        style={{ colorScheme: "light" }}
      />
      <span
        className={`absolute left-12 right-12 top-1/2 -translate-y-1/2 truncate pointer-events-none text-[16px] ${expirationDate ? "font-medium text-[#1a1f36]" : "font-normal text-[#6b7280]"}`}
      >
        {expirationDate ? formatExpDateDisplay(expirationDate) : "No date set"}
      </span>
      {expirationDate && (
        <button
          type="button"
          onClick={() => setExpirationDate("")}
          aria-label="Clear expiration date"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors z-10"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function QuantityFields({
  intakeMode,
  setIntakeMode,
  formQty,
  setFormQty,
  formUnit,
  setFormUnit,
  formWeight,
  setFormWeight,
  formWeightUnit,
  setFormWeightUnit,
  showMoreStep2,
  setShowMoreStep2,
  packSize,
  setPackSize,
  packSizeMode,
  setPackSizeMode,
  handleKeyDown,
  inputClass,
  quietInputClass,
  idPrefix,
}) {
  return (
    <>
      <div className="flex gap-2 p-1 rounded-xl border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => {
            if (intakeMode !== "count") {
              setFormWeight("");
              setIntakeMode("count");
            }
          }}
          className={`flex-1 h-11 rounded-lg text-[13.5px] font-semibold transition-colors ${
            intakeMode === "count" ? "bg-[#fff3ea] text-[#b85f1a]" : "text-gray-500"
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
          className={`flex-1 h-11 rounded-lg text-[13.5px] font-semibold transition-colors ${
            intakeMode === "weight" ? "bg-[#fff3ea] text-[#b85f1a]" : "text-gray-500"
          }`}
        >
          Total weight
        </button>
      </div>

      <div className="mt-5">
        {intakeMode === "count" ? (
          <div className="space-y-7">
            <CleanField label="How many?" id={`${idPrefix}-qty`} required>
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center bg-white rounded-xl border border-gray-200 h-[48px] min-w-0 focus-within:border-[#e27f2c] focus-within:ring-4 focus-within:ring-[#e27f2c]/10 transition-all overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFormQty(String(Math.max(1, (parseInt(formQty, 10) || 1) - 1)))}
                      aria-label="Decrease quantity"
                      className="h-full w-14 shrink-0 flex items-center justify-center text-[#1a1f36] bg-gray-50 active:bg-gray-100 border-r border-gray-200 transition-colors"
                    >
                      <Minus className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                    <input
                      id={`${idPrefix}-qty`}
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
                      aria-label="Increase quantity"
                      className="h-full w-14 shrink-0 flex items-center justify-center text-[#1a1f36] bg-gray-50 active:bg-gray-100 border-l border-gray-200 transition-colors"
                    >
                      <Plus className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <div className="w-[112px] shrink-0">
                  <div className="relative h-[48px]">
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      aria-label="Unit"
                      className="h-full w-full pl-3.5 pr-9 rounded-xl border border-gray-200 bg-white text-[15px] font-medium text-[#1a1f36] outline-none appearance-none focus:border-[#e27f2c] focus:ring-4 focus:ring-[#e27f2c]/10 transition-all"
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
              id={`${idPrefix}-weight`}
              optional
              hint="Leave blank if unsure"
            >
              <div className="flex gap-3">
                <div className="flex-1 min-w-0 relative">
                  <input
                    id={`${idPrefix}-weight`}
                    type="text"
                    inputMode="decimal"
                    value={formWeight}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setFormWeight(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g. 500 mL, 12 oz"
                    className={`${inputClass} pr-11`}
                  />
                  {formWeight && (
                    <button
                      type="button"
                      onClick={() => setFormWeight("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                      aria-label="Clear size"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                <div className="w-[112px] shrink-0">
                  <div className="relative h-[48px]">
                    <select
                      value={formWeightUnit}
                      onChange={(e) => setFormWeightUnit(e.target.value)}
                      aria-label="Weight unit"
                      className="h-full w-full pl-3.5 pr-9 rounded-xl border border-gray-200 bg-white text-[15px] font-medium text-[#1a1f36] outline-none appearance-none focus:border-[#e27f2c] focus:ring-4 focus:ring-[#e27f2c]/10 transition-all"
                    >
                      {WEIGHT_UNIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
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
                <CleanField label="Items per pack" id={`${idPrefix}-packsize`} quiet>
                  <div className="relative">
                    <select
                      id={`${idPrefix}-packsize`}
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
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none bg-white pl-2">
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
                      aria-label="Custom pack size"
                      className={`${quietInputClass} mt-3`}
                    />
                  )}
                </CleanField>
              )}
            </div>
          </div>
        ) : (
          <CleanField label="Total weight" id={`${idPrefix}-total-weight`} required hint="Enter the total weight of this donation">
            <div className="flex rounded-xl focus-within:ring-4 focus-within:ring-[#e27f2c]/10 transition-all overflow-hidden border border-gray-200 focus-within:border-[#e27f2c] h-[48px]">
              <input
                id={`${idPrefix}-total-weight`}
                type="text"
                inputMode="decimal"
                value={formWeight}
                onKeyDown={handleKeyDown}
                onChange={(e) => setFormWeight(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="e.g. 25"
                className="w-full h-full px-4 border-r border-gray-200 bg-white text-[20px] font-bold text-[#1a1f36] outline-none relative z-10 placeholder:text-[#6b7280] placeholder:font-normal placeholder:text-[16px]"
              />
              <div className="relative bg-gray-50 shrink-0 w-[100px]">
                <select
                  value={formWeightUnit}
                  onChange={(e) => setFormWeightUnit(e.target.value)}
                  aria-label="Weight unit"
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
        )}
      </div>
    </>
  );
}

function MoreDetailsFields({
  showMoreStep3,
  setShowMoreStep3,
  formStorageLocation,
  setFormStorageLocation,
  formSource,
  setFormSource,
  donorName,
  setDonorName,
  handleKeyDown,
  quietInputClass,
  idPrefix,
}) {
  return (
    <div className="space-y-3">
      <MoreDetailsToggle
        open={showMoreStep3}
        onToggle={() => setShowMoreStep3((v) => !v)}
        showLabel="Add storage, source & donor info"
        hideLabel="Hide storage, source & donor info"
      />

      {showMoreStep3 && (
        <div className="space-y-3">
          <CleanField label="Storage location" id={`${idPrefix}-storage`} quiet>
            <input
              id={`${idPrefix}-storage`}
              type="text"
              value={formStorageLocation}
              onKeyDown={handleKeyDown}
              onChange={(e) => setFormStorageLocation(e.target.value)}
              placeholder="e.g. Shelf A, Freezer, Back Room"
              className={quietInputClass}
            />
          </CleanField>

          <div className="grid grid-cols-2 gap-3">
            <CleanField label="Source type" id={`${idPrefix}-source`} quiet>
              <div className="relative">
                <select
                  id={`${idPrefix}-source`}
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
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none bg-white pl-1">
                  <ChevronDown className="w-5 h-5 text-[#8792a2]" strokeWidth={2.5} />
                </div>
              </div>
            </CleanField>

            <CleanField label="Donor name" id={`${idPrefix}-donor`} quiet>
              <input
                id={`${idPrefix}-donor`}
                type="text"
                value={donorName}
                onKeyDown={handleKeyDown}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="e.g. Target"
                className={quietInputClass}
              />
            </CleanField>
          </div>
        </div>
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

const PACK_SIZE_OPTIONS = [
  { value: "none", label: "Not packaged" },
  ...PACK_SIZE_PRESETS.map((n) => ({ value: n, label: `${n} per pack` })),
  { value: "custom", label: "Custom amount…" },
];

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

  // Step 3: Details
  const [expirationDate, setExpirationDate] = useState(initialItem?.expirationDate || "");
  const [formSource, setFormSource] = useState(initialItem?.sourceType || "not_specified");
  const [donorName, setDonorName] = useState(initialItem?.donorName || "");

  // Secondary fields stay tucked away unless already filled in (editing) or the user asks for them
  const [showMoreStep2, setShowMoreStep2] = useState(!!initialItem?.packSize);
  const [showMoreStep3, setShowMoreStep3] = useState(
    !!(initialItem?.storageLocation || (initialItem?.sourceType && initialItem.sourceType !== "not_specified") || initialItem?.donorName)
  );

  // Snapshot of the edit form's starting values, taken once on mount, so
  // closing can tell a real edit apart from an untouched form and only
  // interrupt the volunteer when they'd actually lose something.
  const [editSnapshot] = useState(() => ({
    formName, formCategory, formPhotoUrl, intakeMode, formQty, formUnit,
    formWeight, formWeightUnit, formStorageLocation, packSize, expirationDate,
    formSource, donorName,
  }));
  const isDirty =
    isEditing &&
    JSON.stringify({
      formName, formCategory, formPhotoUrl, intakeMode, formQty, formUnit,
      formWeight, formWeightUnit, formStorageLocation, packSize, expirationDate,
      formSource, donorName,
    }) !== JSON.stringify(editSnapshot);

  // pendingSheet: null | "discard" | "delete" — routes both destructive exits
  // through one bottom-sheet confirm instead of a bare window.confirm().
  const [pendingSheet, setPendingSheet] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved

  const dialogRef = React.useRef(null);
  const closeButtonRef = React.useRef(null);

  // Focus trap + restore: the overlay covers the whole screen but the
  // inventory grid behind it stays mounted, so without this a keyboard or
  // screen-reader user can tab straight into stale background controls.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    const handleTrapKeydown = (e) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTrapKeydown);
    return () => {
      document.removeEventListener("keydown", handleTrapKeydown);
      previouslyFocused?.focus?.();
    };
  }, []);

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

    if (!isEditing) {
      onSave(newItem);
      return;
    }

    // Edit mode gives explicit saving → saved feedback before handing off,
    // so a volunteer has a real signal the real-time sync took before
    // passing the device to the next person (see PRODUCT.md: "never show
    // a stale number").
    setSaveState("saving");
    setTimeout(() => {
      setSaveState("saved");
      setTimeout(() => onSave(newItem), 450);
    }, 300);
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
    } else if (isDirty) {
      setPendingSheet("discard");
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

  // Edit mode has no steps to walk through, so all three steps' validation
  // rules are checked at once before "Save changes" is enabled.
  const isEditSaveDisabled = () => {
    if (!formName.trim() || !formCategory) return true;
    if (intakeMode === "weight") return !formWeight || parseFloat(formWeight) <= 0;
    return !formQty || parseFloat(formQty) <= 0;
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
    "w-full h-[48px] px-3.5 rounded-xl border border-gray-200 bg-white text-[16px] font-medium text-[#1a1f36] outline-none focus:border-[#e27f2c] focus:ring-4 focus:ring-[#e27f2c]/10 transition-all placeholder:text-[#6b7280] placeholder:font-normal";

  // Same visual weight as inputClass — every field in the form reads as
  // equally "real" regardless of which card it's tucked under. The "quiet"
  // distinction lives in the label (see CleanField) so a collapsed section
  // still feels secondary without its inputs looking unfinished.
  const quietInputClass = inputClass;

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-entry-heading"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex flex-col overflow-hidden"
    >
      <div className="pt-safe flex flex-col shrink-0 bg-white relative z-10">
        <div className="px-5 py-2.5 flex items-center justify-between">
          <button
            ref={closeButtonRef}
            onClick={handleBack}
            aria-label={currentStep === 1 ? "Close" : "Back"}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 active:bg-gray-300 text-[#1a1f36] transition-colors shadow-sm"
          >
            {currentStep === 1 ? (
              <X className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            )}
          </button>
          {isEditing && onDelete && (
            <button
              onClick={() => setPendingSheet("delete")}
              aria-label="Delete item"
              className="flex items-center justify-center w-11 h-11 rounded-full bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
        
        {!isEditing && (
          <div className="h-1 w-full bg-gray-100">
            <motion.div
              className="h-full bg-[#e27f2c]"
              initial={{ width: "33%" }}
              animate={{ width: `${(currentStep / 3) * 100}%` }}
              transition={{ ease: "easeInOut", duration: 0.3 }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 pb-24">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="mt-0.5">
              <h1 id="manual-entry-heading" className="text-[22px] font-semibold text-[#1a1f36] leading-tight tracking-tight">
                Edit item
              </h1>
              <p className="text-[13.5px] text-[#697386] mt-0.5">
                Update the product details below.
              </p>
            </div>

            {/* Quantity — most commonly edited field, surfaced first */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                Quantity
              </p>
              <QuantityFields
                intakeMode={intakeMode}
                setIntakeMode={setIntakeMode}
                formQty={formQty}
                setFormQty={setFormQty}
                formUnit={formUnit}
                setFormUnit={setFormUnit}
                formWeight={formWeight}
                setFormWeight={setFormWeight}
                formWeightUnit={formWeightUnit}
                setFormWeightUnit={setFormWeightUnit}
                showMoreStep2={showMoreStep2}
                setShowMoreStep2={setShowMoreStep2}
                packSize={packSize}
                setPackSize={setPackSize}
                packSizeMode={packSizeMode}
                setPackSizeMode={setPackSizeMode}
                handleKeyDown={handleKeyDown}
                inputClass={inputClass}
                quietInputClass={quietInputClass}
                idPrefix="edit"
              />
            </div>

            {/* Expiration — a single field, so its label would just repeat
                the card title; the eyebrow carries both the name and the
                Optional flag instead. */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Expiration
                </p>
                <span className="text-[11.5px] font-medium text-gray-500 tracking-wide">
                  Optional
                </span>
              </div>
              <ExpirationField
                id="edit-expiration-date"
                expirationDate={expirationDate}
                setExpirationDate={setExpirationDate}
                handleKeyDown={handleKeyDown}
                inputClass={inputClass}
              />
            </div>

            {/* Identity — least commonly edited, so it sits lowest */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                Product info
              </p>
              <div className="space-y-4">
              <CleanField label="Item name" id="edit-item-name" required>
                <ItemNameField
                  id="edit-item-name"
                  formName={formName}
                  setFormName={setFormName}
                  suggestions={suggestions}
                  setSuggestions={setSuggestions}
                  isTyping={isTyping}
                  setIsTyping={setIsTyping}
                  setFormCategory={setFormCategory}
                  setFormPhotoUrl={setFormPhotoUrl}
                  handleKeyDown={handleKeyDown}
                  inputClass={inputClass}
                  clearPhotoOnClear={false}
                />
              </CleanField>

              <CleanField label="Category" id="edit-category-trigger" required>
                <CategoryField
                  id="edit-category-trigger"
                  formCategory={formCategory}
                  categoryPickerOpen={categoryPickerOpen}
                  setCategoryPickerOpen={setCategoryPickerOpen}
                  inputClass={inputClass}
                />
              </CleanField>

              <CleanField label="Product photo" optional>
                <ProductPhotoFieldContent
                  formName={formName}
                  formCategory={formCategory}
                  formPhotoUrl={formPhotoUrl}
                  setFormPhotoUrl={setFormPhotoUrl}
                />
              </CleanField>
              </div>
            </div>

            {/* More details */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                More details
              </p>
              <MoreDetailsFields
                showMoreStep3={showMoreStep3}
                setShowMoreStep3={setShowMoreStep3}
                formStorageLocation={formStorageLocation}
                setFormStorageLocation={setFormStorageLocation}
                formSource={formSource}
                setFormSource={setFormSource}
                donorName={donorName}
                setDonorName={setDonorName}
                handleKeyDown={handleKeyDown}
                quietInputClass={quietInputClass}
                idPrefix="edit"
              />
            </div>
          </motion.div>
        ) : (
        <>
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="mt-0.5">
              <h1 id="manual-entry-heading" className="text-[22px] font-semibold text-[#1a1f36] leading-tight tracking-tight">
                What are you adding?
              </h1>
              <p className="text-[13.5px] text-[#697386] mt-0.5">
                Enter the product name and category.
              </p>

              {displayBarcode && !initialItem?.isInternal && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#e27f2c] shrink-0" />
                  <p className="text-[12px] text-[#c06245] font-medium leading-snug">
                    Barcode not found — add the details below to save it for next time.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <CleanField label="Item name" id="add-item-name" required>
                <ItemNameField
                  id="add-item-name"
                  formName={formName}
                  setFormName={setFormName}
                  suggestions={suggestions}
                  setSuggestions={setSuggestions}
                  isTyping={isTyping}
                  setIsTyping={setIsTyping}
                  setFormCategory={setFormCategory}
                  setFormPhotoUrl={setFormPhotoUrl}
                  handleKeyDown={handleKeyDown}
                  inputClass={inputClass}
                  clearPhotoOnClear={true}
                  autoFocus={!isEditing}
                />
              </CleanField>

              <CleanField label="Category" id="add-category-trigger" required>
                <CategoryField
                  id="add-category-trigger"
                  formCategory={formCategory}
                  categoryPickerOpen={categoryPickerOpen}
                  setCategoryPickerOpen={setCategoryPickerOpen}
                  inputClass={inputClass}
                />
              </CleanField>

              <CleanField label="Product photo" optional>
                <ProductPhotoFieldContent
                  formName={formName}
                  formCategory={formCategory}
                  formPhotoUrl={formPhotoUrl}
                  setFormPhotoUrl={setFormPhotoUrl}
                />
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
              <h1 id="manual-entry-heading" className="text-[22px] font-semibold text-[#1a1f36] leading-tight tracking-tight">
                How much is there?
              </h1>
              <p className="text-[13.5px] text-[#697386] mt-0.5">
                {intakeMode === "count"
                  ? "Count the items and, if you know it, the size of one."
                  : "For loose or bulk donations with no individual count."}
              </p>
            </div>

            <QuantityFields
              intakeMode={intakeMode}
              setIntakeMode={setIntakeMode}
              formQty={formQty}
              setFormQty={setFormQty}
              formUnit={formUnit}
              setFormUnit={setFormUnit}
              formWeight={formWeight}
              setFormWeight={setFormWeight}
              formWeightUnit={formWeightUnit}
              setFormWeightUnit={setFormWeightUnit}
              showMoreStep2={showMoreStep2}
              setShowMoreStep2={setShowMoreStep2}
              packSize={packSize}
              setPackSize={setPackSize}
              packSizeMode={packSizeMode}
              setPackSizeMode={setPackSizeMode}
              handleKeyDown={handleKeyDown}
              inputClass={inputClass}
              quietInputClass={quietInputClass}
              idPrefix="add"
            />
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
              <h1 id="manual-entry-heading" className="text-[22px] font-semibold text-[#1a1f36] leading-tight tracking-tight">
                Any extra details?
              </h1>
              <p className="text-[13.5px] text-[#697386] mt-0.5">
                Add expiration and sourcing info.
              </p>
            </div>

            <div className="space-y-4">
              <CleanField label="Expiration date" id="add-expiration-date" optional>
                <ExpirationField
                  id="add-expiration-date"
                  expirationDate={expirationDate}
                  setExpirationDate={setExpirationDate}
                  handleKeyDown={handleKeyDown}
                  inputClass={inputClass}
                />
              </CleanField>

              <MoreDetailsFields
                showMoreStep3={showMoreStep3}
                setShowMoreStep3={setShowMoreStep3}
                formStorageLocation={formStorageLocation}
                setFormStorageLocation={setFormStorageLocation}
                formSource={formSource}
                setFormSource={setFormSource}
                donorName={donorName}
                setDonorName={setDonorName}
                handleKeyDown={handleKeyDown}
                quietInputClass={quietInputClass}
                idPrefix="add"
              />
            </div>
          </motion.div>
        )}
        </>
        )}
      </div>

      {/* ── STILL BOTTOM ACTION BAR ── */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-5 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))] z-40">
        {isEditing ? (
          <button
            onClick={handleSave}
            disabled={isEditSaveDisabled() || saveState !== "idle"}
            aria-live="polite"
            className={`w-full h-[48px] rounded-xl text-white font-bold text-[15.5px] shadow-sm active:scale-95 transition-all disabled:active:scale-100 flex items-center justify-center gap-2 ${
              saveState === "saved"
                ? "bg-green-600 disabled:opacity-100"
                : "bg-[#e27f2c] hover:bg-[#cf6f20] disabled:opacity-50"
            }`}
          >
            {saveState === "saving" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                Saving…
              </>
            ) : saveState === "saved" ? (
              <>
                <Check className="w-5 h-5" strokeWidth={2.5} />
                Saved
              </>
            ) : (
              <>
                <Save className="w-5 h-5" strokeWidth={2.5} />
                Save changes
              </>
            )}
          </button>
        ) : (
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
                <Plus className="w-6 h-6" strokeWidth={2.5} />
                Add item
              </>
            )}
          </button>
        )}
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
              style={{ maxHeight: "88dvh" }}
            >
              <div className="pt-2 pb-0.5 flex justify-center shrink-0">
                <div className="w-10 h-1.5 rounded-full bg-gray-300" />
              </div>

              <div className="px-5 pt-1 pb-2 flex items-center justify-between shrink-0 border-b border-gray-100">
                <h2 className="text-[16px] font-semibold text-[#1a1f36]">
                  Select a category
                </h2>
                <button
                  type="button"
                  onClick={() => setCategoryPickerOpen(false)}
                  aria-label="Close category picker"
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-3 pb-[calc(14px+env(safe-area-inset-bottom))]">
                <div className="grid grid-cols-3 gap-2.5">
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
                        className={`flex flex-col items-center gap-2 py-3 px-1.5 rounded-xl border transition-colors ${
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

      {/* ── DISCARD / DELETE CONFIRM SHEET — replaces window.confirm() so the
          message can name the item and match the app's own sheet pattern ── */}
      <AnimatePresence>
        {pendingSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-[10000]"
              onClick={() => setPendingSheet(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-sheet-title"
              className="fixed left-0 right-0 bottom-0 z-[10001] bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.15)] px-5 pt-2 pb-[calc(20px+env(safe-area-inset-bottom))]"
            >
              <div className="pt-2 pb-3 flex justify-center shrink-0">
                <div className="w-10 h-1.5 rounded-full bg-gray-300" />
              </div>
              <h2 id="confirm-sheet-title" className="text-[17px] font-semibold text-[#1a1f36] mb-1.5">
                {pendingSheet === "delete" ? `Delete "${formName.trim() || "this item"}"?` : "Discard your changes?"}
              </h2>
              <p className="text-[13.5px] text-gray-500 mb-5">
                {pendingSheet === "delete"
                  ? "This removes it from inventory for every device connected to this pantry. This can't be undone."
                  : "You've made changes to this item that haven't been saved yet."}
              </p>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (pendingSheet === "delete") {
                      onDelete(initialItem);
                    } else {
                      onBack();
                    }
                    setPendingSheet(null);
                  }}
                  className={`w-full h-12 rounded-xl font-bold text-[15px] active:scale-95 transition-all ${
                    pendingSheet === "delete"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-[#e27f2c] hover:bg-[#cf6f20] text-white"
                  }`}
                >
                  {pendingSheet === "delete" ? "Delete item" : "Discard changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingSheet(null)}
                  className="w-full h-12 rounded-xl font-bold text-[15px] bg-gray-100 text-gray-700 active:bg-gray-200 transition-all"
                >
                  {pendingSheet === "delete" ? "Keep item" : "Keep editing"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
