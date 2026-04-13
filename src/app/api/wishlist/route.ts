import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  
  const platform = searchParams.get('platform');
  const status = searchParams.get('status');
  const visibility = searchParams.get('visibility') || 'public';

  let query = supabase
    .from('wishlist')
    .select('*')
    .eq('visibility', visibility)
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false });

  if (platform) query = query.eq('platform', platform);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();

  // Check for admin key for private items
  const adminKey = request.headers.get('x-admin-key');
  const isAdmin = adminKey === process.env.ADMIN_KEY;

  if (body.visibility === 'private' && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
