'use client';

// Long lists, a screenful at a time.

import React, { useEffect, useRef, useState } from 'react';

/**
 * A marker for the end of a list: calls onEnd whenever it comes within ~2 screens of view (and again
 * after each change in `progress`, in case the list still ends on screen). Render the returned element
 * after the last row; null when `active` is false.
 */
export function useEndSentinel(onEnd, active, progress) {
  const ref = useRef(null);
  const latest = useRef(onEnd);
  useEffect(() => { latest.current = onEnd; });
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) latest.current(); },
      { rootMargin: '1200px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active, progress]);
  return active ? <div ref={ref} aria-hidden="true" className="h-px" /> : null;
}

/**
 * Draws a list already in memory progressively: the first `first` rows now, `step` more as the end
 * nears. Counts, filters and search still see everything; only the drawing is spread out, so the
 * first paint stays light. A new resetKey (filter, search, sort) starts again from the top.
 */
export function useProgressiveList(list, resetKey, { first = 24, step = 48 } = {}) {
  const [state, setState] = useState({ key: resetKey, count: first });
  let count = state.count;
  if (state.key !== resetKey) {
    count = first;
    setState({ key: resetKey, count: first });
  }
  const more = count < list.length;
  const sentinel = useEndSentinel(() => setState((s) => ({ ...s, count: s.count + step })), more, count);
  return { visible: more ? list.slice(0, count) : list, sentinel };
}
