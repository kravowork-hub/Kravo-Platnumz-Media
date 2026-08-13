import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article, LiveScoreData } from '../types';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PlayCircle, Radio, Bell, Circle } from 'lucide-react';

export function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredVideo, setFeaturedVideo] = useState<{ url: string, isLive: boolean } | null>(null);
  const [liveScores, setLiveScores] = useState<LiveScoreData | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const scoresRef = doc(db, 'settings', 'live_scores');
        const scoresSnap = await getDoc(scoresRef);
        if (scoresSnap.exists()) {
          setLiveScores(scoresSnap.data() as LiveScoreData);
        }

        const docRef = doc(db, 'settings', 'videos');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().items && docSnap.data().items.length > 0) {
          const featured = docSnap.data().items[0];
          setFeaturedVideo({ url: featured.url, isLive: featured.isLive });
        } else {
          // Fallback
          const videoDoc = await getDoc(doc(db, 'settings', 'featured_video'));
          if (videoDoc.exists()) {
            const vData = videoDoc.data();
            if (vData.url) {
              setFeaturedVideo({ url: vData.url, isLive: vData.isLive });
            }
          }
        }
        
        const q = query(
          collection(db, 'articles'), 
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'), 
          limit(10)
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
    return <div className="min-h-[50vh] flex items-center justify-center">Loading news...</div>;
  }

  const heroArticle = articles.length > 0 ? articles[0] : null;
  const recentArticles = articles.length > 1 ? articles.slice(1) : [];

  const ArticleList = ({ items, title }: { items: Article[], title: string }) => (
    <div className="mb-10">
      <div className="bg-[#2a2a2a] py-3 px-4 mb-4 flex justify-between items-center border-b border-black">
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="space-y-4 px-2 md:px-4">
        {items.map(article => (
          <Link key={article.id} to={`/article/${article.slug}`} className="flex bg-[#f3f4f6] rounded-sm overflow-hidden hover:opacity-90 transition-opacity">
            <div className="w-[120px] md:w-[200px] shrink-0 relative">
              {article.coverImage ? (
                <img src={article.coverImage} alt={article.title} referrerPolicy="no-referrer" className="w-full h-full object-cover aspect-video md:aspect-[4/3]" />
              ) : (
                <div className="w-full h-full bg-[#111]"></div>
              )}
              {article.categories.includes('Live Streams') && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <PlayCircle size={32} className="text-white opacity-90" />
                </div>
              )}
            </div>
            <div className="flex-1 p-3 md:p-4 flex flex-col justify-center relative">
              <h3 className="text-black font-bold text-sm md:text-lg leading-tight line-clamp-3">
                {article.title}
              </h3>
              {article.categories.includes('Live Streams') && (
                <div className="absolute bottom-2 right-2 text-red-500">
                  <Bell size={20} className="fill-red-500/20" />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12 bg-black min-h-screen">
      <Helmet>
        <title>PLATNUMZ CUESPORT by Kravo | Global Cue Sports News</title>
        <meta property="og:title" content="PLATNUMZ CUESPORT by Kravo" />
        <meta property="og:description" content="Your premier source for global cue sports news, tournament coverage, and player insights." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {/* Featured Video Notification Header */}
      {featuredVideo && (
        <div className="bg-[#0f6f4d] py-3 px-4 text-center">
          <div className="text-white text-sm mb-2">{format(new Date(), 'MMMM d HH:mm')}</div>
          <Link to="/videos" className="inline-block border border-white text-white font-bold px-6 py-2 rounded-full hover:bg-white hover:text-[#0f6f4d] transition-colors">
            Latest Videos
          </Link>
        </div>
      )}

      {/* Hero Section */}
      {heroArticle && (
        <section className="text-center pt-8 pb-4">
          <div className="px-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 max-w-3xl mx-auto leading-tight">
              {heroArticle.title}
            </h1>
            <Link to={`/article/${heroArticle.slug}`} className="inline-block border border-[#eab308] text-white font-bold px-8 py-2 rounded-full hover:bg-[#eab308] hover:text-black transition-colors">
              Read More
            </Link>
          </div>
          {heroArticle.coverImage && (
            <div className="w-full relative aspect-[16/9] md:aspect-[21/9]">
              <img 
                src={heroArticle.coverImage} 
                alt={heroArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </section>
      )}

      {/* Live Scores Widget */}
      {liveScores && liveScores.tournaments && liveScores.tournaments.length > 0 && (
        <section className="px-4 mb-10 mt-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-sm p-4">
            <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3">
              <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Circle size={14} className="animate-pulse fill-red-500 text-red-500" /> 
                Live Scores
              </h2>
              <Link to="/scores" className="text-xs font-bold uppercase tracking-widest text-[#eab308] hover:text-white transition-colors">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveScores.tournaments.flatMap(t => t.matches.map(m => ({...m, tournamentName: t.name}))).slice(0, 3).map(match => (
                <Link key={match.id} to="/scores" className="bg-black border border-white/10 rounded-sm p-3 hover:border-white/30 transition-colors block">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">{match.tournamentName} - {match.matchInfo}</span>
                    {match.status === 'live' ? (
                      <span className="text-red-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Circle size={6} className="animate-pulse fill-red-500" /> Live
                      </span>
                    ) : match.status === 'upcoming' ? (
                      <span className="text-[#eab308] text-[9px] font-bold uppercase tracking-widest">Upcoming</span>
                    ) : (
                      <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Final</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-bold ${match.status === 'completed' && match.score1 > match.score2 ? 'text-white' : 'text-white/70'}`}>{match.player1}</span>
                    <span className="text-lg font-black text-white">{match.score1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${match.status === 'completed' && match.score2 > match.score1 ? 'text-white' : 'text-white/70'}`}>{match.player2}</span>
                    <span className="text-lg font-black text-white">{match.score2}</span>
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
    </div>
  );
}
