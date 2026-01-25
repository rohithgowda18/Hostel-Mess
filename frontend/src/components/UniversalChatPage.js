import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import ChatWindow from './ChatWindow';
import './UniversalChatPage.css';

/**
 * UniversalChatPage Component
 * Displays hostel-wide community chat
 * All logged-in users can view and send messages
 * Messages auto-expire after 24 hours
 * Max 150 characters per message
 * Admin can delete any message
 * 
 * Accessed via: /community
 */
function UniversalChatPage({ currentUser }) {
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [messageCount, setMessageCount] = useState(0);

  // Fetch messages for universal chat
  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await api.getMessages('UNIVERSAL', 'GLOBAL');
      setMessages(msgs.slice().reverse()); // Reverse so newest at bottom
      setMessageCount(msgs.length);
      setError('');
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 8 seconds
    const interval = setInterval(() => {
      fetchMessages();
      setLastUpdate(Date.now());
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSendMessage = async (message) => {
    setSending(true);
    try {
      await api.sendMessage('UNIVERSAL', 'GLOBAL', message);
      // Immediately fetch new messages
      await fetchMessages();
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.deleteMessage(messageId);
      await fetchMessages();
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to delete message');
    }
  };

  return (
    <div className="universal-chat-page">
      {/* Header */}
      <div className="chat-header">
        <div>
          <h2>🌍 Community Chat</h2>
          <p className="chat-info">
            {messageCount} messages
            {lastUpdate && <span className="update-time"> • Updated {Math.floor((Date.now() - lastUpdate) / 1000)}s ago</span>}
          </p>
          <p className="chat-rules">💬 Max 150 characters • Messages expire in 24 hours • Only admin can delete</p>
        </div>
        <div className="status-badge">
          🟢 Live
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="warning-banner">
          ⚠️ {error || 'Chat service unavailable. Please try again later.'}
        </div>
      )}

      {/* Chat window */}
      {!loading && !error ? (
        <ChatWindow
          messages={messages}
          currentUserId={currentUser?.id}
          currentUserRole={currentUser?.role}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          loading={sending}
          chatType="UNIVERSAL"
        />
      ) : loading ? (
        <div className="loading-state">
          ⏳ Loading community chat...
        </div>
      ) : (
        <div className="loading-state">
          <span role="img" aria-label="offline">🚫</span> Chat service unavailable. Please try again later.
        </div>
      )}

      {/* Info footer */}
      <div className="chat-footer">
        <p>
          💡 Tip: Connect with hostel friends without sharing phone numbers. Stay respectful and follow hostel rules.
        </p>
      </div>
    </div>
  );
}

export default UniversalChatPage;
