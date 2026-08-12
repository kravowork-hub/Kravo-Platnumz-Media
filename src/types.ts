export interface Article {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  authorId: string;
  authorName: string;
  status: 'draft' | 'published' | 'scheduled';
  publishDate: string;
  categories: string[];
  tags: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentMatch {
  id: string;
  player1: string;
  player2: string;
  score1: string;
  score2: string;
  status: 'live' | 'completed' | 'upcoming';
  matchInfo: string; // e.g. "Finals", "8:00 PM", "Frame 4"
}

export interface LiveScoreData {
  tournamentName: string;
  matches: TournamentMatch[];
  updatedAt: string;
}

export const CATEGORIES = [
  'Pool',
  'Snooker',
  'Heyball',
  'Blackball',
  'Tournament Updates',
  'Player Profiles',
  'Match Statistics',
  'Live Streams'
];
