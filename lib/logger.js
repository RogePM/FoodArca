// lib/logger.js
import { ChangeLog } from '@/lib/models/ChangeLogModel';

export const logChange = async (actionType, item, metadata = {}, pantryId) => {
  try {
    // 1. Safe Number Parsing (Prevents NaN)
    const currentItemQty = Number(item.quantity) || 0;
    const changeQty = Number(metadata.removedQuantity || item.quantity) || 0;
    const familySize = Number(metadata.familySize) || 1;

    let weight = 0;
    const unit = (metadata.unit || item.unit || 'units').toLowerCase();
    
    // Centralized Weight Math
    if (unit === 'lbs') weight = changeQty;
    else if (unit === 'kg') weight = changeQty * 2.20462;
    else if (unit === 'oz') weight = changeQty / 16;
    else weight = changeQty * 1;

    const value = weight * 2.50; 

    await ChangeLog.create({
      pantryId,
      actionType,
      itemId: item._id,
      itemName: item.name || 'Unknown Item',
      category: item.category || 'Uncategorized',
      // Logic: If added, prev is 0. If distributed, prev was (current + what we took).
      previousQuantity: actionType === 'added' ? 0 : (currentItemQty + changeQty),
      quantityChanged: changeQty,
      newQuantity: currentItemQty,
      unit: unit,
      distributionReason: metadata.reason || '',
      clientName: metadata.clientName || '',
      clientId: metadata.clientId || '',
      impactMetrics: {
        peopleServed: actionType === 'distributed' ? familySize : 0,
        estimatedValue: parseFloat(value.toFixed(2)) || 0,
        standardizedWeight: parseFloat(weight.toFixed(2)) || 0,
        wasteDiverted: actionType === 'added'
      },
      tags: metadata.reason === 'emergency' ? ['Urgent'] : [],
      timestamp: new Date()
    });
  } catch (e) {
    console.error("❌ Failed to log change:", e);
  }
};