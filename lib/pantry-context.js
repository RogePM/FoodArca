// Who the user is working as: their memberships → the active organization and location.
// Used by the server (lib/server/dashboard-context.js, once per request) and by PantryProvider in the
// browser (after a pantry switch or a settings edit), so both always pick the same pantry.
//
// The active pantry is one cookie, the location id (lib/hint-cookies: PANTRY_HINT). A location
// belongs to exactly one organization, so the organization never needs a cookie of its own.

/**
 * Today's date at the pantry ('YYYY-MM-DD', in its timezone). The server and the browser compute the
 * same value, so server-drawn dates ("Expires in 3 days") match in the browser, and it's the same
 * "today" the database uses (public.inventory_page).
 */
export function pantryToday(timezone, now = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'America/New_York' }).format(now);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now);
  }
}

/**
 * The one query behind it: memberships with their organization and its locations. The locations link
 * is named: organizations and locations are also joined through daily_org_stats, and PostgREST
 * refuses to guess between the two (PGRST201).
 */
export const MEMBERSHIP_SELECT =
  'role, organization_id, organization:organizations ( *, locations!locations_organization_id_fkey ( * ) )';

const byCreated = (a, b) => String(a.created_at || '').localeCompare(String(b.created_at || ''));

/**
 * memberships: rows of MEMBERSHIP_SELECT (active only). preferredLocationId: the cookie, if any.
 * The preferred location wins when it's one of theirs; otherwise their first organization's first
 * location.
 */
export function buildPantryContext(memberships = [], preferredLocationId = null) {
  const list = (memberships || []).filter((m) => m?.organization);
  const locationsOf = (m) => [...(m.organization.locations || [])].sort(byCreated);

  const match = preferredLocationId
    ? list.find((m) => locationsOf(m).some((l) => l.id === preferredLocationId))
    : null;
  const active = match || list[0] || null;
  const locations = active ? locationsOf(active) : [];
  const location = locations.find((l) => l.id === preferredLocationId) || locations[0] || null;

  let pantryDetails = null;
  if (active) {
    const { locations: _nested, ...org } = active.organization;
    const loc = location || {};
    // Location address fields stand in for older organization fields the UI still reads.
    pantryDetails = {
      ...org,
      locations,
      address: org.address || loc.address_line1 || '',
      address_line2: org.address_line2 || loc.address_line2 || '',
      city: org.city || loc.city || '',
      state: org.state || loc.state || '',
      zip: org.zip || loc.zip || '',
      country: org.country || loc.country || 'US',
      timezone: org.timezone || loc.timezone || 'America/New_York',
    };
  }

  return {
    organizationId: active?.organization_id || null,
    locationId: location?.id || null,
    userRole: active?.role || null,
    pantryDetails,
    // The shape the pantry switcher reads.
    availablePantries: list.map((m) => ({ pantry_id: m.organization_id, role: m.role, pantry: m.organization })),
  };
}
