import {
  LayoutDashboard,
  PlusSquare,
  MinusSquare,
  Boxes,
  History,
  Calendar,
  Settings,
} from "lucide-react";

export const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, view: "Dashboard", href: "/dashboard" },
  { name: "Add Items", icon: PlusSquare, view: "Add Items", href: "/dashboard/add" },
  { name: "Remove Items", icon: MinusSquare, view: "Remove Items", href: "/dashboard/remove" },
  { name: "View Inventory", icon: Boxes, view: "View Inventory", href: "/dashboard/inventory" },
  { name: "Recent Changes", icon: History, view: "Recent Changes", href: "/dashboard/recent" },
];

export const dashboardActions = [
  {
    title: "Add Items",
    description: "Log new donations and purchases.",
    icon: PlusSquare,
    view: "Add Items",
    href: "/dashboard/add",
  },
  {
    title: "Remove Items",
    description: "Distribute items and update stock.",
    icon: MinusSquare,
    view: "Remove Items",
    href: "/dashboard/remove",
  },
  {
    title: "View Inventory",
    description: "Check current stock levels.",
    icon: Boxes,
    view: "View Inventory",
    href: "/dashboard/inventory",
  },
  {
    title: "Recent Changes",
    description: "Audit log of all inventory movements.",
    icon: History,
    view: "Recent Changes",
    href: "/dashboard/recent",
  },
  {
    title: "Settings",
    description: "Manage organization and user settings.",
    icon: Settings,
    view: "Settings",
    href: "/dashboard/settings",
  },
];

export const categories = [
  {
    value: "dry_goods",
    name: "Dry Goods",
    style: {
      bg: "bg-orange-100/80",
      text: "text-orange-700",
      border: "border-orange-100",
    },
    imagePath: "/foodSVG/Other.png",
    icon: "Archive",
  },
  {
    value: "frozen_food",
    name: "Frozen Food",
    style: {
      bg: "bg-violet-100/80",
      text: "text-violet-600",
      border: "border-violet-100",
    },
    imagePath: "/foodSVG/frozen.png",
    icon: "Snowflake",
  },
  {
    value: "produce",
    name: "Produce",
    style: {
      bg: "bg-lime-100/80",
      text: "text-lime-700",
      border: "border-lime-100",
    },
    imagePath: "/foodSVG/produce.png",
    icon: "Carrot",
  },
  {
    value: "proteins",
    name: "Proteins",
    style: {
      bg: "bg-red-100/80",
      text: "text-red-600",
      border: "border-red-100",
    },
    imagePath: "/foodSVG/protein.png",
    icon: "Beef",
  },
  {
    value: "bakery",
    name: "Bakery",
    style: {
      bg: "bg-amber-100/80",
      text: "text-amber-700",
      border: "border-amber-100",
    },
    imagePath: "/foodSVG/BakeryNsnacks.png",
    icon: "Croissant",
  },
  {
    value: "canned_goods",
    name: "Canned Goods",
    style: {
      bg: "bg-yellow-100/80",
      text: "text-yellow-700",
      border: "border-yellow-100",
    },
    imagePath: "/foodSVG/Cannedgoods.png",
    icon: "Cylinder",
  },
  {
    value: "beverages",
    name: "Beverages",
    style: {
      bg: "bg-rose-100/80",
      text: "text-rose-600",
      border: "border-rose-100",
    },
    imagePath: "/foodSVG/beverages.png",
    icon: "GlassWater",
  },
  {
    value: "dairy",
    name: "Dairy",
    style: {
      bg: "bg-blue-100/80",
      text: "text-blue-600",
      border: "border-blue-100",
    },
    imagePath: "/foodSVG/Dairy.png",
    icon: "MilkIcon",
  },
  {
    value: "hygiene",
    name: "Hygiene",
    style: {
      bg: "bg-emerald-100/80",
      text: "text-emerald-600",
      border: "border-emerald-100",
    },
    imagePath: "/foodSVG/Hygeine.png",
    icon: "Bubbles",
  },
  {
    value: "other",
    name: "Other",
    style: {
      bg: "bg-stone-100/80",
      text: "text-stone-500",
      border: "border-stone-100",
    },
    imagePath: "/foodSVG/Other.png",
    icon: "BookXIcon",
  },
];

export const getCategoryStyle = (value) => {
  const cat = categories.find((c) => c.value === value?.toLowerCase());
  return cat ? cat.style : categories.find((c) => c.value === "other").style;
};

export const getCategoryName = (value) => {
  const cat = categories.find((c) => c.value === value?.toLowerCase());
  return cat ? cat.name : value || "Other";
};

export const getCategoryVisual = (value) => {
  const safeVal = String(value || "other").toLowerCase();
  const cat = categories.find(
    (c) =>
      c.value === safeVal ||
      c.name.toLowerCase() === safeVal ||
      c.value === safeVal.replace(/[\s-]/g, "_") ||
      c.value.replace(/_/g, "") === safeVal.replace(/[\s&_-]/g, ""),
  );
  if (cat)
    return {
      style: cat.style,
      name: cat.name,
      value: cat.value,
      imagePath: cat.imagePath,
      icon: cat.icon,
    };
  const fallback = categories.find((c) => c.value === "other") || categories[0];
  return {
    style: fallback.style,
    name: value || "Other",
    value: "other",
    imagePath: fallback.imagePath,
    icon: fallback.icon,
  };
};
