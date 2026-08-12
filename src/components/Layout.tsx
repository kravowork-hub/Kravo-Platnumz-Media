import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES } from '../types';

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--accent)] text-[var(--accent-text)] rounded-sm flex items-center justify-center font-black text-xl">
                KP
              </div>
              <span className="font-bold text-xl tracking-tight uppercase">Kravo Platnumz Media</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 overflow-x-auto no-scrollbar items-center">
              {CATEGORIES.slice(0, 5).map(cat => (
                <Link key={cat} to={`/category/${cat}`} className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] opacity-50 hover:opacity-100 transition-opacity whitespace-nowrap">
                  {cat}
                </Link>
              ))}
            </nav>

            {/* Search & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="hidden md:flex items-center bg-[var(--bg-input)] rounded px-3 py-1.5 border border-[var(--border-color)] focus-within:border-white/30 transition-colors">
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search news..." 
                  className="bg-transparent border-none outline-none text-sm text-[var(--text-main)] px-2 w-48 placeholder:text-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <button 
                className="md:hidden p-2 text-gray-300 hover:text-[var(--text-main)]"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[var(--bg-card)] border-t border-[var(--border-color)] p-4">
            <form onSubmit={handleSearch} className="flex items-center bg-[var(--bg-input)] rounded px-3 py-2 border border-[var(--border-color)] mb-4">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-base text-[var(--text-main)] px-2 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <nav className="flex flex-col space-y-3">
              {CATEGORIES.map(cat => (
                <Link 
                  key={cat} 
                  to={`/category/${cat}`} 
                  className="text-gray-300 hover:text-[var(--text-main)] text-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {cat}
                </Link>
              ))}
            </nav>
          </div>
        )}
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
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-[var(--accent)] text-[var(--accent-text)] rounded-sm flex items-center justify-center font-black text-sm">
                  KP
                </div>
                <span className="font-bold text-lg text-[var(--text-main)] tracking-tight uppercase">Kravo Platnumz Media</span>
              </Link>
              <p className="text-sm">
                Your premier source for global cue sports news, tournament coverage, and player insights.
              </p>
            </div>
            <div>
              <h3 className="text-[var(--text-main)] font-semibold mb-4 uppercase text-sm tracking-wider">Categories</h3>
              <ul className="space-y-2 text-sm">
                {CATEGORIES.slice(0,4).map(c => (
                  <li key={c}><Link to={`/category/${c}`} className="hover:text-blue-400">{c}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[var(--text-main)] font-semibold mb-4 uppercase text-sm tracking-wider">Connect</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-400">Twitter</a></li>
                <li><a href="#" className="hover:text-blue-400">Facebook</a></li>
                <li><a href="#" className="hover:text-blue-400">WhatsApp</a></li>
                <li className="mt-4"><Link to="/admin" className="text-gray-600 hover:text-gray-300 text-xs uppercase tracking-widest">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[var(--border-color)] text-[9px] font-medium tracking-wide text-center uppercase text-[var(--text-main)]/40">
            &copy; {new Date().getFullYear()} Kravo Platnumz Media. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
