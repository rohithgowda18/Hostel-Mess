import { useEffect, useState } from 'react';
import websocketService from '@/services/websocket-service';
import { cn } from '@/lib/utils';

/**
 * Live connection status pill. Ported from temp-save-before-pull
 * and restyled to the app theme (no emoji).
 */
export function WebSocketStatus({ className }) {
  const [connected, setConnected] = useState(() => websocketService.isConnected());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setConnected(websocketService.isConnected());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (dismissed) return null;

  return (
    <div className={cn('fixed bottom-20 md:bottom-6 right-4 z-40', className)}>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md border text-xs font-semibold backdrop-blur',
          connected
            ? 'bg-[#e8f5ea]/95 dark:bg-[#22C55E]/15 border-[#006e25]/30 dark:border-[#22C55E]/40 text-[#006e25] dark:text-[#22C55E]'
            : 'bg-white/95 dark:bg-[#1E293B]/95 border-[#c2c6d4] dark:border-[#334155] text-[#424752] dark:text-[#94A3B8]'
        )}
      >
        <span className={cn('w-2 h-2 rounded-full', connected ? 'bg-[#006e25] dark:bg-[#22C55E] animate-pulse' : 'bg-[#94A3B8]')} />
        {connected ? 'Live' : 'Offline'}
        <button
          aria-label="Dismiss connection status"
          onClick={() => setDismissed(true)}
          className="ml-1 p-0.5 rounded hover:opacity-70"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
