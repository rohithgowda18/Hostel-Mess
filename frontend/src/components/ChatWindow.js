import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import './ChatWindow.css';

/**
 * ChatWindow Component
 * Main container for displaying and managing chat messages
 * Handles auto-scroll to latest message
 * 
 * Props:
 * - messages: array of message objects
 * - currentUserId: string - ID of logged-in user
 * - currentUserRole: string - Role of logged-in user (STUDENT, ADMIN)
 * - onSendMessage: (message) => Promise - callback to send message
 * - onDeleteMessage: (messageId) => Promise - callback to delete message
 * - loading: boolean - show loading state
 * - chatType: string - "GROUP" or "UNIVERSAL"
 */
function ChatWindow({
  messages,
  currentUserId,
  currentUserRole,
  onSendMessage,
  onDeleteMessage,
  loading,
  chatType
}) {
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDeleteClick = async (messageId) => {
    try {
      await onDeleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const maxLength = chatType === 'UNIVERSAL' ? 150 : 500;
  const isAdmin = currentUserRole === 'ADMIN';

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>💬 No messages yet</p>
            <p className="hint">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === currentUserId}
                onDelete={isAdmin ? handleDeleteClick : null}
                isAdmin={isAdmin}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput
        onSendMessage={onSendMessage}
        maxLength={maxLength}
        disabled={loading}
        loading={loading}
      />
    </div>
  );
}

export default ChatWindow;
