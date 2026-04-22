import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

function isAdmin(request: NextRequest) {
  const key = request.headers.get('x-admin-key');
  return key === process.env.ADMIN_KEY;
}

function isClaude(request: NextRequest) {
  const key = request.headers.get('x-claude-key');
  return key === process.env.CLAUDE_API_KEY;
}

function isAuthorized(request: NextRequest) {
  return isAdmin(request) || isClaude(request);
}

export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const authorized = isAuthorized(request);

  const platform = searchParams.get('platform');
  const status = searchParams.get('status');
  const visibility = searchParams.get('visibility');
  const userId = searchParams.get('user_id');

  let query = supabase
    .from('wishlist')
    .select('*')
    .order('created_at', { ascending: false });

  if (!authorized) {
    query = query.eq('visibility', 'public');
  } else if (visibility) {
    query = query.eq('visibility', visibility);
  }

  if (platform) query = query.eq('platform', platform);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Merge user's sentiments into the items when user_id is provided
  if (userId && data && data.length > 0) {
    const { data: sentiments } = await supabase
      .from('wishlist_sentiments')
      .select('wishlist_id, sentiment')
      .eq('user_id', userId)
      .in('wishlist_id', data.map((item: { id: string }) => item.id));

    const sentimentMap = new Map<string, string>();
    (sentiments || []).forEach((s: { wishlist_id: string; sentiment: string }) => {
      sentimentMap.set(s.wishlist_id, s.sentiment);
    });

    const enriched = data.map((item: { id: string }) => ({
      ...item,
      user_sentiment: sentimentMap.get(item.id) || null,
    }));

    return NextResponse.json(enriched);
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const authorized = isAuthorized(request);

  if (!authorized) {
    body.status = 'idee';
    body.visibility = 'private';
  }

  const { data, error } = await supabase
    .from('wishlist')
    .insert({
      title: body.title,
      description: body.description || null,
      platform: body.platform || 'overig',
      status: body.status || 'idee',
      visibility: body.visibility || 'public',
      created_by: body.created_by || 'anonymous',
      admin_note: body.admin_note || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
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

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabase.from('wishlist').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
