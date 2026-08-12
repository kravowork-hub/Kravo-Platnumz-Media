import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Facebook, CheckCircle2, Link as LinkIcon, AlertCircle } from 'lucide-react';

export function AdminSocial() {
  const [facebookUrl, setFacebookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'social_feed');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFacebookUrl(data.facebookUrl || '');
        }
      } catch (error) {
        console.error("Error loading social settings", error);
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
      await setDoc(doc(db, 'settings', 'social_feed'), {
        facebookUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setMessage('Social settings updated successfully.');
    } catch (error) {
      console.error("Error saving social settings", error);
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
          <Facebook className="text-[var(--accent)]" />
          Manage Social Feeds
        </h1>
        <p className="text-[11px] text-white/50 uppercase tracking-widest mt-2">
          Configure embedded social media feeds for your homepage.
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-[var(--accent)]/10 border border-[var(--accent)] text-[var(--accent)] text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 rounded-sm">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] uppercase tracking-widest flex items-start gap-3 rounded-sm">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Note about WhatsApp:</strong> Meta (Facebook) does not provide a public API or embed widget to display live WhatsApp Channel posts on a website. Your homepage currently features a highly optimized "Join WhatsApp Channel" button to drive traffic directly to your channel instead.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm p-6 space-y-6">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 flex items-center gap-2">
            <Facebook size={14} /> Facebook Page URL
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="text"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="e.g., https://www.facebook.com/kravoplatnumzmedia"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <p className="text-[10px] text-white/40 mt-2">
            Paste the full URL of your public Facebook Page. This will generate a live timeline widget on the homepage sidebar.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[var(--accent)] text-black font-black uppercase tracking-widest text-[11px] py-4 rounded-sm hover:bg-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Update Social Feeds'}
        </button>
      </form>
    </div>
  );
}
