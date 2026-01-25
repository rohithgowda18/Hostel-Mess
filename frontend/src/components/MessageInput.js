import React, { useState } from 'react';
import './MessageInput.css';

/**
 * MessageInput Component
 * Handles message input and sending
 * Shows character counter for universal chat (max 150 chars)
 * 
 * Props:
 * - onSendMessage: (message) => Promise - callback when sending message
 * - maxLength: number - maximum message length (default: 500)
 * - disabled: boolean - disable input while sending
 * - loading: boolean - show loading state
 */
function MessageInput({ onSendMessage, maxLength = 500, disabled = false, loading = false }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setMessage(e.target.value);
    setError('');
  };

  const handleSend = async () => {
    if (message.trim() === '') {
      setError('Message cannot be empty');
      return;
    }

    if (message.length > maxLength) {
      setError(`Message exceeds maximum length of ${maxLength} characters`);
      return;
    }

    try {
      await onSendMessage(message.trim());
      setMessage('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = message.length;
  const isLimitApproaching = maxLength <= 150 && charCount > maxLength - 30;

  return (
    <div className="message-input-container">
      {error && <div className="input-error">{error}</div>}
      
      <div className="input-wrapper">
        <textarea
          className="message-input"
          placeholder="Type your message..."
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || loading}
          maxLength={maxLength}
          rows="2"
        />
        
        {maxLength <= 150 && (
          <div className={`char-counter ${isLimitApproaching ? 'warning' : ''}`}>
            {charCount}/{maxLength}
          </div>
        )}
        
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={disabled || loading || message.trim() === ''}
          title={message.trim() === '' ? 'Type a message first' : 'Send message (Enter)'}
        >
          {loading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
