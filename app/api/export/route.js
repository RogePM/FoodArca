import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem } from '@/lib/models/FoodItemModel';
import { Client } from '@/lib/models/ClientModel';

// --- SHARED SECURITY HELPER ---
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

  // Verify membership
  const { data: membership, error: memberError } = await supabase
    .from('pantry_members')
    .select('is_active, role')
    .eq('user_id', user.id)
    .eq('pantry_id', pantryId)
    .single();

  if (memberError || !membership) {
    return { valid: false, status: 403, message: 'Access Denied: Not a member' };
  }

  // Fetch subscription tier
  const { data: pantry, error: pantryError } = await supabase
    .from('food_pantries')
    .select('subscription_tier')
    .eq('pantry_id', pantryId)
    .single();

  if (pantryError || !pantry) return { valid: false, status: 404, message: 'Pantry configuration not found' };

  return {
    valid: true,
    user,
    pantryId,
    tier: pantry.subscription_tier
  };
}

export async function GET(req) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ error: auth.message }, { status: auth.status });

    // 1. GATEKEEPING
    const allowedTiers = ['pro', 'pilot', 'enterprise'];
    if (!allowedTiers.includes(auth.tier)) {
      return NextResponse.json({ error: 'Upgrade required to export data.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'inventory' or 'clients'

    await connectDB();
    let csvData = '';
    const filename = `${type}-${new Date().toISOString().split('T')[0]}.csv`;

    // 2. DATA FETCHING
    if (type === 'inventory') {
      const items = await FoodItem.find({ pantryId: auth.pantryId }).lean();

      // ✅ UPDATED HEADERS to match your new model
      const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Weight/Unit', 'Barcode', 'Location', 'Expiration', 'Notes'];

      const rows = items.map(item => [
        `"${item.name.replace(/"/g, '""')}"`, // Escape quotes in names
        item.category,
        item.quantity,
        item.unit,
        item.weightPerUnit || 0, // ✅ NEW FIELD
        item.barcode ? `"${item.barcode}"` : '', // Force string for barcodes
        `"${item.storageLocation || ''}"`,
        item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : '',
        `"${(item.notes || '').replace(/"/g, '""')}"` // ✅ NEW FIELD (Escaped)
      ]);

      csvData = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    } else if (type === 'clients') {
      const clients = await Client.find({ pantryId: auth.pantryId }).lean();

      // ✅ FIX: Added Kids, Adults, Seniors to the Header
      const headers = [
        'Client ID', 'First Name', 'Last Name',
        'Family Size', 'Children', 'Adults', 'Seniors', // <--- NEW FIELDS
        'Phone', 'Email', 'Address', 'Status', 'Last Visit'
      ];

      const rows = clients.map(c => [
        `"${c.clientId}"`,
        `"${c.firstName}"`,
        `"${c.lastName || ''}"`,
        c.familySize || 1,
        c.childrenCount || 0, // <--- MAP NEW FIELD
        c.adultCount || 1,    // <--- MAP NEW FIELD
        c.seniorCount || 0,   // <--- MAP NEW FIELD
        `"${c.phone || ''}"`,
        `"${c.email || ''}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        c.isActive ? 'Active' : 'Inactive',
        c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'Never'
      ]);

      csvData = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    } else {
      return NextResponse.json({ error: 'Invalid export type. Use ?type=inventory or ?type=clients' }, { status: 400 });
    }

    // 3. RETURN CSV FILE
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}