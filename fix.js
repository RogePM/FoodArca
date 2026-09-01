const fs = require('fs');
const content = fs.readFileSync('components/pages/distribution/mobile-checkout-cart-view.jsx', 'utf-8');

const newCartContent =             {/* ── SEARCH BAR (FILLED STATE) ── */}
            <div className="bg-[#d97757] px-5 pt-safe pb-4 w-full relative z-10 shadow-sm">
              <div className="flex items-center gap-3">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-1 -ml-1 text-white/90 active:text-white transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                  </button>
                )}
                <div
                  className="flex-1 flex items-center h-[42px] bg-white border-none shadow-sm rounded-full px-4 gap-3 cursor-text active:bg-gray-50 transition-all"
                  onClick={() => onOpenVisualGrid('all')}
                >
                  <Search className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={1.8} />
                  <span className="text-[15px] text-gray-500 font-normal select-none">
                    Find an item in the pantry
                  </span>
                </div>
              </div>
            </div>

            {/* ── TOP CHECKOUT ROW ── */}
            <div className="px-5 py-4 mb-2 flex items-center justify-between bg-white">
              <span className="text-[16px] text-gray-600 font-medium tracking-tight">
                Total: <span className="text-[#1a1f36] font-bold mx-0.5">{totalItemCount}</span> {totalItemCount === 1 ? 'item' : 'items'}
              </span>
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="h-[44px] px-6 rounded-full bg-[#d97757] text-white text-[15px] font-bold shadow-sm active:scale-95 transition-all"
              >
                Check Out
              </button>
            </div>

            <div className="mx-5 mb-8 bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center bg-white">
                <span className="text-[17px] text-[#1a1f36] font-semibold tracking-tight">Scanned items</span>
              </div>
              <div className="flex flex-col bg-white">
                <AnimatePresence initial={false}>
                  {cartItems.map((item, index) => {
                    const catVisual = getCategoryVisual(item.category);
                    const expLabel = formatItemExpiration(item.expirationDate);
                    const maxStock = Number(item.availableBatchStock ?? 9999);
                    const isMaxReached = item.quantity >= maxStock;
                    const isLast = index === cartItems.length - 1;

                    return (
                      <motion.div
                        key={item.id || item.batchId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className={\p-4 flex flex-col gap-3 bg-white \\}
                      >
                        {/* Top Row: Image & Info */}
                        <div className="flex gap-4 items-start">
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt=""
                              className="w-[72px] h-[72px] rounded-md object-cover border border-gray-100 shrink-0 bg-gray-50"
                            />
                          ) : (
                            <div className={\w-[72px] h-[72px] rounded-md flex items-center justify-center shrink-0 border border-gray-100 p-0 overflow-hidden \\}>
                              <img src={catVisual.imagePath} alt="" className="w-full h-full object-contain mix-blend-multiply scale-[1.35]" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              {/* Name with Size Descriptor appended if applicable */}
                              <h4 className="font-medium text-gray-900 text-[15px] leading-snug">
                                {item.name}
                                {item.unit && !['units', 'count'].includes(item.unit.toLowerCase()) && (
                                  <span className="text-gray-500 font-normal"> ({item.unit})</span>
                                )}
                              </h4>
                              
                              {item.availableBatchStock !== undefined && (
                                <span className="text-emerald-600 font-medium bg-emerald-50/50 px-1.5 py-0.5 rounded text-[12.5px] whitespace-nowrap shrink-0 mt-[2px]">
                                  Stock: {item.availableBatchStock}
                                </span>
                              )}
                            </div>
                            
                            {/* Metadata Cluster */}
                            <div className="flex flex-col gap-1 mt-1 text-[12.5px] text-gray-500 font-normal">
                              {/* Category */}
                              <div>
                                <span>{item.categoryName || catVisual.name}</span>
                              </div>

                              {/* Expiration Date */}
                              {expLabel ? (
                                <div className="text-gray-400 font-medium">
                                  Exp {expLabel}
                                </div>
                              ) : (
                                <div className="text-gray-400/80">
                                  No expiration date
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Actions */}
                        <div className="flex items-center justify-between mt-1">
                          <button
                            onClick={() => onRemoveItem && onRemoveItem(item.id)}
                            className="text-[14px] font-medium text-[#1a1f36] underline underline-offset-4 decoration-gray-300 hover:text-red-600 hover:decoration-red-300 transition-colors"
                          >
                            Remove
                          </button>

                          <div className="flex items-center rounded-full border border-[#d97757] h-[34px] bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, -1)}
                              className="h-full w-10 flex items-center justify-center text-[#d97757] active:bg-[#fff7f2] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <span className="w-8 text-center text-[14px] font-medium text-[#d97757]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, 1)}
                              disabled={isMaxReached}
                              className="h-full w-10 flex items-center justify-center text-[#d97757] active:bg-[#fff7f2] disabled:opacity-30 disabled:active:bg-transparent transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>;

let newContent = content.replace(/\{\/\*.*?CART HEADER \(when items exist\).*?<\/AnimatePresence>/s, newCartContent);

const newFabContent = \      {/* FLOATING ACTION BUTTONS (FABs) */}
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
              onClick={onOpenScanner}
              className="w-14 h-14 rounded-full bg-[#d97757] text-white shadow-[0_4px_14px_rgba(217,119,87,0.25)] flex items-center justify-center active:scale-95 transition-all"
              aria-label="Scan Barcode"
              title="Scan Barcode"
            >\;

newContent = newContent.replace(/\{\/\* FLOATING ACTION BUTTONS \(FABs\).*?title="Scan Barcode"\s*>/s, newFabContent);

fs.writeFileSync('components/pages/distribution/mobile-checkout-cart-view.jsx', newContent, 'utf-8');
