import { NextResponse } from 'next/server';
import { handle, getContext, rpc } from '@/lib/server/inventory-api';

// POST: undo one stock change (writes the opposite row). Own entries within 24 h; staff any.
export const POST = handle(async (req, { params }) => {
  const { supabase } = await getContext(req);
  const { id } = await params;
  const result = await rpc(supabase, 'undo_entry', { p_log_id: id });
  return NextResponse.json({ message: 'Undone', undoId: result?.undo_id });
});
