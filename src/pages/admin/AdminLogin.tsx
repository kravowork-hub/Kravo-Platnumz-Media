import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { ArrowLeft } from 'lucide-react';

export function AdminLogin() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (passcode.length < 6) {
      setError('Passcode must be at least 6 characters.');
      setLoading(false);
      return;
    }

    // Simulate authentication process
    setTimeout(() => {
      const success = login(passcode);
      if (success) {
        navigate('/admin');
      } else {
        setError('Incorrect passcode.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        Return to Homepage
      </Link>
      <div className="max-w-md w-full space-y-8 bg-[#0a0a0a] p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #444 0, #444 1px, transparent 0, transparent 10px)' }}></div>
        <div>
          <div className="mx-auto w-12 h-12 bg-[#C0C0C0] text-black rounded-sm flex items-center justify-center font-black text-2xl relative z-10">
            KP
          </div>
          <h2 className="mt-6 text-center text-3xl font-black uppercase tracking-widest text-white relative z-10">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-widest text-white/50 relative z-10">
            Enter your secure passcode
          </p>
        </div>
        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleAuth}>
          {error && (
            <div className="bg-red-900/50 text-red-400 p-3 text-[11px] font-bold uppercase tracking-widest border border-red-500/50 rounded-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#C0C0C0] mb-2 text-center">Passcode (Min 6 Characters)</label>
              <input
                type="password"
                required
                className="appearance-none rounded-sm relative block w-full px-3 py-3 border border-white/10 bg-[#111] placeholder-white/20 text-white focus:outline-none focus:border-white/40 focus:z-10 text-center text-2xl tracking-[0.2em]"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !passcode}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-[11px] font-black uppercase tracking-widest rounded-sm text-black bg-[#C0C0C0] hover:bg-white focus:outline-none disabled:opacity-70 transition-colors"
            >
              {loading ? 'Authenticating...' : 'Enter Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
