import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import { getUser, isAuthenticated } from '@/services/auth-service';
import { useAppEvents } from '@/hooks/useWebSocket';
import {
  Users,
  Plus,
  UserPlus,
  Send,
  CheckCircle2,
  Copy,
  ArrowLeft,
  MessageSquare,
  QrCode,
  Sparkles,
  Info,
  Clock,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const formatDisplayName = (emailOrId) => {
  if (!emailOrId) return 'Resident';
  if (emailOrId.includes('@')) {
    const raw = emailOrId.split('@')[0];
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return emailOrId;
};

export default function GroupsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinParam = searchParams.get('join');

  const [userGroups, setUserGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(Boolean(joinParam));
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState(joinParam || '');
  const [goingUsers, setGoingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const currentUser = getUser() || {};
  const activeGroupIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadGroups = async () => {
    setLoading(true);
    try {
      const groups = await messApi.getUserGroups().catch(() => []);
      if (Array.isArray(groups)) {
        setUserGroups(groups);
        if (groups.length > 0 && !activeGroup) {
          setActiveGroup(groups[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching user groups:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetailsAndChat = async (group) => {
    if (!group) return;
    try {
      const targetId = group.id || group._id;
      const details = await messApi.getGroupDetails(targetId).catch(() => group);
      setActiveGroup(details || group);

      const msgList = await messApi.getMessages('GROUP', targetId).catch(() => []);
      setMessages(Array.isArray(msgList) ? msgList : []);

      const mealStatus = await messApi.getGroupMealStatus(targetId, 'LUNCH').catch(() => null);
      if (mealStatus && Array.isArray(mealStatus.goingUsers)) {
        setGoingUsers(mealStatus.goingUsers);
      }
      setTimeout(scrollToBottom, 100);
    } catch (e) {
      console.error('Error loading group chat:', e);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (activeGroup) {
      activeGroupIdRef.current = activeGroup.id || activeGroup._id;
      loadGroupDetailsAndChat(activeGroup);
    }
  }, [activeGroup?.id || activeGroup?._id]);

  // WebSocket Live chat listener
  useAppEvents(async (event) => {
    if (event?.type !== 'CHAT_MESSAGE') return;
    const incomingChatId = event?.data?.chatId;
    const openId = activeGroupIdRef.current;
    if (incomingChatId && openId && incomingChatId === openId) {
      try {
        const msgList = await messApi.getMessages('GROUP', openId).catch(() => []);
        if (Array.isArray(msgList)) {
          setMessages(msgList);
          setTimeout(scrollToBottom, 100);
        }
      } catch {}
    }
  });

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const created = await messApi.createGroup(newGroupName);
      setNewGroupName('');
      setShowCreateModal(false);
      loadGroups();
      if (created) setActiveGroup(created);
    } catch (err) {
      alert(err.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const joined = await messApi.joinGroup(joinCode);
      setJoinCode('');
      setShowJoinModal(false);
      loadGroups();
      if (joined) setActiveGroup(joined);
    } catch (err) {
      alert(err.message || 'Invalid group code');
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !activeGroup) return;
    const targetId = activeGroup.id || activeGroup._id;
    try {
      await messApi.sendMessage('GROUP', targetId, messageText);
      setMessageText('');
      loadGroupDetailsAndChat(activeGroup);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleToggleGoing = async () => {
    if (!activeGroup) return;
    const targetId = activeGroup.id || activeGroup._id;
    const isGoing = goingUsers.includes(currentUser.email);
    try {
      if (isGoing) {
        await messApi.cancelGroupMealGoing(targetId, 'LUNCH', currentUser.id);
        setGoingUsers(goingUsers.filter((u) => u !== currentUser.email));
      } else {
        await messApi.markGroupMealGoing(targetId, 'LUNCH', currentUser.id);
        setGoingUsers([...goingUsers, currentUser.email]);
      }
    } catch (e) {
      console.error('Failed to update meal status:', e);
    }
  };

  const copyCode = () => {
    if (!activeGroup?.groupCode) return;
    navigator.clipboard.writeText(activeGroup.groupCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <PageHeader
        badge={
          <Badge variant="primary" className="text-[10px] font-bold">
            Hostel Dining Community
          </Badge>
        }
        title="Buddy Groups & Chat"
        description="Coordinate meal times with roommates and friends, track who is heading down to the mess, and chat in real time."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJoinModal(true)}
              className="text-xs font-semibold gap-1.5"
            >
              <UserPlus className="h-4 w-4" /> Join via Code
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-bold bg-primary hover:bg-primary-hover gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Group
            </Button>
          </>
        }
      />

      {/* Main Container: Split List & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card overflow-hidden min-h-[640px]">
        
        {/* Left Side: Groups List (Hidden on mobile when chat is active) */}
        <div
          className={`lg:col-span-4 border-r border-slate-200/90 dark:border-slate-800 flex flex-col ${
            mobileChatOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Groups ({userGroups.length})
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-text-muted">Loading your groups...</div>
            ) : userGroups.length === 0 ? (
              <div className="py-12 text-center p-4 space-y-3">
                <Users className="h-8 w-8 text-text-muted mx-auto" />
                <p className="text-xs text-text-secondary">You haven't joined any groups yet.</p>
                <Button size="sm" onClick={() => setShowCreateModal(true)} className="text-xs">
                  Create First Group
                </Button>
              </div>
            ) : (
              userGroups.map((group) => {
                const isActive = (group.id || group._id) === (activeGroup?.id || activeGroup?._id);
                return (
                  <button
                    key={group.id || group._id}
                    onClick={() => {
                      setActiveGroup(group);
                      setMobileChatOpen(true);
                    }}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 ${
                      isActive
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="h-11 w-11 rounded-2xl bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {group.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-text truncate">
                          {group.name}
                        </h4>
                        <span className="text-[10px] text-text-muted font-mono">
                          {group.groupCode}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate mt-0.5">
                        {group.members?.length || 1} members · Click to chat
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Group View & Chat */}
        <div
          className={`lg:col-span-8 flex flex-col justify-between ${
            !mobileChatOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeGroup ? (
            <>
              {/* Group Active Header */}
              <div className="p-4 border-b border-border flex items-center justify-between gap-3 bg-surface-elevated">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => setMobileChatOpen(false)}
                    className="lg:hidden text-text-secondary"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-10 w-10 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {activeGroup.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-text truncate">
                      {activeGroup.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <button
                        onClick={copyCode}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary hover:underline"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedCode ? 'Copied!' : `Code: ${activeGroup.groupCode}`}
                      </button>
                      <span>·</span>
                      <span>{activeGroup.members?.length || 1} members</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/groups/${activeGroup.id || activeGroup._id}`)}
                    className="text-xs font-semibold gap-1"
                  >
                    <QrCode className="h-3.5 w-3.5" /> Details & QR
                  </Button>
                </div>
              </div>

              {/* Meal Going Coordination Bar */}
              <div className="px-5 py-3 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Heading for Lunch ({goingUsers.length}):
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-xs">
                    {goingUsers.length > 0 ? goingUsers.map(formatDisplayName).join(', ') : 'No one yet'}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant={goingUsers.includes(currentUser.email) ? 'success' : 'primary'}
                  onClick={handleToggleGoing}
                  className="shrink-0 text-xs font-bold gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {goingUsers.includes(currentUser.email) ? 'Marked Going' : "I'm Going"}
                </Button>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3.5 min-h-[360px] max-h-[460px]">
                {messages.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-400">No messages in this buddy group yet.</p>
                    <p className="text-[11px] text-slate-500">Say hello and plan your next meal together!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderEmail === currentUser.email || msg.sender === currentUser.email;
                    const senderName = formatDisplayName(msg.senderEmail || msg.sender);

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {!isMe && (
                          <span className="text-[10px] font-semibold text-slate-400 px-1 mb-1">
                            {senderName}
                          </span>
                        )}
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed ${
                            isMe
                              ? 'bg-primary text-white rounded-br-xs shadow-xs'
                              : 'bg-surface-elevated text-text rounded-bl-xs border border-border'
                          }`}
                        >
                          <p>{msg.message || msg.content}</p>
                          <span
                            className={`block text-[9px] mt-1 text-right ${
                              isMe ? 'text-white/80' : 'text-text-muted'
                            }`}
                          >
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Just now'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex items-center gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message ${activeGroup.name}...`}
                  className="flex-1 h-11 text-xs bg-surface border-border"
                />
                <Button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="h-11 px-4 bg-primary hover:bg-primary-hover text-white font-bold"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Users className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold">Select a group or create one to start coordinating meals.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-dropdown space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create Buddy Group</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Group Name
                </label>
                <Input
                  required
                  placeholder="e.g. 2nd Floor Foodies / Breakfast Squad"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="font-bold bg-primary hover:bg-primary-hover">
                  Create Group
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowJoinModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-dropdown space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Join Buddy Group</h3>
              <button onClick={() => setShowJoinModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 6-Character Group Code
                </label>
                <Input
                  required
                  placeholder="e.g. X9K2LM"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="h-10 text-xs font-mono uppercase"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="font-bold bg-primary hover:bg-primary-hover">
                  Join Group
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
