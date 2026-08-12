import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Video, Radio, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

export function AdminVideo() {
  const [url, setUrl] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'featured_video');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUrl(data.url || '');
          setIsLive(data.isLive || false);
        }
      } catch (error) {
        console.error("Error loading video settings", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      // Determine platform from URL
      let platform = 'unknown';
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        platform = 'youtube';
      } else if (url.includes('facebook.com')) {
        platform = 'facebook';
      }

      await setDoc(doc(db, 'settings', 'featured_video'), {
        url,
        isLive,
        platform,
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
    <div className="max-w-2xl">
      <div className="mb-8 border-b border-[var(--border-color)] pb-4">
        <h1 className="text-[var(--text-dark)] text-xl font-black uppercase tracking-widest flex items-center gap-2">
          <Video className="text-[var(--accent)]" />
          Manage Featured Video
        </h1>
        <p className="text-[11px] text-white/50 uppercase tracking-widest mt-2">
          Set the YouTube or Facebook video that appears at the top of the homepage.
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-[var(--accent)]/10 border border-[var(--accent)] text-[var(--accent)] text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 rounded-sm">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm p-6 space-y-6">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
            Video Link (YouTube or Facebook)
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://www.youtube.com/watch?v=..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <p className="text-[10px] text-white/40 mt-2">
            Paste the full URL of the video or live stream.
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm">
          <input
            type="checkbox"
            id="isLive"
            checked={isLive}
            onChange={(e) => setIsLive(e.target.checked)}
            className="w-4 h-4 accent-[var(--accent)] bg-[var(--bg-card)] border-[var(--border-color)] rounded-sm"
          />
          <label htmlFor="isLive" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white cursor-pointer select-none">
            <Radio size={16} className={isLive ? "text-red-500" : "text-white/40"} />
            Mark as currently LIVE
          </label>
        </div>
        <p className="text-[10px] text-white/40 mt-1 pl-1">
          If checked, a "LIVE NOW" badge will appear on the homepage. Otherwise, it will say "LATEST VIDEO".
        </p>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[var(--accent)] text-black font-black uppercase tracking-widest text-[11px] py-4 rounded-sm hover:bg-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Update Homepage Video'}
        </button>
      </form>
    </div>
  );
}
