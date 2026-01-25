import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CreateGroup from './CreateGroup';
import JoinGroup from './JoinGroup';
import GroupCodeShare from './GroupCodeShare';
import MealGoingButton from './MealGoingButton';
import GroupStatusList from './GroupStatusList';
import './GroupDashboard.css';

const GroupDashboard = ({ userId }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState('DINNER');
  const [userGoingStatus, setUserGoingStatus] = useState({});
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list', 'create', 'join'

  const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
  const mealEmojis = {
    BREAKFAST: '🍳',
    LUNCH: '🍛',
    SNACKS: '☕',
    DINNER: '🌙'
  };

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

  const loadMealStatus = async (groupId, mealType) => {
    try {
      // Call api.getGroupDetails to get meal status
      const groupData = await api.getGroupDetails(groupId);
      if (groupData) {
        const mealStatus = groupData.mealStatus?.[mealType] || {};
        const isUserGoing = mealStatus.goingUsers?.includes(userId);
        setUserGoingStatus(prev => ({
          ...prev,
          [`${groupId}-${mealType}`]: isUserGoing
        }));
      }
    } catch (err) {
      console.error('Failed to load meal status:', err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (userId) {
      loadUserGroups();
    }
  }, [userId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedGroup) {
      loadMealStatus(selectedGroup.id, selectedMeal);
    }
  }, [selectedGroup, selectedMeal, userId]);

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

  const handleMealVoteChange = (status) => {
    const key = `${selectedGroup.id}-${selectedMeal}`;
    const isUserGoing = status.goingUsers?.includes(userId);
    setUserGoingStatus(prev => ({
      ...prev,
      [key]: isUserGoing
    }));
    
    // Reload groups to show updated status
    loadUserGroups();
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
              <div className="group-chat-button-section">
                <a href={`/groups/${selectedGroup.id}/chat`} className="btn-group-chat">
                  💬 Open Group Chat
                </a>
              </div>

              {/* Meal Tabs */}
              <div className="meal-tabs">
                {mealTypes.map(meal => (
                  <button
                    key={meal}
                    className={`meal-tab ${selectedMeal === meal ? 'active' : ''}`}
                    onClick={() => setSelectedMeal(meal)}
                  >
                    <span className="emoji">{mealEmojis[meal]}</span>
                    <span className="label">{meal}</span>
                  </button>
                ))}
              </div>

              {/* Going Status for Selected Meal */}
              <div className="meal-section">
                <h3>{mealEmojis[selectedMeal]} {selectedMeal}</h3>

                <MealGoingButton
                  groupId={selectedGroup.id}
                  mealType={selectedMeal}
                  userId={userId}
                  onVoteChange={handleMealVoteChange}
                  isUserGoing={userGoingStatus[`${selectedGroup.id}-${selectedMeal}`] || false}
                />
              </div>

              {/* All Meal Status */}
              <div className="all-meals-section">
                <GroupStatusList
                  group={selectedGroup}
                  groupMembers={selectedGroup.members}
                  onRefresh={() => loadMealStatus(selectedGroup.id, selectedMeal)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupDashboard;
