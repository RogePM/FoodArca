import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { Client } from '@/lib/models/ClientModel';

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

  const { data: membership, error: memberError } = await supabase
    .from('pantry_members')
    .select('is_active')
    .eq('user_id', user.id)
    .eq('pantry_id', pantryId)
    .single();

  if (memberError || !membership) return { valid: false, status: 403, message: 'Access Denied' };

  return { valid: true, pantryId };
}

export async function GET(req) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ message: auth.message }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query || query.length < 2) return NextResponse.json({ data: [] });

    await connectDB();

    const clients = await Client.find({
      pantryId: auth.pantryId,
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { clientId: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(8)
    .select('firstName lastName clientId familySize childrenCount adultCount seniorCount lastVisit address')
    .lean();

    // 🔥 ENRICH DATA: Add the "Time Ago" string
    const enrichedClients = clients.map(client => ({
      ...client,
      lastVisitPeriod: getTimeAgo(client.lastVisit)
    }));

    return NextResponse.json({ data: enrichedClients });

  } catch (error) {
    console.error("❌ Client Search Error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}