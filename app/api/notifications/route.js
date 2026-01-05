import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem } from '@/lib/models/FoodItemModel';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    let alerts = [];

    // --- CHECK 1: SUPABASE LIMITS (Clients & Items) ---
    const { data: pantry, error: dbError } = await supabase
      .from('food_pantries')
      .select('max_clients_limit, total_families_created, max_items_limit, total_items_created, subscription_tier')
      .eq('pantry_id', pantryId)
      .single();

    if (!dbError && pantry) {
      // Client/Family Limit Check
      const clientLimit = pantry.max_clients_limit;
      const currentClients = pantry.total_families_created;
      
      // If within 90% of limit or exceeded
      if (currentClients >= clientLimit) {
        alerts.push({
          id: 'limit-clients-crit',
          type: 'critical',
          title: 'Client Limit Reached',
          message: `You have reached the limit of ${clientLimit} families. Upgrade to add more.`,
          action: 'billing'
        });
      } else if (currentClients >= clientLimit * 0.9) {
        alerts.push({
          id: 'limit-clients-warn',
          type: 'warning',
          title: 'Client Limit Near',
          message: `You are at ${currentClients}/${clientLimit} families.`,
          action: 'billing'
        });
      }

      // Item Limit Check (Only for Pilot/Free tier usually)
      if (pantry.subscription_tier === 'pilot') {
         const itemLimit = pantry.max_items_limit;
         const currentItems = pantry.total_items_created;

         if (currentItems >= itemLimit) {
            alerts.push({
                id: 'limit-items-crit',
                type: 'critical',
                title: 'Item Limit Reached',
                message: `You reached the ${itemLimit} item limit. Upgrade to Pro.`,
                action: 'billing'
            });
         }
      }
    }

    // --- CHECK 2: MONGODB (Expiring Goods) ---
    await connectDB();
    
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Find items expiring in the next 7 days that have quantity > 0
    const expiringItems = await FoodItem.find({
      pantryId: pantryId,
      quantity: { $gt: 0 },
      expirationDate: { 
        $gte: today, 
        $lte: sevenDaysFromNow 
      }
    }).select('name expirationDate').limit(5);

    if (expiringItems.length > 0) {
      alerts.push({
        id: 'expiry-alert',
        type: 'warning',
        title: 'Expiring Soon',
        message: `${expiringItems.length} items expire this week (e.g., ${expiringItems[0].name}).`,
        action: 'inventory'
      });
    }

    // Check for ALREADY Expired items
    const expiredItems = await FoodItem.countDocuments({
        pantryId: pantryId,
        quantity: { $gt: 0 },
        expirationDate: { $lt: today }
    });

    if (expiredItems > 0) {
        alerts.push({
            id: 'expired-crit',
            type: 'critical',
            title: 'Expired Stock',
            message: `${expiredItems} items in stock are past their expiration date.`,
            action: 'inventory'
        });
    }

    return NextResponse.json({ alerts });

  } catch (error) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}