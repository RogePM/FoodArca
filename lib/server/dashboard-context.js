// Who's asking and in which pantry, worked out once per request on the server and shared by the
// dashboard layout (→ PantryProvider, so the app starts already knowing) and any page that draws data
// on the server (Inventory's first page). React's cache() makes every call in one request share it.
//
// Cost: the login check is local (getClaims verifies the token's signature with the project's ES256
// key), plus one query for memberships with their organizations and locations.

import { cache } from 'react';
import { cookies } from 'next/headers';
import { createSupabase } from '@/lib/server/inventory-api';
import { MEMBERSHIP_SELECT, buildPantryContext } from '@/lib/pantry-context';
import { PANTRY_HINT } from '@/lib/hint-cookies';

export const getDashboardContext = cache(async () => {
  const supabase = await createSupabase();
  const { data: auth, error } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (error || !userId) return { supabase, user: null };

  const { data: memberships, error: memError } = await supabase
    .from('user_organizations')
    .select(MEMBERSHIP_SELECT)
    .eq('user_id', userId)
    .eq('status', 'active');
  // A failed lookup must not look like "no memberships" (that would send them to onboarding).
  if (memError) throw new Error(`Could not load memberships: ${memError.message}`);

  const preferred = (await cookies()).get(PANTRY_HINT)?.value || null;
  return {
    supabase,
    user: { id: userId, email: auth.claims.email || null },
    ...buildPantryContext(memberships || [], preferred),
    hasMembership: (memberships || []).length > 0,
  };
});

/** The part PantryProvider starts from (plain data, safe to send to the browser). */
export function toClientContext(ctx) {
  return {
    userId: ctx.user?.id || null,
    organizationId: ctx.organizationId,
    locationId: ctx.locationId,
    userRole: ctx.userRole,
    pantryDetails: ctx.pantryDetails,
    availablePantries: ctx.availablePantries,
  };
}
