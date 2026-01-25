import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ChatWindow from './ChatWindow';
import './GroupChatPage.css';

/**
 * GroupChatPage Component
 * Displays group-specific chat for Mess Buddy Groups
 * Only group members can view and send messages
 * Messages poll every 5-10 seconds for updates
 * 
 * Accessed via: /groups/:groupId/chat
 */
function GroupChatPage({ currentUser }) {
  const { groupId } = useParams();
  
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Fetch group details
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const groupData = await api.getGroupDetails(groupId);
        setGroup(groupData);
      } catch (err) {
        setError('Failed to load group details');
        console.error(err);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  // Fetch messages for group chat
  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await api.getMessages('GROUP', groupId);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setError('');
    } catch (err) {
      if (err.response?.status !== 403) {
        setError('Failed to load messages');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 6 seconds
    const interval = setInterval(() => {
      fetchMessages();
      setLastUpdate(Date.now());
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSendMessage = async (message) => {
    setSending(true);
    try {
      await api.sendMessage('GROUP', groupId, message);
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

  if (error && !group) {
    return (
      <div className="group-chat-page">
        <div className="error-state">
          <p>⚠️ {error || 'Chat service unavailable. Please try again later.'}</p>
          <p className="error-hint">Try refreshing the page or check your group membership</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group-chat-page">
      {/* Header */}
      <div className="chat-header">
        <div>
          <h2>👥 {group?.name || 'Group Chat'}</h2>
          <p className="group-info">
            {group?.members?.length || 0} members
            {lastUpdate && <span className="update-time"> • Updated {Math.floor((Date.now() - lastUpdate) / 1000)}s ago</span>}
          </p>
        </div>
        <div className="member-count">
          {group?.members?.length || 0}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="warning-banner">
          ⚠️ {error || 'Chat service unavailable. Please try again later.'}
        </div>
      )}

      {/* Chat window */}
      {!loading && group && !error ? (
        <ChatWindow
          messages={messages}
          currentUserId={currentUser?.id}
          currentUserRole={currentUser?.role}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          loading={sending}
          chatType="GROUP"
        />
      ) : loading ? (
        <div className="loading-state">
          ⏳ Loading chat...
        </div>
      ) : (
        <div className="loading-state">
          <span role="img" aria-label="offline">🚫</span> Chat service unavailable. Please try again later.
        </div>
      )}
    </div>
  );
}

export default GroupChatPage;
