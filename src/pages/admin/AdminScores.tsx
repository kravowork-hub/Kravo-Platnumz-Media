import { useState, useEffect } from 'react';
import { Sparkles, Save, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Trophy, Settings } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LiveScoreData, TournamentData, TournamentMatch } from '../../types';

export function AdminScores() {
  const [data, setData] = useState<LiveScoreData>({
    tournaments: [],
    updatedAt: new Date().toISOString()
  });
  
  const [rawTexts, setRawTexts] = useState<Record<string, string>>({});
  const [processingStates, setProcessingStates] = useState<Record<string, boolean>>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const docRef = doc(db, 'settings', 'live_scores');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        if (firestoreData.tournaments) {
           setData(firestoreData as LiveScoreData);
        } else if (firestoreData.tournamentName) {
           // Migration path
           setData({
             tournaments: [
               {
                 id: crypto.randomUUID(),
                 name: firestoreData.tournamentName,
                 status: 'active',
                 matches: firestoreData.matches || [],
                 updatedAt: new Date().toISOString()
               }
             ],
             updatedAt: firestoreData.updatedAt
           });
        }
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
      setMessage({ type: 'error', text: 'Failed to load live scores' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessAITournament = async (tournamentId: string) => {
    const rawText = rawTexts[tournamentId];
    if (!rawText) return;
    
    setProcessingStates(prev => ({ ...prev, [tournamentId]: true }));
    setMessage({ type: '', text: '' });
    
    try {
      const currentTournament = data.tournaments.find(t => t.id === tournamentId);
      
      const response = await fetch('/api/parse-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawText, 
          currentTournament: JSON.stringify([currentTournament]) 
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to process AI request');
      }

      const result = await response.json();
      
      // Merge AI result with existing tournament
      if (result.tournaments && result.tournaments.length > 0) {
         const parsedTournament = result.tournaments[0]; // Take the first one found
         
         setData(prevData => ({
           ...prevData,
           tournaments: prevData.tournaments.map(t => {
             if (t.id === tournamentId) {
               // Intelligently merge matches
               const existingMatches = [...t.matches];
               const parsedMatches = parsedTournament.matches || [];
               
               parsedMatches.forEach((newMatch: TournamentMatch) => {
                 const existingIdx = existingMatches.findIndex(m => {
                   const m1 = (m.player1 || '').toLowerCase();
                   const m2 = (m.player2 || '').toLowerCase();
                   const n1 = (newMatch.player1 || '').toLowerCase();
                   const n2 = (newMatch.player2 || '').toLowerCase();
                   return (m1 === n1 && m2 === n2) || (m1 === n2 && m2 === n1);
                 });
                 
                 if (existingIdx >= 0) {
                   existingMatches[existingIdx] = { 
                     ...existingMatches[existingIdx], 
                     ...newMatch, 
                     id: existingMatches[existingIdx].id 
                   };
                 } else {
                   existingMatches.push({
                     ...newMatch,
                     id: crypto.randomUUID()
                   });
                 }
               });

               return {
                 ...t,
                 matches: existingMatches
               };
             }
             return t;
           }),
           updatedAt: new Date().toISOString()
         }));
         
         setRawTexts(prev => ({ ...prev, [tournamentId]: '' }));
         setMessage({ type: 'success', text: 'AI extraction complete! Review changes and save.' });
      }
    } catch (error: any) {
      console.error('AI Processing error:', error);
      setMessage({ type: 'error', text: error.message || 'AI processing failed.' });
    } finally {
      setProcessingStates(prev => ({ ...prev, [tournamentId]: false }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const docRef = doc(db, 'settings', 'live_scores');
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Live scores saved successfully!' });
    } catch (error) {
      console.error('Error saving scores:', error);
      setMessage({ type: 'error', text: 'Failed to save live scores' });
    } finally {
      setIsSaving(false);
    }
  };

  const addNewTournament = () => {
    const newTourney: TournamentData = {
      id: crypto.randomUUID(),
      name: 'New Tournament',
      status: 'active',
      matches: [], updatedAt: new Date().toISOString()
    };
    setData({
      ...data,
      tournaments: [newTourney, ...data.tournaments]
    });
  };

  const updateTournament = (tourneyId: string, field: keyof TournamentData, value: any) => {
    setData({
      ...data,
      tournaments: data.tournaments.map(t => t.id === tourneyId ? { ...t, [field]: value } : t)
    });
  };

  const removeTournament = (tourneyId: string) => {
    setData({
      ...data,
      tournaments: data.tournaments.filter(t => t.id !== tourneyId)
    });
    setMessage({ type: 'success', text: 'Tournament removed. Click Save to persist changes.' });
  };

  const addNewMatch = (tourneyId: string) => {
    const newMatch: TournamentMatch = {
      id: crypto.randomUUID(),
      player1: '',
      player1Flag: '',
      player2: '',
      player2Flag: '',
      score1: '0',
      score2: '0',
      status: 'upcoming',
      matchInfo: '',
      category: ''
    };
    setData({
      ...data,
      tournaments: data.tournaments.map(t => 
        t.id === tourneyId ? { ...t, matches: [...t.matches, newMatch] } : t
      )
    });
  };

  const updateMatch = (tourneyId: string, matchId: string, field: keyof TournamentMatch, value: any) => {
    setData({
      ...data,
      tournaments: data.tournaments.map(t => {
        if (t.id === tourneyId) {
          return {
            ...t,
            matches: t.matches.map(m => m.id === matchId ? { ...m, [field]: value } : m)
          };
        }
        return t;
      })
    });
  };

  const removeMatch = (tourneyId: string, matchId: string) => {
    setData({
      ...data,
      tournaments: data.tournaments.map(t => {
        if (t.id === tourneyId) {
          return {
            ...t,
            matches: t.matches.filter(m => m.id !== matchId)
          };
        }
        return t;
      })
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Live Scores Admin</h1>
          <p className="text-sm text-gray-400">Manage ongoing tournaments, AI parsing, and active matches.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--accent)] text-black px-6 py-2 rounded-sm font-black uppercase tracking-widest text-[11px] hover:bg-white transition-colors flex items-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
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

      <div className="grid grid-cols-1 gap-8">
        
        {/* Data Board */}
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
            <h2 className="text-[12px] font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Trophy size={14} className="text-[var(--accent)]"/>
              Active Tournaments
            </h2>
            <button 
              onClick={addNewTournament}
              className="bg-[var(--accent)] text-black px-4 py-2 rounded-sm font-black uppercase tracking-widest text-[10px] hover:bg-white transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> New Tournament
            </button>
          </div>

          {data.tournaments.map((tournament) => (
            <div key={tournament.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm overflow-hidden mb-6">
              {/* Tournament Header */}
              <div className="bg-[var(--bg-input)] p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 flex gap-4 items-center w-full">
                  <input
                    type="text"
                    value={tournament.name}
                    onChange={(e) => updateTournament(tournament.id, 'name', e.target.value)}
                    placeholder="Tournament Name"
                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent)] transition-colors font-bold"
                  />
                  <select
                    value={tournament.status}
                    onChange={(e) => updateTournament(tournament.id, 'status', e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm px-3 py-2 text-xs text-white uppercase tracking-widest focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => addNewMatch(tournament.id)}
                    className="bg-white/10 text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:bg-white/20 transition-colors whitespace-nowrap"
                  >
                    <Plus size={14} /> Add Match
                  </button>
                  <button 
                    onClick={() => removeTournament(tournament.id)}
                    className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-red-400 transition-colors whitespace-nowrap"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>

              {/* AI Score Assistant for this Tournament */}
              <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1 w-full">
                    <textarea
                      value={rawTexts[tournament.id] || ''}
                      onChange={(e) => setRawTexts(prev => ({ ...prev, [tournament.id]: e.target.value }))}
                      placeholder="Paste match results or fixtures for this tournament (e.g. O'Sullivan beat Trump 5-2)..."
                      className="w-full h-16 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm p-3 text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                    />
                  </div>
                  <button
                    onClick={() => handleProcessAITournament(tournament.id)}
                    disabled={processingStates[tournament.id] || !(rawTexts[tournament.id] || '').trim()}
                    className="w-full md:w-auto bg-[var(--bg-input)] border border-[var(--border-color)] text-white hover:text-[var(--accent)] hover:border-[var(--accent)] font-bold uppercase tracking-widest text-[10px] px-6 py-4 rounded-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 h-16"
                  >
                    {processingStates[tournament.id] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {processingStates[tournament.id] ? 'Parsing...' : 'AI Add Matches'}
                  </button>
                </div>
              </div>

              {/* Match List */}
              <div className="p-4 space-y-3">
                {tournament.matches.map((match) => (
                  <div key={match.id} className="bg-[var(--bg-main)] border border-[var(--border-color)] p-3 rounded-sm flex flex-col md:flex-row gap-3 relative group">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
                      <div className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          value={match.player1Flag || ''} 
                          onChange={e => updateMatch(tournament.id, match.id, 'player1Flag', e.target.value)}
                          placeholder="ZW"
                          className="w-10 bg-transparent border-b border-[var(--border-color)] px-1 py-1 text-xs text-[var(--text-main)] opacity-50 text-center uppercase focus:outline-none focus:border-[var(--accent)]"
                        />
                        <input 
                          type="text" 
                          value={match.player1 || ''} 
                          onChange={e => updateMatch(tournament.id, match.id, 'player1', e.target.value)}
                          placeholder="Player 1"
                          className="flex-1 bg-transparent border-b border-[var(--border-color)] px-1 py-1 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      
                      <div className="flex gap-2 items-center">
                         <input 
                          type="text" 
                          value={match.player2Flag || ''} 
                          onChange={e => updateMatch(tournament.id, match.id, 'player2Flag', e.target.value)}
                          placeholder="ZA"
                          className="w-10 bg-transparent border-b border-[var(--border-color)] px-1 py-1 text-xs text-[var(--text-main)] opacity-50 text-center uppercase focus:outline-none focus:border-[var(--accent)]"
                        />
                        <input 
                          type="text" 
                          value={match.player2 || ''} 
                          onChange={e => updateMatch(tournament.id, match.id, 'player2', e.target.value)}
                          placeholder="Player 2"
                          className="flex-1 bg-transparent border-b border-[var(--border-color)] px-1 py-1 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <input 
                          type="text" 
                          value={match.score1 || ''} 
                          onChange={e => updateMatch(tournament.id, match.id, 'score1', e.target.value)}
                          placeholder="0"
                          className="w-8 text-center bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm py-1 text-sm text-[var(--accent)] font-bold focus:outline-none focus:border-[var(--accent)]"
                        />
                        <span className="text-[var(--text-main)] opacity-30 text-xs">-</span>
                        <input 
                          type="text" 
                          value={match.score2 || ''} 
                          onChange={e => updateMatch(tournament.id, match.id, 'score2', e.target.value)}
                          placeholder="0"
                          className="w-8 text-center bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm py-1 text-sm text-[var(--accent)] font-bold focus:outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={match.status || 'upcoming'}
                          onChange={e => updateMatch(tournament.id, match.id, 'status', e.target.value as any)}
                          className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-sm px-2 py-1 text-[10px] text-[var(--text-main)] uppercase tracking-widest focus:outline-none focus:border-[var(--accent)]"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="live">Live</option>
                          <option value="completed">Completed</option>
                        </select>
                        <input 
                          type="text" 
                          value={match.category || ''} 
                          onChange={e => updateMatch(tournament.id, match.id, 'category', e.target.value)}
                          placeholder="Category"
                          className="w-20 bg-transparent border-b border-[var(--border-color)] px-1 py-1 text-[10px] text-[var(--accent)] uppercase tracking-widest focus:outline-none focus:border-[var(--accent)]"
                        />
                        <input 
                          type="text" 
                          value={match.matchInfo || ''} 
                          onChange={e => updateMatch(tournament.id, match.id, 'matchInfo', e.target.value)}
                          placeholder="Info (e.g. Final)"
                          className="w-20 bg-transparent border-b border-[var(--border-color)] px-1 py-1 text-xs text-[var(--text-main)] opacity-70 focus:outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => removeMatch(tournament.id, match.id)}
                      className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                
                {tournament.matches.length === 0 && (
                  <div className="text-center py-6 text-white/30 text-[10px] uppercase tracking-widest font-bold">
                    No matches in this tournament yet.
                  </div>
                )}
              </div>
            </div>
          ))}

          {data.tournaments.length === 0 && (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-sm text-white/30 text-[10px] uppercase tracking-widest font-bold">
              No active tournaments. Create one or use the AI Assistant.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
