import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article } from '../types';
import { format } from 'date-fns';
import { Facebook, Link as LinkIcon, Share2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const q = query(collection(db, 'articles'), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = { id: docSnap.id, ...docSnap.data() } as Article;
          setArticle(data);

          // Increment views
          if (data.status === 'published') {
            await updateDoc(doc(db, 'articles', docSnap.id), {
              views: increment(1)
            });
          }
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchArticle();
  }, [slug]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!article || !article.categories || article.categories.length === 0) return;
      try {
        const category = article.categories[0];
        const q = query(
          collection(db, 'articles'),
          where('categories', 'array-contains', category),
          where('status', '==', 'published')
        );
        const snapshot = await getDocs(q);
        const related = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Article))
          .filter(a => a.id !== article.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        setRelatedArticles(related);
      } catch (e) {
        console.error("Error fetching related articles:", e);
      }
    };
    fetchRelated();
  }, [article?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading article...</div>;
  if (!article) return <div className="min-h-screen flex items-center justify-center">Article not found</div>;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>{article.title} - PLATNUMZ CUESPORT</title>
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        {article.coverImage && (
          <>
            <meta property="og:image" content={article.coverImage} />
            <meta name="twitter:image" content={article.coverImage} />
          </>
        )}
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={currentUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <header className="mb-10 text-center max-w-3xl mx-auto">
        <div className="flex justify-center gap-2 mb-6">
          {article.categories.map(cat => (
            <Link key={cat} to={`/category/${cat}`} className="bg-[var(--accent)] text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">
              {cat}
            </Link>
          ))}
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter leading-none text-[var(--text-main)] uppercase mb-6">
          {article.title}
        </h1>
        <p className="text-lg text-[var(--text-main)]/60 mb-8 font-medium leading-relaxed">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-center text-[10px] font-medium text-[var(--text-main)]/40 border-t border-b border-[var(--border-color)] py-4">
          <span className="font-bold text-[var(--text-main)] uppercase tracking-widest">By {article.authorName}</span>
          <span className="w-1 h-1 bg-white/20 rounded-full mx-4"></span>
          <span>{format(new Date(article.createdAt), 'MMMM d, yyyy')}</span>
          <span className="w-1 h-1 bg-white/20 rounded-full mx-4"></span>
          <span>{article.views || 0} Views</span>
        </div>
      </header>

      {article.coverImage && (
        <div className="mb-12 mb-12 border border-[var(--border-hover)] bg-[var(--bg-input)] flex justify-center">
          <img src={article.coverImage} alt={article.title} referrerPolicy="no-referrer" loading="lazy" className="max-w-full h-auto" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Social Share sidebar - sticky */}
        <div className="md:col-span-1 hidden md:block">
          <div className="sticky top-24 flex flex-col gap-4 items-center">
            <div className="w-10 h-10 border border-[var(--border-hover)] flex items-center justify-center text-[var(--text-main)]/40 mb-2">
              <Share2 size={18} />
            </div>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 text-[var(--text-main)] flex items-center justify-center hover:bg-blue-700 transition-colors">
              <Facebook size={18} />
            </a>
            <button onClick={() => {navigator.clipboard.writeText(currentUrl); alert('Link copied!');}} className="w-10 h-10 bg-[#222] text-[var(--text-main)] flex items-center justify-center hover:bg-[#333] transition-colors">
              <LinkIcon size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-10 lg:col-span-9 prose prose-lg prose-invert max-w-none prose-headings:font-black prose-headings:italic prose-headings:tracking-tighter prose-headings:uppercase prose-a:text-[var(--accent)]">
          {/* We render Quill's HTML in read-only mode or dangerouslySetInnerHTML */}
          <div dangerouslySetInnerHTML={{ __html: article.content }} className="markdown-body text-[var(--text-main)]" />
          
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-4">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <Link key={tag} to={`/search?q=${tag}`} className="px-3 py-1 border border-[var(--border-color)] text-[var(--text-main)]/60 text-[10px] font-bold uppercase tracking-widest hover:border-white/40 hover:text-[var(--text-main)] transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-20 pt-12 border-t border-[var(--border-color)]">
          <h3 className="text-2xl font-black italic tracking-tighter uppercase text-[var(--text-main)] mb-8">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map(related => (
              <Link key={related.id} to={`/article/${related.slug}`} className="group flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border-color)] p-4 hover:border-[var(--border-hover)] transition-colors cursor-pointer">
                <div className="bg-[var(--bg-input)] aspect-video overflow-hidden relative mb-4 flex justify-center">
                  {related.coverImage ? (
                    <img src={related.coverImage} alt={related.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-[#222] opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #333 0, #333 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>
                  )}
                  <div className="absolute top-4 left-4 bg-[var(--accent)] text-[var(--accent-text)] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm">
                    {related.categories[0]}
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-[var(--text-main)] mb-2 line-clamp-2 group-hover:text-[var(--accent)] transition-colors leading-tight">
                    {related.title}
                  </h4>
                  <p className="text-[var(--text-main)]/60 text-sm line-clamp-2 mb-4 flex-1">
                    {related.excerpt}
                  </p>
                  <div className="flex items-center text-[10px] font-bold text-[var(--text-main)]/40 uppercase tracking-widest mt-auto">
                    <span>{format(new Date(related.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
