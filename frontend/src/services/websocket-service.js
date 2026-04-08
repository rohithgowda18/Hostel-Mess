import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

/**
 * WebSocket service for real-time messaging
 * Uses STOMP protocol over SockJS for fallback support
 */
class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.token = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.subscriptions = new Map(); // Store active subscriptions
    this.messageHandlers = new Map(); // Store topic-to-handler mappings
  }

  /**
   * Initialize WebSocket connection with JWT authentication
   * @param {string} serverUrl - WebSocket server URL (e.g., 'http://localhost:8080')
   * @param {string} jwtToken - JWT token for authentication
   * @returns {Promise} Resolves when connected
   */
  connect(serverUrl, jwtToken) {
    return new Promise((resolve, reject) => {
      this.token = jwtToken;
      const wsUrl = `${serverUrl}/ws/connect`;

      // Create SockJS socket with fallback transports
      const socket = new SockJS(wsUrl, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
      });

      this.client = Stomp.over(socket);

      // Optional: disable debug logging in production
      this.client.debug = null;

      const headers = {
        Authorization: `Bearer ${jwtToken}`,
        'X-JWT-Token': jwtToken,
      };

      this.client.connect(
        headers,
        (frame) => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('✅ WebSocket connected:', frame);
          resolve(frame);
        },
        (error) => {
          this.connected = false;
          console.error('❌ WebSocket connection error:', error);
          this._handleReconnect(serverUrl, jwtToken, resolve, reject);
        }
      );
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.client && this.connected) {
      // Unsubscribe from all topics
      this.subscriptions.forEach((subscription) => {
        if (subscription) {
          subscription.unsubscribe();
        }
      });
      this.subscriptions.clear();
      this.messageHandlers.clear();

      this.client.disconnect(() => {
        this.connected = false;
        console.log('✅ WebSocket disconnected');
      });
    }
  }

  /**
   * Subscribe to a topic
   * @param {string} topic - Topic to subscribe to (e.g., '/topic/chat/group/123')
   * @param {function} callback - Function to call when message received
   * @returns {object} Subscription object with unsubscribe method
   */
  subscribe(topic, callback) {
    if (!this.connected) {
      console.error('❌ WebSocket not connected. Cannot subscribe to:', topic);
      return null;
    }

    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('❌ Error parsing message from', topic, ':', error);
      }
    });

    // Store subscription for later cleanup
    this.subscriptions.set(topic, subscription);
    this.messageHandlers.set(topic, callback);
    console.log('📡 Subscribed to:', topic);

    return subscription;
  }

  /**
   * Unsubscribe from a topic
   * @param {string} topic - Topic to unsubscribe from
   */
  unsubscribe(topic) {
    if (this.subscriptions.has(topic)) {
      const subscription = this.subscriptions.get(topic);
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
      this.messageHandlers.delete(topic);
      console.log('📵 Unsubscribed from:', topic);
    }
  }

  /**
   * Send a message to a server endpoint
   * @param {string} destination - Destination endpoint (e.g., '/app/chat/group/123')
   * @param {object} message - Message object to send
   * @param {object} headers - Optional additional headers
   */
  send(destination, message, headers = {}) {
    if (!this.connected) {
      console.error('❌ WebSocket not connected. Cannot send message');
      return;
    }

    try {
      this.client.send(destination, headers, JSON.stringify(message));
      console.log('📤 Message sent to:', destination);
    } catch (error) {
      console.error('❌ Error sending message to', destination, ':', error);
    }
  }

  /**
   * Send a group chat message
   * @param {string} groupId - Group ID
   * @param {string} message - Message text
   */
  sendGroupChat(groupId, message) {
    this.send(`/app/chat/group/${groupId}`, {
      message: message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a community chat message
   * @param {string} message - Message text
   */
  sendCommunityChat(message) {
    this.send('/app/chat/community', {
      message: message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to group chat messages
   * @param {string} groupId - Group ID
   * @param {function} callback - Handler function
   */
  subscribeToGroupChat(groupId, callback) {
    return this.subscribe(`/topic/chat/group/${groupId}`, callback);
  }

  /**
   * Subscribe to community chat messages
   * @param {function} callback - Handler function
   */
  subscribeToCommunityChat(callback) {
    return this.subscribe('/topic/chat/community', callback);
  }

  /**
   * Subscribe to meal updates
   * @param {string} mealType - Type of meal (BREAKFAST, LUNCH, DINNER, etc.)
   * @param {function} callback - Handler function
   */
  subscribeToMealUpdates(mealType, callback) {
    return this.subscribe(`/topic/meals/${mealType.toLowerCase()}`, callback);
  }

  /**
   * Subscribe to complaint updates
   * @param {function} callback - Handler function
   */
  subscribeToComplaints(callback) {
    return this.subscribe('/topic/complaints', callback);
  }

  /**
   * Subscribe to group status updates
   * @param {string} groupId - Group ID
   * @param {function} callback - Handler function
   */
  subscribeToGroupStatus(groupId, callback) {
    return this.subscribe(`/topic/groups/${groupId}`, callback);
  }

  /**
   * Subscribe to private messages
   * @param {function} callback - Handler function
   */
  subscribeToPrivateMessages(callback) {
    return this.subscribe('/user/queue/messages', callback);
  }

  /**
   * Keep-alive ping
   */
  ping() {
    this.send('/app/ping', { timestamp: new Date().toISOString() });
  }

  /**
   * Get connection status
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connected && this.client && this.client.connected;
  }

  /**
   * Handle reconnection with exponential backoff
   * @private
   */
  _handleReconnect(serverUrl, jwtToken, resolve, reject) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(
        `⏳ Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
      );

      setTimeout(() => {
        this.connect(serverUrl, jwtToken).then(resolve).catch(reject);
      }, delay);
    } else {
      reject(new Error('❌ Max reconnection attempts reached'));
    }
  }
}

// Export singleton instance
export default new WebSocketService();
