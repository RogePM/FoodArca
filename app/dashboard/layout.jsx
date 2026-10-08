import React from 'react';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PantryProvider } from '@/components/providers/PantryProvider';
import { getDashboardContext, toClientContext } from '@/lib/server/dashboard-context';

export const metadata = {
  title: 'Dashboard | Food Arca',
};

// Works out the user, organization and location once (lib/server/dashboard-context) and hands it
// to PantryProvider, so every dashboard page starts already knowing who and where, with no lookups
// in the browser. Pages that draw data on the server reuse the same answer (same request).
export default async function DashboardRootLayout({ children }) {
  const ctx = await getDashboardContext();

  // Security: not signed in (or the session is no longer valid).
  if (!ctx.user) redirect('/');

  // Not part of any active organization yet: finish onboarding first.
  if (!ctx.hasMembership) redirect('/onboarding');

  return (
    <PantryProvider initial={toClientContext(ctx)}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </PantryProvider>
  );
}
