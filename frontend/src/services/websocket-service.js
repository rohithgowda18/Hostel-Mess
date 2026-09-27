import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { API_BASE_URL, getToken } from '@/services/auth-service';

/**
 * WebSocket service for live mess events (STOMP over SockJS).
 * Ported from temp-save-before-pull and adapted to this app:
 * - connects to <api-origin>/ws (see backend WebSocketConfig)
 * - JWT from auth-service localStorage
 * - subscribes to the backend's real topics (/topic/events envelope
 *   {type, data, timestamp} and /topic/notifications/<email>)
 */

function serverOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return window.location.origin;
  }
}

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.subscriptions = new Map();
  }

  connect(jwtToken) {
    const token = jwtToken || getToken();
    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new Error('No auth token for WebSocket connection'));
        return;
      }
      if (this.connected && this.client) {
        resolve();
        return;
      }
      const socket = new SockJS(`${serverOrigin()}/ws`, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
      });
      this.client = Stomp.over(socket);
      this.client.debug = null;
      this.client.connect(
        { Authorization: `Bearer ${token}` },
        () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        },
        () => {
          this.connected = false;
          this.handleReconnect(resolve, reject);
        }
      );
    });
  }

  handleReconnect(resolve, reject) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      reject(new Error('WebSocket reconnect attempts exhausted'));
      return;
    }
    this.reconnectAttempts += 1;
    setTimeout(() => {
      this.client = null;
      this.connect().then(resolve).catch(reject);
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.client && this.connected) {
      this.subscriptions.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch {
          /* ignore */
        }
      });
      this.subscriptions.clear();
      this.client.disconnect(() => {
        this.connected = false;
      });
    }
  }

  isConnected() {
    return this.connected;
  }

  subscribe(topic, callback) {
    if (!this.connected || !this.client) {
      return null;
    }
    if (this.subscriptions.has(topic)) {
      return this.subscriptions.get(topic);
    }
    const subscription = this.client.subscribe(topic, (message) => {
      try {
        callback(JSON.parse(message.body));
      } catch (err) {
        console.error('Error parsing WebSocket message from', topic, err);
      }
    });
    this.subscriptions.set(topic, subscription);
    return subscription;
  }

  unsubscribe(topic) {
    const sub = this.subscriptions.get(topic);
    if (sub) {
      try {
        sub.unsubscribe();
      } catch {
        /* ignore */
      }
      this.subscriptions.delete(topic);
    }
  }

  subscribeToAppEvents(callback) {
    return this.subscribe('/topic/events', callback);
  }

  subscribeToMyNotifications(email, callback) {
    if (!email) return null;
    return this.subscribe(`/topic/notifications/${email.toLowerCase().trim()}`, callback);
  }
}

const websocketService = new WebSocketService();
export default websocketService;
