import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article } from '../types';
import { format } from 'date-fns';
import { Facebook, Twitter, Link as LinkIcon, Share2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading article...</div>;
  if (!article) return <div className="min-h-screen flex items-center justify-center">Article not found</div>;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>{article.title} - PLATNUMZ CUESPORT</title>
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        {article.coverImage && <meta property="og:image" content={article.coverImage} />}
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
        <div className="mb-12 aspect-[21/9] border border-[var(--border-hover)] overflow-hidden bg-[var(--bg-input)]">
          <img src={article.coverImage} alt={article.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
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
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#222] text-[var(--text-main)] flex items-center justify-center hover:bg-[#333] transition-colors">
              <Twitter size={18} />
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
    </article>
  );
}
