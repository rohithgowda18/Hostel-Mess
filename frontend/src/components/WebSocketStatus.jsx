import { useEffect, useState } from 'react';
import websocketService from '../services/websocket-service';

/**
 * WebSocket connection status indicator component
 * Shows real-time WebSocket connection status
 */
export function WebSocketStatus() {
  const [connected, setConnected] = useState(false);
  const [showIndicator, setShowIndicator] = useState(true);

  useEffect(() => {
    // Check connection status every 1 second
    const interval = setInterval(() => {
      const isConnected = websocketService.isConnected();
      setConnected(isConnected);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
          connected
            ? 'bg-green-500/20 border border-green-500 text-green-700'
            : 'bg-red-500/20 border border-red-500 text-red-700'
        }`}
      >
        {/* Status dot */}
        <div
          className={`w-2 h-2 rounded-full animate-pulse ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />

        {/* Status text */}
        <span className="text-sm font-medium">
          {connected ? '🟢 Live' : '🔴 Offline'}
        </span>

        {/* Close button */}
        <button
          onClick={() => setShowIndicator(false)}
          className="ml-2 text-xs hover:opacity-70 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * WebSocket initialization component
 * Initializes WebSocket connection once in the app
 */
export function WebSocketInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';

    if (token && !initialized) {
      websocketService
        .connect(apiUrl, token)
        .then(() => {
          setInitialized(true);
          console.log('✅ WebSocket initialized');

          // Start keep-alive ping every 30 seconds
          const pingInterval = setInterval(() => {
            if (websocketService.isConnected()) {
              websocketService.ping();
            }
          }, 30000);

          return () => clearInterval(pingInterval);
        })
        .catch((error) => {
          console.error('❌ WebSocket initialization failed:', error);
        });
    }

    return () => {
      // Cleanup on unmount (optional - keep connection alive)
      // websocketService.disconnect();
    };
  }, [initialized]);

  return null; // This component doesn't render anything
}

/**
 * Hook to ensure WebSocket is connected
 */
export function useEnsureWebSocket() {
  const [connected, setConnected] = useState(websocketService.isConnected());

  useEffect(() => {
    const checkConnection = () => {
      const isConnected = websocketService.isConnected();
      setConnected(isConnected);
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  return connected;
}
