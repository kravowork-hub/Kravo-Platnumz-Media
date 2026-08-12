import { useEffect, useState } from 'react';
import { Settings, X } from 'lucide-react';

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState('midnight');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const themes = [
    { id: 'classic', name: 'Classic Newspaper', color: '#b91c1c', bg: '#ffffff' },
    { id: 'sports', name: 'Modern Sports', color: '#f97316', bg: '#0f172a' },
    { id: 'editorial', name: 'Editorial Magazine', color: '#85754d', bg: '#fdfbf7' },
    { id: 'midnight', name: 'Midnight Broadcast', color: '#C0C0C0', bg: '#050505' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {isOpen && (
        <div className="mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-lg p-4 w-64 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Preview Theme</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
                  theme === t.id 
                    ? 'bg-gray-100 dark:bg-gray-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-700 overflow-hidden flex shadow-sm">
                  <div className="w-1/2 h-full" style={{ backgroundColor: t.bg }}></div>
                  <div className="w-1/2 h-full" style={{ backgroundColor: t.color }}></div>
                </div>
                <span className={`text-sm font-medium ${theme === t.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 ml-auto"
      >
        <Settings size={24} className={isOpen ? 'animate-spin-slow' : ''} />
      </button>
    </div>
  );
}
