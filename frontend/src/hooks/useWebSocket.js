import { useCallback, useEffect, useRef, useState } from 'react';
import websocketService from '@/services/websocket-service';
import { getToken } from '@/services/auth-service';

/**
 * React hook for live mess event subscriptions.
 * Ported from temp-save-before-pull and adapted to websocket-service.
 *
 * Usage:
 *   const { connected } = useAppEvents((event) => {
 *     if (event.type === 'CHAT_MESSAGE') { ... }
 *   });
 */
export function useAppEvents(onEvent) {
  const [connected, setConnected] = useState(() => websocketService.isConnected());
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    let cancelled = false;
    websocketService
      .connect(getToken())
      .then(() => {
        if (cancelled) return;
        setConnected(true);
        websocketService.subscribeToAppEvents((event) => handlerRef.current?.(event));
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });
    return () => {
      cancelled = true;
      websocketService.unsubscribe('/topic/events');
    };
  }, []);

  return { connected };
}

/**
 * Generic topic subscription hook.
 */
export function useWebSocketTopic(topic, onMessage) {
  const [connected, setConnected] = useState(() => websocketService.isConnected());
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  const subscribe = useCallback(() => {
    if (!topic) return null;
    return websocketService.subscribe(topic, (msg) => handlerRef.current?.(msg));
  }, [topic]);

  useEffect(() => {
    let cancelled = false;
    websocketService
      .connect(getToken())
      .then(() => {
        if (cancelled) return;
        setConnected(true);
        subscribe();
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });
    return () => {
      cancelled = true;
      if (topic) websocketService.unsubscribe(topic);
    };
  }, [topic, subscribe]);

  return { connected };
}
