import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, LogOut, Video, Share2, Trophy, Menu, X, Tags, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Articles', path: '/admin/articles', icon: FileText },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Live Scores', path: '/admin/scores', icon: Trophy },
    { name: 'Rankings', path: '/admin/rankings', icon: Trophy },
    { name: 'Comments', path: '/admin/comments', icon: MessageCircle },
    { name: 'Live Video', path: '/admin/video', icon: Video },
    { name: 'Social Feeds', path: '/admin/social', icon: Share2 },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex">
      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-color)]">
          <Link to="/" className="flex items-center gap-3">
            <img src="https://i.imgur.com/77gpoV1.png" alt="Platnumz Cuesport Logo" className="h-8 w-auto object-contain" />
            <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap">Platnumz Cuesport</span>
          </Link>
          <button 
            className="md:hidden text-white/50 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-[11px] uppercase tracking-widest font-bold rounded-sm transition-colors",
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={16} className={isActive ? "text-white" : "text-white/40"} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-[var(--border-color)]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-[11px] uppercase tracking-widest font-bold text-white/50 hover:bg-white/5 hover:text-white rounded-sm w-full transition-colors"
          >
            <LogOut size={16} className="text-white/40" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-white/50 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-white uppercase tracking-widest text-[11px]">PLATNUMZ CUESPORT CMS</span>
          </div>
          <div className="hidden md:block"></div>
          <button onClick={handleLogout} className="p-2 text-white/50 hover:bg-white/10 rounded-sm">
            <LogOut size={20} />
          </button>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
