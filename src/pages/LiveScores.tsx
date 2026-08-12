import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Circle } from 'lucide-react';
import { LiveScoreData, TournamentMatch } from '../types';

export function LiveScores() {
  const [data, setData] = useState<LiveScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      try {
        const docRef = doc(db, 'settings', 'live_scores');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data() as LiveScoreData);
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

  if (!data || !data.matches || data.matches.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Trophy size={48} className="mx-auto text-white/20 mb-4" />
        <h2 className="text-xl font-black uppercase tracking-widest text-white/50">No Live Tournaments</h2>
        <p className="text-white/30 text-sm mt-2">Check back later for live scores and match updates.</p>
      </div>
    );
  }

  const liveMatches = data.matches.filter(m => m.status === 'live');
  const upcomingMatches = data.matches.filter(m => m.status === 'upcoming');
  const completedMatches = data.matches.filter(m => m.status === 'completed');

  const MatchCard = ({ match }: { match: TournamentMatch }) => (
    <div className="bg-[var(--bg-card)] border border-[var(--border-hover)] rounded-sm p-4 hover:border-white/20 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">{match.matchInfo}</span>
        {match.status === 'live' && (
          <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm flex items-center gap-1">
            <Circle size={8} className="animate-pulse fill-red-500" /> Live
          </span>
        )}
        {match.status === 'completed' && (
          <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Final</span>
        )}
        {match.status === 'upcoming' && (
          <span className="text-[var(--accent)] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border border-[var(--accent)]/30 bg-[var(--accent)]/10">Upcoming</span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className={`text-sm font-bold ${match.status === 'completed' && match.score1 > match.score2 ? 'text-white' : 'text-white/70'}`}>
            {match.player1}
          </span>
          <span className="text-xl font-black text-white">{match.score1}</span>
        </div>
        <div className="h-[1px] w-full bg-white/5"></div>
        <div className="flex justify-between items-center">
          <span className={`text-sm font-bold ${match.status === 'completed' && match.score2 > match.score1 ? 'text-white' : 'text-white/70'}`}>
            {match.player2}
          </span>
          <span className="text-xl font-black text-white">{match.score2}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-12 border-b border-[var(--border-color)] pb-6 text-center">
        <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-[var(--text-main)] mb-2">
          {data.tournamentName || "Live Scores"}
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">
          Real-time Match Updates
        </p>
      </div>

      <div className="space-y-12">
        {liveMatches.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
              <Circle size={12} className="animate-pulse fill-red-500" /> Live Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map(match => <MatchCard key={match.id} match={match} />)}
            </div>
          </section>
        )}

        {upcomingMatches.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--accent)] mb-4 flex items-center gap-2">
              Upcoming Matches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map(match => <MatchCard key={match.id} match={match} />)}
            </div>
          </section>
        )}

        {completedMatches.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-white/50 mb-4">
              Recent Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
              {completedMatches.map(match => <MatchCard key={match.id} match={match} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
