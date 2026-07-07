import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Pencil } from 'lucide-react';
import { getCategoryName, getCategoryStyle } from '@/lib/constants';
import { getExpirationStatus, formatDate } from './inventory-utils';

export function MobileListView({ 
  groupedInventory, 
  collapsedCategories, toggleCategoryCollapse,
  expandedItems, toggleExpanded,
  handleModify 
}) {
  return (
    <div className="md:hidden space-y-6 mt-1 font-sans">
      <AnimatePresence>
        {Object.entries(groupedInventory).map(([category, items]) => {
          if (items.length === 0) return null;
          const catStyle = getCategoryStyle(category);
          
          return (
            <div key={category}>
              {/* CATEGORY HEADER — clickable to collapse */}
              <div 
                className={`flex items-center justify-between cursor-pointer transition-all duration-200 ${
                  collapsedCategories.has(category) 
                    ? 'bg-white rounded-[20px] px-5 py-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] border border-gray-100 mb-0'
                    : 'px-1 mb-3 mt-2 active:opacity-70'
                }`}
                onClick={() => toggleCategoryCollapse(category)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`h-[7px] w-[7px] rounded-full shrink-0 ${catStyle.badge}`} />
                  <h3 className="text-[15px] font-semibold text-gray-900 truncate">
                    {getCategoryName(category)}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-500">{items.length} items</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${collapsedCategories.has(category) ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* ITEMS list — smoothly collapses */}
              <AnimatePresence initial={false}>
                {!collapsedCategories.has(category) && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden w-full max-w-full"
                  >
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] divide-y divide-slate-100 w-full max-w-full">
                      {items.map((item) => {
                         const expInfo = getExpirationStatus(item.expirationDate);
                         const isLowStock = item.totalQuantity < 5;
                         const hasBatches = item.batches && item.batches.length > 1;
                         const itemKey = `${item.name}__${item.category}`;
                         const isExpanded = expandedItems.has(itemKey);
                         
                         return (
                          <div key={item.id || item._id}>
                            <div
                              onClick={() => hasBatches ? toggleExpanded(itemKey) : handleModify(item)}
                              className="flex items-center justify-between px-5 py-4 active:bg-gray-50/50 transition-colors cursor-pointer w-full"
                            >
                              {/* Left: Info */}
                              <div className="flex flex-col flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1 min-w-0">
                                  <h4 className="text-[15px] font-semibold text-gray-900 truncate min-w-0">
                                    {item.name}
                                  </h4>
                                  {hasBatches && (
                                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                      {item.batches.length} batches
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap min-w-0 mt-0.5">
                                  {item.expirationDate ? (
                                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 whitespace-nowrap">
                                      <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                      {formatDate(item.expirationDate)}
                                    </span>
                                  ) : (
                                    <span className="text-sm font-medium text-gray-400 italic whitespace-nowrap">No date</span>
                                  )}
                                  {item.expirationDate && (
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide whitespace-nowrap ${expInfo.className.replace('border', 'border-0')}`}>
                                      {expInfo.label}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right: Quantity + expand indicator */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex flex-col items-end">
                                  <span className={`text-[15px] font-semibold tabular-nums ${isLowStock ? 'text-red-500' : 'text-gray-900'}`}>
                                    {item.totalQuantity}
                                  </span>
                                  <span className="text-[11px] font-medium text-gray-400 uppercase">
                                    {item.unit || 'units'}
                                  </span>
                                </div>
                                {hasBatches && (
                                  <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                )}
                              </div>
                            </div>

                            {/* Expanded Batch List (FEFO order) */}
                            <AnimatePresence>
                              {hasBatches && isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden w-full max-w-full"
                                >
                                  <div className="bg-gray-50/50 border-t border-gray-100 w-full max-w-full">
                                    {item.batches.map((batch, idx) => {
                                      const batchExp = getExpirationStatus(batch.expirationDate);
                                      return (
                                        <div
                                          key={batch.id || batch._id}
                                          onClick={(e) => { e.stopPropagation(); handleModify(batch); }}
                                          className="flex items-center justify-between px-5 py-3 border-b border-gray-100/60 last:border-0 active:bg-gray-100/50 cursor-pointer w-full"
                                        >
                                          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 pr-4">
                                            <span className="text-[12px] font-semibold text-gray-400 w-5 tabular-nums shrink-0">#{idx + 1}</span>
                                            {batch.expirationDate ? (
                                              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 whitespace-nowrap">
                                                <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                {formatDate(batch.expirationDate)}
                                              </span>
                                            ) : (
                                              <span className="text-sm text-gray-400 font-medium italic whitespace-nowrap">No date</span>
                                            )}
                                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide whitespace-nowrap ${batchExp.className.replace('border', 'border-0')}`}>
                                              {batchExp.label}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[15px] font-semibold text-gray-800 tabular-nums">{batch.quantity}</span>
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">{batch.unit || 'units'}</span>
                                            <Pencil className="h-3.5 w-3.5 text-gray-300 ml-1 shrink-0" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                         );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
