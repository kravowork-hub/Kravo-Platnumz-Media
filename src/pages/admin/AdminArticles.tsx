import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Article } from '../../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Edit, Trash2, Plus } from 'lucide-react';

export function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (window.confirm("Are you sure you want to delete this article?")) {
      await deleteDoc(doc(db, 'articles', id));
      fetchArticles();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b border-[var(--border-color)] pb-4">
        <h1 className="text-[var(--text-dark)]xl font-black uppercase tracking-widest text-white">Articles</h1>
        <Link 
          to="/admin/articles/new" 
          className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest hover:bg-white transition-colors"
        >
          <Plus size={16} />
          New Article
        </Link>
      </div>

      <div className="bg-[var(--bg-card)] rounded-sm border border-[var(--border-color)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest text-white/50">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest text-white/50">No articles found. Create your first one!</div>
        ) : (
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
                    <div className="text-[11px] font-bold text-white">{article.title}</div>
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
        )}
      </div>
    </div>
  );
}
