import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Trophy, CheckCircle2, AlertCircle, Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { TournamentMatch, LiveScoreData } from '../../types';

export function AdminScores() {
  const [data, setData] = useState<LiveScoreData>({
    tournamentName: '',
    matches: [],
    updatedAt: new Date().toISOString()
  });
  
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'success' });

  useEffect(() => {
    async function loadScores() {
      try {
        const docRef = doc(db, 'settings', 'live_scores');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const loadedData = docSnap.data() as LiveScoreData;
          if (loadedData.matches) {
            setData(loadedData);
          }
        }
      } catch (error) {
        console.error("Error loading scores", error);
      } finally {
        setLoading(false);
      }
    }
    loadScores();
  }, []);

  const handleProcessAI = async () => {
    if (!rawText.trim()) return;
    
    setIsProcessing(true);
    setMessage({ text: '', type: 'success' });

    try {
      const response = await fetch('/api/parse-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawText,
          currentTournament: data.tournamentName
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to process');

      setData(prev => ({
        ...prev,
        tournamentName: result.tournamentName || prev.tournamentName,
        // Append new matches or you could replace, let's append for now and let user delete
        matches: [...result.matches, ...prev.matches]
      }));
      setRawText('');
      setMessage({ text: 'AI successfully extracted matches!', type: 'success' });
    } catch (error: any) {
      console.error(error);
      setMessage({ text: error.message || 'An error occurred while processing', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: 'success' });
    
    try {
      const dataToSave = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'settings', 'live_scores'), dataToSave);
      setMessage({ text: 'Live scores saved successfully!', type: 'success' });
    } catch (error) {
      console.error("Error saving scores", error);
      setMessage({ text: 'Error saving scores. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const removeMatch = (id: string) => {
    setData(prev => ({
      ...prev,
      matches: prev.matches.filter(m => m.id !== id)
    }));
  };

  const updateMatch = (id: string, field: keyof TournamentMatch, value: string) => {
    setData(prev => ({
      ...prev,
      matches: prev.matches.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  const addNewMatch = () => {
    const newMatch: TournamentMatch = {
      id: Math.random().toString(36).substr(2, 9),
      player1: '',
      player2: '',
      score1: '',
      score2: '',
      status: 'upcoming',
      matchInfo: ''
    };
    setData(prev => ({ ...prev, matches: [newMatch, ...prev.matches] }));
  };

  if (loading) return <div className="text-[var(--text-main)] text-[11px] font-bold uppercase tracking-widest">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8 border-b border-[var(--border-color)] pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-[var(--text-dark)] text-xl font-black uppercase tracking-widest flex items-center gap-2">
            <Trophy className="text-[var(--accent)]" />
            Live Scores Manager
          </h1>
          <p className="text-[11px] text-white/50 uppercase tracking-widest mt-2">
            Type natural text and let AI organize the tournament scores.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--accent)] text-black px-6 py-2 rounded-sm font-black uppercase tracking-widest text-[11px] hover:bg-white transition-colors flex items-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {isSaving ? 'Saving...' : 'Save All Changes'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: AI Input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm p-4">
            <h2 className="text-[12px] font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--accent)]" /> 
              AI Score Assistant
            </h2>
            <p className="text-[10px] text-white/50 leading-relaxed mb-4">
              Paste tournament updates, results, or upcoming fixtures here. The AI will extract the details and add them to your board.
            </p>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. O'Sullivan just beat Trump 5-2. Tomorrow Higgins plays Selby at 8pm..."
              className="w-full h-40 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm p-3 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition-colors mb-4 resize-none"
            />
            <button
              onClick={handleProcessAI}
              disabled={isProcessing || !rawText.trim()}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-white hover:text-[var(--accent)] hover:border-[var(--accent)] font-bold uppercase tracking-widest text-[10px] py-3 rounded-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isProcessing ? 'Processing...' : 'Process with AI'}
            </button>
          </div>
        </div>

        {/* Right Side: Data Board */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm p-4">
             <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
              Tournament Name
            </label>
            <input
              type="text"
              value={data.tournamentName}
              onChange={(e) => setData({ ...data, tournamentName: e.target.value })}
              placeholder="e.g., World Snooker Championship 2026"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition-colors font-bold"
            />
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[12px] font-black uppercase tracking-widest text-white">
                Match Board
              </h2>
              <button 
                onClick={addNewMatch}
                className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors"
              >
                <Plus size={12} /> Add Manual Match
              </button>
            </div>

            <div className="space-y-3">
              {data.matches.map((match) => (
                <div key={match.id} className="bg-[var(--bg-input)] border border-white/5 p-3 rounded-sm flex flex-col md:flex-row gap-3 relative group">
                  
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <input 
                        type="text" 
                        value={match.player1} 
                        onChange={e => updateMatch(match.id, 'player1', e.target.value)}
                        placeholder="Player 1"
                        className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={match.player2} 
                        onChange={e => updateMatch(match.id, 'player2', e.target.value)}
                        placeholder="Player 2"
                        className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={match.score1} 
                      onChange={e => updateMatch(match.id, 'score1', e.target.value)}
                      placeholder="0"
                      className="w-10 text-center bg-[#111] border border-white/10 rounded-sm py-1 text-sm text-[var(--accent)] font-bold focus:outline-none focus:border-[var(--accent)]"
                    />
                    <span className="text-white/30 text-xs">-</span>
                    <input 
                      type="text" 
                      value={match.score2} 
                      onChange={e => updateMatch(match.id, 'score2', e.target.value)}
                      placeholder="0"
                      className="w-10 text-center bg-[#111] border border-white/10 rounded-sm py-1 text-sm text-[var(--accent)] font-bold focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={match.status}
                      onChange={e => updateMatch(match.id, 'status', e.target.value as any)}
                      className="bg-[#111] border border-white/10 rounded-sm px-2 py-1 text-xs text-white uppercase tracking-widest focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                    </select>
                    
                    <input 
                      type="text" 
                      value={match.matchInfo} 
                      onChange={e => updateMatch(match.id, 'matchInfo', e.target.value)}
                      placeholder="e.g. Final, 8pm"
                      className="w-24 bg-transparent border-b border-white/10 px-1 py-1 text-xs text-white/70 focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <button 
                    onClick={() => removeMatch(match.id)}
                    className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {data.matches.length === 0 && (
                <div className="text-center py-8 text-white/30 text-[10px] uppercase tracking-widest font-bold">
                  No matches added yet. Use the AI or add manually.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
