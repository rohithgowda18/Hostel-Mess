import React, { useState } from 'react';
import './ComplaintCard.css';

const ComplaintCard = ({ complaint, onVote, onRaiseComplaint }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVote = (voteType) => {
    if (hasVoted) return;
    setLoading(true);
    // Always use _id for voting
    const voteResult = onVote(complaint._id, voteType);
    if (voteResult && typeof voteResult.then === 'function') {
      voteResult.then(() => {
        setHasVoted(true);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      // fallback: mark as voted immediately
      setHasVoted(true);
      setLoading(false);
    }
  };

  const getStatusEmoji = () => {
    switch (complaint.status) {
      case 'REMOVAL_REQUESTED':
        return '🚨';
      case 'NEEDS_IMPROVEMENT':
        return '⚠️';
      default:
        return '📝';
    }
  };

  const getStatusLabel = () => {
    switch (complaint.status) {
      case 'REMOVAL_REQUESTED':
        return 'Removal Requested';
      case 'NEEDS_IMPROVEMENT':
        return 'Needs Improvement';
      default:
        return 'Pending Review';
    }
  };

  const totalVotes = complaint.agreeVotes + complaint.disagreeVotes;
  const agreePercentage = totalVotes > 0 
    ? Math.round((complaint.agreeVotes / totalVotes) * 100) 
    : 0;

  return (
    <div className="complaint-card">
      <div className="complaint-header">
        <h3 className="complaint-food-item">🍽️ {complaint.foodItem}</h3>
        <span className="complaint-status-badge">
          {getStatusEmoji()} {getStatusLabel()}
        </span>
      </div>

      {complaint.reasons && complaint.reasons.length > 0 && (
        <div className="complaint-reasons">
          <p className="reasons-label">Common complaints:</p>
          <ul className="reasons-list">
            {complaint.reasons.map((reason, idx) => (
              <li key={idx}>• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {complaint.comments && complaint.comments.length > 0 && (
        <div className="complaint-comments">
          <p className="comments-label">Student feedback:</p>
          <div className="comments-list">
            {complaint.comments.slice(0, 2).map((comment, idx) => (
              <p key={idx} className="comment-item">
                <em>"{comment}"</em>
              </p>
            ))}
            {complaint.comments.length > 2 && (
              <p className="comment-item">
                <em>+{complaint.comments.length - 2} more comments...</em>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="complaint-stats">
        <div className="stat">
          <span className="stat-label">Complaints raised</span>
          <span className="stat-value">{complaint.complaintCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Agree</span>
          <span className="stat-value agree">{complaint.agreeVotes}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Disagree</span>
          <span className="stat-value disagree">{complaint.disagreeVotes}</span>
        </div>
      </div>

      {totalVotes > 0 && (
        <div className="vote-progress">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill agree-bar"
              style={{ width: `${agreePercentage}%` }}
            ></div>
          </div>
          <p className="progress-text">{agreePercentage}% agree</p>
        </div>
      )}

      <div className="complaint-actions">
        <button 
          className="complaint-btn vote-btn"
          onClick={() => handleVote('AGREE')}
          disabled={hasVoted || loading}
          title={hasVoted ? 'You have already voted' : 'Agree with this complaint'}
        >
          👍 Agree {complaint.agreeVotes > 0 && `(${complaint.agreeVotes})`}
        </button>
        <button 
          className="complaint-btn vote-btn disagree"
          onClick={() => handleVote('DISAGREE')}
          disabled={hasVoted || loading}
          title={hasVoted ? 'You have already voted' : 'Disagree with this complaint'}
        >
          👎 Disagree {complaint.disagreeVotes > 0 && `(${complaint.disagreeVotes})`}
        </button>
        <button 
          className="complaint-btn add-complaint-btn"
          onClick={() => onRaiseComplaint(complaint.foodItem)}
          title="Raise another complaint about this food"
        >
          🚨 Raise Complaint
        </button>
      </div>
    </div>
  );
};

export default ComplaintCard;
