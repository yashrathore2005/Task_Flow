import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';

export function OfflineBanner() {
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

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 w-full bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 z-[100]",
        isOffline ? "h-10 opacity-100 translate-y-0" : "h-0 opacity-0 -translate-y-full overflow-hidden"
      )}
    >
      <WifiOff className="w-4 h-4" />
      <span>You are currently offline. Changes will be saved locally and synced later.</span>
    </div>
  );
}
