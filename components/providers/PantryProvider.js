'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const PantryContext = createContext({
  organizationId: null,
  locationId: null,
  pantryId: null, // alias for locationId for backward compatibility
  userRole: null,
  pantryDetails: null, 
  availablePantries: [], 
  switchPantry: async () => {}, 
  refreshPantry: async () => {},
  lastInventoryUpdate: null,
  isLoading: true,
});

export function PantryProvider({ children }) {
  const [organizationId, setOrganizationId] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [pantryDetails, setPantryDetails] = useState(null);
  const [availablePantries, setAvailablePantries] = useState([]);
  const [lastInventoryUpdate, setLastInventoryUpdate] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  // --- 1. REFRESH LOGIC (Querying user_organizations, organizations, and locations) ---
  const refreshPantry = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // A. Fetch Memberships (user_organizations joined with organizations)
      const { data: memberships, error: memError } = await supabase
        .from('user_organizations')
        .select(`
          id,
          role,
          status,
          organization_id,
          organization:organizations (
            *
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memError) {
        console.error('Error fetching memberships:', memError);
      }

      let activeOrgId = null;
      let activeRole = null;
      let activeOrgDetails = null;

      if (memberships && memberships.length > 0) {
        // Read preferred org from localStorage
        const savedOrgId = typeof window !== 'undefined' ? localStorage.getItem('active_organization_id') : null;
        const match = memberships.find(m => m.organization_id === savedOrgId);

        if (!savedOrgId || !match) {
          activeOrgId = memberships[0].organization_id;
          activeRole = memberships[0].role;
          activeOrgDetails = memberships[0].organization;
        } else {
          activeOrgId = match.organization_id;
          activeRole = match.role;
          activeOrgDetails = match.organization;
        }
      }

      // B. Fetch Locations for the active organization
      let activeLocationId = null;
      if (activeOrgId) {
        const { data: locations, error: locError } = await supabase
          .from('locations')
          .select('*')
          .eq('organization_id', activeOrgId)
          .order('created_at', { ascending: true });

        if (!locError && locations && locations.length > 0) {
          const savedLocId = typeof window !== 'undefined' ? localStorage.getItem('active_location_id') : null;
          const locMatch = locations.find(l => l.id === savedLocId);
          activeLocationId = locMatch ? locMatch.id : locations[0].id;

          // Attach locations and map first location address fields onto pantryDetails for UI component compatibility with relational Supabase schema
          if (activeOrgDetails) {
            const firstLoc = locMatch || locations[0] || {};
            activeOrgDetails = { 
              ...activeOrgDetails, 
              locations,
              address: activeOrgDetails.address || firstLoc.address_line1 || '',
              address_line2: activeOrgDetails.address_line2 || firstLoc.address_line2 || '',
              city: activeOrgDetails.city || firstLoc.city || '',
              state: activeOrgDetails.state || firstLoc.state || '',
              zip: activeOrgDetails.zip || firstLoc.zip || '',
              country: activeOrgDetails.country || firstLoc.country || 'US',
              timezone: activeOrgDetails.timezone || firstLoc.timezone || 'America/New_York'
            };
          }
        }
      }

      // Format availablePantries for backward compatibility with UI selector components
      const formattedPantries = (memberships || []).map(m => ({
        pantry_id: m.organization_id,
        role: m.role,
        pantry: m.organization
      }));

      setAvailablePantries(formattedPantries);
      setOrganizationId(activeOrgId || null);
      setLocationId(activeLocationId || null);
      setUserRole(activeRole || null);
      setPantryDetails(activeOrgDetails || null);

      // Save active state to localStorage
      if (typeof window !== 'undefined') {
        if (activeOrgId) localStorage.setItem('active_organization_id', activeOrgId);
        else localStorage.removeItem('active_organization_id');

        if (activeLocationId) localStorage.setItem('active_location_id', activeLocationId);
        else localStorage.removeItem('active_location_id');
      }

    } catch (err) {
      console.error('Error refreshing pantry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // --- 2. REALTIME SUBSCRIPTION (Postgres Changes on inventory_batches) ---
  useEffect(() => {
    if (!locationId) return;

    const channel = supabase
      .channel(`inventory-realtime-${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_batches',
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          console.log('⚡ Realtime inventory change detected:', payload);
          setLastInventoryUpdate(Date.now());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, locationId]);

  // --- 3. SWITCH PANTRY (Client-side persistence) ---
  const switchPantry = async (newOrgIdOrLocId) => {
    try {
      setIsLoading(true);
      if (typeof window !== 'undefined') {
        // Check if newOrgIdOrLocId matches an organization_id in availablePantries
        const orgMatch = availablePantries.find(p => p.pantry_id === newOrgIdOrLocId);
        if (orgMatch) {
          localStorage.setItem('active_organization_id', newOrgIdOrLocId);
          localStorage.removeItem('active_location_id'); // reset location to pick default of new org
        } else {
          // Assume it's a location id
          localStorage.setItem('active_location_id', newOrgIdOrLocId);
        }
      }
      await refreshPantry();
    } catch (error) {
      console.error("Failed to switch pantry:", error);
      setIsLoading(false);
    }
  };

  // --- 4. INITIAL LOAD ---
  useEffect(() => {
    refreshPantry();
  }, [refreshPantry]);

  return (
    <PantryContext.Provider value={{
      organizationId,
      locationId,
      pantryId: locationId || organizationId, // alias for backward compatibility during migration
      userRole,
      pantryDetails,
      availablePantries,
      switchPantry,
      refreshPantry,
      lastInventoryUpdate,
      isLoading
    }}>
      {children}
    </PantryContext.Provider>
  );
}

export const usePantry = () => useContext(PantryContext);