// lib/plans.js

export const PLANS = {
  pilot: {
    id: 'pilot',
    name: 'Pilot',
    price: 0,
    stripePriceId: null, // Free
    limits: { items: 50, users: 1, clients: 100 },
    features: { csv_export: true, multi_site: false }
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 15,
    // 🔥 PASTE YOUR BASIC PLAN PRICE ID HERE
    stripePriceId: 'price_1SfWqkBnjTK4lGKZSGRMOCRx', 
    limits: { items: 800, users: 5, clients: 300 },
    features: { csv_export: false, multi_site: false }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 30,
    // 🔥 PASTE YOUR PRO PLAN PRICE ID HERE
    stripePriceId: 'price_1SfXIUBnjTK4lGKZrugD15IO', 
    limits: { items: 3000, users: 10, clients: 1500 },
    features: { csv_export: true, multi_site: false }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    stripePriceId: null, // Custom
    limits: { items: 999999, users: 999999, clients: 999999 },
    features: { csv_export: true, multi_site: true }
  }
};

export const getPlanDetails = (tierName) => {
  return PLANS[tierName?.toLowerCase()] || PLANS.pilot;
};