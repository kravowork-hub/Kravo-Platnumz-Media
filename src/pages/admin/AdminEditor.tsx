import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RichTextEditor } from '../../components/RichTextEditor';
import { collection, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { CATEGORIES } from '../../types';
import { ArrowLeft, Save, Sparkles, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState('');

  const [aiTopic, setAiTopic] = useState('');
  const [aiMode, setAiMode] = useState<'research' | 'strict'>('research');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiEditInstruction, setAiEditInstruction] = useState('');
  const [isEditingAi, setIsEditingAi] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [coverImage]);

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchArticle = async () => {
        const docRef = doc(db, 'articles', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || '');
          setContent(data.content || '');
          setExcerpt(data.excerpt || '');
          setCoverImage(data.coverImage || '');
          setStatus(data.status || 'draft');
          setSelectedCategories(data.categories || []);
          setTags((data.tags || []).join(', '));
        }
      };
      fetchArticle();
    }
  }, [id]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const generateSlug = (text: string) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleAIGenerate = async () => {
    if (!aiTopic) return alert('Please enter a topic to research');
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, mode: aiMode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      
      if (data.title) setTitle(data.title);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.content) setContent(data.content);
      
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIEdit = async () => {
    if (!aiEditInstruction) return alert('Please enter an instruction');
    if (!content && !title) return alert('No content to edit');
    
    setIsEditingAi(true);
    try {
      const res = await fetch('/api/edit-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, excerpt, content, instruction: aiEditInstruction })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to edit');
      
      if (data.title) setTitle(data.title);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.content) setContent(data.content);
      
      setAiEditInstruction('');
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsEditingAi(false);
    }
  };

  const handleSave = async () => {
    if (!title) return alert('Title is required');

    setLoading(true);
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    const slug = generateSlug(title);

    const articleData = {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      status,
      categories: selectedCategories,
      tags: tagsArray,
      authorId: 'admin_user',
      authorName: 'Admin',
      updatedAt: new Date().toISOString(),
    };

    try {
      if (id && id !== 'new') {
        await updateDoc(doc(db, 'articles', id), articleData);
      } else {
        await addDoc(collection(db, 'articles'), {
          ...articleData,
          views: 0,
          createdAt: new Date().toISOString(),
        });
      }
      navigate('/admin/articles');
    } catch (error) {
      console.error("Error saving article:", error);
      alert("Failed to save article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/articles" className="p-2 hover:bg-white/10 rounded-sm transition-colors">
            <ArrowLeft size={20} className="text-white/60" />
          </Link>
          <h1 className="text-[var(--text-dark)]xl font-black uppercase tracking-widest text-white">{id && id !== 'new' ? 'Edit Article' : 'New Article'}</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-[var(--accent)] text-black px-6 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--bg-card)] p-6 rounded-sm border border-[var(--border-color)]">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-2">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border-color)] bg-[var(--bg-input)] text-white rounded-sm focus:outline-none focus:border-white/40 font-bold text-lg"
              placeholder="Article Title"
            />
          </div>

          <div className="bg-[var(--bg-card)] p-6 rounded-sm border border-[var(--border-color)]">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-4">Content</label>
            <div className="h-96 pb-12 rounded-sm overflow-hidden">
              <RichTextEditor 
                value={content} 
                onChange={setContent}
              />
            </div>
          </div>
          
          <div className="bg-[var(--bg-card)] p-6 rounded-sm border border-[var(--border-color)]">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-2">Excerpt (for homepage & SEO)</label>
            <textarea 
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-input)] text-white rounded-sm focus:outline-none focus:border-white/40"
              placeholder="Brief summary of the article..."
            />
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] p-6 rounded-sm border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <h3 className="flex items-center gap-2 font-black uppercase tracking-widest text-purple-400 mb-4">
              <Sparkles size={16} />
              AI Journalist
            </h3>
            <p className="text-[10px] text-white/50 mb-4 leading-relaxed">
              Have our AI research the latest news, or strictly format the exact info you provide.
            </p>
            
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setAiMode('research')}
                className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-sm border transition-colors ${aiMode === 'research' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-transparent border-[var(--border-color)] text-white/50 hover:text-white'}`}
              >
                Research News
              </button>
              <button 
                onClick={() => setAiMode('strict')}
                className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-sm border transition-colors ${aiMode === 'strict' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-transparent border-[var(--border-color)] text-white/50 hover:text-white'}`}
              >
                Strict Format
              </button>
            </div>

            <textarea 
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              rows={4}
              className="w-full mb-4 px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-input)] text-white rounded-sm focus:outline-none focus:border-purple-500/50 resize-none text-sm"
              placeholder={aiMode === 'research' ? "e.g. Latest 8-Ball World Championship Results" : "Paste your exact raw text or bullet points here to be formatted into an article..."}
            />
            <button
              onClick={handleAIGenerate}
              disabled={isGenerating || !aiTopic}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest hover:bg-purple-500 transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Researching & Writing...' : 'Generate Article'}
            </button>
          </div>

          <div className="bg-[var(--bg-card)] p-6 rounded-sm border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <h3 className="flex items-center gap-2 font-black uppercase tracking-widest text-blue-400 mb-4">
              <Wand2 size={16} />
              AI Editor
            </h3>
            <p className="text-[10px] text-white/50 mb-4 leading-relaxed">
              Refine your current article. Ask the AI to fix grammar, change the tone, or expand on specific paragraphs.
            </p>
            <textarea 
              value={aiEditInstruction}
              onChange={(e) => setAiEditInstruction(e.target.value)}
              rows={3}
              className="w-full mb-4 px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-input)] text-white rounded-sm focus:outline-none focus:border-blue-500/50"
              placeholder="e.g. Make the tone more professional and expand the conclusion."
            />
            <button
              onClick={handleAIEdit}
              disabled={isEditingAi || !aiEditInstruction || (!content && !title)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isEditingAi ? 'Editing Article...' : 'Refine with AI'}
            </button>
          </div>

          <div className="bg-[var(--bg-card)] p-6 rounded-sm border border-[var(--border-color)]">
            <h3 className="font-black uppercase tracking-widest text-white mb-4">Publishing</h3>
            
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-2">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full mb-4 px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-input)] text-white rounded-sm focus:outline-none focus:border-white/40"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
            
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-2">Cover Image URL</label>
            <input 
              type="url" 
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-input)] text-white rounded-sm focus:outline-none focus:border-white/40"
              placeholder="https://..."
            />
            {coverImage && (
              <div className="mt-3 space-y-2">
                {!imageError ? (
                  <img 
                    src={coverImage} 
                    alt="Cover preview" 
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-full h-32 object-cover rounded-sm border border-[var(--border-color)]" 
                  />
                ) : (
                  <div className="w-full h-32 bg-[#1a1a1a] flex flex-col items-center justify-center rounded-sm border border-red-500/50 text-red-400">
                    <span className="block mb-1 text-xs">Image failed to load</span>
                  </div>
                )}
                {imageError && (
                  <p className="text-[10px] text-red-400 leading-tight">
                    Ensure you paste a direct link to an image file (e.g. ends in .jpg or .png), not a webpage link. Some hosts may also block external embedding.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-card)] p-6 rounded-sm border border-[var(--border-color)]">
            <h3 className="font-black uppercase tracking-widest text-white mb-4">Categories</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {CATEGORIES.map(category => (
                <label key={category} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="rounded-sm bg-[var(--bg-input)] border-[var(--border-color)] text-white focus:ring-white/40"
                  />
                  <span className="text-[11px] font-bold text-white/60 group-hover:text-white transition-colors uppercase">{category}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="bg-[var(--bg-card)] p-6 rounded-sm border border-[var(--border-color)]">
            <h3 className="font-black uppercase tracking-widest text-white mb-4">Tags</h3>
            <input 
              type="text" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-input)] text-white rounded-sm focus:outline-none focus:border-white/40"
              placeholder="e.g. pool, tournament, final (comma separated)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
