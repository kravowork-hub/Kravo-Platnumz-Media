import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article, LiveScoreData } from '../types';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PlayCircle, Bell, Circle } from 'lucide-react';
import { GridSkeleton, Skeleton } from '../components/Skeleton';

export function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveScores, setLiveScores] = useState<LiveScoreData | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const scoresRef = doc(db, 'settings', 'live_scores');
        const scoresSnap = await getDoc(scoresRef);
        if (scoresSnap.exists()) {
          setLiveScores(scoresSnap.data() as LiveScoreData);
        }
        
        const q = query(
          collection(db, 'articles'), 
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'), 
          limit(50)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        setArticles(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <div className="w-full h-[60vh] md:h-[70vh] mb-8">
          <Skeleton className="w-full h-full rounded-sm" />
        </div>
        <GridSkeleton count={10} />
      </div>
    );
  }

  const heroArticle = articles.find(a => a.isHero) || (articles.length > 0 ? articles[0] : null);
  const remainingArticles = articles.filter(a => a.id !== heroArticle?.id);

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 3);

  const recentArticles = remainingArticles.filter(a => new Date(a.createdAt) >= thresholdDate);
  const moreArticles = remainingArticles.filter(a => new Date(a.createdAt) < thresholdDate);

  const ArticleList = ({ items, title }: { items: Article[], title: string }) => (
    <div className="mb-10 px-4">
      <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)] pb-3">
        <h2 className="text-lg font-black uppercase tracking-widest text-[var(--text-main)]">{title}</h2>
        <Link to="/search" className="flex items-center gap-1 text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-main)]/50 hover:text-[var(--accent)] transition-colors">
          All News <span className="p-1 bg-white/5 rounded-sm ml-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg></span>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {items.map(article => (
          <Link key={article.id} to={`/article/${article.slug}`} className="group flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm overflow-hidden hover:border-[var(--accent)] transition-colors">
            <div className="w-full aspect-[4/3] relative flex justify-center bg-black overflow-hidden">
              {article.coverImage ? (
                <img src={article.coverImage} alt={article.title} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-[#111]"></div>
              )}
              {article.categories.includes('Live Streams') && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <PlayCircle size={24} className="text-white opacity-90" />
                </div>
              )}
            </div>
            <div className="flex-1 p-3 flex flex-col justify-start relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent)] truncate">
                  {article.categories[0] || 'News'}
                </span>
                <span className="text-[9px] text-white/40 whitespace-nowrap">
                  {format(new Date(article.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <h3 className="text-white/90 font-bold text-xs leading-snug line-clamp-3 group-hover:text-white transition-colors">
                {article.title}
              </h3>
              {article.categories.includes('Live Streams') && (
                <div className="absolute bottom-2 right-2 text-red-500">
                  <Bell size={14} className="fill-red-500/20" />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12 bg-[var(--bg-main)] min-h-screen">
      <Helmet>
        <title>PLATNUMZ CUESPORT by Kravo | Global Cue Sports News</title>
        <meta property="og:title" content="PLATNUMZ CUESPORT by Kravo" />
        <meta property="og:description" content="Breaking news, live results, and rankings from the world of pool, snooker, and billiards - plus exclusive photography and videography from Kravo Platnumz Media." />
        <meta property="og:image" content="https://i.imgur.com/2QVQb4w.png" />
        <meta name="twitter:image" content="https://i.imgur.com/2QVQb4w.png" />
        <meta name="twitter:title" content="PLATNUMZ CUESPORT by Kravo" />
        <meta name="twitter:description" content="Breaking news, live results, and rankings from the world of pool, snooker, and billiards - plus exclusive photography and videography from Kravo Platnumz Media." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {/* Hero Section */}
      {heroArticle && (
        <section className="text-center pt-8 pb-4">
          {heroArticle.coverImage && (
            <div className="w-full relative flex justify-center bg-[var(--bg-main)] mb-6">
              <img 
                src={heroArticle.coverImage} 
                alt={heroArticle.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="max-w-full h-auto"
              />
            </div>
          )}
          <div className="px-4 mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-3">
              {format(new Date(heroArticle.createdAt), 'MMM d, yyyy')}
              {heroArticle.categories[0] && <span className="text-white/40"> | {heroArticle.categories[0]}</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-6 max-w-3xl mx-auto leading-tight">
              {heroArticle.title}
            </h1>
            <Link to={`/article/${heroArticle.slug}`} className="inline-block border border-[var(--accent)] text-[var(--text-main)] font-bold px-8 py-2 rounded-full hover:bg-[var(--accent)] hover:text-[var(--accent-text)] transition-colors">
              Read More
            </Link>
          </div>
        </section>
      )}

      {/* Live Scores Widget */}
      {liveScores && liveScores.tournaments && liveScores.tournaments.length > 0 && (
        <section className="px-4 mb-10 mt-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm p-4">
            <div className="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-3">
              <h2 className="text-lg font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2">
                <Circle size={14} className="animate-pulse fill-red-500 text-red-500" /> 
                Live Scores
              </h2>
              <Link to="/scores" className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] hover:text-[var(--text-main)] transition-colors">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
              {liveScores.tournaments.flatMap(t => t.matches.map(m => ({...m, tournamentName: t.name, tournamentId: t.id}))).slice(0, 3).map(match => (
                <Link key={match.id} to={`/scores/${match.tournamentId}`} className="bg-[var(--bg-main)] border border-white/10 rounded-sm p-2 md:p-3 hover:border-white/30 transition-colors block">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest text-white/50 truncate max-w-[80px] md:max-w-none">{match.tournamentName} - {match.matchInfo}</span>
                    {match.status === 'live' ? (
                      <span className="text-red-500 text-[7px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Circle size={6} className="animate-pulse fill-red-500" /> Live
                      </span>
                    ) : match.status === 'upcoming' ? (
                      <span className="text-[var(--accent)] text-[7px] md:text-[9px] font-bold uppercase tracking-widest">Upcoming</span>
                    ) : (
                      <span className="text-white/30 text-[7px] md:text-[9px] font-bold uppercase tracking-widest">Final</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] md:text-sm font-bold truncate max-w-[80px] md:max-w-[150px] ${match.status === 'completed' && match.score1 > match.score2 ? 'text-white' : 'text-white/70'}`}>{match.player1}</span>
                    <span className="text-sm md:text-lg font-black text-white">{match.score1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] md:text-sm font-bold truncate max-w-[80px] md:max-w-[150px] ${match.status === 'completed' && match.score2 > match.score1 ? 'text-white' : 'text-white/70'}`}>{match.player2}</span>
                    <span className="text-sm md:text-lg font-black text-white">{match.score2}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Articles */}
      {recentArticles.length > 0 && (
        <ArticleList items={recentArticles} title="Latest News" />
      )}

      {/* More News */}
      {moreArticles.length > 0 && (
        <ArticleList items={moreArticles} title="More News" />
      )}
    </div>
  );
}
