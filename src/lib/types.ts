export type Status = 'idee' | 'gepland' | 'bezig' | 'live' | 'verworpen';
export type Visibility = 'public' | 'private';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export type Track = 'roadmap' | 'idea';
export type RoadmapPhase =
  | 'concept'
  | 'planning'
  | 'uitvoering'
  | 'oplevering'
  | 'evaluatie';
export type UserGroup = 'nieuwkomer' | 'expat' | 'ondernemer' | 'twijfelaar';

export interface PlatformItem {
  id: string;
  parent_id: string | null;
  label: string;
  sort_order: number;
  visible: boolean;
}

export interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  platform: string;
  status: Status;
  visibility: Visibility;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  admin_note?: string | null;
  url?: string | null;
  user_sentiment?: Sentiment | null;

  // V2 — track-split
  track: Track;
  roadmap_phase?: RoadmapPhase | null;
  functional_goal?: string | null;
  user_groups?: UserGroup[] | null;
  live_satisfaction_positive?: number;
  live_satisfaction_neutral?: number;
  live_satisfaction_negative?: number;
  forum_url?: string | null;
}

export const STATUS_LABELS: Record<Status, string> = {
  idee: '💡 Idee',
  gepland: '📋 Gepland',
  bezig: '🔨 Bezig',
  live: '✅ Live',
  verworpen: '❌ Verworpen',
};

export const STATUS_COLORS: Record<Status, string> = {
  idee: 'bg-gray-100 text-gray-700',
  gepland: 'bg-blue-50 text-blue-700',
  bezig: 'bg-amber-50 text-amber-700',
  live: 'bg-green-50 text-green-700',
  verworpen: 'bg-red-50 text-red-700',
};

export const SENTIMENT_EMOJI: Record<Sentiment, string> = {
  positive: '😀',
  neutral: '😐',
  negative: '🙁',
};

export const ROADMAP_PHASES: RoadmapPhase[] = [
  'concept',
  'planning',
  'uitvoering',
  'oplevering',
  'evaluatie',
];

export const ROADMAP_PHASE_LABELS: Record<RoadmapPhase, string> = {
  concept: 'Concept',
  planning: 'Planning',
  uitvoering: 'Uitvoering',
  oplevering: 'Oplevering',
  evaluatie: 'Evaluatie',
};

export const ROADMAP_PHASE_DESCRIPTIONS: Record<RoadmapPhase, string> = {
  concept: 'Idee verkennen, behoefte toetsen.',
  planning: 'Aanpak bepalen, prioriteit en planning.',
  uitvoering: 'In ontwikkeling.',
  oplevering: 'Beschikbaar voor gebruik, monitoring loopt.',
  evaluatie: 'In gebruik, ervaringen worden gemeten.',
};

export const USER_GROUPS: UserGroup[] = [
  'nieuwkomer',
  'expat',
  'ondernemer',
  'twijfelaar',
];

export const USER_GROUP_LABELS: Record<UserGroup, string> = {
  nieuwkomer: 'Nieuwkomer',
  expat: 'Expat',
  ondernemer: 'Ondernemer',
  twijfelaar: 'Twijfelaar',
};

export const USER_GROUP_DESCRIPTIONS: Record<UserGroup, string> = {
  nieuwkomer: 'Wie kort in Frankrijk is of net aankomt.',
  expat: 'Wie langer in Frankrijk woont en is gevestigd.',
  ondernemer: 'Wie in Frankrijk een onderneming heeft of opzet.',
  twijfelaar: 'Wie nadenkt over een verhuizing naar Frankrijk.',
};
