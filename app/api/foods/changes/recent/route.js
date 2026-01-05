import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { ChangeLog } from '@/lib/models/ChangeLogModel';

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

  // ✅ ACTION: Verify user membership before showing history
  const { data: membership, error: memberError } = await supabase
    .from('pantry_members')
    .select('is_active')
    .eq('user_id', user.id)
    .eq('pantry_id', pantryId)
    .single();

  if (memberError || !membership) {
    return { valid: false, status: 403, message: 'Access Denied: Not a member of this pantry' };
  }

  return { valid: true, pantryId };
}

// ----------------------------------------------------------------------------------
// --- GET: Fetch Recent Activity ---
// ----------------------------------------------------------------------------------
export async function GET(req) {
  try {
    // 1. Run Security Verification
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    await connectDB();

    // 2. Fetch Data (Filtered by verified pantryId)
    const changes = await ChangeLog.find({ pantryId: auth.pantryId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean(); // Optimized for read-speed

    return NextResponse.json(changes);

  } catch (error) {
    console.error('❌ GET /api/foods/changes/recent - Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}