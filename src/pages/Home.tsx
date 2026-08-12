import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article } from '../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, PlayCircle, Radio } from 'lucide-react';

export function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredVideo, setFeaturedVideo] = useState<{ url: string, isLive: boolean } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured video
        const videoDoc = await getDoc(doc(db, 'settings', 'featured_video'));
        if (videoDoc.exists()) {
          const vData = videoDoc.data();
          if (vData.url) {
            setFeaturedVideo({ url: vData.url, isLive: vData.isLive });
          }
        }

        // Fetch articles
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

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
        else if (url.includes('v=')) videoId = new URL(url).searchParams.get('v') || '';
        else if (url.includes('/live/')) videoId = url.split('/live/')[1]?.split('?')[0];
        
        if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
      } else if (url.includes('facebook.com')) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=auto`;
      }
    } catch (e) {
      console.error(e);
    }
    return '';
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">Loading news...</div>;
  }

  const heroArticle = articles.length > 0 ? articles[0] : null;
  const recentArticles = articles.length > 1 ? articles.slice(1, 5) : [];
  const trendingArticles = articles.length > 5 ? articles.slice(5) : [];
  
  const videoEmbedUrl = featuredVideo ? getEmbedUrl(featuredVideo.url) : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Featured Video Section */}
      {videoEmbedUrl && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            {featuredVideo?.isLive ? (
              <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1">
                <Radio size={12} className="animate-pulse" /> LIVE NOW
              </span>
            ) : (
              <span className="bg-[var(--accent)] text-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1">
                <PlayCircle size={12} /> LATEST VIDEO
              </span>
            )}
            <div className="h-[1px] flex-1 bg-[var(--border-color)]"></div>
          </div>
          <div className="aspect-video w-full bg-black rounded-sm overflow-hidden border border-[var(--border-color)]">
            <iframe 
              src={videoEmbedUrl} 
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen>
            </iframe>
          </div>
        </section>
      )}

      {/* Hero Section */}
      {heroArticle && (
        <section className="mb-12">
          <Link to={`/article/${heroArticle.slug}`} className="group relative block overflow-hidden aspect-[4/3] md:aspect-[21/9] bg-[var(--bg-input)] border-b border-[var(--border-hover)] shrink-0">
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
            <div className="absolute bottom-0 left-0 p-4 md:p-12 md:w-2/3 z-20">
              <div className="flex gap-2 mb-4">
                {heroArticle.categories.slice(0,2).map(cat => (
                  <span key={cat} className="bg-[var(--accent)] text-[var(--accent-text)] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                    {cat}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-[0.9] text-[var(--text-main)] mb-4 uppercase transition-colors group-hover:text-[var(--accent)]">
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
          <div className="flex items-center justify-between mb-6 border-b border-[var(--border-hover)] pb-2">
            <h2 className="text-[10px] uppercase font-black tracking-widest text-[var(--accent)]">Recent Updates</h2>
            <Link to="/category/Tournament Updates" className="text-[9px] font-bold text-[var(--text-main)]/50 hover:text-[var(--text-main)] uppercase tracking-widest flex items-center transition-colors">
              View All <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>
          
          <div className="flex flex-col md:grid md:grid-cols-2 gap-0 md:gap-6 border-t md:border-t-0 border-[var(--border-hover)]">
            {recentArticles.map(article => (
              <Link key={article.id} to={`/article/${article.slug}`} className="group flex flex-row md:flex-col h-full bg-[var(--bg-main)] md:bg-[var(--bg-card)] border-b md:border border-[var(--border-hover)] md:border-white/5 py-4 md:p-4 hover:bg-[var(--bg-card)] md:hover:border-[var(--border-hover)] transition-colors cursor-pointer gap-4 md:gap-0">
                <div className="w-[100px] h-[100px] md:w-full md:aspect-[16/9] md:h-auto bg-[var(--bg-input)] overflow-hidden relative md:mb-3 shrink-0 rounded-sm md:rounded-none">
                  {article.coverImage && (
                    <img src={article.coverImage} alt={article.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  {article.categories.includes('Live Streams') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <PlayCircle size={48} className="text-[var(--text-main)] opacity-80" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center md:justify-start">
                  <span className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-wider mb-1">
                    {article.categories[0]}
                  </span>
                  <h3 className="text-[15px] md:text-sm font-bold text-[var(--text-main)] mb-1 md:mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-3 md:line-clamp-2 leading-tight">
                    {article.title}
                  </h3>
                  <p className="hidden md:block text-[11px] text-[var(--text-main)]/50 mb-4 line-clamp-2 flex-1 leading-relaxed">
                    {article.excerpt}
                  </p>
                  <div className="text-[11px] md:text-[10px] text-[var(--text-main)]/50 md:text-[var(--text-main)]/40 font-medium flex items-center gap-1 mt-1 md:mt-0">
                    <span className="md:hidden opacity-50">🕒</span> {format(new Date(article.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar / Trending */}
        <aside>
          <div className="mb-6 border-b border-[var(--border-hover)] pb-2">
            <h2 className="text-[10px] uppercase font-black tracking-widest text-[var(--accent)]">Trending</h2>
          </div>
          <div className="flex flex-col gap-6">
            {trendingArticles.length > 0 ? trendingArticles.map((article, index) => (
              <Link key={article.id} to={`/article/${article.slug}`} className="group flex gap-4 items-start">
                <div className="text-4xl font-black text-[#222] tracking-tighter leading-none w-8">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[var(--text-main)] text-sm group-hover:text-[var(--text-main)] transition-colors line-clamp-2 mb-1">
                    {article.title}
                  </h4>
                  <div className="text-[10px] text-[var(--text-main)]/40 font-medium flex items-center">
                    <span className="uppercase text-blue-400 font-bold">{article.categories[0]}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full mx-2"></span>
                    {format(new Date(article.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </Link>
            )) : (
              <p className="text-[11px] text-[var(--text-main)]/40">More stories coming soon.</p>
            )}
          </div>

          {/* Ad Placeholder or Promo */}
          <div className="mt-12 bg-[var(--bg-card)] border border-[var(--border-color)] p-8 text-center aspect-square flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #444 0, #444 1px, transparent 0, transparent 10px)' }}></div>
             </div>
            <div className="w-16 h-16 bg-[#25D366] text-white rounded-sm flex items-center justify-center font-black text-3xl mb-4 relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
            </div>
            <h3 className="text-[var(--text-main)] font-bold text-lg uppercase mb-2 relative z-10">Join Our Community</h3>
            <p className="text-[11px] text-[var(--text-main)]/50 mb-6 leading-relaxed relative z-10">Get the latest cue sports updates and live stream alerts straight to your WhatsApp.</p>
            <a href="https://whatsapp.com/channel/0029Va8ZB5LJpe8fqDvigx3O" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white font-black px-6 py-3 hover:bg-[#128C7E] transition-colors w-full uppercase text-[10px] tracking-widest relative z-10 block text-center">
              Join WhatsApp Channel
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
