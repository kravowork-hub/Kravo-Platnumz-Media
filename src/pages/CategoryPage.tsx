import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article } from '../types';
import { format } from 'date-fns';

export function CategoryPage() {
  const { category } = useParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryArticles = async () => {
      setLoading(true);
      try {
        // Note: In Firestore, array-contains is used for querying array fields.
        const q = query(
          collection(db, 'articles'), 
          where('status', '==', 'published'),
          where('categories', 'array-contains', category),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        setArticles(data);
      } catch (error) {
        console.error("Error fetching category articles:", error);
      } finally {
        setLoading(false);
      }
    };
    if (category) fetchCategoryArticles();
  }, [category]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 border-b border-[var(--border-hover)] pb-4">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none text-[var(--text-main)]">{category} News</h1>
        <p className="mt-4 text-[var(--text-main)]/50 text-[11px] uppercase tracking-widest font-bold">Latest updates and stories in {category}.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500 text-lg font-medium">Loading {category} news...</div>
      ) : articles.length === 0 ? (
        <div className="py-20 text-center text-gray-500 text-lg font-medium">No articles found in this category yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map(article => (
            <Link key={article.id} to={`/article/${article.slug}`} className="group flex flex-col h-full bg-[var(--bg-card)] border border-white/5 p-4 hover:border-[var(--border-hover)] transition-colors cursor-pointer">
              <div className="aspect-[4/3] bg-[var(--bg-input)] overflow-hidden relative mb-4">
                {article.coverImage ? (
                  <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
