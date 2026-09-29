import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import { usePageTitle } from '@/hooks/use-page-title';
import { useToast } from '@/context/toast-context';
import websocketService from '@/services/websocket-service';
import { useAppEvents } from '@/hooks/useWebSocket';
import { getMealTimeStatus } from '@/utils/meal-time';

const formatDisplayName = (emailOrId, currentUserEmail) => {
  if (!emailOrId) return 'Resident';
  const isMe =
    currentUserEmail &&
    (emailOrId.toLowerCase() === currentUserEmail.toLowerCase() ||
      emailOrId === currentUserEmail);
  const raw = emailOrId.includes('@') ? emailOrId.split('@')[0] : emailOrId;
  const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  return isMe ? `${capitalized} (You)` : capitalized;
};

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle('Group Details', 'Hostel dining group meal coordination and chat.');

  const currentUser = getUser() || {};
  const currentEmail = currentUser.email || '';

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goingUsers, setGoingUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [submittingGoing, setSubmittingGoing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [timeStatus, setTimeStatus] = useState(() => getMealTimeStatus(0));
  const currentMealSlot = timeStatus.activeSlot || timeStatus.nextSlot || {
    key: 'LUNCH',
    name: 'Lunch',
    time: '12:30 – 14:30'
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sync server meal slot every 30s
  useEffect(() => {
    const updateTime = () => setTimeStatus(getMealTimeStatus(0));
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadGroupDetails = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [details, msgList, mealStatus] = await Promise.all([
        messApi.getGroupDetails(groupId).catch(() => null),
        messApi.getMessages('GROUP', groupId).catch(() => []),
        messApi.getGroupMealStatus(groupId, currentMealSlot.key).catch(() => ({ goingUsers: [] }))
      ]);

      if (details) setGroup(details);
      if (Array.isArray(msgList)) setMessages(msgList);
      if (Array.isArray(mealStatus?.goingUsers)) setGoingUsers(mealStatus.goingUsers);
      setTimeout(scrollToBottom, 80);
    } catch (err) {
      console.error('Failed to load group:', err);
      toast.error('Load Failed', 'Could not fetch group details.');
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is owner/creator of the group
  const isOwner = Boolean(
    group &&
    (
      (group.creatorId && group.creatorId === currentUser?.id) ||
      (group.creator && group.creator.toLowerCase() === currentEmail?.toLowerCase()) ||
      (group.createdBy && group.createdBy.toLowerCase() === currentEmail?.toLowerCase()) ||
      (group.creator && group.creator === currentUser?.id)
    )
  );

  // Subscribe to real-time STOMP topic for this group
  useEffect(() => {
    if (!groupId) return;
    loadGroupDetails();

    const unsubscribe = websocketService.subscribeToGroupChat(groupId, (data) => {
      if (data?.type === 'GROUP_DELETED') {
        toast.info('Group Deleted', data.message || 'This group was deleted by the admin.');
        navigate('/student/groups');
        return;
      }
      if (data?.type === 'MEMBER_REMOVED') {
        if (data.member?.toLowerCase() === currentEmail?.toLowerCase() || data.member === currentUser?.id) {
          toast.warning('Removed from Group', 'You have been removed from this group.');
          navigate('/student/groups');
          return;
        } else {
          messApi.getGroupDetails(groupId).then(setGroup).catch(() => {});
        }
        return;
      }
      if (data && (data.id || data.message)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
        setTimeout(scrollToBottom, 50);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [groupId, currentMealSlot.key]);

  // Fallback app-wide events listener
  useAppEvents(async (event) => {
    if (event?.type !== 'CHAT_MESSAGE') return;
    const incomingChatId = event?.data?.chatId;
    if (incomingChatId && groupId && incomingChatId === groupId) {
      const msg = event?.data;
      if (msg && msg.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);
      }
    }
  });

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const cleanMsg = messageText.trim();
    if (!cleanMsg || !groupId) return;
    setMessageText('');

    try {
      const sent = await messApi.sendMessage('GROUP', groupId, cleanMsg);
      if (sent && (sent.id || sent.message)) {
        setMessages((prev) => [...prev.filter((m) => m.id !== sent.id), sent]);
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Send Failed', 'Could not send message.');
    }
  };

  const handleToggleGoing = async (wantToGo) => {
    if (!groupId || submittingGoing) return;
    setSubmittingGoing(true);

    try {
      if (wantToGo) {
        await messApi.markGroupMealGoing(groupId, currentMealSlot.key, currentUser.id);
        setGoingUsers((prev) => (prev.includes(currentEmail) ? prev : [...prev, currentEmail]));
        toast.success('Declared Going', `Marked as going for ${currentMealSlot.name}!`);
      } else {
        await messApi.cancelGroupMealGoing(groupId, currentMealSlot.key, currentUser.id);
        setGoingUsers((prev) => prev.filter((u) => u !== currentEmail));
        toast.info('Declared Not Going', `Updated: Not attending ${currentMealSlot.name}.`);
      }
    } catch (e) {
      console.error('Failed to update meal status:', e);
      toast.error('Update Failed', 'Could not update meal attendance declaration.');
    } finally {
      setSubmittingGoing(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;
    const groupName = group.name || 'this group';
    if (!window.confirm(`Are you sure you want to leave "${groupName}"?`)) return;

    try {
      await messApi.leaveGroup(groupId);
      toast.info('Left Group', `You have left "${groupName}".`);
      navigate('/student/groups');
    } catch (err) {
      toast.error('Leave Failed', err.message || 'Could not leave group.');
    }
  };

  const handleRemoveMember = async (memberEmailOrId) => {
    if (!group || !isOwner) return;
    const name = formatDisplayName(memberEmailOrId, currentEmail);
    if (!window.confirm(`Are you sure you want to remove ${name} from "${group.name}"?`)) return;

    try {
      await messApi.removeGroupMember(groupId, memberEmailOrId);
      toast.success('Member Removed', `${name} removed from the group.`);
      const updated = await messApi.getGroupDetails(groupId);
      if (updated) setGroup(updated);
    } catch (err) {
      toast.error('Action Failed', err.message || 'Could not remove member.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !isOwner) return;
    const groupName = group.name || 'this group';
    if (!window.confirm(`⚠️ Are you sure you want to delete "${groupName}"?\n\nThis will permanently delete the group, group chat history, and remove all members.`)) {
      return;
    }

    try {
      await messApi.deleteGroup(groupId);
      toast.success('Group Deleted', `"${groupName}" has been deleted.`);
      navigate('/student/groups');
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Could not delete group.');
    }
  };

  const copyGroupCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Code Copied', `Group code ${code} copied to clipboard.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-on-surface-variant font-medium">Loading group details...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-container text-primary flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[28px]">group_off</span>
        </div>
        <h2 className="text-lg font-bold text-on-surface">Group Not Found</h2>
        <p className="text-xs text-on-surface-variant">
          This dining group does not exist or you are not a member.
        </p>
        <button
          type="button"
          onClick={() => navigate('/student/groups')}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs cursor-pointer"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  const members = Array.isArray(group.members)
    ? group.members
    : group.members
    ? [group.members]
    : [];

  const isUserGoing = Boolean(
    currentEmail &&
      goingUsers.some(
        (u) =>
          u?.toLowerCase() === currentEmail.toLowerCase() ||
          u === currentUser.id
      )
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/student/groups')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        <span>Back to All Groups</span>
      </button>

      {/* Group Header Card */}
      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              {group.name}
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyGroupCode(group.groupCode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-mono font-bold text-on-surface border border-outline-variant/20 transition-all cursor-pointer"
            >
              <span className="text-outline font-normal">Code:</span>
              <span>{group.groupCode}</span>
              <span className="material-symbols-outlined text-[16px] text-primary">
                {copiedCode ? 'check' : 'content_copy'}
              </span>
            </button>

            {isOwner ? (
              <button
                type="button"
                onClick={handleDeleteGroup}
                title="Delete this group (Admin)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-container/20 hover:bg-error-container text-error text-xs font-semibold border border-error/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Delete Group</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLeaveGroup}
                title="Leave group"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 border border-outline-variant/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Leave</span>
              </button>
            )}
          </div>
        </div>

        {/* ──────────────── TODAY'S MEAL COORDINATION ──────────────── */}
        <div className="bg-surface-container-low rounded-xl p-4 sm:p-5 border border-outline-variant/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                TODAY'S MEAL
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-base font-extrabold text-on-surface uppercase">
                  {currentMealSlot.name}
                </h3>
                <span className="text-xs font-mono text-on-surface-variant">
                  {currentMealSlot.time}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span>
                {goingUsers.length} {goingUsers.length === 1 ? 'member going' : 'members going'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={submittingGoing}
              onClick={() => handleToggleGoing(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isUserGoing
                  ? 'bg-secondary text-on-secondary ring-2 ring-secondary/30'
                  : 'bg-primary hover:bg-primary-container text-on-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isUserGoing ? 'check_circle' : 'restaurant'}
              </span>
              <span>{isUserGoing ? "I'm Going ✓" : "I'm Going"}</span>
            </button>

            {isUserGoing && (
              <button
                type="button"
                disabled={submittingGoing}
                onClick={() => handleToggleGoing(false)}
                className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/20 transition-all cursor-pointer"
              >
                Not Going
              </button>
            )}
          </div>

          {/* Who's Going List */}
          <div className="space-y-1.5 pt-2 border-t border-outline-variant/15">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline block">
              Who's going?
            </span>
            {members.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {members.map((member, idx) => {
                  const memberEmail = typeof member === 'string' ? member : member.email;
                  const isGoing = goingUsers.includes(memberEmail);

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between text-xs border border-outline-variant/10"
                    >
                      <span className="font-semibold text-on-surface truncate">
                        {formatDisplayName(memberEmail, currentEmail)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isGoing
                            ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                            : 'text-on-surface-variant/70'
                        }`}
                      >
                        {isGoing ? 'Going' : 'Not declared'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">No members in group yet.</p>
            )}
          </div>
        </div>

        {/* ──────────────── MEMBERS ──────────────── */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-outline block">
            MEMBERS ({members.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {members.map((member, idx) => {
              const memberEmail = typeof member === 'string' ? member : member.email;
              const isMe =
                currentEmail &&
                (memberEmail?.toLowerCase() === currentEmail.toLowerCase() ||
                  memberEmail === currentUser.id);
              const isMemberAdmin =
                (group.creatorId && group.creatorId === memberEmail) ||
                (group.creator && group.creator.toLowerCase() === memberEmail?.toLowerCase()) ||
                (group.createdBy && group.createdBy.toLowerCase() === memberEmail?.toLowerCase());

              return (
                <div
                  key={idx}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                    isMe
                      ? 'bg-primary-fixed/30 border-primary text-on-surface font-semibold'
                      : 'bg-surface-container-low border-outline-variant/20 text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-outline">person</span>
                  <span>{formatDisplayName(memberEmail, currentEmail)}</span>
                  {isMemberAdmin && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                      Admin
                    </span>
                  )}
                  {isOwner && !isMemberAdmin && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(memberEmail)}
                      title={`Remove ${memberEmail} from group`}
                      className="ml-1 text-on-surface-variant hover:text-error hover:bg-error-container/30 p-0.5 rounded transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ──────────────── GROUP CHAT ──────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">chat</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline">GROUP CHAT</h3>
          </div>
          <span className="text-[11px] text-on-surface-variant">Real-time</span>
        </div>

        {/* Messages */}
        <div className="h-64 sm:h-72 overflow-y-auto space-y-2.5 pr-1">
          {messages.length > 0 ? (
            messages.map((msg, idx) => {
              const isMe =
                currentEmail &&
                (msg.senderEmail?.toLowerCase() === currentEmail.toLowerCase() ||
                  msg.senderName?.toLowerCase() === currentEmail.toLowerCase() ||
                  msg.senderId === currentUser.id);

              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-medium px-1 mb-0.5">
                    <span>
                      {isMe ? 'You' : formatDisplayName(msg.senderName || msg.senderEmail, currentEmail)}
                    </span>
                    {msg.createdAt && (
                      <span className="text-[9px] text-outline font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface-container-low text-on-surface border border-outline-variant/15 rounded-tl-none'
                    }`}
                  >
                    {msg.message || msg.content}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs text-on-surface-variant italic space-y-1">
              <span className="material-symbols-outlined text-[24px] text-outline">forum</span>
              <span>No messages yet. Start the conversation with your hostel mates!</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Message..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
