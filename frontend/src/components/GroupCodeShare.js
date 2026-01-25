import React, { useState } from 'react';
import './GroupCodeShare.css';

const GroupCodeShare = ({ groupCode, groupName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = `Join my mess group "${groupName}" on the Hostel Mess App! 🍛\n\nGroup Code: ${groupCode}\n\nShare this code with friends to join!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="group-code-share">
      <div className="code-display">
        <div className="code-label">📱 Your Group Code</div>
        <div className="code-box">
          <span className="code-text">{groupCode}</span>
          <button 
            className="copy-btn" 
            onClick={handleCopyCode}
            title="Copy to clipboard"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>

      <div className="share-actions">
        <button 
          className="share-btn whatsapp-btn"
          onClick={handleShareWhatsApp}
          title="Share on WhatsApp"
        >
          💬 Share on WhatsApp
        </button>
        <p className="share-hint">Share this code with friends so they can join your group!</p>
      </div>
    </div>
  );
};

export default GroupCodeShare;
