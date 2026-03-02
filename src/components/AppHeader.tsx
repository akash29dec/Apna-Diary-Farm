// ========================================
// App Header Component
// ========================================

import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AppHeader() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-primary-blue px-4 h-14">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🥛</span>
        <h1 className="text-xl font-bold text-white font-poppins">Apna Diary</h1>
      </div>
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center justify-center min-w-touch min-h-touch"
        aria-label="Open settings"
      >
        <Settings size={28} className="text-white" />
      </button>
    </header>
  );
}
