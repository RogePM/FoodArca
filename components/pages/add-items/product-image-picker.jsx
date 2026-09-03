"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Check,
  X,
  RotateCw,
  Link as LinkIcon,
  AlertCircle,
  Search,
} from "lucide-react";

/**
 * ProductImagePicker
 * Elegant two-state UI for safely searching and selecting food product packaging images.
 * 
 * State 1: Clean trigger button / placeholder or selected image preview.
 * State 2: Expanded grid displaying 3-4 fetched images to select from.
 */
export function ProductImagePicker({
  formName = "",
  formCategory = "",
  photoUrl = null,
  onSelectPhoto,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState("");
  const [failedUrls, setFailedUrls] = useState(new Set());
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const selectTimerRef = React.useRef(null);

  // Clean up any pending selection timer on unmount
  useEffect(() => {
    return () => {
      if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    };
  }, []);

  // Clear query prompt error once user starts typing a product name
  useEffect(() => {
    if (formName.trim() && error && error.includes("enter an item name")) {
      setError(null);
    }
  }, [formName, error]);

  const handleFetchImages = useCallback(
    async (force = false) => {
      const trimmedName = formName.trim();
      if (!trimmedName || trimmedName.length < 2) {
        setError("Please enter an item name above first to search for photos.");
        return;
      }

      // Avoid re-fetching if query hasn't changed unless forced
      const currentQueryKey = `${trimmedName.toLowerCase()}|${(formCategory || "").toLowerCase()}`;
      if (!force && lastSearchedQuery === currentQueryKey && images.length > 0) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setFailedUrls(new Set());

      try {
        const params = new URLSearchParams({
          q: trimmedName,
          category: formCategory || "",
        });

        const res = await fetch(`/api/foods/image-search?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        const fetchedList = Array.isArray(data.images) ? data.images : [];

        if (fetchedList.length === 0) {
          setError(`No packaging images found for "${trimmedName}". You can paste a custom URL below.`);
          setImages([]);
        } else {
          setImages(fetchedList);
          setLastSearchedQuery(currentQueryKey);
        }
      } catch (err) {
        console.error("Error fetching images:", err);
        setError("Unable to search images right now. Check your connection or paste a URL.");
      } finally {
        setIsLoading(false);
      }
    },
    [formName, formCategory, lastSearchedQuery, images.length]
  );

  const handleOpenSearch = () => {
    const trimmed = formName.trim();
    if (!trimmed || trimmed.length < 2) {
      setError("Please enter an item name above first to search for photos.");
      return;
    }
    setError(null);
    setIsExpanded(true);
    handleFetchImages();
  };

  const handleSelect = (url) => {
    if (photoUrl === url) {
      handleRemovePhoto();
    } else {
      onSelectPhoto(url);
    }
    // Smoothly return to State 1 after selection
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    selectTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 200);
  };

  const handleRemovePhoto = () => {
    if (photoUrl) {
      setFailedUrls((prev) => {
        const next = new Set(prev);
        next.delete(photoUrl);
        return next;
      });
    }
    onSelectPhoto(null);
  };

  const handleImageError = (badUrl) => {
    setFailedUrls((prev) => new Set([...prev, badUrl]));
  };

  const handleCustomUrlSubmit = (e) => {
    e?.preventDefault();
    let url = customInputUrl.trim();
    if (!url) return;
    if (url.startsWith("//")) {
      url = "https:" + url;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    const lower = url.toLowerCase().split(/[?#]/)[0];
    const invalidExts = [
      ".pdf", ".svg", ".html", ".htm", ".xml",
      ".tif", ".tiff", ".djvu", ".webm", ".mp4",
      ".ogv", ".ogg", ".zip", ".exe", ".doc", ".docx", ".tar", ".gz"
    ];
    if (invalidExts.some((ext) => lower.endsWith(ext))) {
      setError("Please provide a direct image URL (.jpg, .png, .webp). Documents or media files are not supported.");
      return;
    }

    onSelectPhoto(url);
    setCustomInputUrl("");
    setShowCustomInput(false);
    setIsExpanded(false);
  };

  // Filter out any broken image URLs dynamically
  const visibleImages = images.filter((url) => !failedUrls.has(url));

  return (
    <div className="w-full">
      {/* ══════════════════════════════════════════════════════════════════════
          STATE 1: COLLAPSED TRIGGER / PLACEHOLDER OR SELECTED PHOTO
         ══════════════════════════════════════════════════════════════════════ */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.15 }}
        >
          {photoUrl ? (
            /* Selected Photo Preview Card */
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-gray-300 transition-all">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                  {failedUrls.has(photoUrl) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-amber-500 bg-amber-50">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  ) : (
                    <img
                      src={photoUrl}
                      alt={`Packaging preview for ${formName.trim() || "selected item"}`}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain p-1"
                      onError={() => handleImageError(photoUrl)}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {failedUrls.has(photoUrl) ? (
                      <>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700">
                          <AlertCircle className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                        <p className="text-[14px] font-semibold text-amber-900 truncate">
                          Image preview failed
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100 text-green-700">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                        <p className="text-[14px] font-semibold text-[#1a1f36] truncate">
                          Photo attached
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-[12px] text-[#697386] truncate mt-0.5">
                    {failedUrls.has(photoUrl)
                      ? "External link unreachable. Tap Change to pick another."
                      : "Packaging image selected"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={handleOpenSearch}
                  className="px-3 py-1.5 text-[13px] font-semibold text-[#e27f2c] hover:bg-orange-50 rounded-xl transition-colors active:scale-95 cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95 cursor-pointer"
                  title="Remove image"
                  aria-label="Remove attached photo"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ) : (
            /* Find Image Button / Placeholder */
            <button
              type="button"
              onClick={handleOpenSearch}
              aria-expanded={isExpanded}
              aria-haspopup="true"
              aria-label="Find product packaging photo online"
              className="w-full group text-left p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#e27f2c] bg-gray-50 hover:bg-[#fffcf7] transition-all flex flex-col items-center justify-center cursor-pointer gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm text-gray-400 group-hover:text-[#e27f2c] flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                <ImageIcon className="w-6 h-6" strokeWidth={2} />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-semibold text-[#1a1f36] group-hover:text-[#e27f2c] transition-colors">
                  Find a product photo
                </p>
                <p className="text-[13px] text-[#697386] mt-0.5">
                  {formName.trim()
                    ? `Search the web for "${formName.trim()}"`
                    : "Enter a name above first"}
                </p>
              </div>
            </button>
          )}

          {/* Inline error feedback for State 1 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-[12px]"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STATE 2: EXPANDED VIEW WITH 3-4 FETCHED IMAGE OPTIONS
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl space-y-3.5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#e27f2c]" />
                  <span className="text-[14px] font-bold text-[#1a1f36]">
                    Choose packaging image
                  </span>
                  {visibleImages.length > 0 && !isLoading && (
                    <span className="text-[11px] font-semibold text-[#697386] bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {visibleImages.length} options
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {formName.trim().length >= 2 && (
                    <button
                      type="button"
                      onClick={() => handleFetchImages(true)}
                      disabled={isLoading}
                      className="p-1.5 text-gray-500 hover:text-[#e27f2c] hover:bg-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      title="Refresh search"
                      aria-label="Refresh image search results"
                    >
                      <RotateCw
                        className={`w-4 h-4 ${isLoading ? "animate-spin text-[#e27f2c]" : ""}`}
                      />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setError(null);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="Close"
                    aria-label="Close image picker"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Subtitle / Query indicator */}
              {formName.trim() && (
                <p className="text-[12px] text-[#697386] truncate">
                  {isLoading ? "Searching photos for:" : visibleImages.length > 0 ? "Results for:" : "Target item:"}{" "}
                  <span className="font-semibold text-gray-800">{formName.trim()}</span>
                  {formCategory && <span className="text-gray-500"> ({formCategory.replace(/_/g, " ")})</span>}
                </p>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-[#e27f2c]" />
                  </div>
                  <p className="text-[13px] font-medium text-gray-600 animate-pulse">
                    Finding safe packaging photos...
                  </p>
                </div>
              )}

              {/* Error or Notice */}
              {error && !isLoading && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-2 text-amber-800 text-[13px]">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">{error}</p>
                  </div>
                  {formName.trim().length >= 2 && !error.toLowerCase().includes("url") && !error.toLowerCase().includes("item name") && (
                    <button
                      type="button"
                      onClick={() => handleFetchImages(true)}
                      className="text-[12px] font-semibold text-[#e27f2c] shrink-0 hover:underline active:scale-95 cursor-pointer"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Ready to search / empty state (when not loading, no error, and 0 images) */}
              {!isLoading && !error && images.length === 0 && (
                <div className="py-4 text-center space-y-2.5">
                  <p className="text-[13px] text-gray-600">
                    {formName.trim().length >= 2 ? (
                      <>Ready to search packaging photos for <span className="font-semibold text-gray-800">"{formName.trim()}"</span></>
                    ) : (
                      "Enter an item name above to search for packaging photos."
                    )}
                  </p>
                  {formName.trim().length >= 2 && (
                    <button
                      type="button"
                      onClick={() => handleFetchImages(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e27f2c] text-white text-[13px] font-semibold hover:bg-[#cf6f20] transition-colors shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      Search Photos
                    </button>
                  )}
                </div>
              )}

              {/* All images failed to load */}
              {!isLoading && images.length > 0 && visibleImages.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-amber-800 text-[13px]">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p>Could not load image previews. Try refreshing or paste a URL below.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFetchImages(true)}
                    className="text-[12px] font-semibold text-[#e27f2c] shrink-0 hover:underline cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* 3-4 Fetched Image Options Grid */}
              {!isLoading && visibleImages.length > 0 && (
                <div className={`grid gap-2 ${
                  visibleImages.length === 1 ? "grid-cols-1 max-w-[160px] mx-auto" :
                  visibleImages.length === 2 ? "grid-cols-2 max-w-[280px] mx-auto" :
                  visibleImages.length === 3 ? "grid-cols-3" : "grid-cols-4"
                }`}>
                  {visibleImages.slice(0, 4).map((url, idx) => {
                    const isSelected = photoUrl === url;
                    return (
                      <button
                        key={`${url}-${idx}`}
                        type="button"
                        onClick={() => handleSelect(url)}
                        className={`group relative aspect-square rounded-xl bg-white border-2 overflow-hidden transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer ${
                          isSelected
                            ? "border-[#e27f2c] ring-2 ring-[#e27f2c]/20"
                            : "border-gray-200 hover:border-[#e27f2c]/50"
                        }`}
                        title={isSelected ? "Deselect image" : `Select option ${idx + 1}`}
                        aria-label={isSelected ? `Deselect option ${idx + 1}` : `Select packaging image option ${idx + 1}`}
                        aria-pressed={isSelected}
                      >
                        <img
                          src={url}
                          alt={`Packaging photo option ${idx + 1} for ${formName.trim() || "item"}`}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-105"
                          onError={() => handleImageError(url)}
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#e27f2c] text-white flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer / Custom URL Toggle & Actions */}
              <div className="pt-1 flex items-center justify-between text-[12px] text-[#697386] border-t border-gray-200/60">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  aria-expanded={showCustomInput}
                  aria-label={showCustomInput ? "Hide custom URL input" : "Paste custom image URL"}
                  className="inline-flex items-center gap-1 font-semibold text-[#e27f2c] hover:underline cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  {showCustomInput ? "Hide custom URL" : "Paste custom image URL"}
                </button>

                <div className="flex items-center gap-3">
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        handleRemovePhoto();
                        setIsExpanded(false);
                      }}
                      className="font-medium text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Remove photo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="font-medium text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Optional Custom URL Input Form */}
              {showCustomInput && (
                <form onSubmit={handleCustomUrlSubmit} className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customInputUrl}
                      onChange={(e) => setCustomInputUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      aria-label="Direct image URL"
                      className="flex-1 h-[38px] px-3 rounded-xl border border-gray-300 bg-white text-[13px] outline-none focus:border-[#e27f2c] focus:ring-2 focus:ring-[#e27f2c]/10"
                    />
                    <button
                      type="submit"
                      disabled={!customInputUrl.trim()}
                      className="px-3.5 h-[38px] rounded-xl bg-[#e27f2c] text-white text-[13px] font-semibold disabled:opacity-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                    >
                      Use
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Skeleton fallback for Next.js Suspense boundary
 */
export function ProductImagePickerSkeleton() {
  return (
    <div className="w-full p-3.5 rounded-2xl border-2 border-dashed border-gray-200 bg-[#fafbfc] flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100/60 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-orange-300" />
        </div>
        <div className="space-y-1.5">
          <div className="w-28 h-4 bg-gray-200 rounded" />
          <div className="w-44 h-3 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="w-16 h-7 bg-orange-100/50 rounded-lg" />
    </div>
  );
}
