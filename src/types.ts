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

export const CATEGORIES = [
  'Breaking News',
  'Live Updates',
  'Upcoming Events',
  'Match Recaps',
  'Player Profiles',
  'Features & Editorials',
  'Gear & Tech',
  'Tips & Techniques',
  'Classic Matches',
  'From the Archives',
  'Bulawayo Pool',
  'Harare Pool',
  'Rest of Zimbabwe Pool',
  'African Pool',
  'Zimbabwean Heyball',
  'African Heyball',
  'World Heyball',
  'Snooker',
  'Blackball',
  'Billiards',
  'Match Statistics',
  'Live Streams'
];
