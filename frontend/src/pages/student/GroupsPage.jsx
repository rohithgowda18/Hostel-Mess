import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import { useAppEvents } from '@/hooks/useWebSocket';
import websocketService from '@/services/websocket-service';
import { usePageTitle } from '@/hooks/use-page-title';
import { useToast } from '@/context/toast-context';
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

export default function GroupsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const joinParam = searchParams.get('join');
  const initialGroupId = searchParams.get('id');

  const toast = useToast();
  usePageTitle('Groups & Chat', 'Coordinate hostel dining sessions and real-time chat with friends.');

  const currentUser = getUser() || {};
  const currentEmail = currentUser.email || '';

  // Server time and current meal slot
  const [timeStatus, setTimeStatus] = useState(() => getMealTimeStatus(0));
  const currentMealSlot = timeStatus.activeSlot || timeStatus.nextSlot || {
    key: 'LUNCH',
    name: 'Lunch',
    time: '12:30 – 14:30'
  };

  // Groups state
  const [userGroups, setUserGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupGoingCounts, setGroupGoingCounts] = useState({});

  // Active group detail states
  const [goingUsers, setGoingUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [submittingGoing, setSubmittingGoing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(Boolean(joinParam));
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [createdGroupResult, setCreatedGroupResult] = useState(null);
  const [joinCode, setJoinCode] = useState(joinParam || '');
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);

  // Mobile navigation: whether viewing group details on small screens
  const [mobileViewingGroup, setMobileViewingGroup] = useState(false);

  const activeGroupIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sync server time slot every 30s
  useEffect(() => {
    const updateTime = () => setTimeStatus(getMealTimeStatus(0));
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch user's dining groups
  const loadGroups = async (targetSelectId = null) => {
    setLoading(true);
    try {
      const groups = await messApi.getUserGroups().catch(() => []);
      if (Array.isArray(groups)) {
        setUserGroups(groups);

        // Fetch going count for each group for current meal slot
        groups.forEach(async (grp) => {
          const gid = grp.id || grp._id;
          if (gid) {
            try {
              const status = await messApi.getGroupMealStatus(gid, currentMealSlot.key);
              if (status?.goingUsers) {
                setGroupGoingCounts((prev) => ({
                  ...prev,
                  [gid]: status.goingUsers.length
                }));
              }
            } catch { }
          }
        });

        // Determine which group should be active
        if (groups.length > 0) {
          const toSelect = targetSelectId
            ? groups.find((g) => (g.id || g._id) === targetSelectId) || groups[0]
            : activeGroup
              ? groups.find((g) => (g.id || g._id) === (activeGroup.id || activeGroup._id)) || groups[0]
              : initialGroupId
                ? groups.find((g) => (g.id || g._id) === initialGroupId) || groups[0]
                : groups[0];

          setActiveGroup(toSelect);
        } else {
          setActiveGroup(null);
        }
      }
    } catch (e) {
      console.error('Error fetching user groups:', e);
      toast.error('Load Failed', 'Could not load your dining groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups(initialGroupId);
  }, [currentMealSlot.key]);

  // 2. Load details, members, meal status, and chat for selected group
  const loadGroupDetailsAndChat = async (group) => {
    if (!group) return;
    const targetId = group.id || group._id;
    activeGroupIdRef.current = targetId;

    try {
      const [details, msgList, mealStatus] = await Promise.all([
        messApi.getGroupDetails(targetId).catch(() => group),
        messApi.getMessages('GROUP', targetId).catch(() => []),
        messApi.getGroupMealStatus(targetId, currentMealSlot.key).catch(() => ({ goingUsers: [] }))
      ]);

      if (details) setActiveGroup(details);
      if (Array.isArray(msgList)) setMessages(msgList);
      if (Array.isArray(mealStatus?.goingUsers)) {
        setGoingUsers(mealStatus.goingUsers);
        setGroupGoingCounts((prev) => ({
          ...prev,
          [targetId]: mealStatus.goingUsers.length
        }));
      }
      setTimeout(scrollToBottom, 80);
    } catch (e) {
      console.error('Error loading group details and chat:', e);
    }
  };

  const isOwner = Boolean(
    activeGroup &&
    (
      (activeGroup.creatorId && activeGroup.creatorId === currentUser?.id) ||
      (activeGroup.creator && activeGroup.creator.toLowerCase() === currentEmail?.toLowerCase()) ||
      (activeGroup.createdBy && activeGroup.createdBy.toLowerCase() === currentEmail?.toLowerCase()) ||
      (activeGroup.creator && activeGroup.creator === currentUser?.id)
    )
  );

  useEffect(() => {
    if (!activeGroup) return;
    const targetId = activeGroup.id || activeGroup._id;
    activeGroupIdRef.current = targetId;
    loadGroupDetailsAndChat(activeGroup);

    // Real-time group chat subscription via STOMP
    const unsubscribeChat = websocketService.subscribeToGroupChat(targetId, (data) => {
      if (data?.type === 'GROUP_DELETED') {
        toast.info('Group Deleted', data.message || 'This group was deleted by the admin.');
        loadGroups();
        setActiveGroup(null);
        setMobileViewingGroup(false);
        return;
      }
      if (data?.type === 'MEMBER_REMOVED') {
        if (data.member?.toLowerCase() === currentEmail?.toLowerCase() || data.member === currentUser?.id) {
          toast.warning('Removed from Group', 'You have been removed from this group.');
          loadGroups();
          setActiveGroup(null);
          setMobileViewingGroup(false);
          return;
        } else {
          messApi.getGroupDetails(targetId).then(setActiveGroup).catch(() => { });
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
      unsubscribeChat();
    };
  }, [activeGroup?.id || activeGroup?._id]);

  // 3. Fallback WebSocket Real-time app event listener
  useAppEvents(async (event) => {
    if (event?.type !== 'CHAT_MESSAGE') return;
    const incomingChatId = event?.data?.chatId;
    const openId = activeGroupIdRef.current;
    if (incomingChatId && openId && incomingChatId === openId) {
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

  // 4. Create Group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || creating) return;
    setCreating(true);
    try {
      const created = await messApi.createGroup(newGroupName.trim());
      if (created) {
        setCreatedGroupResult(created);
        toast.success('Group Created', `"${created.name}" is ready!`);
        loadGroups(created.id || created._id);
        setActiveGroup(created);
        setMobileViewingGroup(true);
      }
    } catch (err) {
      toast.error('Creation Failed', err.message || 'Could not create group.');
    } finally {
      setCreating(false);
    }
  };

  // 5. Join Group
  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim() || joining) return;
    setJoining(true);
    try {
      const cleanCode = joinCode.trim().toUpperCase();
      const joined = await messApi.joinGroup(cleanCode);
      setJoinCode('');
      setShowJoinModal(false);
      toast.success('Joined Group', `Welcome to "${joined?.name || 'the group'}"!`);
      loadGroups(joined?.id || joined?._id);
      if (joined) {
        setActiveGroup(joined);
        setMobileViewingGroup(true);
      }
    } catch (err) {
      toast.error('Join Failed', err.message || 'Invalid group code. Please check and try again.');
    } finally {
      setJoining(false);
    }
  };

  // 6. Send Chat Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const cleanMsg = messageText.trim();
    if (!cleanMsg || !activeGroup) return;
    const targetId = activeGroup.id || activeGroup._id;
    setMessageText('');

    try {
      const sent = await messApi.sendMessage('GROUP', targetId, cleanMsg);
      if (sent && (sent.id || sent.message)) {
        setMessages((prev) => [...prev.filter((m) => m.id !== sent.id), sent]);
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Message Failed', 'Could not send message.');
    }
  };

  // 6b. Remove Member (Admin only)
  const handleRemoveMember = async (memberEmailOrId) => {
    if (!activeGroup || !isOwner) return;
    const targetId = activeGroup.id || activeGroup._id;
    const name = formatDisplayName(memberEmailOrId, currentEmail);
    if (!window.confirm(`Are you sure you want to remove ${name} from "${activeGroup.name}"?`)) return;

    try {
      await messApi.removeGroupMember(targetId, memberEmailOrId);
      toast.success('Member Removed', `${name} removed from the group.`);
      const updated = await messApi.getGroupDetails(targetId);
      if (updated) setActiveGroup(updated);
    } catch (err) {
      toast.error('Action Failed', err.message || 'Could not remove member.');
    }
  };

  // 6c. Delete Group (Admin only)
  const handleDeleteGroup = async () => {
    if (!activeGroup || !isOwner) return;
    const targetId = activeGroup.id || activeGroup._id;
    const groupName = activeGroup.name || 'this group';
    if (!window.confirm(`⚠️ Are you sure you want to delete "${groupName}"?\n\nThis will permanently delete the group, group chat history, and remove all members.`)) {
      return;
    }

    try {
      await messApi.deleteGroup(targetId);
      toast.success('Group Deleted', `"${groupName}" has been deleted.`);
      loadGroups();
      setActiveGroup(null);
      setMobileViewingGroup(false);
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Could not delete group.');
    }
  };

  // 6d. Leave Group (Regular member)
  const handleLeaveGroup = async () => {
    if (!activeGroup) return;
    const targetId = activeGroup.id || activeGroup._id;
    const groupName = activeGroup.name || 'this group';
    if (!window.confirm(`Are you sure you want to leave "${groupName}"?`)) return;

    try {
      await messApi.leaveGroup(targetId);
      toast.info('Left Group', `You have left "${groupName}".`);
      loadGroups();
      setActiveGroup(null);
      setMobileViewingGroup(false);
    } catch (err) {
      toast.error('Leave Failed', err.message || 'Could not leave group.');
    }
  };

  // 7. Toggle Meal Going Status
  const handleToggleGoing = async (wantToGo) => {
    if (!activeGroup || submittingGoing) return;
    const targetId = activeGroup.id || activeGroup._id;
    setSubmittingGoing(true);

    try {
      if (wantToGo) {
        await messApi.markGroupMealGoing(targetId, currentMealSlot.key, currentUser.id);
        setGoingUsers((prev) => (prev.includes(currentEmail) ? prev : [...prev, currentEmail]));
        setGroupGoingCounts((prev) => ({
          ...prev,
          [targetId]: (prev[targetId] || 0) + (goingUsers.includes(currentEmail) ? 0 : 1)
        }));
        toast.success('Declared Going', `Marked as going for ${currentMealSlot.name}!`);
      } else {
        await messApi.cancelGroupMealGoing(targetId, currentMealSlot.key, currentUser.id);
        setGoingUsers((prev) => prev.filter((u) => u !== currentEmail));
        setGroupGoingCounts((prev) => ({
          ...prev,
          [targetId]: Math.max(0, (prev[targetId] || 1) - 1)
        }));
        toast.info('Declared Not Going', `Updated: Not attending ${currentMealSlot.name}.`);
      }
    } catch (e) {
      console.error('Failed to update meal going status:', e);
      toast.error('Update Failed', 'Could not record your meal attendance.');
    } finally {
      setSubmittingGoing(false);
    }
  };

  // Copy Group Code
  const copyGroupCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Code Copied', `Group code ${code} copied to clipboard.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isUserGoing = Boolean(
    currentEmail &&
    goingUsers.some(
      (u) =>
        u?.toLowerCase() === currentEmail.toLowerCase() ||
        u === currentUser.id
    )
  );

  const activeGroupMembers = Array.isArray(activeGroup?.members)
    ? activeGroup.members
    : activeGroup?.members
      ? [activeGroup.members]
      : [];

  const isCreator =
    activeGroup?.createdBy &&
    (activeGroup.createdBy === currentEmail ||
      activeGroup.createdBy === currentUser.id);

  return (
    <div className="w-full space-y-6 pb-12 max-w-6xl mx-auto">
      {/* ──────────────── 1. PAGE HEADER ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            Groups & Chat
          </h1>
          <p className="text-xs text-on-surface-variant">
            Coordinate meals with your hostel mates.
          </p>
        </div>

        {/* Primary Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setCreatedGroupResult(null);
              setNewGroupName('');
              setNewGroupDesc('');
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">group_add</span>
            <span>+ Create Group</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setJoinCode('');
              setShowJoinModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 border border-outline-variant/20 shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">key</span>
            <span>Join with Code</span>
          </button>
        </div>
      </div>

      {/* ──────────────── 2. MAIN CONTENT (EMPTY STATE OR TWO-COLUMN LAYOUT) ──────────────── */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-on-surface-variant font-medium">
            Loading your dining groups...
          </p>
        </div>
      ) : userGroups.length === 0 ? (
        /* Empty State */
        <div className="bg-surface-container-lowest rounded-xl p-8 sm:p-12 text-center max-w-lg mx-auto border border-outline-variant/20 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center mx-auto shadow-xs border border-outline-variant/15">
            <span className="material-symbols-outlined text-[28px]">groups</span>
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline block">
              MY GROUPS
            </span>
            <h2 className="text-lg font-bold text-on-surface">
              You haven't joined a dining group yet.
            </h2>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Create a group with your hostel mates or join one using a code.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setCreatedGroupResult(null);
                setNewGroupName('');
                setNewGroupDesc('');
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              + Create Group
            </button>
            <button
              type="button"
              onClick={() => {
                setJoinCode('');
                setShowJoinModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/20 shadow-xs transition-all cursor-pointer"
            >
              Join with Code
            </button>
          </div>
        </div>
      ) : (
        /* Two-column layout on Desktop, toggleable view on Mobile */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ──── LEFT COLUMN: MY GROUPS LIST (lg:col-span-4) ──── */}
          <div
            className={`space-y-3 ${mobileViewingGroup ? 'hidden lg:block' : 'block'
              } lg:col-span-4`}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">
                MY GROUPS ({userGroups.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {userGroups.map((grp) => {
                const gid = grp.id || grp._id;
                const isSelected = (activeGroup?.id || activeGroup?._id) === gid;
                const memberCount = Array.isArray(grp.members)
                  ? grp.members.length
                  : grp.memberCount || 1;
                const goingCount = groupGoingCounts[gid] || 0;

                return (
                  <div
                    key={gid}
                    onClick={() => {
                      setActiveGroup(grp);
                      setMobileViewingGroup(true);
                    }}
                    className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm border transition-all cursor-pointer ${isSelected
                        ? 'border-primary ring-1 ring-primary/20 bg-surface-container-low/40'
                        : 'border-outline-variant/20 hover:border-outline-variant/50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-sm font-bold text-on-surface truncate">
                          {grp.name}
                        </h3>
                        <p className="text-[11px] text-on-surface-variant">
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${goingCount > 0
                            ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                            : 'bg-surface-container text-on-surface-variant'
                          }`}
                      >
                        {goingCount > 0
                          ? `${goingCount} going for ${currentMealSlot.name.toLowerCase()}`
                          : `No one going yet`}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-outline-variant/10 flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-outline">
                        Code: {grp.groupCode || '—'}
                      </span>
                      <span className="text-primary font-semibold text-[11px] hover:underline">
                        Open Group →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ──── RIGHT COLUMN: SELECTED GROUP DETAILS & CHAT (lg:col-span-8) ──── */}
          <div
            className={`space-y-5 ${!mobileViewingGroup ? 'hidden lg:block' : 'block'
              } lg:col-span-8`}
          >
            {activeGroup ? (
              <div className="space-y-5">
                {/* Mobile Back Button */}
                <div className="lg:hidden flex items-center gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setMobileViewingGroup(false)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    <span>All Groups</span>
                  </button>
                </div>

                {/* Group Details Header Card */}
                <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                        {activeGroup.name}
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {activeGroupMembers.length}{' '}
                        {activeGroupMembers.length === 1 ? 'member' : 'members'} in this dining group
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Group Code Chip with Copy */}
                      <button
                        type="button"
                        onClick={() => copyGroupCode(activeGroup.groupCode)}
                        title="Click to copy group code"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-mono font-bold text-on-surface border border-outline-variant/20 transition-all cursor-pointer"
                      >
                        <span className="text-outline font-normal">Code:</span>
                        <span>{activeGroup.groupCode}</span>
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          {copiedCode ? 'check' : 'content_copy'}
                        </span>
                      </button>

                      {/* Admin Delete or Member Leave Action */}
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
                          title="Leave this group"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 border border-outline-variant/20 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">logout</span>
                          <span>Leave</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ──────────────── MEAL COORDINATION ──────────────── */}
                  <div className="bg-surface-container-low rounded-xl p-4 sm:p-5 border border-outline-variant/20 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                          TODAY'S MEAL COORDINATION
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
                          {goingUsers.length}{' '}
                          {goingUsers.length === 1 ? 'member going' : 'members going'}
                        </span>
                      </div>
                    </div>

                    {/* Meal Attendance Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={submittingGoing}
                        onClick={() => handleToggleGoing(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${isUserGoing
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

                    {/* Who's Going Members List */}
                    <div className="space-y-1.5 pt-2 border-t border-outline-variant/15">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-outline block">
                        Who's going?
                      </span>
                      {activeGroupMembers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeGroupMembers.map((member, idx) => {
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
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${isGoing
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
                        <p className="text-xs text-on-surface-variant italic">
                          No members in group yet.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ──────────────── GROUP MEMBERS LIST ──────────────── */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline block">
                      MEMBERS ({activeGroupMembers.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeGroupMembers.map((member, idx) => {
                        const memberEmail = typeof member === 'string' ? member : member.email;
                        const isMe =
                          currentEmail &&
                          (memberEmail?.toLowerCase() === currentEmail.toLowerCase() ||
                            memberEmail === currentUser.id);
                        const isMemberAdmin =
                          (activeGroup.creatorId && activeGroup.creatorId === memberEmail) ||
                          (activeGroup.creator && activeGroup.creator.toLowerCase() === memberEmail?.toLowerCase()) ||
                          (activeGroup.createdBy && activeGroup.createdBy.toLowerCase() === memberEmail?.toLowerCase());

                        return (
                          <div
                            key={idx}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${isMe
                                ? 'bg-primary-fixed/30 border-primary text-on-surface font-semibold'
                                : 'bg-surface-container-low border-outline-variant/20 text-on-surface'
                              }`}
                          >
                            <span className="material-symbols-outlined text-[16px] text-outline">
                              person
                            </span>
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
                      <h3 className="text-xs font-bold uppercase tracking-wider text-outline">
                        GROUP CHAT
                      </h3>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">Real-time</span>
                  </div>

                  {/* Message Stream */}
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
                                {isMe
                                  ? 'You'
                                  : formatDisplayName(msg.senderName || msg.senderEmail, currentEmail)}
                              </span>
                              {msg.createdAt && (
                                <span className="text-[9px] text-outline font-mono">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div
                              className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${isMe
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
                        <span className="material-symbols-outlined text-[24px] text-outline">
                          forum
                        </span>
                        <span>No messages yet. Start the conversation with your hostel mates!</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Send Input */}
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
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-xs text-on-surface-variant border border-outline-variant/20">
                Select a dining group from the left to view details and chat.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── 3. CREATE GROUP MODAL ──────────────── */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="relative max-w-md w-full bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/30 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {createdGroupResult ? (
              /* Success view showing code */
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary-container/50 text-secondary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-on-surface">Group Created!</h3>
                  <p className="text-xs text-on-surface-variant">
                    "{createdGroupResult.name}" has been created successfully.
                  </p>
                </div>

                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline block">
                    Group Code
                  </span>
                  <div className="text-2xl font-extrabold font-mono text-primary tracking-wider">
                    {createdGroupResult.groupCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyGroupCode(createdGroupResult.groupCode)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      content_copy
                    </span>
                    <span>Copy Code</span>
                  </button>
                </div>

                <p className="text-xs text-on-surface-variant">
                  Share this code with your hostel mates to let them join.
                </p>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Create form */
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                  <h3 className="text-base font-bold text-on-surface">Create Dining Group</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface block">Group Name</label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Hostel Block A, CSE Friends"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant block">
                    Optional Description
                  </label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="e.g. Table 4 regulars"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newGroupName.trim() || creating}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {creating ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── 4. JOIN GROUP MODAL ──────────────── */}
      {showJoinModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="relative max-w-sm w-full bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/30 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <h3 className="text-base font-bold text-on-surface">Join a Dining Group</h3>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">Enter Group Code</label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 font-mono text-center text-sm font-bold tracking-widest text-on-surface uppercase focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!joinCode.trim() || joining}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {joining ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
