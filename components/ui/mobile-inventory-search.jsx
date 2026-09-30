'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, ScanBarcode, ArrowLeft, ChevronRight } from 'lucide-react';
import { BarcodeScannerOverlay } from '@/components/ui/BarcodeScannerOverlay';
import { usePantry } from '@/components/providers/PantryProvider';
import { categories } from '@/lib/constants';
import { getCategoryVisual, groupInventoryBatches, getUrgentStatusStyles } from '@/components/pages/inventory/inventory-utils';

function matchesCategoryFilter(productCategory, selectedCategoryValue) {
  if (!selectedCategoryValue || selectedCategoryValue === 'ALL') return true;
  const prodCat = String(productCategory || 'other').toLowerCase();
  const selected = String(selectedCategoryValue).toLowerCase();
  const catObj = categories.find((c) => c.value === selected);
  const catName = catObj?.name.toLowerCase();
  return prodCat === selected || (catName && prodCat === catName);
}

function SearchResultThumb({ item }) {
  const [imgError, setImgError] = useState(false);
  const catVisual = getCategoryVisual(item.category);
  const showPhoto = Boolean(item.photoUrl) && !imgError;

  return (
    <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border border-gray-100 ${catVisual.style.bg}`}>
      {showPhoto ? (
        <img
          src={item.photoUrl}
          alt=""
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-xl"
        />
      ) : (
        <img src={catVisual.imagePath} alt="" className="w-6 h-6 opacity-75 mix-blend-multiply" />
      )}
    </div>
  );
}

// Bolds the substring of `name` that matches the live query, same
// as-you-type affordance as the retail search references this was modeled on.
function HighlightedName({ text, query }) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function ResultRow({ item, query, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="w-full flex items-center gap-3.5 py-3.5 -mx-2 px-2 rounded-xl hover:bg-gray-50/70 active:bg-gray-100 transition-colors text-left"
    >
      <SearchResultThumb item={item} />
      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-medium text-[#1a1f36] truncate leading-snug">
          <HighlightedName text={item.name} query={query} />
        </h4>
        <p className="text-[12px] text-gray-500 truncate mt-1">
          {getCategoryVisual(item.category).name}
          <span className="text-gray-300 mx-1.5">&middot;</span>
          {(item.totalQuantity !== undefined ? item.totalQuantity : item.quantity) || 0} in stock
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" strokeWidth={2.5} />
    </button>
  );
}

// Pill styling follows the app's existing tokens (neutral-100 fill, ink text,
// the one brand accent on the active state) rather than a new one-off recipe —
// there's no documented "pill/chip" component yet, so this stays close to
// what's already used for icon-chips and the active bottom-nav state.
function PillButton({ label, count, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full text-[13.5px] font-medium tracking-[-0.01em] whitespace-nowrap transition-colors ${
        isActive ? 'bg-[var(--accent)] text-white' : 'bg-gray-100 text-[#1a1f36] hover:bg-gray-200'
      }`}
    >
      {label}
      {typeof count === 'number' && (
        <span className={`ml-1.5 text-[12px] font-medium ${isActive ? 'text-white/75' : 'text-gray-400'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 py-3.5 px-2">
      <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="w-2/5 h-3.5 bg-gray-200/80 rounded-md animate-pulse" />
        <div className="w-1/4 h-3 bg-gray-100 rounded-md animate-pulse" />
      </div>
    </div>
  );
}

export function MobileInventorySearch({
  initialQuery = '',
  onQueryChange,
  inventoryData = null,
  onItemSelect,
  onSubmit,
  forceOpen = false,
  onClose,
  onOpenScanner,
  // The Add/scan flow's accent (#e27f2c) is the default since that's this
  // component's original home; Settings/Inventory pass their own (#d97757)
  // so the active pill/scan icon matches the sticky header they sit under
  // instead of the other screen's accent. See DESIGN.md's "Unconverged
  // Orange" rule — this follows it rather than resolving it.
  accentColor = '#e27f2c'
}) {
  const { pantryId } = usePantry();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  // Mirrors initialQuery so an external change can be detected and applied
  // during render, without the extra render an effect-based sync would cost.
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(forceOpen);
  // null = no pill picked (the page's "browse" launcher state); a status id
  // ('EXPIRING'/'EXPIRED'/'LOW') or a category value once one is tapped.
  const [activeFilter, setActiveFilter] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [localInventory, setLocalInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setSearchQuery(initialQuery);
  }

  // If inventoryData is not provided, fetch it when the overlay opens
  useEffect(() => {
    if (isSearchOverlayOpen && !inventoryData && localInventory.length === 0 && pantryId) {
      const fetchInventory = async () => {
        setIsLoading(true);
        try {
          const res = await fetch('/api/foods', {
            headers: { 'x-pantry-id': pantryId }
          });
          if (res.ok) {
            const data = await res.json();
            // simple grouping for display
            setLocalInventory(data.data || []);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInventory();
    }
  }, [isSearchOverlayOpen, inventoryData, pantryId, localInventory.length]);

  // When we're fetching our own data (no inventoryData prop, e.g. on the Settings page),
  // group raw batch records into one card per item — same shape the Inventory page passes in.
  const groupedLocalInventory = React.useMemo(
    () => groupInventoryBatches(localInventory),
    [localInventory]
  );
  const activeInventory = inventoryData || groupedLocalInventory;

  // Two separate pill groups — status and category are different kinds of
  // question ("what state is it in" vs "what is it"), so they read as two
  // labeled sections instead of one long undifferentiated strip.
  const statusPills = React.useMemo(() => {
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let lowStockCount = 0;

    activeInventory.forEach((item) => {
      const statusStyles = getUrgentStatusStyles(item);
      if (statusStyles.isExpired) expiredCount++;
      if (statusStyles.isExpiring) expiringSoonCount++;
      if (statusStyles.isLowStock) lowStockCount++;
    });

    return [
      { id: 'EXPIRING', name: 'Expiring Soon', count: expiringSoonCount },
      { id: 'EXPIRED', name: 'Expired', count: expiredCount },
      { id: 'LOW', name: 'Low Stock', count: lowStockCount },
    ];
  }, [activeInventory]);

  const categoryPills = React.useMemo(() => {
    return categories
      .map((cat) => ({
        id: cat.value,
        name: cat.name,
        count: activeInventory.filter((item) => matchesCategoryFilter(item.category, cat.value)).length,
      }))
      .filter((pill) => pill.count > 0);
  }, [activeInventory]);

  // Toggling the already-active pill clears it, returning to the picker state.
  const togglePill = (id) => setActiveFilter((prev) => (prev === id ? null : id));

  // A short typed query (even one letter) can match a big chunk of the
  // pantry — capped so the list stays a quick glance, not a second full
  // inventory dump. Pill browsing isn't capped; picking "All" via a pill is
  // an intentional "show me everything" action, typing "a" isn't.
  const SEARCH_RESULTS_LIMIT = 8;

  // Typing takes over completely — the picker (pills) is a browse tool for
  // when nothing's been looked up yet, and a typed query is its own lookup,
  // not a second filter stacked on top of whichever pill happened to be
  // active. So: a query searches the whole inventory; with no query, a pill
  // (if any) is what's shown; with neither, the list stays empty.
  const { items: filteredInventory, matchCount } = React.useMemo(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matches = activeInventory.filter((i) =>
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.barcode && String(i.barcode).includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
      );
      return { items: matches.slice(0, SEARCH_RESULTS_LIMIT), matchCount: matches.length };
    }

    let result = [];
    if (activeFilter === 'LOW') result = activeInventory.filter((i) => getUrgentStatusStyles(i).isLowStock);
    else if (activeFilter === 'EXPIRING') result = activeInventory.filter((i) => getUrgentStatusStyles(i).isExpiring);
    else if (activeFilter === 'EXPIRED') result = activeInventory.filter((i) => getUrgentStatusStyles(i).isExpired);
    else if (activeFilter) result = activeInventory.filter((i) => matchesCategoryFilter(i.category, activeFilter));

    return { items: result, matchCount: result.length };
  }, [activeInventory, searchQuery, activeFilter]);

  const handleQueryChange = (val) => {
    setSearchQuery(val);
    if (onQueryChange) onQueryChange(val);
  };

  const closeOverlay = () => {
    if (forceOpen && onClose) onClose();
    else setIsSearchOverlayOpen(false);
  };

  const handleSelect = (item) => {
    if (onItemSelect) {
      onItemSelect(item);
    } else {
      handleQueryChange(item.name);
    }
    setIsSearchOverlayOpen(false);
  };

  return (
    <>
      {/* FAKE SEARCH BAR — the trigger that opens the full lookup page */}
      <div
        className="md:hidden relative cursor-text"
        style={{ '--accent': accentColor }}
        onClick={() => setIsSearchOverlayOpen(true)}
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" strokeWidth={2.5} />
        <div className="flex items-center pl-11 pr-[52px] h-12 bg-white shadow-[0_4px_20px_-6px_rgba(0,0,0,0.15)] rounded-2xl text-base font-medium overflow-hidden">
          <span className={searchQuery ? 'text-gray-900 truncate' : 'text-gray-400'}>
            {searchQuery || 'Search by name or barcode...'}
          </span>
        </div>
        {searchQuery ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleQueryChange(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenScanner) onOpenScanner();
              else setShowScanner(true);
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Scan barcode"
          >
            <ScanBarcode className="h-5 w-5 text-[var(--accent)]" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* FULL SCREEN LOOKUP PAGE (Mobile) */}
      {isSearchOverlayOpen && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col md:hidden animate-in fade-in duration-200"
          style={{ '--accent': accentColor }}
        >
          <div className="flex items-center gap-2 p-4 pb-3 border-b border-gray-100 shrink-0">
            <button
              onClick={closeOverlay}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-full"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
              <input
                autoFocus
                placeholder="Search inventory..."
                enterKeyHint="search"
                // Explicit 16px, not Tailwind's text-base: iOS Safari auto-zooms
                // the page on focus for any input font-size under 16px, and this
                // field autofocuses the instant the page opens.
                className="w-full pl-9 pr-12 h-11 bg-gray-100 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 font-medium text-[16px] placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchQuery) {
                      if (onSubmit) onSubmit(searchQuery);
                      closeOverlay();
                    }
                  }
                }}
              />
              {searchQuery ? (
                <button
                  onClick={() => handleQueryChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-[15px] h-[15px]" strokeWidth={3} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenScanner) onOpenScanner();
                    else setShowScanner(true);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Scan barcode"
                >
                  <ScanBarcode className="h-[18px] w-[18px] text-[var(--accent)]" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {/* PICKER — two labeled pill groups (status, then category),
                wrapped rather than a single scrolling strip, so this reads as
                a laid-out lookup page rather than a dump of every item. Status
                is built as two explicit rows (not one flex-wrap container) so
                Low Stock always breaks onto its own line with a single normal
                row gap above it — a flex-wrap spacer counts as its own empty
                line and doubles the gap, which read as too much top padding.
                Hidden entirely once the volunteer starts typing — a typed
                query is its own lookup, not a second filter layered on the
                picker, so the results below replace this rather than sitting
                alongside it. */}
            {!searchQuery && statusPills.length > 0 && (
              <div className="px-4 pt-6">
                <h3 className="text-[16px] font-medium text-gray-900 tracking-[-0.01em] mb-3.5">Item Status</h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <PillButton
                      label={statusPills[0].name}
                      count={statusPills[0].count}
                      isActive={activeFilter === statusPills[0].id}
                      onClick={() => togglePill(statusPills[0].id)}
                    />
                    <PillButton
                      label={statusPills[1].name}
                      count={statusPills[1].count}
                      isActive={activeFilter === statusPills[1].id}
                      onClick={() => togglePill(statusPills[1].id)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <PillButton
                      label={statusPills[2].name}
                      count={statusPills[2].count}
                      isActive={activeFilter === statusPills[2].id}
                      onClick={() => togglePill(statusPills[2].id)}
                    />
                  </div>
                </div>
              </div>
            )}

            {!searchQuery && categoryPills.length > 0 && (
              <div className="px-4 pt-6">
                <h3 className="text-[16px] font-medium text-gray-900 tracking-[-0.01em] mb-3.5">Categories</h3>
                <div className="flex flex-wrap gap-3">
                  {categoryPills.map((pill) => (
                    <PillButton
                      key={pill.id}
                      label={pill.name}
                      count={pill.count}
                      isActive={activeFilter === pill.id}
                      onClick={() => togglePill(pill.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS — only once the volunteer has actually asked for
                something (a pill or a query), never a default dump of every
                item in the pantry. Typing replaces the picker outright, so
                it gets plain top padding instead of the divider that
                separates it from the picker when a pill is what's active. */}
            {(activeFilter || searchQuery) && (
              <div className={searchQuery ? 'px-2 pt-2' : 'px-2 pt-5 mt-6 border-t border-gray-100'}>
                {isLoading ? (
                  <div className="divide-y divide-gray-100">
                    {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
                  </div>
                ) : filteredInventory.length > 0 ? (
                  <>
                    <div className="divide-y divide-gray-100">
                      {filteredInventory.map((item) => (
                        <ResultRow key={item.id} item={item} query={searchQuery} onSelect={handleSelect} />
                      ))}
                    </div>
                    {searchQuery && matchCount > filteredInventory.length && (
                      <p className="text-center text-[12.5px] text-gray-400 pt-3 pb-1">
                        Showing {filteredInventory.length} of {matchCount} — keep typing to narrow it down
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 font-normal text-[14px]">
                      {searchQuery
                        ? `No results found for "${searchQuery}"`
                        : 'No items match this filter'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Barcode Scanner HUD */}
      {showScanner && (
        <BarcodeScannerOverlay
          onScan={(code) => {
            handleQueryChange(code);
            setShowScanner(false);
            setIsSearchOverlayOpen(true);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
