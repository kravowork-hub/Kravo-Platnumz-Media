import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Articles', path: '/admin/articles', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#C0C0C0] text-black rounded-sm flex items-center justify-center font-black text-xs">
              KP
            </div>
            <span className="font-bold text-sm tracking-tight uppercase text-white">Media CMS</span>
          </Link>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
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
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-[11px] uppercase tracking-widest font-bold text-white/50 hover:bg-white/5 hover:text-white rounded-sm w-full transition-colors"
          >
            <LogOut size={16} className="text-white/40" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-6 md:hidden">
          <span className="font-bold text-white uppercase tracking-widest text-[11px]">KP CMS</span>
          <button onClick={handleLogout} className="p-2 text-white/50 hover:bg-white/10 rounded-sm">
            <LogOut size={20} />
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
