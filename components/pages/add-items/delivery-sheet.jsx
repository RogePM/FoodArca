'use client';

// "From" for the whole cart (one drop-off). Everything is optional — skipping it is
// saved as "Not recorded", never guessed, and can be filled in later from Recent Changes.
// A slide-in page (not a sheet) so both text boxes sit in the top half, above the keyboard.

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { SOURCE_OPTIONS } from '@/lib/inventory-format';
import { EMPTY_DELIVERY } from './cart-lines';
import { WeightField, recallScaleUnit } from './new-item-pages';

// The name question is asked in the chosen source's own words.
const NAME_LABEL = { donation: 'Who donated it?', food_bank: 'Which food bank?', usda_tefap: 'Which agency?', food_rescue: 'Rescued from where?', purchased: 'Bought where?' };
const NAME_EXAMPLE = { food_bank: 'e.g. Regional Food Bank', usda_tefap: 'e.g. State TEFAP office', food_rescue: 'e.g. Trader Joe’s on Main', purchased: 'e.g. Costco' };

const chip = (on) =>
  `h-11 px-4 rounded-full text-[14px] transition-colors ${on
    ? 'border-[1.5px] border-[#1a1f36] bg-gray-50 font-semibold text-[#1a1f36]'
    : 'border border-gray-200 bg-white font-medium text-[#4b5263] active:bg-gray-50'}`;

// onClose(draft) — back and Done both keep what was entered.
export function DeliveryPage({ open, delivery, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(delivery || EMPTY_DELIVERY);
  useEffect(() => setMounted(true), []);
  // Nothing weighed yet: start in the scale's last unit.
  useEffect(() => {
    if (!open) return;
    const d = { ...EMPTY_DELIVERY, ...delivery };
    setDraft(Number(d.weighedLbs) > 0 ? d : { ...d, weighedUnit: recallScaleUnit() });
  }, [open, delivery]);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const hasAny = !!(draft.source || (draft.donorName || '').trim() || draft.isAnonymous || Number(draft.weighedLbs) > 0);
  const showAnon = !draft.source || draft.source === 'donation';

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delivery-title"
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
          className="fixed inset-0 z-[10040] bg-white flex flex-col text-[#1a1f36]"
        >
          <div className="shrink-0 pt-[env(safe-area-inset-top)] border-b border-gray-100">
            <div className="h-[60px] px-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onClose(draft)}
                aria-label="Back"
                className="w-11 h-11 shrink-0 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center active:bg-gray-200"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
              </button>
              <h2 id="delivery-title" className="flex-1 text-[16px] font-medium tracking-[-0.01em]">
                Where is this from? <span className="text-[12px] font-normal text-gray-500">· Optional</span>
              </h2>
              {hasAny && (
                <button type="button" onClick={() => setDraft({ ...EMPTY_DELIVERY, weighedUnit: draft.weighedUnit })} className="h-11 px-1 text-[14px] font-medium text-gray-500">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4 flex flex-col gap-6">
            {/* Source: one row of chips */}
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type of source">
              {SOURCE_OPTIONS.map((o) => {
                const on = draft.source === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set({ source: on ? null : o.value, isAnonymous: o.value === 'donation' && draft.isAnonymous })}
                    className={chip(on)}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>

            {/* Name: "Anonymous" sits inside the box, for donations only */}
            <div className="flex flex-col gap-2">
              <label htmlFor="donor-name" className="text-[14px] font-medium text-gray-900">{NAME_LABEL[draft.source] || 'Name'}</label>
              <div className={`h-[52px] flex items-center gap-1.5 pr-1.5 rounded-xl border border-gray-200 focus-within:border-[#1a1f36] ${draft.isAnonymous ? 'bg-gray-50' : 'bg-white'}`}>
                <input
                  id="donor-name"
                  type="text"
                  enterKeyHint="done"
                  value={draft.isAnonymous ? '' : draft.donorName}
                  onChange={(e) => set({ donorName: e.target.value, isAnonymous: false })}
                  placeholder={draft.isAnonymous ? 'Name kept private' : NAME_EXAMPLE[draft.source] || 'e.g. St. Mary’s Church'}
                  className="w-0 flex-1 h-full px-3.5 bg-transparent text-[16px] outline-none placeholder:text-gray-500"
                />
                {showAnon && (
                  <button
                    type="button"
                    aria-pressed={draft.isAnonymous}
                    onClick={() => set({ isAnonymous: !draft.isAnonymous })}
                    className={`h-9 px-3 shrink-0 rounded-full text-[13px] font-semibold ${draft.isAnonymous ? 'bg-[#1a1f36] text-white' : 'border border-gray-200 bg-gray-100 text-[#4b5263]'}`}
                  >
                    Anonymous
                  </button>
                )}
              </div>
            </div>

            {/* Scale total: clearly extra, the same box + lb | kg switch as the weight page */}
            <div className="pt-5 border-t border-gray-100 flex flex-col gap-2">
              <label htmlFor="weighed-lbs" className="text-[14px] font-medium text-gray-900">
                Weighed it all together? <span className="text-[12px] font-normal text-gray-500">· Total on the scale</span>
              </label>
              <WeightField
                id="weighed-lbs"
                value={draft.weighedLbs}
                onChange={(v) => set({ weighedLbs: v })}
                unit={draft.weighedUnit || 'lb'}
                onUnit={(u) => set({ weighedUnit: u })}
                height="h-[52px]"
              />
            </div>
          </div>

          <div className="shrink-0 px-4 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => onClose(draft)}
              className="w-full h-[52px] rounded-full bg-[#e27f2c] hover:bg-[#cf6f20] text-white text-[16px] font-semibold"
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
