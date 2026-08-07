import { useEffect, useState } from 'react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';

const formatDisplayName = (emailOrId) => {
  if (!emailOrId) return 'Student';
  if (emailOrId.includes('@')) {
    const raw = emailOrId.split('@')[0];
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return emailOrId;
};

export default function GroupsPage() {
  const [userGroups, setUserGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [goingUsers, setGoingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getUser() || {};

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
    } catch (e) {
      console.error('Error loading group chat:', e);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (activeGroup) {
      loadGroupDetailsAndChat(activeGroup);
    }
  }, [activeGroup?.id || activeGroup?._id]);

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

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeGroup) return;
    const targetId = activeGroup.id || activeGroup._id;
    try {
      const sent = await messApi.sendMessage('GROUP', targetId, messageText);
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

  return (
    <div className="flex-1 overflow-y-auto font-[Inter,sans-serif] bg-[#f8f9fa] dark:bg-[#0F172A] text-[#191c1d] dark:text-[#F8FAFC] pb-24 md:pb-8 transition-colors duration-200">
      <main className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-[36px] md:text-[45px] font-semibold text-[#003f87] dark:text-[#3B82F6] leading-10 md:leading-[52px]">Buddy Groups</h2>
            <p className="text-sm text-[#424752] dark:text-[#94A3B8] mt-1">Coordinate meals and connect with your hostel mates.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-[#003f87] dark:border-[#3B82F6] text-[#003f87] dark:text-[#3B82F6] rounded-xl text-sm font-semibold hover:bg-[#e8f0f7] dark:hover:bg-[#3B82F6]/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Create Group
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#003f87] dark:bg-[#3B82F6] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">group_add</span>
              Join Group
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active Group Card */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {activeGroup ? (
              <section className="bg-white dark:bg-[#1E293B] rounded-xl p-6 relative overflow-hidden border border-[#c2c6d4] dark:border-[#334155] shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 bg-[#80f98b] dark:bg-[#22C55E]/20 text-[#007327] dark:text-[#22C55E] px-3 py-1 rounded-full text-[11px] font-bold mb-3 border border-[#006e25]/30 dark:border-[#22C55E]/40">
                      <span className="w-2 h-2 rounded-full bg-[#006e25] dark:bg-[#22C55E]" /> Code: {activeGroup.groupCode || 'ACTIVE'}
                    </span>
                    <h3 className="text-[22px] font-bold text-[#191c1d] dark:text-[#F8FAFC]">{activeGroup.name}</h3>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center mt-6 p-4 bg-[#f3f4f5] dark:bg-[#0F172A] rounded-xl border border-[#c2c6d4]/40 dark:border-[#334155]">
                  <div className="flex-1 w-full text-center md:text-left border-b md:border-b-0 md:border-r border-[#c2c6d4] dark:border-[#334155] pb-4 md:pb-0 md:pr-4">
                    <p className="text-[11px] font-bold text-[#424752] dark:text-[#94A3B8] uppercase mb-1">Next Meal Coordination</p>
                    <div className="text-[32px] font-bold text-[#003f87] dark:text-[#3B82F6]">Lunch Slot</div>
                  </div>
                  <div className="flex-1 w-full">
                    <p className="text-[11px] font-bold text-[#424752] dark:text-[#94A3B8] uppercase mb-2">
                      Going ({goingUsers.length})
                    </p>
                    <div className="text-xs text-[#191c1d] dark:text-[#CBD5E1] truncate font-medium">
                      {goingUsers.length > 0 ? goingUsers.map(formatDisplayName).join(', ') : 'No one marked going yet'}
                    </div>
                  </div>
                  <div className="flex-1 w-full flex flex-col gap-2">
                    <button
                      onClick={handleToggleGoing}
                      className={`w-full py-2.5 rounded-xl text-sm font-extrabold transition-all shadow-sm flex items-center justify-center gap-2 ${
                        goingUsers.includes(currentUser.email)
                          ? 'bg-[#006e25] dark:bg-[#22C55E] text-white dark:text-slate-950'
                          : 'bg-[#003f87] dark:bg-[#3B82F6] text-white hover:opacity-90'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      {goingUsers.includes(currentUser.email) ? 'Going' : "I'm Going"}
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <div className="p-12 bg-white dark:bg-[#1E293B] border border-[#c2c6d4] dark:border-[#334155] rounded-xl text-center text-[#424752] dark:text-[#94A3B8]">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-40">groups</span>
                <p className="text-sm font-medium">You are not in any buddy group yet. Create or join one!</p>
              </div>
            )}

            {/* Other Groups */}
            {userGroups.length > 1 && (
              <div>
                <h3 className="text-[22px] font-semibold text-[#191c1d] dark:text-[#F8FAFC] mb-4 mt-2">Your Other Groups</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userGroups
                    .filter((g) => (g.id || g._id) !== (activeGroup?.id || activeGroup?._id))
                    .map((g) => (
                      <div
                        key={g.id || g._id}
                        onClick={() => setActiveGroup(g)}
                        className="bg-white dark:bg-[#1E293B] border border-[#c2c6d4] dark:border-[#334155] rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <h4 className="text-sm font-bold text-[#191c1d] dark:text-[#F8FAFC] mb-1">{g.name}</h4>
                        <p className="text-xs text-[#424752] dark:text-[#94A3B8]">Code: {g.groupCode}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Chat Panel */}
          <div className="lg:col-span-4 h-full">
            <div className="bg-white dark:bg-[#1E293B] rounded-xl flex flex-col h-[600px] border border-[#c2c6d4] dark:border-[#334155] sticky top-24 shadow-sm">
              <div className="p-4 border-b border-[#c2c6d4] dark:border-[#334155] flex items-center justify-between bg-[#f3f4f5] dark:bg-[#0F172A] rounded-t-xl">
                <h4 className="text-sm font-bold text-[#191c1d] dark:text-[#F8FAFC]">
                  {activeGroup ? activeGroup.name : 'Group Chat'}
                </h4>
              </div>

              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-[#f8f9fa] dark:bg-[#0F172A]">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#424752] dark:text-[#94A3B8] italic">No messages in group yet</div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderEmail === currentUser.email || msg.sender === currentUser.email;
                    const senderDisplay = formatDisplayName(msg.senderName || msg.senderEmail || msg.sender);
                    return (
                      <div key={msg.id || msg._id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-3 rounded-2xl max-w-[85%] ${isMine ? 'bg-[#cfe2ff] dark:bg-[#3B82F6]/20 text-[#003f87] dark:text-[#F8FAFC] rounded-tr-xs border border-[#003f87]/20 dark:border-[#3B82F6]/30' : 'bg-white dark:bg-[#1E293B] text-[#191c1d] dark:text-[#F8FAFC] rounded-tl-xs border border-[#c2c6d4] dark:border-[#334155]'}`}>
                          <p className="text-[11px] font-extrabold text-[#003f87] dark:text-[#3B82F6] mb-0.5">{senderDisplay}</p>
                          <p className="text-xs leading-relaxed">{msg.message || msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-[#c2c6d4] dark:border-[#334155] bg-white dark:bg-[#1E293B] rounded-b-xl">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="w-full bg-[#f3f4f5] dark:bg-[#0F172A] border border-[#c2c6d4] dark:border-[#334155] rounded-full py-2.5 pl-4 pr-12 text-xs text-[#191c1d] dark:text-[#F8FAFC] focus:border-[#003f87] dark:focus:border-[#3B82F6] outline-none"
                  />
                  <button onClick={handleSendMessage} className="absolute right-2 text-[#003f87] dark:text-[#3B82F6] p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-[#c2c6d4] dark:border-[#334155]">
            <h2 className="text-[22px] font-bold text-[#191c1d] dark:text-[#F8FAFC] mb-4">Create Buddy Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group Name (e.g. Block A Lunch Crew)"
                className="w-full bg-[#f3f4f5] dark:bg-[#0F172A] border border-[#c2c6d4] dark:border-[#334155] rounded-xl px-4 py-2 text-xs text-[#191c1d] dark:text-[#F8FAFC] outline-none"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-[#c2c6d4] dark:border-[#334155] text-xs font-semibold rounded-xl text-[#424752] dark:text-[#CBD5E1]">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#003f87] dark:bg-[#3B82F6] text-white rounded-xl text-xs font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowJoinModal(false)} />
          <div className="relative bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-[#c2c6d4] dark:border-[#334155]">
            <h2 className="text-[22px] font-bold text-[#191c1d] dark:text-[#F8FAFC] mb-4">Join Buddy Group</h2>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter 8-Character Group Code"
                className="w-full bg-[#f3f4f5] dark:bg-[#0F172A] border border-[#c2c6d4] dark:border-[#334155] rounded-xl px-4 py-2 text-xs text-[#191c1d] dark:text-[#F8FAFC] outline-none uppercase"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 border border-[#c2c6d4] dark:border-[#334155] text-xs font-semibold rounded-xl text-[#424752] dark:text-[#CBD5E1]">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#003f87] dark:bg-[#3B82F6] text-white rounded-xl text-xs font-bold">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
