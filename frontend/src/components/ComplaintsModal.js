import React, { useState } from 'react';
import './ComplaintsModal.css';

const COMPLAINT_REASONS = [
  'Poor taste',
  'Hygiene issue',
  'Too oily',
  'Repeated too often',
  'Undercooked / Overcooked',
  'Other'
];

const ComplaintsModal = ({ foodItem, mealType, onClose, onSubmit, loading = false }) => {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleReasonToggle = (reason) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
    setError('');
  };

  const handleCommentChange = (e) => {
    const text = e.target.value.slice(0, 100);
    setComment(text);
  };

  const handleSubmit = () => {
    if (selectedReasons.length === 0) {
      setError('Please select at least one reason');
      return;
    }

    onSubmit({
      mealType,
      foodItem,
      reasons: selectedReasons,
      comment: comment.trim()
    });
  };

  return (
    <div className="complaints-modal-overlay">
      <div className="complaints-modal">
        <div className="modal-header">
          <h2>🚨 Raise Complaint</h2>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            title="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="food-info">
            <p className="food-label">About: <strong>{foodItem}</strong></p>
            <p className="meal-label">Meal Type: <strong>{mealType}</strong></p>
          </div>

          <div className="reasons-section">
            <label className="section-label">What's your complaint? (Select at least one)</label>
            <div className="reasons-grid">
              {COMPLAINT_REASONS.map(reason => (
                <button
                  key={reason}
                  className={`reason-btn ${selectedReasons.includes(reason) ? 'selected' : ''}`}
                  onClick={() => handleReasonToggle(reason)}
                  disabled={loading}
                >
                  <span className="checkbox">
                    {selectedReasons.includes(reason) ? '✓' : ''}
                  </span>
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div className="comment-section">
            <label className="section-label">
              Add a comment (optional, max 100 characters)
            </label>
            <textarea
              className="comment-input"
              placeholder="Tell us more about your experience..."
              value={comment}
              onChange={handleCommentChange}
              disabled={loading}
              maxLength="100"
            />
            <p className="char-count">
              {comment.length} / 100
            </p>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="modal-actions">
            <button 
              className="modal-btn cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="modal-btn submit-btn"
              onClick={handleSubmit}
              disabled={loading || selectedReasons.length === 0}
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsModal;
