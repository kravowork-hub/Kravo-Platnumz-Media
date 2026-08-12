import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FileText, Eye, TrendingUp, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Article } from '../../types';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    totalViews: 0
  });
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatsAndArticles() {
      try {
        const q = query(collection(db, 'articles'));
        const snapshot = await getDocs(q);
        
        let published = 0;
        let views = 0;
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'published') published++;
          if (data.views) views += data.views;
        });

        setStats({
          totalArticles: snapshot.size,
          publishedArticles: published,
          totalViews: views
        });

        const recentQ = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnapshot = await getDocs(recentQ);
        const data = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        setRecentArticles(data);

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStatsAndArticles();
  }, []);

  if (loading) return <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest">Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Articles', value: stats.totalArticles, icon: FileText, color: 'text-[var(--text-main)]', bg: 'bg-[var(--bg-input)]' },
    { label: 'Published', value: stats.publishedArticles, icon: TrendingUp, color: 'text-[var(--text-main)]', bg: 'bg-[var(--bg-input)]' },
    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-[var(--text-main)]', bg: 'bg-[var(--bg-input)]' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b border-[var(--border-color)] pb-4">
        <h1 className="text-[var(--text-dark)]xl font-black uppercase tracking-widest text-white">Dashboard Overview</h1>
        <Link 
          to="/admin/articles/new" 
          className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest hover:bg-white transition-colors"
        >
          <FileText size={16} />
          New Article
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-[var(--bg-card)] rounded-sm border border-[var(--border-color)] p-6 flex items-center gap-4">
              <div className={`p-4 rounded-sm ${stat.bg}`}>
                <Icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{stat.label}</p>
                <p className="text-3xl font-black tracking-tighter text-white">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-[var(--bg-card)] rounded-sm border border-[var(--border-color)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Recent Articles</h2>
          <Link to="/admin/articles" className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:text-white transition-colors">View All</Link>
        </div>
        
        {recentArticles.length === 0 ? (
          <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest text-white/50">No articles yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-[var(--bg-input)]">
              <tr>
                <th className="px-6 py-3 text-left text-[9px] font-black text-white/50 uppercase tracking-widest">Title</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-white/50 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-white/50 uppercase tracking-widest">Date</th>
                <th className="px-6 py-3 text-right text-[9px] font-black text-white/50 uppercase tracking-widest">Edit</th>
              </tr>
            </thead>
            <tbody className="bg-[var(--bg-card)] divide-y divide-white/10">
              {recentArticles.map((article) => (
                <tr key={article.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/admin/articles/${article.id}`} className="block">
                      <div className="text-[11px] font-bold text-white hover:text-[var(--accent)] transition-colors">{article.title}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 mt-1">{article.categories.join(', ')}</div>
                    </Link>
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
                    <Link to={`/admin/articles/${article.id}`} className="text-[var(--accent)] hover:text-white inline-block">
                      <Edit size={16} />
                    </Link>
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
