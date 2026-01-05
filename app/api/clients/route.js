import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { Client } from '@/lib/models/ClientModel';
import { logChange } from '@/lib/logger'; // Don't forget to import this if you use it!

// --- HELPER: Human Readable Time ---
function getTimeAgo(date) {
  if (!date) return 'Never';
  
  const now = new Date();
  const visitDate = new Date(date);
  const diffInMs = now - visitDate;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 30) return `${diffInDays} days ago`;
  
  const months = Math.floor(diffInDays / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

// --- SHARED SECURITY HELPER ---
async function authenticateAndVerify(req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { valid: false, status: 401, message: 'Unauthorized', supabase }; // Return supabase client for checks

  const pantryId = req.headers.get('x-pantry-id');
  if (!pantryId) return { valid: false, status: 400, message: 'Pantry ID required', supabase };

  const { data: membership, error: memberError } = await supabase
    .from('pantry_members')
    .select('is_active, role')
    .eq('user_id', user.id)
    .eq('pantry_id', pantryId)
    .single();

  if (memberError || !membership) {
    return { valid: false, status: 403, message: 'Access Denied', supabase };
  }

  return { valid: true, user, pantryId, isActive: membership.is_active, supabase };
}

// --- GET: List Clients ---
export async function GET(req) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ message: auth.message }, { status: auth.status });

    await connectDB();
    
    // Sort by last visit so the most recent people are at the top
    const clients = await Client.find({ pantryId: auth.pantryId })
      .sort({ lastVisit: -1 })
      .select('firstName lastName clientId familySize childrenCount adultCount seniorCount lastVisit address') 
      .limit(100)
      .lean(); 

    // 🔥 ENRICH DATA: Calculate the "Time Ago" string for each client
    const enrichedClients = clients.map(client => ({
      ...client,
      lastVisitPeriod: getTimeAgo(client.lastVisit)
    }));

    return NextResponse.json({ count: enrichedClients.length, data: enrichedClients });
  } catch (error) {
    console.error("GET Clients Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------------
// --- POST: Create New Client (WITH LIMIT CHECK) ---
// ----------------------------------------------------------------------------------
export async function POST(req) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ message: auth.message }, { status: auth.status });

    // Check for Read-Only status
    if (!auth.isActive) {
      return NextResponse.json({ message: 'Read-only account. Cannot create clients.' }, { status: 403 });
    }

    // ---------------------------------------------------------
    // 🚨 GATEKEEPER START: CHECK FAMILY LIMITS 🚨
    // ---------------------------------------------------------
    // Fetch pantry limit settings from Supabase
    const { data: pantrySettings, error: pantryError } = await auth.supabase
        .from('food_pantries')
        .select('subscription_tier, total_families_created, max_clients_limit')
        .eq('pantry_id', auth.pantryId)
        .single();

    if (pantryError || !pantrySettings) {
        return NextResponse.json({ message: 'Could not verify pantry limits' }, { status: 500 });
    }

    // Check Pilot Limits logic
    if (pantrySettings.subscription_tier === 'pilot') {
        const limit = pantrySettings.max_clients_limit || 100; // Default limit
        
        // Critical Check: Have they created too many families historically?
        if (pantrySettings.total_families_created >= limit) {
            return NextResponse.json({ 
                error: 'LIMIT_REACHED', 
                message: `Client Limit Reached (${limit} families). Please upgrade.` 
            }, { status: 403 });
        }
    }
    // ---------------------------------------------------------
    // 🚨 GATEKEEPER END 🚨
    // ---------------------------------------------------------

    const data = await req.json();
    await connectDB();

    const finalClientId = data.clientId || `MANUAL-${Date.now().toString().slice(-6)}`;

    // Create in MongoDB
    const newClient = await Client.create({
      ...data,
      pantryId: auth.pantryId,
      clientId: finalClientId,
      lastVisit: new Date(),
    });

    // ---------------------------------------------------------
    // 💰 SPEND TOKEN: INCREMENT COUNTER 💰
    // ---------------------------------------------------------
    if (newClient) {
        // Increment the Supabase counter for families
        const { error: rpcError } = await auth.supabase.rpc('increment_pantry_usage', {
            p_pantry_id: auth.pantryId,
            p_resource_type: 'family' 
        });
        
        if (rpcError) {
            console.error("Failed to increment family counter:", rpcError);
        }
    }

    // Optional: Log the creation
    // await logChange('created_client', newClient, {}, auth.pantryId); 

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ message: 'Client ID already exists' }, { status: 400 });
    }
    console.error("POST Client Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// --- PUT: Update Client Profile ---
export async function PUT(req) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ message: auth.message }, { status: auth.status });
    if (!auth.isActive) return NextResponse.json({ message: 'Read-only account' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const data = await req.json();

    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    // 🛡️ SECURITY & LOGIC: Auto-calculate Family Size on the Server
    if (
      data.childrenCount !== undefined || 
      data.adultCount !== undefined || 
      data.seniorCount !== undefined
    ) {
      const kids = Number(data.childrenCount) || 0;
      const adults = Number(data.adultCount) || 0;
      const seniors = Number(data.seniorCount) || 0;
      
      const calculatedTotal = kids + adults + seniors;
      data.familySize = calculatedTotal > 0 ? calculatedTotal : 1;
      
      data.childrenCount = kids;
      data.adultCount = adults;
      data.seniorCount = seniors;
    }

    await connectDB();

    const updatedClient = await Client.findOneAndUpdate(
      { _id: id, pantryId: auth.pantryId },
      { $set: data },
      { new: true }
    );

    if (!updatedClient) return NextResponse.json({ message: 'Client not found' }, { status: 404 });

    return NextResponse.json({ message: 'Updated', data: updatedClient });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ message: 'Update Failed' }, { status: 500 });
  }
}

// --- DELETE: Remove Client ---
export async function DELETE(req) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ message: auth.message }, { status: auth.status });

    if (!auth.isActive) return NextResponse.json({ message: 'Read-only account' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    await connectDB();
    const result = await Client.findOneAndDelete({ _id: id, pantryId: auth.pantryId });

    if (!result) return NextResponse.json({ message: 'Client not found' }, { status: 404 });

    // Note: Deleting a client does NOT decrement the total_families_created counter in Supabase.
    // This is intentional to prevent abusing free trials.

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Delete Failed' }, { status: 500 });
  }
}