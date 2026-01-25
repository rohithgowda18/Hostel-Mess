import React from 'react';
import './MessageBubble.css';

/**
 * MessageBubble Component
 * Displays a single chat message with sender info
 * Highlights admin messages with different styling
 * 
 * Props:
 * - message: { id, senderName, senderRole, message, createdAt }
 * - isOwnMessage: boolean - true if current user sent this message
 * - onDelete: (messageId) => void - callback to delete message (admin only)
 * - isAdmin: boolean - true if current user is admin
 */
function MessageBubble({ message, isOwnMessage, onDelete, isAdmin }) {
  
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'Unknown time';
    }
  };

  const handleDelete = () => {
    if (isAdmin && onDelete) {
      if (window.confirm('Delete this message?')) {
        onDelete(message.id);
      }
    }
  };

  return (
    <div className={`message-bubble ${isOwnMessage ? 'own-message' : ''} ${message.senderRole === 'ADMIN' ? 'admin-message' : ''}`}>
      <div className="message-header">
        <span className="sender-name">
          {message.senderName}
          {message.senderRole === 'ADMIN' && <span className="admin-badge">👤 ADMIN</span>}
        </span>
        <span className="message-time">{formatTime(message.createdAt)}</span>
      </div>
      <div className="message-content">
        {message.message}
      </div>
      {isAdmin && (
        <div className="message-actions">
          <button className="delete-btn" onClick={handleDelete} title="Delete message">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
