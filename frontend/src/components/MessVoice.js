
import React, { useState, useEffect } from 'react';
import ComplaintCard from './ComplaintCard';
import ComplaintsModal from './ComplaintsModal';
import complaintApi from '../services/complaints';
import { FOOD_OPTIONS } from '../data/foodData';
import './MessVoice.css';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

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
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Debug: log complaints for React key warning
  console.log('Current complaints:', complaints);

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
          // Map id and _id for all complaints for React key and state update
          complaintsByMeal[result.mealType] = (result.data || []).map(c => ({
            ...c,
            id: c.id || c._id,
            _id: c._id || c.id
          }));
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
      console.log('Vote response:', response.data);
      // Map id to _id for frontend consistency
      const updatedComplaint = { ...response.data, _id: response.data.id };
      const updatedComplaints = { ...complaints };
      const mealType = updatedComplaint.mealType;
      if (updatedComplaints[mealType]) {
        const idx = updatedComplaints[mealType].findIndex(c => c._id === complaintId);
        if (idx !== -1) {
          updatedComplaints[mealType][idx] = updatedComplaint;
          setComplaints(updatedComplaints);
        }
      }
    } catch (err) {
      // Show backend error message to user
      let backendMsg = 'Failed to vote. Please try again.';
      if (err.response) {
        if (err.response.data && (err.response.data.error || err.response.data.message)) {
          backendMsg = err.response.data.error || err.response.data.message;
        } else if (typeof err.response.data === 'string') {
          backendMsg = err.response.data;
        }
        console.error('Vote error:', err.response);
      }
      setError(backendMsg);
    }
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
          const availableFoods = foodItemsList.map(item => item.name);

          return (
            <section key={mealType} className="meal-section">
              <div className="meal-header">
                <span className="meal-title">{mealType}</span>
                <span className="complaint-count">
                  {mealComplaints.length} complaint{mealComplaints.length !== 1 ? 's' : ''}
                </span>
              </div>

              {mealComplaints.length === 0 && availableFoods.length === 0 ? (
                <div className="empty-state">
                  <p>✨ No foods available for {mealType}</p>
                </div>
              ) : (
                <div className="meal-content">
                  {/* Show Complaints First */}
                  {mealComplaints.length > 0 && (
                    <div className="complaints-list">
                      {mealComplaints.map(complaint => (
                        <ComplaintCard
                          key={complaint._id}
                          complaint={complaint}
                          onVote={(complaintId, voteType) => handleVote(complaintId, voteType)}
                          onRaiseComplaint={(foodItem) => handleRaiseComplaint(foodItem, mealType)}
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
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitComplaint}
          loading={submitLoading}
        />
      )}
    </div>
  );
}

export default MessVoice;
