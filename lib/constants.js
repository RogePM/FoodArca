
import {
  LayoutDashboard,
  PlusSquare,
  MinusSquare,
  Boxes,
  History,
  Calendar,
  Settings,
  Archive,
  Snowflake,
  Carrot,
  Croissant,
  Cylinder,
  Beef,
  GlassWater,
  BookXIcon,
  MilkIcon,
  UserRoundSearchIcon,
  Bubbles
} from 'lucide-react';

export const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, view: 'Dashboard' },
  { name: 'Add Items', icon: PlusSquare, view: 'Add Items' },
  { name: 'Remove Items', icon: MinusSquare, view: 'Remove Items' },
  { name: 'View Inventory', icon: Boxes, view: 'View Inventory' },
  { name: 'Recent Changes', icon: History, view: 'Recent Changes' },
  { name: 'View Clients', icon: UserRoundSearchIcon, view: 'View Clients' },
];

export const dashboardActions = [
  {
    title: 'Add Items',
    description: 'Log new donations and purchases.',
    icon: PlusSquare,
    view: 'Add Items',
  },
  {
    title: 'Remove Items',
    description: 'Distribute items and update stock.',
    icon: MinusSquare,
    view: 'Remove Items',
  },
  {
    title: 'View Inventory',
    description: 'Check current stock levels.',
    icon: Boxes,
    view: 'View Inventory',
  },
  {
    title: 'Recent Changes',
    description: 'Audit log of all inventory movements.',
    icon: History,
    view: 'Recent Changes',
  },
  {
    title: 'View Clients',
    description: 'View clients recieving food.',
    icon: UserRoundSearchIcon, 
    view: 'View Clients'
  },
{
  title: 'Settings',
    description: 'Manage organization and user settings.',
      icon: Settings,
        view: 'Settings',
  },
];

export const categories = [
  { name: 'Dry Goods', icon: Archive, value: 'dry_goods', style: { bg: 'bg-orange-50/50', border: 'border-orange-100', text: 'text-orange-700', badge: 'bg-orange-200' } },
  { name: 'Frozen Food', icon: Snowflake, value: 'frozen_food', style: { bg: 'bg-cyan-50/50', border: 'border-cyan-100', text: 'text-cyan-700', badge: 'bg-cyan-200' } },
  { name: 'Produce', icon: Carrot, value: 'produce', style: { bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-200' } },
  { name: 'Proteins', icon: Beef, value: 'proteins', style: { bg: 'bg-rose-50/50', border: 'border-rose-100', text: 'text-rose-700', badge: 'bg-rose-200' } },
  { name: 'Bakery & Snacks', icon: Croissant, value: 'bakery_snacks', style: { bg: 'bg-yellow-50/50', border: 'border-yellow-100', text: 'text-yellow-700', badge: 'bg-yellow-200' } },
  { name: 'Canned Goods', icon: Cylinder, value: 'canned_goods', style: { bg: 'bg-stone-50/50', border: 'border-stone-100', text: 'text-stone-700', badge: 'bg-stone-200' } },
  { name: 'Beverages', icon: GlassWater, value: 'beverages', style: { bg: 'bg-blue-50/50', border: 'border-blue-100', text: 'text-blue-700', badge: 'bg-blue-200' } },
  { name: 'Dairy', icon: MilkIcon, value: 'dairy', style: { bg: 'bg-indigo-50/50', border: 'border-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-200' } },
  { name: 'Hygiene', icon: Bubbles, value: 'hygiene', style: { bg: 'bg-teal-50/50', border: 'border-teal-100', text: 'text-teal-700', badge: 'bg-teal-200' } },
  { name: 'Other', icon: BookXIcon, value: 'other', style: { bg: 'bg-gray-50/50', border: 'border-gray-100', text: 'text-gray-700', badge: 'bg-gray-200' } },
];

export const getCategoryStyle = (value) => {
  const cat = categories.find(c => c.value === value?.toLowerCase());
  return cat ? cat.style : categories.find(c => c.value === 'other').style;
};

export const getCategoryName = (value) => {
  const cat = categories.find(c => c.value === value?.toLowerCase());
  return cat ? cat.name : (value || 'Other');
};

