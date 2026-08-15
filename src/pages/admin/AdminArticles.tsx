import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Article } from '../../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Edit, Trash2, Plus, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useAuth();

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(data);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'articles', id));
      fetchArticles();
      setMessage({ type: 'success', text: 'Article deleted successfully.' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to delete article.' });
    }
  };

  const handleAutoFetchNews = async () => {
    setIsFetchingNews(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await fetch('/api/auto-fetch-news', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      const data = await response.json();
      if (data.articles && data.articles.length > 0) {
        for (const item of data.articles) {
          const baseSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const newArticle: Omit<Article, 'id'> = {
            title: item.title,
            slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
            content: item.content,
            excerpt: item.excerpt,
            coverImage: '',
            categories: item.categories || ['Tournament Updates'],
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            authorId: user?.uid || 'admin',
            authorName: user?.email || 'Admin', views: 0, publishDate: new Date().toISOString(), tags: [],
          };
          await addDoc(collection(db, 'articles'), newArticle);
        }
        await fetchArticles();
        setMessage({ type: 'success', text: `Successfully fetched and published ${data.articles.length} news articles.` });
      } else {
        setMessage({ type: 'error', text: "No news found." });
      }
    } catch (error) {
      console.error("Error auto-fetching news:", error);
      setMessage({ type: 'error', text: "Failed to auto-fetch news." });
    } finally {
      setIsFetchingNews(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 border-b border-[var(--border-color)] pb-4">
        <h1 className="text-[var(--text-dark)]xl font-black uppercase tracking-widest text-white">Articles</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoFetchNews}
            disabled={isFetchingNews}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isFetchingNews ? "animate-spin" : ""} />
            {isFetchingNews ? "Fetching..." : "Auto-Fetch News"}
          </button>
          <Link 
            to="/admin/articles/new" 
            className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest hover:bg-white transition-colors"
          >
            <Plus size={16} />
            New Article
          </Link>
        </div>
      </div>
      
      {message.text && (
        <div className={`mb-6 p-4 border text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 rounded-sm ${
          message.type === 'success' 
            ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="bg-[var(--bg-card)] rounded-sm border border-[var(--border-color)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest text-white/50">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest text-white/50">No articles found. Create your first one!</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-[var(--bg-input)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-[9px] font-black text-white/50 uppercase tracking-widest">Title</th>
                    <th className="px-6 py-3 text-left text-[9px] font-black text-white/50 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-3 text-left text-[9px] font-black text-white/50 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-3 text-right text-[9px] font-black text-white/50 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--bg-card)] divide-y divide-white/10">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/admin/articles/${article.id}`} className="text-[11px] font-bold text-white hover:text-[var(--accent)] hover:underline">{article.title}</Link>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 mt-1">{article.categories.join(', ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-[9px] leading-5 font-black uppercase tracking-widest rounded-sm 
                          ${article.status === 'published' ? 'bg-[var(--accent)] text-black' : 
                            article.status === 'draft' ? 'bg-white/10 text-white/60' : 
                            'bg-white/20 text-white'}`}
                        >
                          {article.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-white/50">
                        {format(new Date(article.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <Link to={`/admin/articles/${article.id}`} className="text-[var(--accent)] hover:text-white">
                            <Edit size={16} />
                          </Link>
                          <button onClick={() => handleDelete(article.id!)} className="text-red-500/80 hover:text-red-400">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/10">
              {articles.map((article) => (
                <div key={article.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <Link to={`/admin/articles/${article.id}`} className="text-[11px] font-bold text-white hover:text-[var(--accent)] hover:underline block truncate mb-1">
                        {article.title}
                      </Link>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 truncate">
                        {article.categories.join(', ')}
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 inline-flex text-[9px] leading-5 font-black uppercase tracking-widest rounded-sm 
                      ${article.status === 'published' ? 'bg-[var(--accent)] text-black' : 
                        article.status === 'draft' ? 'bg-white/10 text-white/60' : 
                        'bg-white/20 text-white'}`}
                    >
                      {article.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-[10px] font-bold text-white/50">
                      {format(new Date(article.createdAt), 'MMM d, yyyy')}
                    </div>
                    <div className="flex justify-end gap-4">
                      <Link to={`/admin/articles/${article.id}`} className="flex items-center gap-1 text-[var(--accent)] hover:text-white text-[10px] font-bold uppercase tracking-widest">
                        <Edit size={14} /> Edit
                      </Link>
                      <button onClick={() => handleDelete(article.id!)} className="flex items-center gap-1 text-red-500/80 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
