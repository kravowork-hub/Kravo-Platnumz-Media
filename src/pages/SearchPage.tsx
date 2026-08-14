import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article } from '../types';
import { format } from 'date-fns';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const searchArticles = async () => {
      setLoading(true);
      try {
        // Note: Firestore doesn't support full-text search natively in basic queries.
        // For a simple CMS, we fetch published articles and filter in-memory.
        // A production app would use Algolia or Typesense.
        const q = query(
          collection(db, 'articles'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        
        const lowerQuery = queryParam.toLowerCase();
        const filtered = data.filter(article => 
          article.title.toLowerCase().includes(lowerQuery) || 
          article.excerpt.toLowerCase().includes(lowerQuery) ||
          (article.tags && article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
          article.categories.some(cat => cat.toLowerCase().includes(lowerQuery))
        );
        
        setArticles(filtered);
      } catch (error) {
        console.error("Error searching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (queryParam) {
      searchArticles();
    } else {
      setArticles([]);
      setLoading(false);
    }
  }, [queryParam]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 border-b border-[var(--border-hover)] pb-4">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--text-main)] mb-2">Search Results</h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-main)]/50">
          Showing results for <span className="font-bold text-[var(--text-main)]">"{queryParam}"</span>
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Searching...</div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No results found for your query. Try different keywords.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map(article => (
             <Link key={article.id} to={`/article/${article.slug}`} className="group flex flex-col h-full bg-[var(--bg-card)] border border-white/5 p-4 hover:border-[var(--border-hover)] transition-colors cursor-pointer">
             <div className="bg-[var(--bg-input)] overflow-hidden relative mb-4 flex justify-center">
               {article.coverImage ? (
                 <img src={article.coverImage} alt={article.title} className="max-w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500" />
               ) : (
                 <div className="absolute inset-0 bg-[#222] opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #333 0, #333 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>
               )}
               <div className="absolute top-4 left-4 bg-[var(--accent)] text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm">
                 {article.categories[0]}
               </div>
             </div>
             <div className="flex-1 flex flex-col">
               <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 group-hover:text-[var(--text-main)] transition-colors leading-tight line-clamp-3">
                 {article.title}
               </h3>
               <p className="text-[11px] text-[var(--text-main)]/50 mb-4 line-clamp-2 flex-1 leading-relaxed">
                 {article.excerpt}
               </p>
               <div className="flex items-center text-[10px] text-[var(--text-main)]/40 font-medium pt-4 border-t border-white/5">
                 <span className="font-bold uppercase text-[var(--text-main)]/80">{article.authorName}</span>
                 <span className="w-1 h-1 bg-white/20 rounded-full mx-2"></span>
                 {format(new Date(article.createdAt), 'MMM d, yyyy')}
               </div>
             </div>
           </Link>
          ))}
        </div>
      )}
    </div>
  );
}
