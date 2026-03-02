// ========================================
// Offline Banner Component
// ========================================

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-xl mx-4 mt-2 px-4 py-3 flex items-center gap-3">
      <WifiOff size={20} className="text-accent-orange shrink-0" />
      <p className="text-helper text-accent-orange font-medium font-poppins">
        📶 Offline — entries will sync when connected
      </p>
    </div>
  );
}
