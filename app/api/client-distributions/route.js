import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ClientDistribution } from '@/lib/models/ClientDistributionModel';
import { ChangeLog } from '@/lib/models/ChangeLogModel';
import { Client } from '@/lib/models/ClientModel';

// --- FIXED Helper: Log Changes ---
const logChange = async (actionType, item, changes = null, metadata = {}, pantryId) => {
  try {
    const qty = metadata.removedQuantity || 0;
    const unit = (metadata.unit || 'units').toLowerCase();

    // Calculate Metrics
    let weight = 0;
    if (unit === 'lbs') weight = qty;
    else if (unit === 'kg') weight = qty * 2.20462;
    else if (unit === 'oz') weight = qty / 16;
    else weight = qty * 1;

    const value = weight * 2.50;

    await ChangeLog.create({
      pantryId,
      actionType,
      itemId: item._id,
      itemName: item.name,
      category: item.category,
      changes,

      // Quantity Data
      quantityChanged: qty,
      unit: metadata.unit,

      // Metadata
      distributionReason: metadata.reason,
      clientName: metadata.clientName,
      clientId: metadata.clientId,
      removedQuantity: qty,

      // Impact Data
      impactMetrics: {
        peopleServed: 1,
        estimatedValue: parseFloat(value.toFixed(2)),
        standardizedWeight: parseFloat(weight.toFixed(2)),
        wasteDiverted: false
      },

      timestamp: new Date()
    });
  } catch (e) {
    console.error("Failed to log change:", e);
  }
};

// --- GET: List All Distributions ---
export async function GET(req) {
  try {
    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    await connectDB();

    const distributions = await ClientDistribution.find({ pantryId })
      .sort({ distributionDate: -1 })
      .limit(100);

    return NextResponse.json({ count: distributions.length, data: distributions });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// --- POST: Create New Distribution ---
export async function POST(req) {
  try {
    const data = await req.json();
    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    await connectDB();

    // 🔥 SENIOR FIX: DEFAULT VALUES
    const safeClientName = data.clientName || 'General Inventory Adjustment';
    const safeClientId = data.clientId || 'SYS';

    // ---------------------------------------------------------
    // 🚀 NEW: AUTO-UPDATE CLIENT DIRECTORY
    // ---------------------------------------------------------
    // We only create a client record if this is a real person (not "SYS")
    // and not an internal adjustment.
    if (safeClientId !== 'SYS' && safeClientId !== 'anonymous') {
      try {
        // "Upsert" = Update if exists, Insert if new
        await Client.findOneAndUpdate(
          {
            pantryId: pantryId,
            // Case-insensitive search to prevent "John Doe" vs "john doe" duplicates
            clientId: { $regex: new RegExp(`^${safeClientId}$`, 'i') }
          },
          {
            $set: {
              // Always update these fields to keep them fresh
              firstName: safeClientName.split(' ')[0],
              lastName: safeClientName.split(' ').slice(1).join(' ') || '',
              lastVisit: new Date(),
              isActive: true
            },
            $setOnInsert: {
              // Only set these ONCE when creating a new client
              pantryId,
              clientId: safeClientId, // Keep original casing or normalize here
              createdAt: new Date(),
              familySize: 1 // Default, can be updated later via Profile page
            }
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Client Directory tracked: ${safeClientName}`);
      } catch (clientErr) {
        console.error("⚠️ Failed to track client (Non-fatal):", clientErr);
        // We swallow this error so the Distribution itself doesn't fail.
      }
    }
    // ---------------------------------------------------------

    // 1. Create Distribution Record (Business as usual)
    const distribution = await ClientDistribution.create({
      ...data,
      clientName: safeClientName,
      clientId: safeClientId,
      pantryId,
      distributionDate: new Date(),
    });

    // 2. Log to History
    await logChange('distributed', {
      _id: data.itemId,
      name: data.itemName,
      category: data.category
    }, null, {
      reason: data.reason,
      clientName: safeClientName,
      clientId: safeClientId,
      removedQuantity: data.quantityDistributed,
      unit: data.unit
    }, pantryId);

    return NextResponse.json(distribution, { status: 201 });

  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// --- PUT: Update Distribution ---
export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const data = await req.json();
    const pantryId = req.headers.get('x-pantry-id');

    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    await connectDB();

    const result = await ClientDistribution.findOneAndUpdate(
      { _id: id, pantryId },
      data,
      { new: true }
    );

    if (!result) return NextResponse.json({ message: 'Record not found' }, { status: 404 });

    return NextResponse.json({ message: 'Updated', data: result });

  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// --- DELETE: Remove Distribution ---
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const pantryId = req.headers.get('x-pantry-id');

    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    await connectDB();

    const result = await ClientDistribution.findOneAndDelete({ _id: id, pantryId });

    if (!result) return NextResponse.json({ message: 'Record not found' }, { status: 404 });

    return NextResponse.json({ message: 'Deleted' });

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}