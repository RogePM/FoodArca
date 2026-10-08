// Small cookies that tell the server what only the browser knows, so pages can draw their real first
// screen on the server (no spinner, no flash). They're hints, never trusted: the data itself is
// always fetched as the signed-in user, under RLS.

/** Cart hints: '1' when that cart (kept in sessionStorage) has items. Session cookies. */
export const CART_HINT = { add: 'fa_add_cart', remove: 'fa_remove_cart' };

/** The pantry location this browser is working in (PantryProvider keeps it current). */
export const PANTRY_HINT = 'fa_location';

/** Keeps a cart hint in step with its cart (the contents stay in sessionStorage). */
export function setCartHint(name, hasItems) {
  try { document.cookie = `${name}=${hasItems ? 1 : 0}; path=/; SameSite=Lax`; } catch {}
}

/** Remembers the active location for the server for a year; null forgets it. */
export function setPantryHint(locationId) {
  try {
    document.cookie = locationId
      ? `${PANTRY_HINT}=${encodeURIComponent(locationId)}; path=/; max-age=31536000; SameSite=Lax`
      : `${PANTRY_HINT}=; path=/; max-age=0; SameSite=Lax`;
  } catch {}
}
