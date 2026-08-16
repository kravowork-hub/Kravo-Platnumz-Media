import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, Search, X, Radio, Video as VideoIcon, Trophy, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const docRef = doc(db, 'settings', 'categories');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().list) {
          setCategories(docSnap.data().list);
        }
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    fetchCategories();
  }, []);

  // Lock body scroll while the menu drawer is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  const primaryLinks = [
    { to: '/scores', label: 'Live Scores', icon: Radio, live: true },
    { to: '/rankings', label: 'Rankings', icon: Trophy },
    { to: '/videos', label: 'Videos', icon: VideoIcon },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans">
      {/* Header */}
      <header className="bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-lg text-[var(--text-main)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="https://i.imgur.com/77gpoV1.png" alt="Platnumz Cuesport Logo" className="h-10 md:h-12 w-auto object-contain" />
              <span className="brand-wordmark text-xl md:text-2xl text-[var(--text-main)] whitespace-nowrap">Platnumz Cuesport</span>
            </Link>

            <div className="flex items-center gap-2 md:gap-4">
              <form onSubmit={handleSearch} className="hidden sm:flex items-center bg-[var(--bg-input)] rounded px-3 py-1.5 border border-[var(--border-color)] focus-within:border-[var(--accent)]/50 transition-colors">
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-transparent border-none outline-none text-sm text-[var(--text-main)] px-2 w-32 md:w-48 placeholder:text-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {/* Hamburger Menu Trigger */}
              <button
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
                className="flex items-center gap-2 border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-main)] px-3 py-2 rounded-sm transition-colors"
              >
                <Menu size={20} />
                <span className="hidden md:inline text-[11px] font-black uppercase tracking-widest">Menu</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60]">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col animate-[slideIn_0.25s_ease-out]">
            <div className="h-16 md:h-20 flex items-center justify-between px-5 border-b border-[var(--border-color)]">
              <span className="brand-wordmark text-lg text-[var(--text-main)]">Menu</span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
                className="text-[var(--text-main)]/60 hover:text-[var(--text-main)] p-1"
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile search */}
            <form onSubmit={handleSearch} className="sm:hidden flex items-center bg-[var(--bg-input)] mx-5 mt-4 rounded px-3 py-2 border border-[var(--border-color)] focus-within:border-[var(--accent)]/50 transition-colors">
              <Search size={16} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm text-[var(--text-main)] px-2 w-full placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <nav className="flex-1 overflow-y-auto py-4">
              <div className="px-5 mb-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Explore</div>
              {primaryLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between px-5 py-3 text-sm font-bold uppercase tracking-wide text-[var(--text-main)] hover:bg-[var(--bg-input)] transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={18} className="text-[var(--accent)]" />
                      {link.label}
                      {link.live && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    </span>
                    <ChevronRight size={16} className="text-[var(--text-main)]/30" />
                  </Link>
                );
              })}

              <div className="px-5 mt-6 mb-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Categories</div>
              {categories.map(cat => (
                <Link
                  key={cat}
                  to={`/category/${cat}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-2.5 text-[13px] font-semibold text-[var(--text-main)]/80 hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] transition-colors"
                >
                  {cat}
                  <ChevronRight size={14} className="text-[var(--text-main)]/20" />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)] pb-12">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[var(--bg-card)] text-[var(--text-main)]/40 py-12 border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-3 mb-4">
                <img src="https://i.imgur.com/77gpoV1.png" alt="Platnumz Cuesport Logo" className="h-8 md:h-10 w-auto object-contain" />
                <span className="font-bold text-lg text-[var(--text-main)] tracking-tight whitespace-nowrap">Platnumz Cuesport</span>
              </Link>
              <p className="text-sm">
                Your premier source for global cue sports news, tournament coverage, and player insights.
              </p>
            </div>
            <div>
              <h3 className="text-[var(--text-main)] font-semibold mb-4 uppercase text-sm tracking-wider">Categories</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/rankings" className="hover:text-blue-400">Rankings</Link></li>
                {categories.slice(0,3).map(c => (
                  <li key={c}><Link to={`/category/${c}`} className="hover:text-blue-400">{c}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[var(--text-main)] font-semibold mb-4 uppercase text-sm tracking-wider">Connect</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://www.facebook.com/share/1EXtDbFsLu/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Facebook</a></li>
                <li><a href="https://www.instagram.com/kravo_platnvmz_official?igsh=MW9uNXI0cjYyY2Z5eA==" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Instagram</a></li>
                <li><a href="https://www.tiktok.com/@kravoplatnumzofficial?_r=1&_t=ZS-98ti24ifVsC" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">TikTok</a></li>
                <li><a href="https://whatsapp.com/channel/0029Va8ZB5LJpe8fqDvigx3O" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">WhatsApp</a></li>
                <li className="mt-4"><Link to="/admin" className="text-gray-600 hover:text-gray-300 text-xs uppercase tracking-widest">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[var(--border-color)] text-[9px] font-medium tracking-wide text-center uppercase text-[var(--text-main)]/40">
            &copy; {new Date().getFullYear()} PLATNUMZ CUESPORT by Kravo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
