import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Plus, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../../types';

export function AdminCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const docRef = doc(db, 'settings', 'categories');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().list) {
        setCategories(docSnap.data().list);
      } else {
        // Fallback to default
        setCategories([...DEFAULT_CATEGORIES]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setMessage({ type: 'error', text: 'Failed to load categories' });
      setCategories([...DEFAULT_CATEGORIES]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const docRef = doc(db, 'settings', 'categories');
      await setDoc(docRef, { list: categories, updatedAt: new Date().toISOString() });
      setMessage({ type: 'success', text: 'Categories saved successfully!' });
    } catch (error) {
      console.error('Error saving categories:', error);
      setMessage({ type: 'error', text: 'Failed to save categories' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
      setMessage({ type: 'error', text: 'Category already exists' });
      return;
    }
    setCategories([...categories, newCategory.trim()]);
    setNewCategory('');
    setMessage({ type: '', text: '' });
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setCategories(categories.filter(c => c !== catToRemove));
    setMessage({ type: 'success', text: `Removed "${catToRemove}". Click Save Changes to apply.` });
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= categories.length) return;
    const newCats = [...categories];
    const temp = newCats[index];
    newCats[index] = newCats[index + direction];
    newCats[index + direction] = temp;
    setCategories(newCats);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-[var(--border-color)] pb-4">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Categories</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setCategories([...DEFAULT_CATEGORIES]);
              setMessage({ type: 'success', text: 'Categories reset to defaults. Click Save Changes to apply.' });
            }}
            className="text-white/50 hover:text-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors"
          >
            Reset to Defaults
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[var(--accent)] text-black px-6 py-2 rounded-sm font-black uppercase tracking-widest text-[11px] hover:bg-white transition-colors flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
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

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm p-6 mb-8">
        <h2 className="text-[12px] font-black uppercase tracking-widest text-white mb-4">Add New Category</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="e.g. European Tour"
            className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategory.trim()}
            className="bg-[var(--bg-input)] border border-[var(--border-color)] text-white hover:text-[var(--accent)] hover:border-[var(--accent)] font-bold uppercase tracking-widest text-[11px] px-6 py-2 rounded-sm transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm overflow-hidden">
        <div className="bg-[var(--bg-input)] p-4 border-b border-[var(--border-color)]">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-white/50">Current Categories (Drag order not supported, use arrows)</h2>
        </div>
        <div className="divide-y divide-white/5">
          {categories.map((cat, index) => (
            <div key={cat} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
              <span className="text-sm font-bold text-white">{cat}</span>
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => moveCategory(index, -1)}
                    disabled={index === 0}
                    className="text-white/30 hover:text-[var(--accent)] disabled:opacity-30 disabled:hover:text-white/30"
                  >
                    ▲
                  </button>
                  <button 
                    onClick={() => moveCategory(index, 1)}
                    disabled={index === categories.length - 1}
                    className="text-white/30 hover:text-[var(--accent)] disabled:opacity-30 disabled:hover:text-white/30"
                  >
                    ▼
                  </button>
                </div>
                <button 
                  onClick={() => handleRemoveCategory(cat)}
                  className="text-red-500/80 hover:text-red-400 p-2 bg-red-500/10 rounded-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest text-white/50">
              No categories found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
