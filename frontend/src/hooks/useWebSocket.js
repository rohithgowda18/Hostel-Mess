import { useEffect, useState, useCallback, useRef } from 'react';
import websocketService from '../services/websocket-service';

/**
 * React hook for WebSocket subscriptions
 * Handles connection, subscriptions, and cleanup
 */
export function useWebSocket(serverUrl, jwtToken, autoConnect = true) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const subscriptionsRef = useRef(new Map());

  // Establish connection on mount
  useEffect(() => {
    if (!autoConnect || !serverUrl || !jwtToken) return;

    const initializeConnection = async () => {
      try {
        await websocketService.connect(serverUrl, jwtToken);
        setConnected(true);
        setError(null);
      } catch (err) {
        setError(err.message);
        setConnected(false);
      }
    };

    initializeConnection();

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount - keep connection alive for other components
      // websocketService.disconnect();
    };
  }, [serverUrl, jwtToken, autoConnect]);

  /**
   * Subscribe to a WebSocket topic
   */
  const subscribe = useCallback((topic, callback) => {
    if (!websocketService.isConnected()) {
      console.warn('❌ WebSocket not connected, cannot subscribe');
      return null;
    }

    const subscription = websocketService.subscribe(topic, callback);
    subscriptionsRef.current.set(topic, subscription);
    return subscription;
  }, []);

  /**
   * Unsubscribe from a topic
   */
  const unsubscribe = useCallback((topic) => {
    websocketService.unsubscribe(topic);
    subscriptionsRef.current.delete(topic);
  }, []);

  /**
   * Send a message to a topic
   */
  const send = useCallback((destination, message) => {
    if (!websocketService.isConnected()) {
      console.warn('❌ WebSocket not connected, cannot send message');
      return;
    }
    websocketService.send(destination, message);
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((subscription, topic) => {
        unsubscribe(topic);
      });
    };
  }, [unsubscribe]);

  return {
    connected,
    error,
    subscribe,
    unsubscribe,
    send,
    service: websocketService,
  };
}

/**
 * Hook for group chat subscription
 */
export function useGroupChat(groupId, enabled = true) {
  const [messages, setMessages] = useState([]);
  const { connected, subscribe, unsubscribe } = useWebSocket(
    process.env.REACT_APP_API_URL || 'http://localhost:8080',
    localStorage.getItem('token'),
    enabled
  );

  useEffect(() => {
    if (!enabled || !connected || !groupId) return;

    const topic = `/topic/chat/group/${groupId}`;
    const subscription = subscribe(topic, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      unsubscribe(topic);
    };
  }, [groupId, enabled, connected, subscribe, unsubscribe]);

  const sendMessage = useCallback((messageText) => {
    websocketService.sendGroupChat(groupId, messageText);
  }, [groupId]);

  return {
    messages,
    connected,
    sendMessage,
  };
}

/**
 * Hook for community chat subscription
 */
export function useCommunityChat(enabled = true) {
  const [messages, setMessages] = useState([]);
  const { connected, subscribe, unsubscribe } = useWebSocket(
    process.env.REACT_APP_API_URL || 'http://localhost:8080',
    localStorage.getItem('token'),
    enabled
  );

  useEffect(() => {
    if (!enabled || !connected) return;

    const subscription = subscribe('/topic/chat/community', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      unsubscribe('/topic/chat/community');
    };
  }, [enabled, connected, subscribe, unsubscribe]);

  const sendMessage = useCallback((messageText) => {
    websocketService.sendCommunityChat(messageText);
  }, []);

  return {
    messages,
    connected,
    sendMessage,
  };
}

/**
 * Hook for meal updates subscription
 */
export function useMealUpdates(mealType, enabled = true) {
  const [mealData, setMealData] = useState(null);
  const { connected, subscribe, unsubscribe } = useWebSocket(
    process.env.REACT_APP_API_URL || 'http://localhost:8080',
    localStorage.getItem('token'),
    enabled
  );

  useEffect(() => {
    if (!enabled || !connected || !mealType) return;

    const topic = `/topic/meals/${mealType.toLowerCase()}`;
    const subscription = subscribe(topic, (data) => {
      setMealData(data);
    });

    return () => {
      unsubscribe(topic);
    };
  }, [mealType, enabled, connected, subscribe, unsubscribe]);

  return {
    mealData,
    connected,
  };
}

/**
 * Hook for group status updates
 */
export function useGroupStatus(groupId, enabled = true) {
  const [status, setStatus] = useState(null);
  const { connected, subscribe, unsubscribe } = useWebSocket(
    process.env.REACT_APP_API_URL || 'http://localhost:8080',
    localStorage.getItem('token'),
    enabled
  );

  useEffect(() => {
    if (!enabled || !connected || !groupId) return;

    const topic = `/topic/groups/${groupId}`;
    const subscription = subscribe(topic, (data) => {
      setStatus(data);
    });

    return () => {
      unsubscribe(topic);
    };
  }, [groupId, enabled, connected, subscribe, unsubscribe]);

  return {
    status,
    connected,
  };
}

/**
 * Hook for complaint updates
 */
export function useComplaints(enabled = true) {
  const [complaints, setComplaints] = useState([]);
  const { connected, subscribe, unsubscribe } = useWebSocket(
    process.env.REACT_APP_API_URL || 'http://localhost:8080',
    localStorage.getItem('token'),
    enabled
  );

  useEffect(() => {
    if (!enabled || !connected) return;

    const subscription = subscribe('/topic/complaints', (complaint) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaint.id ? complaint : c))
      );
      // Add if new complaint
      if (!prev.find((c) => c.id === complaint.id)) {
        setComplaints((prev) => [...prev, complaint]);
      }
    });

    return () => {
      unsubscribe('/topic/complaints');
    };
  }, [enabled, connected, subscribe, unsubscribe]);

  return {
    complaints,
    connected,
  };
}
