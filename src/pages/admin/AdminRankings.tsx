import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Discipline, RankingPlayer } from '../../types';
import { Loader2, Plus, Save, Trash2, CheckCircle2, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export function AdminRankings() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [newDisciplineName, setNewDisciplineName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rawTexts, setRawTexts] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const docRef = doc(db, 'settings', 'rankings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().disciplines) {
        setDisciplines(docSnap.data().disciplines);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setMessage({ type: 'error', text: 'Failed to load rankings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const docRef = doc(db, 'settings', 'rankings');
      await setDoc(docRef, { disciplines, updatedAt: new Date().toISOString() });
      setMessage({ type: 'success', text: 'Rankings saved successfully!' });
    } catch (error) {
      console.error('Error saving rankings:', error);
      setMessage({ type: 'error', text: 'Failed to save rankings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDiscipline = () => {
    if (!newDisciplineName.trim()) return;
    const newDiscipline: Discipline = {
      id: crypto.randomUUID(),
      name: newDisciplineName.trim(),
      rankings: [],
      updatedAt: new Date().toISOString()
    };
    setDisciplines([...disciplines, newDiscipline]);
    setNewDisciplineName('');
    setExpandedId(newDiscipline.id);
  };

  const handleRemoveDiscipline = (id: string) => {
    setDisciplines(disciplines.filter(d => d.id !== id));
  };

  const handleAddPlayer = (disciplineId: string) => {
    setDisciplines(disciplines.map(d => {
      if (d.id !== disciplineId) return d;
      const nextRank = d.rankings.length > 0 ? Math.max(...d.rankings.map(p => p.rank)) + 1 : 1;
      const newPlayer: RankingPlayer = { id: crypto.randomUUID(), rank: nextRank, name: '', points: '' };
      return { ...d, rankings: [...d.rankings, newPlayer], updatedAt: new Date().toISOString() };
    }));
  };

  const handleUpdatePlayer = (disciplineId: string, playerId: string, field: keyof RankingPlayer, value: string) => {
    setDisciplines(disciplines.map(d => {
      if (d.id !== disciplineId) return d;
      return {
        ...d,
        rankings: d.rankings.map(p => p.id === playerId ? { ...p, [field]: field === 'rank' ? Number(value) || 0 : value } : p),
        updatedAt: new Date().toISOString()
      };
    }));
  };

  const handleRemovePlayer = (disciplineId: string, playerId: string) => {
    setDisciplines(disciplines.map(d => {
      if (d.id !== disciplineId) return d;
      return { ...d, rankings: d.rankings.filter(p => p.id !== playerId), updatedAt: new Date().toISOString() };
    }));
  };

  const handleAIImport = async (disciplineId: string) => {
    const rawText = rawTexts[disciplineId];
    if (!rawText || !rawText.trim()) return;

    setProcessing(prev => ({ ...prev, [disciplineId]: true }));
    setMessage({ type: '', text: '' });

    try {
      const discipline = disciplines.find(d => d.id === disciplineId);
      const response = await fetch('/api/parse-rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          disciplineName: discipline?.name,
          currentRankings: JSON.stringify(discipline?.rankings || [])
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to process AI request');
      }

      const result = await response.json();

      if (result.rankings && Array.isArray(result.rankings)) {
        setDisciplines(prev => prev.map(d => {
          if (d.id !== disciplineId) return d;
          const parsed: RankingPlayer[] = result.rankings.map((p: any) => ({
            id: crypto.randomUUID(),
            rank: Number(p.rank) || 0,
            name: p.name || '',
            flag: p.flag || '',
            points: p.points || '',
            club: p.club || ''
          }));
          return { ...d, rankings: parsed, updatedAt: new Date().toISOString() };
        }));
        setRawTexts(prev => ({ ...prev, [disciplineId]: '' }));
        setMessage({ type: 'success', text: 'AI import complete! Review the list, then click Save Changes.' });
      }
    } catch (error: any) {
      console.error('AI ranking import error:', error);
      setMessage({ type: 'error', text: error.message || 'AI import failed.' });
    } finally {
      setProcessing(prev => ({ ...prev, [disciplineId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-0 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Rankings</h1>
          <p className="text-sm text-white/40 mt-1">Manage disciplines and player rankings shown on the public Rankings page.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--accent)] text-black px-6 py-2 rounded-sm font-black uppercase tracking-widest text-[11px] hover:bg-white transition-colors flex items-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
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

      {/* Add discipline */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm p-6 mb-8">
        <h2 className="text-[12px] font-black uppercase tracking-widest text-white mb-4">Add New Discipline</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newDisciplineName}
            onChange={(e) => setNewDisciplineName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDiscipline()}
            placeholder="e.g. 9-Ball, Snooker, Heyball, 8-Ball"
            className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <button
            onClick={handleAddDiscipline}
            disabled={!newDisciplineName.trim()}
            className="bg-[var(--bg-input)] border border-[var(--border-color)] text-white hover:text-[var(--accent)] hover:border-[var(--accent)] font-bold uppercase tracking-widest text-[11px] px-6 py-2 rounded-sm transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Disciplines list */}
      <div className="space-y-4">
        {disciplines.map(discipline => {
          const isExpanded = expandedId === discipline.id;
          return (
            <div key={discipline.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : discipline.id)}
                className="w-full flex justify-between items-center p-4 bg-[var(--bg-input)] hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-black uppercase tracking-widest text-white">{discipline.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{discipline.rankings.length} players</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleRemoveDiscipline(discipline.id); }}
                    className="text-red-500/80 hover:text-red-400 p-1"
                  >
                    <Trash2 size={16} />
                  </span>
                  {isExpanded ? <ChevronUp size={18} className="text-white/50" /> : <ChevronDown size={18} className="text-white/50" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 border-t border-[var(--border-color)]">
                  {/* AI Import */}
                  <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-[var(--accent)]" />
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-white">AI Ranking Import</h3>
                    </div>
                    <p className="text-[11px] text-white/40 mb-3">
                      Paste a ranking list from anywhere (a press release, spreadsheet text, or notes). The AI will structure it into ranked entries for this discipline. This replaces the current list below once imported — review before saving.
                    </p>
                    <textarea
                      value={rawTexts[discipline.id] || ''}
                      onChange={(e) => setRawTexts(prev => ({ ...prev, [discipline.id]: e.target.value }))}
                      placeholder="e.g. 1. Aloysius Yapp (SGP) - 620 pts&#10;2. Carlo Biado (PHI) - 590 pts&#10;..."
                      rows={4}
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition-colors mb-3"
                    />
                    <button
                      onClick={() => handleAIImport(discipline.id)}
                      disabled={processing[discipline.id] || !rawTexts[discipline.id]?.trim()}
                      className="bg-[var(--accent)] text-black px-5 py-2 rounded-sm font-black uppercase tracking-widest text-[11px] hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {processing[discipline.id] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {processing[discipline.id] ? 'Processing...' : 'Generate Rankings with AI'}
                    </button>
                  </div>

                  {/* Manual list */}
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white/50">Manual Entries</h3>
                    <button
                      onClick={() => handleAddPlayer(discipline.id)}
                      className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:text-white flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Player
                    </button>
                  </div>

                  <div className="space-y-2">
                    {[...discipline.rankings].sort((a, b) => a.rank - b.rank).map(player => (
                      <div key={player.id} className="grid grid-cols-[60px_1fr_100px_auto] gap-2 items-center">
                        <input
                          type="number"
                          value={player.rank}
                          onChange={(e) => handleUpdatePlayer(discipline.id, player.id, 'rank', e.target.value)}
                          className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-[var(--accent)]"
                        />
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handleUpdatePlayer(discipline.id, player.id, 'name', e.target.value)}
                          placeholder="Player name"
                          className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent)]"
                        />
                        <input
                          type="text"
                          value={player.points || ''}
                          onChange={(e) => handleUpdatePlayer(discipline.id, player.id, 'points', e.target.value)}
                          placeholder="Points"
                          className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent)]"
                        />
                        <button
                          onClick={() => handleRemovePlayer(discipline.id, player.id)}
                          className="text-red-500/80 hover:text-red-400 p-2"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    {discipline.rankings.length === 0 && (
                      <p className="text-[11px] text-white/30 uppercase tracking-widest py-4 text-center">No players yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {disciplines.length === 0 && (
          <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest text-white/50 border border-dashed border-[var(--border-color)] rounded-sm">
            No disciplines yet. Add one above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
