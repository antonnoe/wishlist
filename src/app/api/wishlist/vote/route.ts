import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { wishlist_id, user_id } = body;

  if (!wishlist_id || !user_id) {
    return NextResponse.json({ error: 'Missing wishlist_id or user_id' }, { status: 400 });
  }

  // Check if already voted (maybeSingle returns null instead of error)
  const { data: existing, error: checkError } = await supabase
    .from('wishlist_votes')
    .select('id')
    .eq('wishlist_id', wishlist_id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  if (existing) {
    // Remove vote (toggle off)
    const { error: deleteError } = await supabase
      .from('wishlist_votes')
      .delete()
      .eq('wishlist_id', wishlist_id)
      .eq('user_id', user_id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    await supabase.rpc('decrement_upvotes', { item_id: wishlist_id });
    return NextResponse.json({ voted: false });
  } else {
    // Add vote
    const { error: insertError } = await supabase
      .from('wishlist_votes')
      .insert({ wishlist_id, user_id });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabase.rpc('increment_upvotes', { item_id: wishlist_id });
    return NextResponse.json({ voted: true });
  }
}
