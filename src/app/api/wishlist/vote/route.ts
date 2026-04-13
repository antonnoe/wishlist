import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { wishlist_id, user_id } = body;

  if (!wishlist_id || !user_id) {
    return NextResponse.json({ error: 'Missing wishlist_id or user_id' }, { status: 400 });
  }

  // Check if already voted
  const { data: existing } = await supabase
    .from('wishlist_votes')
    .select('id')
    .eq('wishlist_id', wishlist_id)
    .eq('user_id', user_id)
    .single();

  if (existing) {
    // Remove vote (toggle)
    await supabase
      .from('wishlist_votes')
      .delete()
      .eq('wishlist_id', wishlist_id)
      .eq('user_id', user_id);

    // Decrement counter
    await supabase
      .from('wishlist')
      .update({ upvotes: supabase.rpc ? undefined : 0 })
      .eq('id', wishlist_id);

    // Use raw SQL to decrement safely
    await supabase.rpc('decrement_upvotes', { item_id: wishlist_id });

    return NextResponse.json({ voted: false });
  } else {
    // Add vote
    await supabase
      .from('wishlist_votes')
      .insert({ wishlist_id, user_id });

    await supabase.rpc('increment_upvotes', { item_id: wishlist_id });

    return NextResponse.json({ voted: true });
  }
}
