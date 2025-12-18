import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem } from '@/lib/models/FoodItemModel';
import { Client } from '@/lib/models/ClientModel'; // Ensure this path is correct

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'inventory' or 'clients'
    const pantryId = req.headers.get('x-pantry-id');

    if (!pantryId) return NextResponse.json({ error: 'Pantry ID required' }, { status: 400 });

    // 1. AUTH & PERMISSION CHECK (Supabase)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check Subscription Tier
    const { data: pantry, error: pantryError } = await supabase
      .from('food_pantries')
      .select('subscription_tier')
      .eq('pantry_id', pantryId)
      .single();

    if (pantryError || !pantry) return NextResponse.json({ error: 'Pantry not found' }, { status: 404 });

    // Gatekeeping: Only Pro or Enterprise can export
    const allowedTiers = ['pro', 'pilot', 'enterprise'];
    if (!allowedTiers.includes(pantry.subscription_tier)) {
      return NextResponse.json({ error: 'Upgrade required to export data.' }, { status: 403 });
    }

    // 2. DATA FETCHING (MongoDB)
    await connectDB();
    let csvData = '';
    const filename = `${type}-${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'inventory') {
      const items = await FoodItem.find({ pantryId }).lean();
      
      const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Barcode', 'Location', 'Expiration', 'Notes'];
      const rows = items.map(item => [
        `"${item.name}"`,
        item.category,
        item.quantity,
        item.unit,
        item.barcode || '',
        `"${item.storageLocation || ''}"`,
        item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : '',
        `"${item.notes || ''}"`
      ]);
      
      csvData = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    } else if (type === 'clients') {
      // 👇 UPDATED CLIENT LOGIC MATCHING YOUR SCHEMA
      const clients = await Client.find({ pantryId }).lean();
      
      // Headers matching ClientSchema
      const headers = [
        'Client ID', 
        'First Name', 
        'Last Name', 
        'Family Size', 
        'Phone', 
        'Email', 
        'Address', 
        'Status', 
        'Last Visit',
        'Created At'
      ];

      const rows = clients.map(c => [
        `"${c.clientId}"`,           // Matches ClientSchema.clientId
        `"${c.firstName}"`,          // Matches ClientSchema.firstName
        `"${c.lastName || ''}"`,     // Matches ClientSchema.lastName
        c.familySize || 1,           // Matches ClientSchema.familySize
        `"${c.phone || ''}"`,        // Matches ClientSchema.phone
        `"${c.email || ''}"`,        // Matches ClientSchema.email
        `"${c.address || ''}"`,      // Matches ClientSchema.address
        c.isActive ? 'Active' : 'Inactive', // Derived from ClientSchema.isActive
        c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'Never', // Matches ClientSchema.lastVisit
        c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''       // Matches ClientSchema.createdAt
      ]);

      csvData = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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