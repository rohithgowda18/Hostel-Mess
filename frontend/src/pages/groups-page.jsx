import { useEffect, useState } from 'react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';

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
    <div className="flex-1 overflow-y-auto font-[Inter,sans-serif] pb-24 md:pb-0">
      <main className="p-4 md:p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-[36px] md:text-[45px] font-semibold text-[#191c1d] leading-10 md:leading-[52px]">Buddy Groups</h2>
            <p className="text-sm text-[#424752] mt-1">Coordinate meals and connect with your hostel mates.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-[#003f87] text-[#003f87] rounded-lg text-sm font-medium hover:bg-[#e8f0f7] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Create Group
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#003f87] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
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
              <section className="bg-white rounded-xl p-6 relative overflow-hidden border border-[#c2c6d4] shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 bg-[#80f98b] text-[#002109] px-2.5 py-1 rounded-full text-[11px] font-medium mb-3">
                      <span className="w-2 h-2 rounded-full bg-[#006e25]" /> Code: {activeGroup.groupCode || 'ACTIVE'}
                    </span>
                    <h3 className="text-[22px] font-semibold text-[#191c1d]">{activeGroup.name}</h3>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center mt-6 p-4 bg-[#f3f4f5] rounded-lg border border-[#c2c6d4]/30">
                  <div className="flex-1 w-full text-center md:text-left border-b md:border-b-0 md:border-r border-[#c2c6d4] pb-4 md:pb-0 md:pr-4">
                    <p className="text-[11px] font-medium text-[#424752] uppercase mb-1">Next Meal Coordination</p>
                    <div className="text-[32px] font-bold text-[#003f87]">Lunch Slot</div>
                  </div>
                  <div className="flex-1 w-full">
                    <p className="text-[11px] font-medium text-[#424752] uppercase mb-2">
                      Going ({goingUsers.length})
                    </p>
                    <div className="text-xs text-[#424752] truncate">
                      {goingUsers.length > 0 ? goingUsers.join(', ') : 'No one marked going yet'}
                    </div>
                  </div>
                  <div className="flex-1 w-full flex flex-col gap-2">
                    <button
                      onClick={handleToggleGoing}
                      className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2 ${
                        goingUsers.includes(currentUser.email)
                          ? 'bg-[#006e25] text-white'
                          : 'bg-[#003f87] text-white hover:opacity-90'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      {goingUsers.includes(currentUser.email) ? 'Going' : "I'm Going"}
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <div className="p-12 bg-white border border-[#c2c6d4] rounded-xl text-center text-[#424752]">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-40">groups</span>
                <p className="text-sm font-medium">You are not in any buddy group yet. Create or join one!</p>
              </div>
            )}

            {/* Other Groups */}
            {userGroups.length > 1 && (
              <div>
                <h3 className="text-[22px] font-medium text-[#191c1d] mb-4 mt-2">Your Other Groups</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userGroups
                    .filter((g) => (g.id || g._id) !== (activeGroup?.id || activeGroup?._id))
                    .map((g) => (
                      <div
                        key={g.id || g._id}
                        onClick={() => setActiveGroup(g)}
                        className="bg-white border border-[#c2c6d4] rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <h4 className="text-sm font-bold text-[#191c1d] mb-1">{g.name}</h4>
                        <p className="text-xs text-[#424752]">Code: {g.groupCode}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Chat Panel */}
          <div className="lg:col-span-4 h-full">
            <div className="bg-white rounded-xl flex flex-col h-[600px] border border-[#c2c6d4] sticky top-24">
              <div className="p-4 border-b border-[#c2c6d4] flex items-center justify-between bg-[#f3f4f5] rounded-t-xl">
                <h4 className="text-sm font-bold text-[#191c1d]">
                  {activeGroup ? activeGroup.name : 'Group Chat'}
                </h4>
              </div>

              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-[#f8f9fa]/50">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#424752] italic">No messages in group yet</div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderEmail === currentUser.email || msg.sender === currentUser.email;
                    return (
                      <div key={msg.id || msg._id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-3 rounded-2xl max-w-[80%] ${isMine ? 'bg-[#cfe2ff] text-[#003f87] rounded-tr-sm' : 'bg-white text-[#191c1d] rounded-tl-sm'}`}>
                          <p className="text-[11px] text-[#424752] mb-1">{msg.senderEmail || msg.sender || 'User'}</p>
                          <p className="text-sm">{msg.message || msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-[#c2c6d4] bg-white rounded-b-xl">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="w-full bg-[#f3f4f5] border-none rounded-full py-2.5 pl-4 pr-12 text-sm text-[#191c1d] focus:ring-2 focus:ring-[#003f87] outline-none"
                  />
                  <button onClick={handleSendMessage} className="absolute right-2 text-[#003f87] p-1.5 rounded-full hover:bg-[#c5d8f7]/50">
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-[22px] font-semibold text-[#191c1d] mb-4">Create Buddy Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group Name (e.g. Block A Lunch Crew)"
                className="w-full bg-[#f3f4f5] border-b-2 border-[#c2c6d4] px-4 py-2 text-sm text-[#191c1d] outline-none"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-[#c2c6d4] text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#003f87] text-white rounded-lg text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowJoinModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-[22px] font-semibold text-[#191c1d] mb-4">Join Buddy Group</h2>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter 8-Character Group Code"
                className="w-full bg-[#f3f4f5] border-b-2 border-[#c2c6d4] px-4 py-2 text-sm text-[#191c1d] outline-none uppercase"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 border border-[#c2c6d4] text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#003f87] text-white rounded-lg text-sm">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
