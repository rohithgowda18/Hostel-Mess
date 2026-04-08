/**
 * EXAMPLE: How to integrate WebSocket into existing React components
 * 
 * This file demonstrates the pattern for updating components to use real-time WebSocket
 * instead of REST API polling.
 */

import { useState, useEffect } from 'react';
import { useCommunityChat, useGroupChat, useGroupStatus } from '../hooks/useWebSocket';

/**
 * EXAMPLE 1: Community Chat Component with WebSocket
 * 
 * Before: ChatMessages fetched via REST API on page load only
 * After: Messages stream in real-time via WebSocket subscription
 */
export function CommunityChatWithWebSocket() {
  const { messages, connected, sendMessage } = useCommunityChat();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && connected) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2>Community Chat {connected ? '🟢 Live' : '🔴 Offline'}</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="p-2 border rounded">
              <strong>{msg.senderName}:</strong> {msg.message}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type message..."
          disabled={!connected}
        />
        <button onClick={handleSend} disabled={!connected}>
          Send
        </button>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 2: Group Chat Component with WebSocket
 * 
 * Before: Messages fetched via REST API with manual refresh button
 * After: Messages stream in real-time, updates automatically
 */
export function GroupChatWithWebSocket({ groupId }) {
  const { messages, connected, sendMessage } = useGroupChat(groupId);
  const [input, setInput] = useState('');

  return (
    <div>
      <h3>Group Chat - {groupId} {connected ? '✓' : 'Offline'}</h3>
      {/* Same structure as community chat above */}
    </div>
  );
}

/**
 * EXAMPLE 3: How to migrate an existing component
 * 
 * BEFORE - REST API approach:
 */
export function OldGroupPanel({ groupId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Fetch messages once on load
    fetch(`/api/groups/${groupId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data));
  }, [groupId]);

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.message}</div>
      ))}
      {/* User must click a "Refresh" button to see new messages */}
    </div>
  );
}

/**
 * AFTER - WebSocket approach:
 * 
 * Simply replace the fetch logic with the useGroupChat hook.
 * Messages now update automatically in real-time!
 */
export function NewGroupPanelWithWebSocket({ groupId }) {
  const { messages, connected, sendMessage } = useGroupChat(groupId);

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.message}</div>
      ))}
      {/* Messages update automatically as they arrive! */}
    </div>
  );
}

/**
 * EXAMPLE 4: Using multiple WebSocket hooks simultaneously
 * 
 * You can combine multiple hooks in a single component
 */
export function DashboardWithLiveData({ groupId }) {
  const { messages: communityChat, connected: chatConnected } = useCommunityChat();
  const { status: groupStatus, connected: statusConnected } = useGroupStatus(groupId);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>Community Chat {chatConnected ? '🟢' : '🔴'}</h3>
        {communityChat.map((msg) => (
          <div key={msg.id}>{msg.message}</div>
        ))}
      </div>

      <div>
        <h3>Group Status {statusConnected ? '🟢' : '🔴'}</h3>
        {groupStatus && (
          <div>
            <p>Members: {groupStatus.memberIds.length}</p>
            <p>Confirmed: {groupStatus.goingStatus.filter((g) => g).length}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * INTEGRATION STEPS
 * 
 * 1. Import the hook at the top of your component:
 *    import { useCommunityChat, useGroupChat } from '../hooks/useWebSocket';
 * 
 * 2. Call the hook in your component:
 *    const { messages, connected, sendMessage } = useCommunityChat();
 * 
 * 3. Replace REST API fetch calls with the hook:
 *    OLD: const [messages, setMessages] = useState([]);
 *         useEffect(() => {
 *           fetch('/api/messages').then(r => r.json()).then(setMessages);
 *         }, []);
 *    
 *    NEW: const { messages } = useCommunityChat();
 * 
 * 4. Use the messages state directly in your JSX:
 *    {messages.map(msg => <div key={msg.id}>{msg.message}</div>)}
 * 
 * 5. For sending messages, use the sendMessage function:
 *    onClick={() => sendMessage(text)}
 * 
 * That's it! Your component now has real-time updates.
 * 
 * Keep the REST API endpoints as fallback for initial load or offline scenarios.
 */

/**
 * PERFORMANCE TIPS
 * 
 * 1. Only subscribe to topics when needed:
 *    const { messages } = useCommunityChat(enabled); // enabled = visibility
 * 
 * 2. Use key props on lists to prevent re-renders:
 *    {messages.map(msg => <div key={msg.id}>{msg.message}</div>)}
 * 
 * 3. Limit message history in state:
 *    // Keep only last 100 messages
 *    const limitedMessages = messages.slice(-100);
 * 
 * 4. Use memo for child components:
 *    const MessageList = memo(({ messages }) => (...));
 * 
 * 5. Unsubscribe from topics when component unmounts:
 *    // Hook handles this automatically!
 */
