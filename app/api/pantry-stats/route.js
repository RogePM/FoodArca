import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem, BarcodeCache } from '@/lib/models/FoodItemModel'; // Import BarcodeCache
import { ClientDistribution } from '@/lib/models/ClientDistributionModel';
import { Client } from '@/lib/models/ClientModel'; 

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
    return { authenticated: false, user: null, error: 'Unauthorized' };
  }

  return { authenticated: true, user, error: null };
}

export async function GET(req) {
  try {
    // ✅ AUTH CHECK
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ message: auth.error }, { status: 401 });
    }

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) {
      return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });
    }

    await connectDB();

    // 🚀 RUN ALL COUNTS IN PARALLEL (Fastest method)
    const [
        currentStockCount, 
        distributionStats, 
        billingSkuCount, 
        billingClientCount
    ] = await Promise.all([
        // 1. Dashboard: Items currently on shelf (FoodItem)
        FoodItem.countDocuments({ pantryId }),
        
        // 2. Dashboard: Impact Stats
        ClientDistribution.aggregate([
            { $match: { pantryId: pantryId } },
            { $group: { _id: null, totalVisits: { $sum: 1 }, totalItemsDistributed: { $sum: "$quantityDistributed" } } }
        ]),

        // 3. 💰 Billing: Unique SKUs (BarcodeCache)
        // This is the number that counts towards the 50/300/2000 limit
        BarcodeCache.countDocuments({ pantryId }),

        // 4. 💰 Billing: Registered Clients (Client Profile Limit)
        // Safe check in case you haven't created the Client model yet
        Client ? Client.countDocuments({ pantryId }) : 0
    ]);

    const distData = distributionStats[0] || { totalVisits: 0, totalItemsDistributed: 0 };

    // --- CONSTRUCT RESPONSE ---
    const response = {
      // Standard Dashboard Data
      inventoryCount: currentStockCount,
      totalPeopleServed: distData.totalVisits,
      totalValue: distData.totalItemsDistributed * 1.96, // Estimated value
      totalWeight: distData.totalItemsDistributed,
      
      // New Billing Data
      billing: {
          totalSkus: billingSkuCount,
          totalClients: billingClientCount
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ GET /api/dashboard - Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}