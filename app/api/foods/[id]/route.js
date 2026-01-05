import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem } from '@/lib/models/FoodItemModel';
import { ClientDistribution } from '@/lib/models/ClientDistributionModel';
import { logChange } from '@/lib/logger'; // ✅ ACTION: Use Centralized Logger

// --- SECURITY HELPER ---
async function authenticateAndVerify(req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { valid: false, status: 401, message: 'Unauthorized' };

  const pantryId = req.headers.get('x-pantry-id');
  if (!pantryId) return { valid: false, status: 400, message: 'Pantry ID required' };

  // ✅ ACTION: Membership Verification
  const { data: membership, error: memberError } = await supabase
    .from('pantry_members')
    .select('is_active, role')
    .eq('user_id', user.id)
    .eq('pantry_id', pantryId)
    .single();

  if (memberError || !membership) return { valid: false, status: 403, message: 'Access Denied' };

  return { valid: true, user, supabase, pantryId, isActive: membership.is_active };
}

// ----------------------------------------------------------------------------------
// --- GET Single Item ---
// ----------------------------------------------------------------------------------
export async function GET(req, { params }) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ message: auth.message }, { status: auth.status });

    const { id } = await params;
    await connectDB();
    
    // Ensure the item belongs to the user's verified pantry
    const food = await FoodItem.findOne({ _id: id, pantryId: auth.pantryId });
    if (!food) return NextResponse.json({ message: 'Item not found' }, { status: 404 });

    return NextResponse.json(food);
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------------
// --- PUT: Update Item ---
// ----------------------------------------------------------------------------------
export async function PUT(req, { params }) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ message: auth.message }, { status: auth.status });
    if (!auth.isActive) return NextResponse.json({ message: 'Read-only account' }, { status: 403 });

    const { id } = await params;
    const data = await req.json();

    await connectDB();

    // 1. Fetch old state for logging comparison
    const oldItem = await FoodItem.findOne({ _id: id, pantryId: auth.pantryId });
    if (!oldItem) return NextResponse.json({ message: 'Item not found' }, { status: 404 });

    // 2. ✅ ACTION: Atomic Update using findOneAndUpdate
    const updateData = {
      ...data,
      lastModified: new Date()
    };

    const result = await FoodItem.findOneAndUpdate(
      { _id: id, pantryId: auth.pantryId },
      { $set: updateData },
      { new: true }
    );

    // 3. Log Changes (Only if things actually changed)
    const changes = {};
    for (const key of Object.keys(data)) {
      if (oldItem[key] != data[key]) {
        changes[key] = { old: oldItem[key], new: data[key] };
      }
    }

    if (Object.keys(changes).length > 0) {
      await logChange('updated', result, changes, auth.pantryId);
    }

    return NextResponse.json({ message: 'Item updated', data: result });
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------------
// --- DELETE: Remove Item ---
// ----------------------------------------------------------------------------------
export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ message: auth.message }, { status: auth.status });
    if (!auth.isActive) return NextResponse.json({ message: 'Read-only account' }, { status: 403 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    
    // Extract metadata from query params (used for distribution logging)
    const metadata = {
      reason: searchParams.get('reason') || 'deleted',
      clientName: searchParams.get('clientName'),
      clientId: searchParams.get('clientId'),
      removedQuantity: parseInt(searchParams.get('removedQuantity')),
      unit: searchParams.get('unit')
    };

    await connectDB();

    // Find and delete strictly within the verified pantry
    const result = await FoodItem.findOneAndDelete({ _id: id, pantryId: auth.pantryId });
    if (!result) return NextResponse.json({ message: 'Item not found' }, { status: 404 });

    // If client info was provided, create a distribution record
    if (metadata.clientName && metadata.clientName.trim() !== "") {
      await ClientDistribution.create({
        pantryId: auth.pantryId,
        clientName: metadata.clientName.trim(),
        clientId: metadata.clientId?.trim(),
        itemName: result.name,
        itemId: result._id,
        category: result.category,
        quantityDistributed: metadata.removedQuantity || result.quantity,
        unit: metadata.unit || result.unit || 'units',
        reason: metadata.reason,
        distributionDate: new Date()
      });
    }

    // ✅ ACTION: Use Centralized Logger
    await logChange('deleted', result, metadata, auth.pantryId);

    return NextResponse.json({ message: 'Item deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}