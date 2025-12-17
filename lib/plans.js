// lib/plans.js

export const PLANS = {
  pilot: {
    id: 'pilot',
    name: 'Pilot',
    price: 0,
    limits: {
      items: 50,
      users: 5,        // Generous team size
      clients: 100,   // High client cap (from your screenshot)
    },
    features: {
      csv_export: true,  // Pilot gets Pro features
      multi_site: false
    }
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 15,
    limits: {
      items: 300,
      users: 2,        // The "Poison Pill" (Low limit)
      clients: 100     // Lower client cap
    },
    features: {
      csv_export: false, // Basic LOSES features
      multi_site: false
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 30,
    limits: {
      items: 2000,
      users: 10,       // Restore team size
      clients: 1500
    },
    features: {
      csv_export: true,
      multi_site: false
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom
    limits: {
      items: 999999,   // "Unlimited"
      users: 999999,
      clients: 999999
    },
    features: {
      csv_export: true,
      multi_site: true
    }
  }
};

// Helper to get plan details safely
export const getPlanDetails = (tierName) => {
  return PLANS[tierName?.toLowerCase()] || PLANS.pilot;
};