import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article } from '../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, PlayCircle } from 'lucide-react';

export function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
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
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">Loading news...</div>;
  }

  const heroArticle = articles.length > 0 ? articles[0] : null;
  const recentArticles = articles.length > 1 ? articles.slice(1, 5) : [];
  const trendingArticles = articles.length > 5 ? articles.slice(5) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero Section */}
      {heroArticle && (
        <section className="mb-12">
          <Link to={`/article/${heroArticle.slug}`} className="group relative block overflow-hidden aspect-[21/9] bg-[#111] border-b border-white/20 shrink-0">
            {heroArticle.coverImage ? (
              <img 
                src={heroArticle.coverImage} 
                alt={heroArticle.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-[#222] opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #333 0, #333 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
            <div className="absolute bottom-0 left-0 p-8 md:p-12 md:w-2/3 z-20">
              <div className="flex gap-2 mb-4">
                {heroArticle.categories.slice(0,2).map(cat => (
                  <span key={cat} className="bg-[#C0C0C0] text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                    {cat}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-[0.9] text-white mb-4 uppercase transition-colors group-hover:text-[#C0C0C0]">
                {heroArticle.title}
              </h1>
              <p className="text-gray-300 text-lg hidden md:block mb-4 line-clamp-2">
                {heroArticle.excerpt}
              </p>
              <div className="flex items-center text-gray-400 text-xs font-medium">
                <span>{heroArticle.authorName}</span>
                <span className="w-1 h-1 bg-white/40 rounded-full mx-2"></span>
                <span>{format(new Date(heroArticle.createdAt), 'MMMM d, yyyy')}</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Articles */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6 border-b border-white/20 pb-2">
            <h2 className="text-[10px] uppercase font-black tracking-widest text-[#C0C0C0]">Recent Updates</h2>
            <Link to="/category/Tournament Updates" className="text-[9px] font-bold text-white/50 hover:text-white uppercase tracking-widest flex items-center transition-colors">
              View All <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentArticles.map(article => (
              <Link key={article.id} to={`/article/${article.slug}`} className="group flex flex-col h-full bg-[#0a0a0a] border border-white/5 p-4 hover:border-white/20 transition-colors cursor-pointer">
                <div className="aspect-[16/9] bg-[#111] overflow-hidden relative mb-3">
                  {article.coverImage && (
                    <img src={article.coverImage} alt={article.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  {article.categories.includes('Live Streams') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <PlayCircle size={48} className="text-white opacity-80" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider mb-2">
                    {article.categories[0]}
                  </span>
                  <h3 className="text-sm font-bold text-[#e5e5e5] mb-2 group-hover:text-white transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-[11px] text-white/50 mb-4 line-clamp-2 flex-1 leading-relaxed">
                    {article.excerpt}
                  </p>
                  <div className="text-[10px] text-white/40 font-medium">
                    {format(new Date(article.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar / Trending */}
        <aside>
          <div className="mb-6 border-b border-white/20 pb-2">
            <h2 className="text-[10px] uppercase font-black tracking-widest text-[#C0C0C0]">Trending</h2>
          </div>
          <div className="flex flex-col gap-6">
            {trendingArticles.length > 0 ? trendingArticles.map((article, index) => (
              <Link key={article.id} to={`/article/${article.slug}`} className="group flex gap-4 items-start">
                <div className="text-4xl font-black text-[#222] tracking-tighter leading-none w-8">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#e5e5e5] text-sm group-hover:text-white transition-colors line-clamp-2 mb-1">
                    {article.title}
                  </h4>
                  <div className="text-[10px] text-white/40 font-medium flex items-center">
                    <span className="uppercase text-blue-400 font-bold">{article.categories[0]}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full mx-2"></span>
                    {format(new Date(article.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </Link>
            )) : (
              <p className="text-[11px] text-white/40">More stories coming soon.</p>
            )}
          </div>

          {/* Ad Placeholder or Promo */}
          <div className="mt-12 bg-[#0a0a0a] border border-white/10 p-8 text-center aspect-square flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #444 0, #444 1px, transparent 0, transparent 10px)' }}></div>
             </div>
            <div className="w-16 h-16 bg-[#C0C0C0] text-black rounded-sm flex items-center justify-center font-black text-3xl mb-4 relative z-10">
              KP
            </div>
            <h3 className="text-white font-bold text-lg uppercase mb-2 relative z-10">Join The Community</h3>
            <p className="text-[11px] text-white/50 mb-6 leading-relaxed relative z-10">Subscribe for the latest cue sports updates straight to your inbox.</p>
            <button className="bg-[#e5e5e5] text-black font-black px-6 py-3 hover:bg-white transition-colors w-full uppercase text-[10px] tracking-widest relative z-10">
              Subscribe Now
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
