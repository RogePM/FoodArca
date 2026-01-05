import mongoose from 'mongoose';

const ClientDistributionSchema = new mongoose.Schema({
  pantryId: { type: String, required: true, index: true },
  clientName: { type: String, required: true },
  clientId: { type: String },
  itemName: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
  category: { type: String, required: true },
  quantityDistributed: { type: Number, required: true },
  unit: { type: String, default: 'units' },
  reason: { type: String, required: true },
  distributionDate: { type: Date, default: Date.now },

  // 🚀 ADD THESE TO TRACK HISTORY ACCURATELY:
  childrenCount: { type: Number, default: 0 },
  adultCount: { type: Number, default: 0 },
  seniorCount: { type: Number, default: 0 },
  familySize: { type: Number, default: 0 }
});

// UPDATED INDEXES: 
// We add 'pantryId: 1' to the start of every index.
// This ensures we search WITHIN the pantry, not the whole database.
ClientDistributionSchema.index({ pantryId: 1, clientName: 1, distributionDate: -1 });
ClientDistributionSchema.index({ pantryId: 1, clientId: 1, distributionDate: -1 });
ClientDistributionSchema.index({ pantryId: 1, distributionDate: -1 });

// CRITICAL FIX for Next.js: Check if model exists before creating
const ClientDistribution = mongoose.models.ClientDistribution || mongoose.model('ClientDistribution', ClientDistributionSchema);

export { ClientDistribution };