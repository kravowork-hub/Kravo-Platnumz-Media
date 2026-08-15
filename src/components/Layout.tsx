import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans">
      {/* Header */}
      <header className="bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-lg text-[var(--text-main)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="https://i.imgur.com/77gpoV1.png" alt="Platnumz Cuesport Logo" className="h-10 md:h-12 w-auto object-contain" />
              <span className="font-bold text-xl tracking-tight whitespace-nowrap">Platnumz Cuesport</span>
            </Link>

            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="flex items-center bg-[var(--bg-input)] rounded px-3 py-1.5 border border-[var(--border-color)] focus-within:border-white/30 transition-colors">
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-transparent border-none outline-none text-sm text-[var(--text-main)] px-2 w-32 md:w-48 placeholder:text-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
          </div>
        </div>

        {/* Full Scrollable Navigation */}
        <div className="border-t border-[var(--border-color)] bg-[#111]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-6 overflow-x-auto no-scrollbar items-center py-3">
              <Link to="/scores" className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)] hover:text-white transition-colors whitespace-nowrap flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Live Scores
              </Link>
              <Link to="/videos" className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap">
                Videos
              </Link>
              {categories.map(cat => (
                <Link key={cat} to={`/category/${cat}`} className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors whitespace-nowrap">
                  {cat}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

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
                {categories.slice(0,4).map(c => (
                  <li key={c}><Link to={`/category/${c}`} className="hover:text-blue-400">{c}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[var(--text-main)] font-semibold mb-4 uppercase text-sm tracking-wider">Connect</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-400">Twitter</a></li>
                <li><a href="#" className="hover:text-blue-400">Facebook</a></li>
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
