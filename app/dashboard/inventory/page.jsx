import { Suspense } from 'react';
import { InventoryView } from '@/components/pages/inventory';

export const metadata = {
  title: 'Inventory | Food Arca',
};

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryView />
    </Suspense>
  );
}
