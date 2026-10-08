import { InventoryPageSkeleton } from '@/components/pages/inventory/skeletons';

// Shown the moment Inventory is tapped, while the server draws the first page of items.
export default function InventoryLoading() {
  return <InventoryPageSkeleton />;
}
