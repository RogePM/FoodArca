import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { ClientDistribution } from '@/lib/models/ClientDistributionModel';
import { Client } from '@/lib/models/ClientModel';
import { FoodItem } from '@/lib/models/FoodItemModel'; 
import { logChange } from '@/lib/logger';

// --- AUTHENTICATION & SECURITY HELPER ---
async function authenticateAndVerify(req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { valid: false, status: 401, message: 'Unauthorized', supabase }; // Return supabase client

  const pantryId = req.headers.get('x-pantry-id');
  if (!pantryId) return { valid: false, status: 400, message: 'Pantry ID required', supabase };

  const { data: membership, error: memberError } = await supabase
    .from('pantry_members')
    .select('is_active, role')
    .eq('user_id', user.id)
    .eq('pantry_id', pantryId)
    .single();

  if (memberError || !membership) return { valid: false, status: 403, message: 'Access Denied', supabase };

  return {
    valid: true,
    user,
    pantryId,
    isActive: membership.is_active,
    role: membership.role,
    supabase // Pass this back so we can query limits!
  };
}

// --- GET: List All Distributions ---
export async function GET(req) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ message: auth.message }, { status: auth.status });

    await connectDB();
    const distributions = await ClientDistribution.find({ pantryId: auth.pantryId })
      .sort({ distributionDate: -1 })
      .limit(100);

    return NextResponse.json({ count: distributions.length, data: distributions });
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// --- POST: Create Distribution & Handle Client Profile ---
export async function POST(req) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ message: auth.message }, { status: auth.status });
    if (!auth.isActive) return NextResponse.json({ message: 'Read-only account' }, { status: 403 });

    const data = await req.json();
    await connectDB();

    const {
      clientName, clientId, isNewClient, address,
      childrenCount, adultCount, seniorCount,
      cart 
    } = data;
    
    // ---------------------------------------------------------
    // 🚨 GATEKEEPER: CHECK FAMILY LIMITS (Only if Creating New) 🚨
    // ---------------------------------------------------------
    if (isNewClient && clientName && clientName !== 'Walk-in') {
        const { data: pantrySettings, error: pantryError } = await auth.supabase
            .from('food_pantries')
            .select('subscription_tier, total_families_created, max_clients_limit')
            .eq('pantry_id', auth.pantryId)
            .single();

        if (!pantryError && pantrySettings && pantrySettings.subscription_tier === 'pilot') {
            const limit = pantrySettings.max_clients_limit || 100;
            
            // If they hit the limit, BLOCK the distribution until they fix the client issue
            if (pantrySettings.total_families_created >= limit) {
                return NextResponse.json({ 
                    error: 'LIMIT_REACHED', 
                    message: `Client Limit Reached (${limit}). Please select an existing client or upgrade.` 
                }, { status: 403 });
            }
        }
    }
    // ---------------------------------------------------------

    // 1. IDENTITY & HOUSEHOLD LOGIC
    let finalClientId = clientId || 'SYS';
    let familySize = (childrenCount || 0) + (adultCount || 1) + (seniorCount || 0);

    if (clientName && finalClientId !== 'SYS' && clientName !== 'Walk-in') {
      try {
        if (isNewClient) {
          const newClient = await Client.create({
            pantryId: auth.pantryId,
            clientId: finalClientId,
            firstName: clientName.split(' ')[0],
            lastName: clientName.split(' ').slice(1).join(' ') || '',
            address: address || '',
            childrenCount: childrenCount || 0,
            adultCount: adultCount || 1,
            seniorCount: seniorCount || 0,
            familySize: familySize,
            lastVisit: new Date(),
          });
          finalClientId = newClient.clientId;

          // --- 💰 SPEND TOKEN: INCREMENT COUNTER 💰 ---
          if (newClient) {
             const { error: rpcError } = await auth.supabase.rpc('increment_pantry_usage', {
                p_pantry_id: auth.pantryId,
                p_resource_type: 'family' 
             });
             if (rpcError) console.error("Failed to increment family counter:", rpcError);
          }

        } else {
          // Updating existing client does NOT cost a token
          await Client.findOneAndUpdate(
            { pantryId: auth.pantryId, clientId: finalClientId },
            {
              $set: {
                lastVisit: new Date(),
                isActive: true,
                childrenCount: childrenCount || 0,
                adultCount: adultCount || 1,
                seniorCount: seniorCount || 0,
                familySize: familySize
              }
            }
          );
        }
      } catch (err) { console.error("Client update failed:", err); }
    }

    // 2. DISTRIBUTION & INVENTORY LOGIC
    const itemsToProcess = cart || [data];
    const timestamp = new Date();

    const results = await Promise.all(itemsToProcess.map(async (item) => {
      const qty = item.quantityDistributed;

      // A. Update Food Inventory
      const updatedFood = await FoodItem.findOneAndUpdate(
        { _id: item.itemId, pantryId: auth.pantryId },
        { $inc: { quantity: -qty }, $set: { lastModified: timestamp } },
        { new: true }
      );

      // B. Auto-delete if stock is empty
      if (updatedFood && updatedFood.quantity <= 0) {
        await FoodItem.findByIdAndDelete(item.itemId);
      }

      // C. Create Distribution Record
      const distribution = await ClientDistribution.create({
        pantryId: auth.pantryId,
        clientName: clientName,
        clientId: finalClientId,
        itemId: item.itemId,
        itemName: item.itemName,
        category: item.category,
        quantityDistributed: qty,
        unit: item.unit || 'units',
        reason: item.reason || 'distribution-regular',
        distributionDate: timestamp,
      });

      // D. Log to History
      await logChange('distributed',
        {
          _id: item.itemId,
          name: item.itemName,
          category: item.category,
          quantity: updatedFood?.quantity || 0
        },
        {
          reason: item.reason || 'distribution-regular',
          clientName,
          clientId: finalClientId,
          removedQuantity: qty,
          unit: item.unit,
          familySize
        },
        auth.pantryId
      );

      return distribution;
    }));

    return NextResponse.json({
      message: 'Distribution successful',
      itemsProcessed: results.length
    }, { status: 201 });

  } catch (error) {
    console.error("POST Distribution Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// --- PUT & DELETE (Standard) ---
export async function PUT(req) {
  const auth = await authenticateAndVerify(req);
  if (!auth.valid || !auth.isActive) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const data = await req.json();

  await connectDB();
  const result = await ClientDistribution.findOneAndUpdate({ _id: id, pantryId: auth.pantryId }, data, { new: true });
  return result ? NextResponse.json(result) : NextResponse.json({ message: 'Not found' }, { status: 404 });
}

export async function DELETE(req) {
  const auth = await authenticateAndVerify(req);
  if (!auth.valid || !auth.isActive) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  await connectDB();
  const result = await ClientDistribution.findOneAndDelete({ _id: id, pantryId: auth.pantryId });
  return result ? NextResponse.json({ message: 'Deleted' }) : NextResponse.json({ message: 'Not found' }, { status: 404 });
}