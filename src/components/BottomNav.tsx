// ========================================
// Bottom Navigation Component
// ========================================

import { ClipboardList, CalendarDays, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavTab {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs: NavTab[] = [
    {
      path: '/',
      label: 'Daily Entry',
      icon: <ClipboardList size={24} className="text-text-secondary" />,
      activeIcon: <ClipboardList size={24} className="text-primary-blue" />,
    },
    {
      path: '/summary',
      label: 'Summary',
      icon: <CalendarDays size={24} className="text-text-secondary" />,
      activeIcon: <CalendarDays size={24} className="text-primary-blue" />,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <Settings size={24} className="text-text-secondary" />,
      activeIcon: <Settings size={24} className="text-primary-blue" />,
    },
  ];

  const isActive = (path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" style={{ height: '72px' }}>
      <div className="flex items-center justify-around h-full max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 min-w-touch min-h-touch px-4 py-2 transition-colors ${
                active ? 'text-primary-blue' : 'text-text-secondary'
              }`}
              aria-label={`Navigate to ${tab.label}`}
              aria-current={active ? 'page' : undefined}
            >
              {active ? tab.activeIcon : tab.icon}
              <span
                className={`text-nav font-poppins ${
                  active ? 'font-bold text-primary-blue' : 'font-normal text-text-secondary'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
