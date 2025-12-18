import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem } from '@/lib/models/FoodItemModel';
import { ChangeLog } from '@/lib/models/ChangeLogModel';
import { ClientDistribution } from '@/lib/models/ClientDistributionModel';

// --- HELPER: Authentication ---
async function authenticateRequest(req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { authenticated: false, error: 'Unauthorized' };
  return { authenticated: true, user };
}

// --- HELPER: Log Changes ---
const logChange = async (actionType, item, changes = null, metadata = {}, pantryId) => {
  try {
    let qty = 0;
    if (actionType === 'added') qty = item.quantity;
    else if (actionType === 'distributed') qty = metadata.removedQuantity || 0;
    else if (actionType === 'deleted') qty = item.quantity;

    let weight = 0;
    const unit = (metadata.unit || item.unit || 'units').toLowerCase();
    if (unit === 'lbs') weight = qty;
    else if (unit === 'kg') weight = qty * 2.20462;
    else if (unit === 'oz') weight = qty / 16;
    else weight = qty;

    const value = weight * 2.50;
    const familySize = metadata.familySize || 1;

    await ChangeLog.create({
      pantryId,
      actionType,
      itemId: item._id,
      itemName: item.name,
      category: item.category,
      previousQuantity: actionType === 'added' ? 0 : item.quantity,
      quantityChanged: qty,
      newQuantity: actionType === 'deleted' ? 0 : item.quantity,
      unit: item.unit,
      changes, // Records what specifically changed (e.g. notes updated)
      distributionReason: metadata.reason,
      clientName: metadata.clientName,
      clientId: metadata.clientId,
      removedQuantity: qty,
      impactMetrics: {
        peopleServed: actionType === 'distributed' ? familySize : 0,
        estimatedValue: parseFloat(value.toFixed(2)),
        standardizedWeight: parseFloat(weight.toFixed(2)),
        wasteDiverted: false
      },
      tags: metadata.reason === 'emergency' ? ['Urgent'] : [],
      timestamp: new Date()
    });
  } catch (e) {
    console.error("Failed to log change:", e);
  }
};

// --- GET Single Item ---
export async function GET(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ message: auth.error }, { status: 401 });

    const { id } = await params;
    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    await connectDB();
    const food = await FoodItem.findOne({ _id: id, pantryId });
    if (!food) return NextResponse.json({ message: 'Item not found' }, { status: 404 });

    return NextResponse.json(food);
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// --- PUT: Update Item ---
export async function PUT(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ message: auth.error }, { status: 401 });

    const { id } = await params;
    const data = await req.json();
    const pantryId = req.headers.get('x-pantry-id');

    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    await connectDB();

    // 1. Find old item
    const oldItem = await FoodItem.findOne({ _id: id, pantryId });
    if (!oldItem) return NextResponse.json({ message: 'Item not found' }, { status: 404 });

    // 2. Prepare Update Data
    // 🔥 Explicitly handle the new fields (Notes/Location)
    const updateData = {
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      barcode: data.barcode,
      expirationDate: data.expirationDate,
      
      // ✅ Allow empty strings to clear the values
      storageLocation: data.storageLocation !== undefined ? data.storageLocation : oldItem.storageLocation,
      notes: data.notes !== undefined ? data.notes : oldItem.notes,
      
      lastModified: new Date()
    };

    const result = await FoodItem.findOneAndUpdate(
      { _id: id, pantryId },
      updateData,
      { new: true }
    );

    // 3. Log Changes
    const changes = {};
    for (const key of Object.keys(updateData)) {
      // Compare loosely (!=) to handle date string vs Date object differences
      if (key !== 'lastModified' && key !== '_id' && oldItem[key] != updateData[key]) {
        changes[key] = { old: oldItem[key], new: updateData[key] };
      }
    }

    if (Object.keys(changes).length > 0) {
      await logChange('updated', result, changes, {}, pantryId);
    }

    return NextResponse.json({ message: 'Item updated', data: result });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// --- DELETE: Remove Item ---
export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ message: auth.error }, { status: 401 });

    const { id } = await params;
    const pantryId = req.headers.get('x-pantry-id');
    
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const reason = searchParams.get('reason');
    const clientName = searchParams.get('clientName');
    const clientId = searchParams.get('clientId');
    const removedQuantity = searchParams.get('removedQuantity');
    const unit = searchParams.get('unit');

    await connectDB();

    const result = await FoodItem.findOneAndDelete({ _id: id, pantryId });

    if (!result) return NextResponse.json({ message: 'Item not found' }, { status: 404 });

    // Log Distribution if client exists
    if (clientName && clientName.trim()) {
        await ClientDistribution.create({
            pantryId,
            clientName: clientName.trim(),
            clientId: clientId?.trim(),
            itemName: result.name,
            itemId: result._id,
            category: result.category,
            quantityDistributed: parseInt(removedQuantity) || result.quantity,
            unit: unit || result.unit || 'units',
            reason: reason || 'deleted',
            distributionDate: new Date()
        });
    }

    // Log to History
    await logChange('deleted', result, null, { 
        reason, 
        clientName, 
        clientId, 
        removedQuantity: parseInt(removedQuantity) || result.quantity, 
        unit: unit || result.unit 
    }, pantryId);

    return NextResponse.json({ message: 'Item deleted' });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}