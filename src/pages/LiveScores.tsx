import React from 'react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Circle } from 'lucide-react';
import { LiveScoreData, TournamentData, TournamentMatch } from '../types';

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
    return <div className="min-h-[50vh] flex items-center justify-center text-[var(--text-main)] text-[11px] font-bold uppercase tracking-widest">Loading Scores...</div>;
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

  const renderFlag = (code?: string) => {
    if (!code) return null;
    return (
      <img 
        src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} 
        alt={code}
        className="w-5 h-auto inline-block rounded-[1px] opacity-80"
      />
    );
  };

  const MatchCard: React.FC<{ match: TournamentMatch }> = ({ match }) => (
    <div className="bg-[#0b1325] border border-white/5 rounded-lg p-0 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#121c32] border-b border-white/5">
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#eab308] bg-[#eab308]/10 px-2 py-1 rounded-sm">
            {match.matchInfo || "Table TBD"}
          </span>
          {match.category && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              {match.category}
            </span>
          )}
        </div>
        
        {match.status === 'live' && (
          <span className="bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1">
            <Circle size={8} className="animate-pulse fill-white" /> LIVE
          </span>
        )}
        {match.status === 'completed' && (
          <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded-sm">FINAL</span>
        )}
        {match.status === 'upcoming' && (
          <span className="text-white/70 text-[9px] font-bold uppercase tracking-widest bg-white/10 px-2 py-1 rounded-sm">SCHEDULED</span>
        )}
      </div>
      
      {/* Players & Scores */}
      <div className="p-4 flex flex-col gap-0 relative">
        {/* Player 1 */}
        <div className="flex justify-between items-center py-2 relative z-10">
          <div className="flex items-center gap-3">
             {renderFlag(match.player1Flag) || <div className="w-5 h-3.5 bg-white/10 rounded-[1px]"></div>}
             <span className={`text-base font-medium ${match.status === 'completed' && match.score1 > match.score2 ? 'text-white font-bold' : 'text-white/80'}`}>
               {match.player1 || "TBD"}
             </span>
          </div>
          <span className={`text-lg font-bold ${match.status === 'completed' && match.score1 > match.score2 ? 'text-white' : 'text-white/60'}`}>
            {match.score1 || "-"}
          </span>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/5 my-1"></div>

        {/* Player 2 */}
        <div className="flex justify-between items-center py-2 relative z-10">
          <div className="flex items-center gap-3">
            {renderFlag(match.player2Flag) || <div className="w-5 h-3.5 bg-white/10 rounded-[1px]"></div>}
            <span className={`text-base font-medium ${match.status === 'completed' && match.score2 > match.score1 ? 'text-white font-bold' : 'text-white/80'}`}>
              {match.player2 || "TBD"}
            </span>
          </div>
          <span className={`text-lg font-bold ${match.status === 'completed' && match.score2 > match.score1 ? 'text-white' : 'text-white/60'}`}>
            {match.score2 || "-"}
          </span>
        </div>
      </div>
    </div>
  );

  const TournamentSection: React.FC<{ tournament: TournamentData }> = ({ tournament }) => {
    const liveMatches = tournament.matches.filter(m => m.status === 'live');
    const upcomingMatches = tournament.matches.filter(m => m.status === 'upcoming');
    const completedMatches = tournament.matches.filter(m => m.status === 'completed');

    if (tournament.matches.length === 0) return null;

    return (
      <div className="mb-16">
        <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-color)] pb-4">
           <Trophy size={24} className="text-[var(--accent)]" />
           <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-[var(--text-main)]">
             {tournament.name}
           </h2>
           {tournament.status === 'ended' && (
             <span className="ml-4 text-xs font-bold uppercase tracking-widest text-white/50 border border-white/20 px-2 py-1 rounded-sm">Ended</span>
           )}
        </div>

        <div className="space-y-10">
          {liveMatches.length > 0 && (
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                <Circle size={10} className="animate-pulse fill-red-500" /> Live Now
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {liveMatches.map(match => <MatchCard key={match.id} match={match} />)}
              </div>
            </section>
          )}

          {upcomingMatches.length > 0 && (
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)] mb-4 flex items-center gap-2">
                Upcoming Fixtures
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcomingMatches.map(match => <MatchCard key={match.id} match={match} />)}
              </div>
            </section>
          )}

          {completedMatches.length > 0 && (
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-white/50 mb-4">
                Recent Results
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 opacity-75">
                {completedMatches.map(match => <MatchCard key={match.id} match={match} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {data.tournaments.map(tournament => (
        <TournamentSection key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}
