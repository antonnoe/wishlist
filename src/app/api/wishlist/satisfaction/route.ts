import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

function isAuthorized(request: NextRequest) {
  // Mutatie van productie-tellers: alleen admin-key. Claude-credentials
  // worden hier bewust niet geaccepteerd; voor automatische tool-ingest
  // komt later een dedicated secret.
  const adminKey = request.headers.get('x-admin-key');
  return adminKey === process.env.ADMIN_KEY;
}

// POST /api/wishlist/satisfaction
// Body: { id, positive?, neutral?, negative? } — absolute counts
// Voorlopig admin-only (handmatige invoer). Later vervangen door API
// vanuit de tools zelf.
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await request.json();
  const { id, positive, neutral, negative } = body as {
    id?: string;
    positive?: number;
    neutral?: number;
    negative?: number;
  };

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const updates: Record<string, number> = {};
  if (Number.isFinite(positive) && (positive as number) >= 0) {
    updates.live_satisfaction_positive = Math.floor(positive as number);
  }
  if (Number.isFinite(neutral) && (neutral as number) >= 0) {
    updates.live_satisfaction_neutral = Math.floor(neutral as number);
  }
  if (Number.isFinite(negative) && (negative as number) >= 0) {
    updates.live_satisfaction_negative = Math.floor(negative as number);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Geen geldige tellers opgegeven' }, { status: 400 });
  }

  // Alleen op roadmap-items van toepassing
  const { data: target, error: targetError } = await supabase
    .from('wishlist')
    .select('track')
    .eq('id', id)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ error: 'Item niet gevonden' }, { status: 404 });
  }
  if (target.track !== 'roadmap') {
    return NextResponse.json(
      { error: 'Tevredenheidsmeting is alleen van toepassing op roadmap-items.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('wishlist')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
