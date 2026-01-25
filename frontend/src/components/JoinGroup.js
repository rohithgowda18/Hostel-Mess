import React, { useState } from 'react';
import './JoinGroup.css';

const JoinGroup = ({ userId, onGroupJoined, onCancel }) => {
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    
    if (!groupCode.trim()) {
      setError('Please enter a group code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupCode: groupCode.toUpperCase(), userId })
      });

      if (response.ok) {
        const group = await response.json();
        onGroupJoined(group);
        setGroupCode('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to join group');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-group-container">
      <div className="join-group-card">
        <h2>🔗 Join a Group</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleJoinGroup}>
          <div className="form-group">
            <label>Group Code</label>
            <input
              type="text"
              value={groupCode.toUpperCase()}
              onChange={(e) => setGroupCode(e.target.value)}
              placeholder="Enter 8-character code (e.g., ABC12345)"
              maxLength="8"
              disabled={loading}
              className="code-input"
            />
            <small>Ask a group member for the 8-character group code</small>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroup;
