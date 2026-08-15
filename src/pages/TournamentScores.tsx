import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Circle, ArrowLeft } from 'lucide-react';
import { LiveScoreData, TournamentData, TournamentMatch } from '../types';

export function TournamentScores() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      try {
        const docRef = doc(db, 'settings', 'live_scores');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const firestoreData = docSnap.data();
          let allTournaments: TournamentData[] = [];
          if (firestoreData.tournaments) {
            allTournaments = firestoreData.tournaments;
          } else if (firestoreData.tournamentName) {
             allTournaments = [{
                  id: 'legacy',
                  name: firestoreData.tournamentName,
                  status: 'active',
                  matches: firestoreData.matches || []
             }];
          }
          
          const found = allTournaments.find(t => t.id === id);
          if (found) {
            setTournament(found);
          }
        }
      } catch (error) {
        console.error("Error fetching tournament:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchScores();
  }, [id]);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-[var(--text-main)] text-[11px] font-bold uppercase tracking-widest">Loading...</div>;
  }

  if (!tournament) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Trophy size={48} className="mx-auto text-white/20 mb-4" />
        <h2 className="text-xl font-black uppercase tracking-widest text-white/50">Tournament Not Found</h2>
        <button onClick={() => navigate('/scores')} className="text-[var(--accent)] text-sm mt-4 font-bold uppercase tracking-widest">Back to Tournaments</button>
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
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-0 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center px-2 py-1.5 md:px-4 md:py-2 bg-[var(--bg-input)] border-b border-[var(--border-color)]">
        <div className="flex gap-2 items-center">
          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#eab308] bg-[#eab308]/10 px-1 py-0.5 md:px-2 md:py-1 rounded-sm">
            {match.matchInfo || "Table TBD"}
          </span>
          {match.category && (
            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)] opacity-50 truncate max-w-[60px] md:max-w-none">
              {match.category}
            </span>
          )}
        </div>
        
        {match.status === 'live' && (
          <span className="bg-red-500 text-white text-[7px] md:text-[9px] font-black uppercase tracking-widest px-1 py-0.5 md:px-2 md:py-1 rounded-sm flex items-center gap-1">
            <Circle size={8} className="animate-pulse fill-white" /> LIVE
          </span>
        )}
        {match.status === 'completed' && (
          <span className="text-[var(--text-main)] opacity-70 text-[7px] md:text-[9px] font-bold uppercase tracking-widest bg-[var(--text-main)]/5 px-1 md:px-2 py-0.5 md:py-1 rounded-sm">FINAL</span>
        )}
        {match.status === 'upcoming' && (
          <span className="text-[var(--text-main)] opacity-70 text-[7px] md:text-[9px] font-bold uppercase tracking-widest bg-[var(--text-main)]/10 px-1 md:px-2 py-0.5 md:py-1 rounded-sm">SCHEDULED</span>
        )}
      </div>
      
      {/* Players & Scores */}
      <div className="p-2 md:p-4 flex flex-col gap-0 relative bg-[var(--bg-card)]">
        {/* Player 1 */}
        <div className="flex justify-between items-center py-2 relative z-10">
          <div className="flex items-center gap-3">
             {renderFlag(match.player1Flag) || <div className="w-5 h-3.5 bg-[var(--text-main)] opacity-10 rounded-[1px]"></div>}
             <span className={`text-xs md:text-base font-medium truncate max-w-[100px] md:max-w-[200px] ${match.status === 'completed' && match.score1 > match.score2 ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-main)] opacity-80'}`}>
               {match.player1 || "TBD"}
             </span>
          </div>
          <span className={`text-sm md:text-lg font-bold ${match.status === 'completed' && match.score1 > match.score2 ? 'text-[var(--text-main)]' : 'text-[var(--text-main)] opacity-60'}`}>
            {match.score1 || "-"}
          </span>
        </div>
        {/* Divider */}
        <div className="h-[1px] w-full bg-[var(--border-color)] my-1"></div>
        {/* Player 2 */}
        <div className="flex justify-between items-center py-2 relative z-10">
          <div className="flex items-center gap-3">
            {renderFlag(match.player2Flag) || <div className="w-5 h-3.5 bg-[var(--text-main)] opacity-10 rounded-[1px]"></div>}
            <span className={`text-xs md:text-base font-medium truncate max-w-[100px] md:max-w-[200px] ${match.status === 'completed' && match.score2 > match.score1 ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-main)] opacity-80'}`}>
              {match.player2 || "TBD"}
            </span>
          </div>
          <span className={`text-sm md:text-lg font-bold ${match.status === 'completed' && match.score2 > match.score1 ? 'text-[var(--text-main)]' : 'text-[var(--text-main)] opacity-60'}`}>
            {match.score2 || "-"}
          </span>
        </div>
      </div>
    </div>
  );

  const liveMatches = tournament.matches.filter(m => m.status === 'live');
  const upcomingMatches = tournament.matches.filter(m => m.status === 'upcoming');
  const completedMatches = tournament.matches.filter(m => m.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-6">
        <Link to="/scores" className="text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors w-fit">
          <ArrowLeft size={16} /> Back to Tournaments
        </Link>
      </div>
      
      <div className="mb-16">
        <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-color)] pb-4">
           <Trophy size={24} className="text-[var(--accent)]" />
           <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-[var(--text-main)]">
             {tournament.name}
           </h2>
           {tournament.status === 'ended' ? (
             <span className="ml-4 text-[10px] font-bold uppercase tracking-widest text-white/50 border border-white/20 px-2 py-1 rounded-sm">Ended</span>
           ) : (
             <span className="ml-4 text-[10px] font-bold uppercase tracking-widest text-red-500 border border-red-500/20 px-2 py-1 rounded-sm flex items-center gap-1"><Circle size={8} className="animate-pulse fill-red-500"/> Live</span>
           )}
        </div>
        
        {tournament.matches.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm font-bold uppercase tracking-widest">
            No matches scheduled yet
          </div>
        ) : (
          <div className="space-y-10">
            {liveMatches.length > 0 && (
              <section>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                  <Circle size={10} className="animate-pulse fill-red-500" /> Live Now
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                  {liveMatches.map(match => <MatchCard key={match.id} match={match} />)}
                </div>
              </section>
            )}
            
            {upcomingMatches.length > 0 && (
              <section>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)] mb-4 flex items-center gap-2">
                  Upcoming Fixtures
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                  {upcomingMatches.map(match => <MatchCard key={match.id} match={match} />)}
                </div>
              </section>
            )}
            
            {completedMatches.length > 0 && (
              <section>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white/50 mb-4">
                  Recent Results
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 opacity-75">
                  {completedMatches.map(match => <MatchCard key={match.id} match={match} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
