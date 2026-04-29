// app/dashboard/layout.jsx
import React from 'react';
import { PantryProvider } from '@/components/providers/PantryProvider';

export const metadata = {
  title: 'Dashboard | Food Arca',
};

export default function DashboardLayout({ children }) {
  return (
    // The Provider wraps the children. 
    // "children" in this case will automatically be your dashboard's page.js!
    <PantryProvider>
      {children}
    </PantryProvider>
  );
}