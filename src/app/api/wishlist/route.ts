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

  const id = searchParams.get('id');
  const platform = searchParams.get('platform');
  const status = searchParams.get('status');
  const visibility = searchParams.get('visibility');
  const userId = searchParams.get('user_id');
  const track = searchParams.get('track');

  let query = supabase
    .from('wishlist')
    .select('*')
    .order('created_at', { ascending: false });

  if (!authorized) {
    query = query.eq('visibility', 'public');
  } else if (visibility) {
    query = query.eq('visibility', visibility);
  }

  if (id) query = query.eq('id', id);
  if (platform) query = query.eq('platform', platform);
  if (status) query = query.eq('status', status);
  if (track === 'roadmap' || track === 'idea') query = query.eq('track', track);

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
    body.track = 'idea';
    body.roadmap_phase = null;
    body.functional_goal = null;
    body.user_groups = null;
  }

  // Server-side URL-validatie (alleen eigen domeinen toegestaan voor niet-admins)
  const ALLOWED_DOMAINS = [
    'infofrankrijk.com',
    'nedergids.nl',
    'nederlanders.fr',
    'cafeclaude.fr',
    'dossierfrankrijk.nl',
  ];

  let sanitizedUrl: string | null = null;
  if (body.url) {
    try {
      const parsed = new URL(body.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
      }
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      const isAllowed = ALLOWED_DOMAINS.some(
        (d) => host === d || host.endsWith('.' + d)
      );
      if (!authorized && !isAllowed) {
        return NextResponse.json(
          { error: 'URL-domein niet toegestaan' },
          { status: 400 }
        );
      }
      sanitizedUrl = parsed.toString();
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  }

  const VALID_TRACKS = ['roadmap', 'idea'] as const;
  const VALID_PHASES = ['concept','planning','uitvoering','oplevering','evaluatie'] as const;
  const VALID_GROUPS = ['nieuwkomer','expat','ondernemer','twijfelaar'] as const;

  const track = VALID_TRACKS.includes(body.track) ? body.track : 'idea';
  const roadmap_phase = track === 'roadmap' && VALID_PHASES.includes(body.roadmap_phase)
    ? body.roadmap_phase
    : null;
  const user_groups = Array.isArray(body.user_groups)
    ? body.user_groups.filter((g: string) => VALID_GROUPS.includes(g as typeof VALID_GROUPS[number]))
    : null;

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
      url: sanitizedUrl,
      track,
      roadmap_phase,
      functional_goal: track === 'roadmap' ? (body.functional_goal || null) : null,
      user_groups: track === 'roadmap' ? user_groups : null,
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

  const VALID_TRACKS = ['roadmap', 'idea'];
  const VALID_PHASES = ['concept','planning','uitvoering','oplevering','evaluatie'];
  const VALID_GROUPS = ['nieuwkomer','expat','ondernemer','twijfelaar'];

  if (updates.track !== undefined && !VALID_TRACKS.includes(updates.track)) {
    return NextResponse.json({ error: 'Invalid track' }, { status: 400 });
  }
  if (updates.roadmap_phase != null && !VALID_PHASES.includes(updates.roadmap_phase)) {
    return NextResponse.json({ error: 'Invalid roadmap_phase' }, { status: 400 });
  }
  if (updates.user_groups !== undefined && updates.user_groups !== null) {
    if (!Array.isArray(updates.user_groups)) {
      return NextResponse.json({ error: 'user_groups must be an array' }, { status: 400 });
    }
    updates.user_groups = updates.user_groups.filter((g: string) => VALID_GROUPS.includes(g));
  }

  // Bij overgang naar track='idea' moeten roadmap-velden leeg, anders
  // krijg je inconsistente rijen (idea-item met fase/doel/doelgroepen).
  if (updates.track === 'idea') {
    updates.roadmap_phase = null;
    updates.functional_goal = null;
    updates.user_groups = null;
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
