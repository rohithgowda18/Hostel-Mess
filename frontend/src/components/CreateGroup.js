import React, { useState } from 'react';
import './CreateGroup.css';

const CreateGroup = ({ userId, onGroupCreated, onCancel }) => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, userId })
      });

      if (response.ok) {
        const group = await response.json();
        onGroupCreated(group);
        setGroupName('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create group');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-group-container">
      <div className="create-group-card">
        <h2>➕ Create a New Group</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleCreateGroup}>
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Night Owls, Dinner Squad..."
              maxLength="50"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Group'}
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

export default CreateGroup;
