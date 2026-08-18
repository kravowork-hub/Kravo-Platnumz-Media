import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, increment, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Article, Comment } from '../types';
import { format } from 'date-fns';
import { Facebook, Link as LinkIcon, Share2, MessageCircle, PlayCircle, Bell } from 'lucide-react';
import { useMetaTags } from '../lib/MetaProvider';
import { ArticlePageSkeleton } from '../components/Skeleton';

const WhatsAppIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const REACTIONS: { key: string; emoji: string; label: string }[] = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
];

export function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useMetaTags({
    title: article ? article.title : undefined,
    description: article ? article.excerpt : undefined,
    image: article ? article.coverImage : undefined,
    type: 'article'
  });

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

          if (slug) {
            setMyReaction(localStorage.getItem(`reaction:${slug}`));
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
    const fetchComments = async () => {
      if (!article?.id) return;
      try {
        const q = query(collection(db, 'comments'), where('articleId', '==', article.id));
        const snapshot = await getDocs(q);
        const list = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as Comment))
          .filter(c => c.approved)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setComments(list);
      } catch (e) {
        console.error("Error fetching comments:", e);
      }
    };
    fetchComments();
  }, [article?.id]);

  const handleReaction = async (key: string) => {
    if (!article?.id || !slug) return;
    if (myReaction) return; // one reaction per browser, per article

    try {
      await updateDoc(doc(db, 'articles', article.id), {
        [`reactions.${key}`]: increment(1)
      });
      setArticle(prev => prev ? {
        ...prev,
        reactions: { ...(prev.reactions || {}), [key]: ((prev.reactions?.[key]) || 0) + 1 }
      } : prev);
      localStorage.setItem(`reaction:${slug}`, key);
      setMyReaction(key);
    } catch (e) {
      console.error("Error saving reaction:", e);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article?.id || !commentName.trim() || !commentMessage.trim()) return;
    setCommentSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        articleId: article.id,
        articleSlug: article.slug,
        name: commentName.trim().slice(0, 60),
        message: commentMessage.trim().slice(0, 1000),
        approved: false,
        createdAt: new Date().toISOString(),
      });
      setCommentSubmitted(true);
      setCommentName('');
      setCommentMessage('');
    } catch (e) {
      console.error("Error posting comment:", e);
    } finally {
      setCommentSubmitting(false);
    }
  };

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

  if (loading) return <ArticlePageSkeleton />;
  if (!article) return <div className="min-h-screen flex items-center justify-center">Article not found</div>;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <div className="mb-12 border border-[var(--border-hover)] bg-[var(--bg-input)] flex justify-center">
          <img src={article.coverImage} alt={article.title} referrerPolicy="no-referrer" loading="lazy" className="max-w-full h-auto" />
        </div>
      )}

      {/* Mobile Social Share */}
      <div className="flex md:hidden gap-3 mb-8 pb-8 border-b border-[var(--border-color)] justify-center">
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-600 text-[var(--text-main)] flex items-center justify-center hover:bg-blue-700 transition-colors">
          <Facebook size={20} />
        </a>
        <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-[#25D366] text-white flex items-center justify-center hover:bg-[#128C7E] transition-colors">
          <WhatsAppIcon size={20} />
        </a>
        <button onClick={() => {navigator.clipboard.writeText(currentUrl); alert('Link copied!');}} className="w-12 h-12 bg-[#222] text-[var(--text-main)] flex items-center justify-center hover:bg-[#333] transition-colors">
          <LinkIcon size={20} />
        </button>
      </div>

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
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#25D366] text-white flex items-center justify-center hover:bg-[#128C7E] transition-colors">
              <WhatsAppIcon size={18} />
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

      {/* Reactions */}
      <div className="mt-12 pt-8 border-t border-[var(--border-color)] flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]/40 mr-2">React:</span>
        {REACTIONS.map(r => {
          const count = article.reactions?.[r.key] || 0;
          const active = myReaction === r.key;
          return (
            <button
              key={r.key}
              onClick={() => handleReaction(r.key)}
              disabled={!!myReaction}
              title={r.label}
              className={`flex items-center gap-2 px-3 py-2 border rounded-full text-sm transition-colors ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--border-color)] text-[var(--text-main)]/70 hover:border-[var(--border-hover)]'
              } ${myReaction && !active ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span>{r.emoji}</span>
              <span className="font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Comments */}
      <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
        <h3 className="text-2xl font-black italic tracking-tighter uppercase text-[var(--text-main)] mb-8 flex items-center gap-2">
          <MessageCircle size={22} /> Comments {comments.length > 0 && `(${comments.length})`}
        </h3>

        {commentSubmitted ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 text-[var(--text-main)]/70 text-sm mb-10">
            Thanks! Your comment has been submitted and will appear once approved.
          </div>
        ) : (
          <form onSubmit={handleCommentSubmit} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 mb-10 space-y-4">
            <input
              type="text"
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              placeholder="Your name"
              required
              maxLength={60}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
            <textarea
              value={commentMessage}
              onChange={(e) => setCommentMessage(e.target.value)}
              placeholder="Write a comment..."
              required
              maxLength={1000}
              rows={4}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
            />
            <button
              type="submit"
              disabled={commentSubmitting}
              className="bg-[var(--accent)] text-[var(--accent-text)] font-bold px-6 py-2 text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {commentSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        )}

        {comments.length === 0 ? (
          <p className="text-[var(--text-main)]/40 text-sm">No comments yet. Be the first to share your thoughts.</p>
        ) : (
          <div className="space-y-6">
            {comments.map(c => (
              <div key={c.id} className="border-b border-[var(--border-color)] pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-[var(--text-main)] text-sm">{c.name}</span>
                  <span className="text-[var(--text-main)]/40 text-xs">{format(new Date(c.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <p className="text-[var(--text-main)]/70 text-sm leading-relaxed">{c.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-20 pt-12 border-t border-[var(--border-color)]">
          <h3 className="text-2xl font-black italic tracking-tighter uppercase text-[var(--text-main)] mb-8">Related Articles</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {relatedArticles.map(article => (
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
      )}
    </article>
  );
}
