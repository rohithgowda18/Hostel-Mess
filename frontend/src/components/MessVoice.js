import React, { useState, useEffect } from 'react';
import ComplaintCard from './ComplaintCard';
import ComplaintsModal from './ComplaintsModal';
import complaintApi from '../services/complaints';
import { FOOD_OPTIONS } from '../data/foodData';
import './MessVoice.css';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

const MEAL_EMOJIS = {
  BREAKFAST: '🍳',
  LUNCH: '🍛',
  SNACKS: '☕',
  DINNER: '🌙'
};

const MEAL_DISPLAY_NAMES = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  SNACKS: 'Snacks',
  DINNER: 'Dinner'
};

const MessVoice = () => {
    // Handle submitting a new complaint
    const handleSubmitComplaint = async (complaintData) => {
      setSubmitLoading(true);
      try {
        const response = await complaintApi.raiseComplaint(
          complaintData.mealType,
          complaintData.foodItem,
          complaintData.reasons,
          complaintData.comment
        );
        // Update complaints for the meal type
        const mealType = complaintData.mealType;
        const updatedComplaints = [...(complaints[mealType] || [])];
        const existingIndex = updatedComplaints.findIndex(
          c => c.foodItem === complaintData.foodItem
        );
        if (existingIndex >= 0) {
          updatedComplaints[existingIndex] = response.data;
        } else {
          updatedComplaints.push(response.data);
        }
        setComplaints({
          ...complaints,
          [mealType]: updatedComplaints
        });
        setShowModal(false);
        setSelectedFood(null);
        setSelectedMeal(null);
        setSubmitLoading(false);
      } catch (err) {
        setError('Failed to submit complaint. Please try again.');
        setSubmitLoading(false);
      }
    };
  const [complaints, setComplaints] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Generate or retrieve unique user ID for vote tracking
  const getUserId = () => {
    let userId = localStorage.getItem('messVoiceUserId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('messVoiceUserId', userId);
    }
    return userId;
  };



  useEffect(() => {
    fetchAllComplaints();
  }, []);

  const fetchAllComplaints = () => {
    setLoading(true);
    setError('');

    const promises = MEAL_TYPES.map(mealType =>
      complaintApi.getComplaintsToday(mealType)
        .then(res => ({ mealType, data: res.data }))
        .catch(err => ({ mealType, data: [], error: true }))
    );

    Promise.all(promises)
      .then(results => {
        const complaintsByMeal = {};
        let anyError = false;
        results.forEach(result => {
          if (result.error) anyError = true;
          complaintsByMeal[result.mealType] = result.data || [];
        });
        setComplaints(complaintsByMeal);
        if (anyError) setError('Feedback service unavailable. Try again later.');
        setLoading(false);
      })
      .catch(err => {
        setError('Feedback service unavailable. Try again later.');
        setLoading(false);
      });
  };

  const handleRaiseComplaint = (foodItem, mealType) => {
    setSelectedFood(foodItem);
    setSelectedMeal(mealType);
    setShowModal(true);
  };


  // Handle voting on a complaint
  const handleVote = async (complaintId, vote) => {
    try {
      const userId = getUserId();
      const response = await complaintApi.voteOnComplaint(complaintId, vote, userId);
      // Update the complaint in state
      const updatedComplaints = { ...complaints };
      const mealType = response.data.mealType;
      if (updatedComplaints[mealType]) {
        const idx = updatedComplaints[mealType].findIndex(c => c._id === complaintId);
        if (idx !== -1) {
          updatedComplaints[mealType][idx] = response.data;
          setComplaints(updatedComplaints);
        }
      }
    } catch (err) {
      // Try to show backend error message if available
      const backendMsg = err.response?.data?.error || err.response?.data?.message;
      setError(backendMsg || 'Failed to vote. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFood(null);
    setSelectedMeal(null);
  };

  if (loading && Object.keys(complaints).length === 0) {
    return (
      <div className="mess-voice-container">
        <div className="mess-voice-header">
          <h1>🗣 Mess Voice</h1>
          <p>Collective student voice for food quality</p>
        </div>
        <div className="loading-state">
          <p>Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mess-voice-container">
      <div className="mess-voice-header">
        <h1>🗣 Mess Voice</h1>
        <p>Collective student voice for food quality • No spam, just action</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button onClick={fetchAllComplaints} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="meals-grid">
        {MEAL_TYPES.map(mealType => {
          const mealComplaints = complaints[mealType] || [];
          const foodItemsList = FOOD_OPTIONS[mealType] || [];
          const availableFoods = foodItemsList.map(item => item.name); // Extract just the names
          
          return (
            <section key={mealType} className="meal-section">
              <div className="meal-header">
                <h2>
                  {MEAL_EMOJIS[mealType]} {MEAL_DISPLAY_NAMES[mealType]}
                </h2>
                <span className="complaint-count">
                  {mealComplaints.length} complaint{mealComplaints.length !== 1 ? 's' : ''}
                </span>
              </div>

              {mealComplaints.length === 0 && availableFoods.length === 0 ? (
                <div className="empty-state">
                  <p>✨ No foods available for {MEAL_DISPLAY_NAMES[mealType]}</p>
                </div>
              ) : (
                <div className="meal-content">
                  {/* Show Complaints First */}
                  {mealComplaints.length > 0 && (
                    <div className="complaints-list">
                      {mealComplaints.map(complaint => (
                        <ComplaintCard
                          key={complaint.id}
                          complaint={complaint}
                          onVote={handleVote}
                          onRaiseComplaint={(foodItem) =>
                            handleRaiseComplaint(foodItem, mealType)
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* Show Available Foods */}
                  {availableFoods.length > 0 && (
                    <div className="available-foods">
                      <h3 className="available-foods-title">📋 Available Foods</h3>
                      <div className="food-items-list">
                        {availableFoods.map(food => {
                          const hasComplaint = mealComplaints.some(c => c.foodItem === food);
                          return (
                            <div key={food} className="food-item-option">
                              <div className="food-item-info">
                                <span className="food-name">{food}</span>
                                {hasComplaint && (
                                  <span className="has-complaint-badge">Has complaint</span>
                                )}
                              </div>
                              {!hasComplaint && (
                                <button
                                  className="btn-raise-complaint"
                                  onClick={() => handleRaiseComplaint(food, mealType)}
                                  title="Click to raise a complaint about this food"
                                >
                                  🗣 Complain
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {mealComplaints.length === 0 && availableFoods.length > 0 && (
                    <div className="no-complaints-note">
                      <p>✨ No complaints yet for these foods</p>
                      <p className="note-subtext">Select any food above to raise a complaint</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {showModal && (
        <ComplaintsModal
          foodItem={selectedFood}
          mealType={selectedMeal}
          onClose={handleCloseModal}
          onSubmit={handleSubmitComplaint}
          loading={submitLoading}
        />
      )}
    </div>
  );
};

export default MessVoice;
