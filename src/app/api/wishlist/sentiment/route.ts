import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

type Sentiment = 'positive' | 'neutral' | 'negative';

const NING_GATE_ENABLED = process.env.NEXT_PUBLIC_NING_GATE === 'true';

export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { wishlist_id, user_id, sentiment } = body as {
    wishlist_id?: string;
    user_id?: string;
    sentiment?: Sentiment;
  };

  if (!wishlist_id || !user_id || !sentiment) {
    return NextResponse.json(
      { error: 'Missing wishlist_id, user_id or sentiment' },
      { status: 400 }
    );
  }

  if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
    return NextResponse.json({ error: 'Invalid sentiment' }, { status: 400 });
  }

  // V1-gate: ondiepe server-side controle dat user_id de Ning-prefix
  // heeft. Stopt anonieme/script-kiddie API-aanroepen die met willekeurige
  // user_id's stemmen (de UI laat dat niet toe). Niet kogelvrij — een
  // techneut die op nederlanders.fr in dev-tools rommelt kan een
  // verzonnen "ning_jan_jansen" sturen. Voor échte enforcement is een
  // server-verified Ning-session of HMAC-handshake nodig (V2, niet
  // gekozen door Anton in deze fase).
  if (NING_GATE_ENABLED && !user_id.startsWith('ning_')) {
    return NextResponse.json(
      {
        error:
          'Reageren is voor leden van nederlanders.fr. Log in en probeer opnieuw.',
      },
      { status: 401 }
    );
  }

  // Smileys werken alleen op gebruikersideeën (track='idea').
  // Voor roadmap-items is er een aparte tevredenheidsmeting vanuit de tool zelf.
  const { data: target, error: targetError } = await supabase
    .from('wishlist')
    .select('track')
    .eq('id', wishlist_id)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ error: 'Item niet gevonden' }, { status: 404 });
  }
  if (target.track === 'roadmap') {
    return NextResponse.json(
      {
        error:
          'Smileys werken alleen op gebruikersideeën. Voor reacties op innovaties: zie het forum.',
      },
      { status: 400 }
    );
  }

  // Check if user already has a sentiment for this item
  const { data: existing, error: checkError } = await supabase
    .from('wishlist_sentiments')
    .select('id, sentiment')
    .eq('wishlist_id', wishlist_id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  // Case 1: Same sentiment clicked again → remove (toggle off)
  if (existing && existing.sentiment === sentiment) {
    const { error: deleteError } = await supabase
      .from('wishlist_sentiments')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    await supabase.rpc('decrement_sentiment', {
      item_id: wishlist_id,
      sentiment_type: sentiment,
    });

    return NextResponse.json({ sentiment: null });
  }

  // Case 2: Different sentiment → update + swap counters
  if (existing && existing.sentiment !== sentiment) {
    const { error: updateError } = await supabase
      .from('wishlist_sentiments')
      .update({ sentiment, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.rpc('decrement_sentiment', {
      item_id: wishlist_id,
      sentiment_type: existing.sentiment,
    });
    await supabase.rpc('increment_sentiment', {
      item_id: wishlist_id,
      sentiment_type: sentiment,
    });

    return NextResponse.json({ sentiment });
  }

  // Case 3: No existing → insert + increment
  const { error: insertError } = await supabase
    .from('wishlist_sentiments')
    .insert({ wishlist_id, user_id, sentiment });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.rpc('increment_sentiment', {
    item_id: wishlist_id,
    sentiment_type: sentiment,
  });

  return NextResponse.json({ sentiment });
}
