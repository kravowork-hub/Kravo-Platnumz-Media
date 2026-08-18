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
  isHero?: boolean;
  publishDate: string;
  categories: string[];
  tags: string[];
  views: number;
  reactions?: { [key: string]: number };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id?: string;
  articleId: string;
  articleSlug: string;
  name: string;
  message: string;
  approved: boolean;
  createdAt: string;
}

export interface TournamentMatch {
  id: string;
  player1: string;
  player1Flag?: string;
  player2: string;
  player2Flag?: string;
  score1: string;
  score2: string;
  status: 'live' | 'completed' | 'upcoming';
  matchInfo: string; // e.g. "Finals", "8:00 PM", "Table 9"
  category?: string; // e.g. "Stage 1", "Women's Division"
}

export interface TournamentData {
  id: string;
  name: string;
  status: 'active' | 'ended';
  matches: TournamentMatch[];
  updatedAt: string;
}

export interface LiveScoreData {
  tournaments: TournamentData[];
  updatedAt: string;
}

export interface RankingPlayer {
  id: string;
  rank: number;
  name: string;
  flag?: string; // ISO 3166-1 alpha-2 country code
  points?: string;
  club?: string;
}

export interface Discipline {
  id: string;
  name: string; // e.g. "9-Ball", "Snooker", "Heyball"
  rankings: RankingPlayer[];
  updatedAt: string;
}

export interface RankingsData {
  disciplines: Discipline[];
  updatedAt: string;
}

export const CATEGORIES = [
  'Upcoming Events',
  'Match Recaps',
  'Live Streams',
  'Features & Editorials',
  'Cuesport Types'
];
