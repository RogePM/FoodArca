import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem } from '@/lib/models/FoodItemModel';
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

    // 🛡️ SECURITY CHECK: Membership Verification
    const { data: membership, error: memberError } = await auth.supabase
      .from('pantry_members')
      .select('is_active')
      .eq('user_id', auth.user.id)
      .eq('pantry_id', pantryId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
    }

    await connectDB();

    // 2. Parallel Data Fetching
    const [
      inventoryStats,
      distributionStats,
      clientCount
    ] = await Promise.all([
      // SOURCE 1: Inventory Aggregation (Sum Quantity AND Count SKUs)
      FoodItem.aggregate([
        { $match: { pantryId: pantryId } },
        { 
          $group: { 
            _id: null, 
            totalQuantity: { $sum: "$quantity" }, // ✅ Sums the actual cans/units
            totalSkus: { $sum: 1 }                // ✅ Counts unique database rows
          } 
        }
      ]),
      
      // SOURCE 2: Distributions Aggregation
      // Note: Ensure your ClientDistribution model has 'quantityDistributed' field
      ClientDistribution.aggregate([
        { $match: { pantryId: pantryId } },
        { 
          $group: { 
            _id: null, 
            totalVisits: { $sum: 1 }, 
            totalItemsDistributed: { $sum: "$quantityDistributed" } 
          } 
        }
      ]),

      // SOURCE 3: Clients Count
      Client.countDocuments({ pantryId })
    ]);

    // Unpack Aggregation Results (Handle empty arrays if no data exists)
    const invData = inventoryStats[0] || { totalQuantity: 0, totalSkus: 0 };
    const distData = distributionStats[0] || { totalVisits: 0, totalItemsDistributed: 0 };

    // 3. Construct Response
    const response = {
      // ✅ DASHBOARD STAT: Shows "2,500" items (Volume) instead of "50" items (Rows)
      inventoryCount: invData.totalQuantity, 
      
      totalPeopleServed: distData.totalVisits,
      
      // Value calculation ($1.96 avg value per item)
      totalValue: parseFloat((distData.totalItemsDistributed * 1.96).toFixed(2)),
      
      totalItemsDistributed: distData.totalItemsDistributed,
      
      billing: {
        totalSkus: invData.totalSkus, // Used for Plan Limits (e.g. 500 item limit)
        totalClients: clientCount
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ GET /api/pantry-stats - Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}