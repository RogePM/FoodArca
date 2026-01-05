import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem, BarcodeCache } from '@/lib/models/FoodItemModel';
import { ClientDistribution } from '@/lib/models/ClientDistributionModel';
import { Client } from '@/lib/models/ClientModel';

// --- AUTHENTICATION HELPER ---
async function authenticateRequest(req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { authenticated: false, user: null, supabase: null };

  // ✅ Returning supabase client for verification queries
  return { authenticated: true, user, supabase };
}

export async function GET(req) {
  try {
    // 1. Auth Check
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) {
      return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });
    }

    // ================================ 🛡️ SECURITY CHECK ================================
    // ACTION: Verify membership to ensure user isn't spoofing another pantry's billing
    const { data: membership, error: memberError } = await auth.supabase
      .from('pantry_members')
      .select('is_active')
      .eq('user_id', auth.user.id)
      .eq('pantry_id', pantryId)
      .single();

    if (memberError || !membership) {
      console.error(`🚫 Unauthorized Usage Access: ${auth.user.email} -> ${pantryId}`);
      return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
    }
    // ====================================================================================

    await connectDB();

    // 2. Parallel Data Fetching
    const [
      currentStockCount,
      distributionStats,
      clientCount
    ] = await Promise.all([
      // SOURCE 1: Inventory (Most Accurate: Real-time count of unique items)
      FoodItem.countDocuments({ pantryId }),
      
      // SOURCE 2: Distributions (Most Accurate: Aggregation of raw transaction logs)
      ClientDistribution.aggregate([
        { $match: { pantryId: pantryId } },
        { $group: { _id: null, totalVisits: { $sum: 1 }, totalItemsDistributed: { $sum: "$quantityDistributed" } } }
      ]),
      // SOURCE 3: Clients (Direct count of registered families)
      Client.countDocuments({ pantryId })
    ]);

    const distData = distributionStats[0] || { totalVisits: 0, totalItemsDistributed: 0 };

    // 3. Construct Response
    // Using parseFloat/toFixed to keep the "Value" currency-safe
    const response = {
      inventoryCount: currentStockCount,
      totalPeopleServed: distData.totalVisits,
      totalValue: parseFloat((distData.totalItemsDistributed * 1.96).toFixed(2)),
      // Renamed to match reality: This is a count of units, not weight in lbs.
      totalItemsDistributed: distData.totalItemsDistributed,
      
      billing: {
        totalSkus: currentStockCount, // Fixed: Uses actual inventory count instead of cache
        totalClients: clientCount
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ GET /api/dashboard/usage - Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}