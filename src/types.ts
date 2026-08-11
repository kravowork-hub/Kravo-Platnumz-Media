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
