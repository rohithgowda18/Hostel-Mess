import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CreateGroup from './CreateGroup';
import JoinGroup from './JoinGroup';
import GroupCodeShare from './GroupCodeShare';
import './GroupDashboard.css';

const GroupDashboard = ({ userId }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list', 'create', 'join'

  // Load user's groups using api service
  const loadUserGroups = async () => {
    setError('');
    
    try {
      const data = await api.getUserGroups();
      setGroups(data);
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0]);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError('Failed to load groups');
    }
  };

  useEffect(() => {
    if (userId) {
      loadUserGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleGroupCreated = (newGroup) => {
    setGroups([...groups, newGroup]);
    setSelectedGroup(newGroup);
    setView('list');
    setError('');
  };

  const handleGroupJoined = (joinedGroup) => {
    // Reload groups to ensure consistency
    loadUserGroups();
    setView('list');
    setError('');
  };

  // Render create group modal
  if (view === 'create') {
    return (
      <CreateGroup
        userId={userId}
        onGroupCreated={handleGroupCreated}
        onCancel={() => setView('list')}
      />
    );
  }

  // Render join group modal
  if (view === 'join') {
    return (
      <JoinGroup
        userId={userId}
        onGroupJoined={handleGroupJoined}
        onCancel={() => setView('list')}
      />
    );
  }

  // Main dashboard view
  return (
    <div className="group-dashboard">
      <div className="dashboard-header">
        <h1>🤝 Mess Buddy Groups</h1>
        <p>Coordinate with friends to go to the mess together</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="dashboard-actions">
        <button
          className="action-btn create-btn"
          onClick={() => setView('create')}
        >
          ➕ Create Group
        </button>
        <button
          className="action-btn join-btn"
          onClick={() => setView('join')}
        >
          🔗 Join Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <p>No groups yet. Create or join one to get started!</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Groups List */}
          <div className="groups-sidebar">
            <h3>Your Groups</h3>
            <div className="groups-list">
              {groups.map(group => (
                <div
                  key={group.id}
                  className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="group-name">{group.name}</div>
                  <div className="member-count">{group.memberCount} members</div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Details */}
          {selectedGroup && (
            <div className="group-details">
              {/* Group Code Share Section */}
              <GroupCodeShare 
                groupCode={selectedGroup.groupCode} 
                groupName={selectedGroup.name}
              />

              {/* Group Chat Button */}
              <div className="group-chat-section">
                <h3>💬 Group Chat</h3>
                <p className="chat-description">Chat with your group members to coordinate meals</p>
                <a href={`/groups/${selectedGroup.id}/chat`} className="btn-group-chat">
                  💬 Open Group Chat
                </a>
              </div>

              {/* Group Members */}
              <div className="group-members-section">
                <h3>👥 Members ({selectedGroup.memberCount || selectedGroup.members?.length || 0})</h3>
                <div className="members-list">
                  {selectedGroup.members?.map((member, index) => (
                    <div key={index} className="member-item">
                      <span className="member-avatar">👤</span>
                      <span className="member-name">{member}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupDashboard;
