import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = getServiceClient();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Count public items created this month
  const { count: monthCount, error: e1 } = await supabase
    .from('wishlist')
    .select('*', { count: 'exact', head: true })
    .eq('visibility', 'public')
    .gte('created_at', firstOfMonth);

  // Count private items (pending moderation)
  const { count: pendingCount, error: e2 } = await supabase
    .from('wishlist')
    .select('*', { count: 'exact', head: true })
    .eq('visibility', 'private')
    .eq('status', 'idee');

  if (e1 || e2) {
    return NextResponse.json({ error: (e1 || e2)?.message }, { status: 500 });
  }

  return NextResponse.json({
    month: monthCount || 0,
    pending: pendingCount || 0,
    period: now.toISOString().slice(0, 7),
  });
}
