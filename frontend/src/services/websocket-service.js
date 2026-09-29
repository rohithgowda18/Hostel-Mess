import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { API_BASE_URL, getToken } from '@/services/auth-service';

/**
 * WebSocket service for live mess events and group chat (STOMP over SockJS).
 * - Connects to <api-origin>/ws
 * - Authenticates with JWT in CONNECT frame
 * - Persistent connection with automatic reconnection
 * - Resilient topic subscription registry (auto-subscribes upon connect & reconnect)
 * - Clean unsubscribe to prevent memory leaks and duplicate listeners
 */

function serverOrigin() {
  try {
    if (typeof API_BASE_URL === 'string' && (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://'))) {
      return new URL(API_BASE_URL).origin;
    }
    return window.location.origin;
  } catch {
    return window.location.origin;
  }
}

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 15;
    this.reconnectDelay = 2000;
    // topic string -> Set of callback functions
    this.listeners = new Map();
    // topic string -> active STOMP subscription object
    this.stompSubscriptions = new Map();
  }

  connect(jwtToken) {
    const token = jwtToken || getToken();
    if (!token) {
      this.connected = false;
      return Promise.resolve();
    }
    if (this.connected && this.client) {
      return Promise.resolve();
    }
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const socket = new SockJS(`${serverOrigin()}/ws`);
        const client = Stomp.over(socket);
        client.debug = (msg) => {
          if (import.meta.env?.DEV) {
            console.debug('[STOMP]', msg);
          }
        };

        client.connect(
          { Authorization: `Bearer ${token}` },
          () => {
            this.client = client;
            this.connected = true;
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.connectionPromise = null;
            // Restore all registered topic subscriptions immediately
            this.resubscribeAll();
            resolve();
          },
          (err) => {
            console.warn('[WS CONNECT FAILED]', err);
            this.connected = false;
            this.isConnecting = false;
            this.connectionPromise = null;
            this.stompSubscriptions.clear();
            this.handleReconnect(resolve, reject);
          }
        );
      } catch (err) {
        console.error('[WS EXCEPTION]', err);
        this.isConnecting = false;
        this.connectionPromise = null;
        this.handleReconnect(resolve, reject);
      }
    });

    return this.connectionPromise;
  }

  handleReconnect(resolve, reject) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (reject) reject(new Error('WebSocket reconnect attempts exhausted'));
      return;
    }
    this.reconnectAttempts += 1;
    const backoff = Math.min(this.reconnectDelay * Math.pow(1.3, this.reconnectAttempts - 1), 10000);
    this.reconnectTimer = setTimeout(() => {
      this.client = null;
      this.connect().then(resolve).catch(reject);
    }, backoff);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stompSubscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch {
        /* ignore */
      }
    });
    this.stompSubscriptions.clear();
    if (this.client && this.connected) {
      try {
        this.client.disconnect(() => {
          this.connected = false;
          this.isConnecting = false;
          this.connectionPromise = null;
        });
      } catch {
        this.connected = false;
        this.isConnecting = false;
        this.connectionPromise = null;
      }
    }
    this.client = null;
    this.connected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  isConnected() {
    return this.connected;
  }

  /**
   * Internal method to bind a STOMP subscription for a topic
   */
  _bindStompSubscription(topic) {
    if (!this.connected || !this.client || this.stompSubscriptions.has(topic)) {
      return;
    }
    try {
      const sub = this.client.subscribe(topic, (message) => {
        try {
          const parsed = JSON.parse(message.body);
          const callbacks = this.listeners.get(topic);
          if (callbacks) {
            callbacks.forEach((cb) => {
              try {
                cb(parsed);
              } catch (e) {
                console.error('Error in WebSocket listener for', topic, e);
              }
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message from', topic, err);
        }
      });
      this.stompSubscriptions.set(topic, sub);
    } catch (err) {
      console.error('Failed to subscribe to topic:', topic, err);
    }
  }

  resubscribeAll() {
    for (const topic of this.listeners.keys()) {
      const callbacks = this.listeners.get(topic);
      if (callbacks && callbacks.size > 0) {
        this._bindStompSubscription(topic);
      }
    }
  }

  /**
   * Subscribe to any topic. Returns an unsubscribe function.
   * If not yet connected, remembers the topic and binds when connected.
   */
  subscribe(topic, callback) {
    if (!topic || typeof callback !== 'function') return () => {};

    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic).add(callback);

    // If already connected, bind immediately
    if (this.connected && this.client) {
      this._bindStompSubscription(topic);
    } else {
      this.connect().catch((err) => {
        if (import.meta.env?.DEV) {
          console.warn('[WS] Connection deferred during subscribe:', err?.message);
        }
      });
    }

    return () => this.unsubscribe(topic, callback);
  }

  unsubscribe(topic, callback) {
    if (!topic) return;

    if (this.listeners.has(topic)) {
      if (callback) {
        this.listeners.get(topic).delete(callback);
      }
      if (!callback || this.listeners.get(topic).size === 0) {
        this.listeners.delete(topic);
        const stompSub = this.stompSubscriptions.get(topic);
        if (stompSub) {
          try {
            stompSub.unsubscribe();
          } catch {
            /* ignore */
          }
          this.stompSubscriptions.delete(topic);
        }
      }
    }
  }

  /**
   * Subscribe to real-time chat messages for a specific group.
   * Destination: /topic/chat/{groupId}
   */
  subscribeToGroupChat(groupId, callback) {
    if (!groupId) return () => {};
    return this.subscribe(`/topic/chat/${groupId}`, callback);
  }

  /**
   * Subscribe to real-time personal notifications for a student.
   * Destination: /topic/notifications/{email}
   */
  subscribeToMyNotifications(email, callback) {
    if (!email) return () => {};
    return this.subscribe(`/topic/notifications/${email.toLowerCase().trim()}`, callback);
  }

  /**
   * Subscribe to global portal events.
   * Destination: /topic/events
   */
  subscribeToAppEvents(callback) {
    return this.subscribe('/topic/events', callback);
  }
}

const websocketService = new WebSocketService();
export default websocketService;
