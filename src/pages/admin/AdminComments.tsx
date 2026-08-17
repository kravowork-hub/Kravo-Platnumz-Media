import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Comment } from '../../types';
import { format } from 'date-fns';
import { Check, Trash2, MessageCircle } from 'lucide-react';

export function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  const fetchComments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'comments', id), { approved: true });
      setComments(prev => prev.map(c => c.id === id ? { ...c, approved: true } : c));
    } catch (e) {
      console.error("Error approving comment:", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'comments', id));
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error("Error deleting comment:", e);
    }
  };

  const filtered = comments.filter(c => {
    if (filter === 'pending') return !c.approved;
    if (filter === 'approved') return c.approved;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 border-b border-[var(--border-color)] pb-4">
        <h1 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
          <MessageCircle size={20} /> Comments
        </h1>
        <div className="flex gap-2">
          {(['pending', 'approved', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-sm transition-colors ${
                filter === f ? 'bg-[var(--accent)] text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {f} {f === 'pending' && comments.filter(c => !c.approved).length > 0 && `(${comments.filter(c => !c.approved).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-sm border border-[var(--border-color)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest text-white/50">Loading comments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest text-white/50">No {filter !== 'all' ? filter : ''} comments found.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {filtered.map(c => (
              <div key={c.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] font-bold text-white">{c.name}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                        {format(new Date(c.createdAt), 'MMM d, yyyy • HH:mm')}
                      </span>
                      <span className={`px-2 text-[9px] font-black uppercase tracking-widest rounded-sm ${
                        c.approved ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/60'
                      }`}>
                        {c.approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[12px] text-white/70 mt-2">{c.message}</p>
                    {c.articleSlug && (
                      <a
                        href={`/article/${c.articleSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-[var(--accent)]"
                      >
                        View article →
                      </a>
                    )}
                  </div>
                  <div className="flex gap-3 shrink-0">
                    {!c.approved && (
                      <button onClick={() => handleApprove(c.id!)} className="text-[var(--accent)] hover:text-white" title="Approve">
                        <Check size={18} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(c.id!)} className="text-red-500/80 hover:text-red-400" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
