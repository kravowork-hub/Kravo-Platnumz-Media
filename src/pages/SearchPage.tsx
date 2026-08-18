import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article } from '../types';
import { format } from 'date-fns';
import { PlayCircle, Bell } from 'lucide-react';
import { GridSkeleton } from '../components/Skeleton';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'articles'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        
        if (queryParam) {
          const lowerQuery = queryParam.toLowerCase();
          const filtered = data.filter(article => 
            article.title.toLowerCase().includes(lowerQuery) || 
            article.excerpt.toLowerCase().includes(lowerQuery) ||
            (article.tags && article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
            article.categories.some(cat => cat.toLowerCase().includes(lowerQuery))
          );
          setArticles(filtered);
        } else {
          setArticles(data);
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
  }, [queryParam]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 border-b border-[var(--border-hover)] pb-4">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--text-main)] mb-2">
          {queryParam ? 'Search Results' : 'All News'}
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-main)]/50">
          {queryParam ? (
            <>Showing results for <span className="font-bold text-[var(--text-main)]">"{queryParam}"</span></>
          ) : (
            'Showing all published articles'
          )}
        </p>
      </div>

      {loading ? (
        <GridSkeleton count={10} />
      ) : articles.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No results found for your query. Try different keywords.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {articles.map(article => (
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
      )}
    </div>
  );
}
