import mongoose from 'mongoose';

const FoodItemSchema = new mongoose.Schema({
  pantryId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { 
    type: String, 
    required: true, 
    enum: ['units', 'lbs', 'kg', 'oz'], 
    default: "units" 
  },
  barcode: { type: String, default: null },
  
  // ✅ UPDATED: Default to empty string so it's cleaner in forms
  storageLocation: { type: String, default: "" }, 
  
  // ✅ NEW FIELD: Notes
  notes: { type: String, default: "" }, 

  expirationDate: { type: Date }, 
  lastModified: { type: Date, default: Date.now },
});

// --- ALLOW MULTIPLE BATCHES ---
FoodItemSchema.index(
  { pantryId: 1, barcode: 1 },
  { 
    partialFilterExpression: { barcode: { $type: "string" } } 
  }
);

// --- SPEED BOOST ---
FoodItemSchema.index({ pantryId: 1, barcode: 1, expirationDate: 1 });

// --- Barcode Cache Schema ---
const BarcodeCacheSchema = new mongoose.Schema({
  pantryId: { type: String, required: true, index: true },
  barcode: { type: String, required: true },
  name: String,
  brand: String,
  category: String,
  storageLocation: String, // Cache the location too
  lastModified: Date,
});

// Cache stays unique
BarcodeCacheSchema.index(
  { pantryId: 1, barcode: 1 },
  {
    unique: true, 
    partialFilterExpression: { barcode: { $type: "string" } },
  }
);

export const FoodItem = mongoose.models.FoodItem || mongoose.model('FoodItem', FoodItemSchema);

export const BarcodeCache = mongoose.models.BarcodeCache || mongoose.model('BarcodeCache', BarcodeCacheSchema);