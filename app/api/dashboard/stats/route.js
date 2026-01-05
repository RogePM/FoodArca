import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem } from '@/lib/models/FoodItemModel';
import { ClientDistribution } from '@/lib/models/ClientDistributionModel';

// --- AUTHENTICATION HELPER ---
async function authenticateRequest(req) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { authenticated: false, user: null, supabase: null, error: 'Unauthorized' };
  }

  // ✅ Return supabase client for membership verification
  return { authenticated: true, user, supabase, error: null };
}

export async function GET(req) {
  try {
    // 1. Auth Check
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ message: auth.error }, { status: 401 });
    }

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) {
      return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });
    }

    // ================================ 🛡️ SECURITY CHECK ================================
    // ACTION: Verify user membership to prevent header manipulation
    const { data: membership, error: memberError } = await auth.supabase
      .from('pantry_members')
      .select('is_active')
      .eq('user_id', auth.user.id)
      .eq('pantry_id', pantryId)
      .single();

    if (memberError || !membership) {
      console.error(`🚫 Unauthorized Dashboard Access: User ${auth.user.email} -> Pantry ${pantryId}`);
      return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
    }
    // ====================================================================================

    await connectDB();

    // 2. Optimized Data Aggregation
    // Run inventory count and distribution stats in parallel for speed
    const [totalItemsCount, distributionStats] = await Promise.all([
      FoodItem.countDocuments({ pantryId }),
      ClientDistribution.aggregate([
        { $match: { pantryId: pantryId } },
        {
          $group: {
            _id: null,
            totalVisits: { $sum: 1 },
            totalItemsDistributed: { $sum: "$quantityDistributed" }
          }
        }
      ])
    ]);

    const distData = distributionStats[0] || { totalVisits: 0, totalItemsDistributed: 0 };

    // 3. Logic Cleanup: Ensure math matches your centralized logging (e.g., $1.96 vs $2.50)
    // Note: If you want these to match the logger exactly, we should eventually pull 
    // these constants from a config file.
    const estimatedWeight = distData.totalItemsDistributed; 
    const estimatedValue = distData.totalItemsDistributed * 1.96;

    const response = {
      inventoryCount: totalItemsCount,
      totalPeopleServed: distData.totalVisits,
      totalValue: parseFloat(estimatedValue.toFixed(2)),
      totalWeight: parseFloat(estimatedWeight.toFixed(2))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ GET /api/dashboard - Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}