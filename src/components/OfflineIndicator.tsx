import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-banner"
      className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-center gap-2 bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2"
    >
      <WifiOff className="w-3.5 h-3.5 animate-pulse" />
      <span>Modo Offline — Você pode continuar usando seus lançamentos normalmente</span>
    </div>
  );
};
