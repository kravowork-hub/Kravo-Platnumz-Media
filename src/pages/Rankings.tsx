import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Discipline } from '../types';
import { Helmet } from 'react-helmet-async';
import { Trophy, Loader2 } from 'lucide-react';

export function Rankings() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const docRef = doc(db, 'settings', 'rankings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().disciplines) {
          const list: Discipline[] = docSnap.data().disciplines;
          setDisciplines(list);
          if (list.length > 0) setActiveId(list[0].id);
        }
      } catch (error) {
        console.error('Error fetching rankings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  const activeDiscipline = disciplines.find(d => d.id === activeId);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-[var(--accent)]" size={28} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 bg-[var(--bg-main)] min-h-screen">
      <Helmet>
        <title>World Rankings | PLATNUMZ CUESPORT by Kravo</title>
        <meta property="og:title" content="World Rankings | PLATNUMZ CUESPORT" />
        <meta property="og:description" content="Official cue sports rankings across every discipline." />
      </Helmet>

      <section className="text-center pt-10 pb-6 px-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-center gap-2 mb-3 text-[var(--accent)]">
          <Trophy size={20} />
          <span className="text-[11px] font-black uppercase tracking-widest">Official Standings</span>
        </div>
        <h1 className="text-3xl md:text-4xl brand-wordmark text-[var(--text-main)]">World Rankings</h1>
      </section>

      {disciplines.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-main)]/50 text-sm font-bold uppercase tracking-widest">
          Rankings coming soon.
        </div>
      ) : (
        <>
          {/* Discipline selector */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-6">
            {disciplines.map(d => (
              <button
                key={d.id}
                onClick={() => setActiveId(d.id)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border transition-colors ${
                  activeId === d.id
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
                    : 'border-[var(--border-color)] text-[var(--text-main)]/60 hover:text-[var(--text-main)] hover:border-[var(--border-hover)]'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {activeDiscipline && (
            <div className="px-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm overflow-hidden">
                <div className="grid grid-cols-[50px_1fr_auto] gap-2 px-4 py-3 bg-[var(--bg-input)] border-b border-[var(--border-color)] text-[9px] font-black uppercase tracking-widest text-[var(--text-main)]/50">
                  <span>Rank</span>
                  <span>Player</span>
                  <span>Points</span>
                </div>
                {activeDiscipline.rankings.length === 0 ? (
                  <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest text-[var(--text-main)]/40">
                    No rankings added for this discipline yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-color)]">
                    {[...activeDiscipline.rankings].sort((a, b) => a.rank - b.rank).map(player => (
                      <div key={player.id} className="grid grid-cols-[50px_1fr_auto] gap-2 px-4 py-3 items-center hover:bg-[var(--bg-input)] transition-colors">
                        <span className="text-lg font-black text-[var(--accent)]">#{player.rank}</span>
                        <div>
                          <div className="text-sm font-bold text-[var(--text-main)]">{player.name}</div>
                          {player.club && <div className="text-[10px] text-[var(--text-main)]/40 uppercase tracking-wide">{player.club}</div>}
                        </div>
                        <span className="text-sm font-black text-[var(--text-main)]/70 whitespace-nowrap">{player.points || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {activeDiscipline.updatedAt && (
                <p className="text-[10px] text-[var(--text-main)]/30 uppercase tracking-widest mt-4 text-right">
                  Last updated {new Date(activeDiscipline.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
