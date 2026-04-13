export type Platform = 'IF' | 'CC' | 'DF' | 'FK' | 'BH' | 'NLFR' | 'EP' | 'overig';
export type Status = 'idee' | 'gepland' | 'bezig' | 'live' | 'verworpen';
export type Visibility = 'public' | 'private';

export interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  platform: Platform;
  status: Status;
  visibility: Visibility;
  upvotes: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  user_has_voted?: boolean;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  IF: 'Infofrankrijk',
  CC: 'Café Claude',
  DF: 'DossierFrankrijk',
  FK: 'Financieel Kompas',
  BH: 'Correspondentie-assistent',
  NLFR: 'Nederlanders.fr',
  EP: 'EnergiePortaal',
  overig: 'Overig',
};

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
