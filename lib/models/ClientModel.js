import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  // 1. Isolation (Multi-tenant)
  pantryId: { 
    type: String, 
    required: true,
    index: true 
  },

  // 2. Identity
  // The ID used in distributions (e.g. "CL-55" or "555-0199")
  clientId: { 
    type: String, 
    required: true 
  }, 
  
  firstName: { type: String, required: true },
  lastName: { type: String, default: '' },
  
  // 3. Contact (Optional for now, but ready for the Profile page)
  email: { type: String },
  phone: { type: String },
  address: { type: String },

  // 4. Household Info (Critical for "People Served" impact metrics)
  familySize: { 
    type: Number, 
    default: 1 
  },

  // 5. Status & Timestamps
  isActive: { type: Boolean, default: true },
  lastVisit: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// 🚀 COMPOUND INDEX
// This ensures searching for a client *within* a pantry is instant.
// It also helps prevents duplicate IDs inside the same pantry.
ClientSchema.index({ pantryId: 1, clientId: 1 }, { unique: true });

// CRITICAL FIX for Next.js Hot Reloading
// Prevents "OverwriteModelError" when you save files in dev mode
const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);

export { Client };