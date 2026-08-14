import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Circle, Calendar, ChevronRight } from 'lucide-react';
import { LiveScoreData, TournamentData } from '../types';

export function LiveScores() {
  const [data, setData] = useState<LiveScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      try {
        const docRef = doc(db, 'settings', 'live_scores');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const firestoreData = docSnap.data();
          if (firestoreData.tournaments) {
            setData(firestoreData as LiveScoreData);
          } else if (firestoreData.tournamentName) {
            setData({
              tournaments: [
                {
                  id: 'legacy',
                  name: firestoreData.tournamentName,
                  status: 'active',
                  matches: firestoreData.matches || []
                }
              ],
              updatedAt: firestoreData.updatedAt
            });
          }
        }
      } catch (error) {
        console.error("Error fetching live scores:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchScores();
  }, []);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-[var(--text-main)] text-[11px] font-bold uppercase tracking-widest">Loading Tournaments...</div>;
  }

  if (!data || !data.tournaments || data.tournaments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Trophy size={48} className="mx-auto text-white/20 mb-4" />
        <h2 className="text-xl font-black uppercase tracking-widest text-white/50">No Live Tournaments</h2>
        <p className="text-white/30 text-sm mt-2">Check back later for live scores and match updates.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <Trophy size={28} className="text-[var(--accent)]" />
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[var(--text-main)]">
            Tournaments
          </h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.tournaments.map((tournament) => {
          const liveMatchesCount = tournament.matches.filter(m => m.status === 'live').length;
          
          return (
            <Link 
              key={tournament.id} 
              to={`/scores/${tournament.id}`}
              className="group bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent)] rounded-lg overflow-hidden transition-all duration-300 flex flex-col"
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  {tournament.status === 'active' ? (
                    <span className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1 border border-red-500/20">
                      <Circle size={8} className="animate-pulse fill-red-500" /> LIVE EVENT
                    </span>
                  ) : (
                    <span className="bg-white/5 text-white/50 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border border-white/10">
                      ENDED
                    </span>
                  )}
                  
                  {liveMatchesCount > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                      {liveMatchesCount} Match{liveMatchesCount !== 1 ? 'es' : ''} Live
                    </span>
                  )}
                </div>
                
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 line-clamp-2 flex-1 group-hover:text-[var(--accent)] transition-colors">
                  {tournament.name}
                </h2>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-widest">
                    <Calendar size={14} />
                    <span>{tournament.matches.length} Total Matches</span>
                  </div>
                  <ChevronRight size={18} className="text-white/30 group-hover:text-[var(--accent)] transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
