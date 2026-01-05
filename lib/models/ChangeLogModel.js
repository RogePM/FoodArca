import mongoose from 'mongoose';

const changeLogSchema = new mongoose.Schema({
  // Multi-tenant isolation
  pantryId: {
    type: String,
    required: true,
    index: true
  },

  actionType: {
    type: String,
    enum: ['added', 'updated', 'deleted', 'distributed'],
    required: true
  },

  // Item Details
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodItem',
    // We don't make this 'required' because if an item is deleted, 
    // we still want the log to exist.
  },
  itemName: { type: String, required: true },
  category: { type: String, required: true },

  // For "Updated" actions (stores old vs new values)
  changes: {
    type: mongoose.Schema.Types.Mixed
  },

  // Quantity Tracking
  previousQuantity: { type: Number },
  quantityChanged: { type: Number },
  newQuantity: { type: Number },
  unit: { type: String, default: 'units' },

  // Distribution Specific Metadata
  distributionReason: { type: String },
  clientName: { type: String, index: true }, // ✅ Index added for "Client History" lookups
  clientId: { type: String, index: true },   // ✅ Index added for "Client Profile" activity feeds

  impactMetrics: {
    peopleServed: { type: Number, default: 0 },
    estimatedValue: { type: Number, default: 0 },
    standardizedWeight: { type: Number, default: 0 },
    wasteDiverted: { type: Boolean, default: false }
  },

  tags: [{ type: String }],

  timestamp: {
    type: Date,
    default: Date.now,
    index: true // ✅ Individual index for date-range reporting
  }
});

// --- COMPOSITE INDEXES ---

// 1. For the "Recent Activity" Feed
changeLogSchema.index({ pantryId: 1, timestamp: -1 });

// 2. For "Impact Reports" (Filtering by pantry AND date range)
changeLogSchema.index({ pantryId: 1, actionType: 1, timestamp: 1 });

// 3. Optional: TTL Index (Automatic Cleanup)
// If you want to delete logs older than 5 years to save database costs:
// changeLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 * 5 });

export const ChangeLog = mongoose.models.ChangeLog || mongoose.model('ChangeLog', changeLogSchema);