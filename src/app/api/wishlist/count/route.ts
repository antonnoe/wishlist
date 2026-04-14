import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = getServiceClient();

  // Count public items created this month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from('wishlist')
    .select('*', { count: 'exact', head: true })
    .eq('visibility', 'public')
    .gte('created_at', firstOfMonth);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // CORS headers for cross-origin embed
  return NextResponse.json(
    { count: count || 0, month: now.toISOString().slice(0, 7) },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    }
  );
}
