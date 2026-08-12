import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Video, Radio, Link as LinkIcon, CheckCircle2, Plus, Trash2, GripVertical } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  url: string;
  isLive: boolean;
}

export function AdminVideo() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'videos');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().items) {
          setVideos(docSnap.data().items);
        } else {
          // Fallback to old featured_video if exists
          const oldRef = doc(db, 'settings', 'featured_video');
          const oldSnap = await getDoc(oldRef);
          if (oldSnap.exists() && oldSnap.data().url) {
            setVideos([{
              id: Date.now().toString(),
              title: 'Featured Video',
              url: oldSnap.data().url,
              isLive: oldSnap.data().isLive || false
            }]);
          }
        }
      } catch (error) {
        console.error("Error loading video settings", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleAddVideo = () => {
    setVideos([...videos, { id: Date.now().toString(), title: '', url: '', isLive: false }]);
  };

  const handleRemoveVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  const handleVideoChange = (id: string, field: keyof VideoItem, value: any) => {
    setVideos(videos.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      await setDoc(doc(db, 'settings', 'videos'), {
        items: videos,
        updatedAt: new Date().toISOString()
      });
      setMessage('Video settings updated successfully.');
    } catch (error) {
      console.error("Error saving video settings", error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="text-[var(--text-main)] text-[11px] font-bold uppercase tracking-widest">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-8 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-[var(--text-dark)] text-xl font-black uppercase tracking-widest flex items-center gap-2">
            <Video className="text-[var(--accent)]" />
            Manage Videos
          </h1>
          <p className="text-[11px] text-white/50 uppercase tracking-widest mt-2">
            Add and manage videos. The first video will be featured.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddVideo}
          className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-color)] text-white px-4 py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
        >
          <Plus size={16} /> Add Video
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-[var(--accent)]/10 border border-[var(--accent)] text-[var(--accent)] text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 rounded-sm">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {videos.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm">
            <Video size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/50 uppercase tracking-widest text-[11px] font-bold">No videos added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video, index) => (
              <div key={video.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm p-4 relative flex gap-4">
                <div className="pt-2 text-white/20 cursor-move">
                  <GripVertical size={20} />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
                        Video Title
                      </label>
                      <input
                        type="text"
                        value={video.title}
                        onChange={(e) => handleVideoChange(video.id, 'title', e.target.value)}
                        placeholder="e.g., World Championship Final"
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                        required
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={video.isLive}
                          onChange={(e) => handleVideoChange(video.id, 'isLive', e.target.checked)}
                          className="w-4 h-4 accent-[var(--accent)] bg-[var(--bg-card)] border-[var(--border-color)] rounded-sm"
                        />
                        <span className={video.isLive ? "text-red-500" : "text-white/40"}>LIVE NOW</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
                      Video URL (YouTube or Facebook)
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                      <input
                        type="text"
                        value={video.url}
                        onChange={(e) => handleVideoChange(video.id, 'url', e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveVideo(video.id)}
                  className="absolute top-4 right-4 text-white/30 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || videos.length === 0}
          className="w-full bg-[var(--accent)] text-black font-black uppercase tracking-widest text-[11px] py-4 rounded-sm hover:bg-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Videos'}
        </button>
      </form>
    </div>
  );
}
