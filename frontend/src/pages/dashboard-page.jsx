import { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck2,
  FolderCog,
  RefreshCcw,
  Send,
  UserCircle2,
  Users,
  Vote
} from 'lucide-react';
import CommunityChatPreview from '@/components/dashboard/community-chat-preview';
import EmptyState from '@/components/dashboard/empty-state';
import GroupVotingSection from '@/components/dashboard/group-voting-section';
import QuickStatsGrid from '@/components/dashboard/quick-stats-grid';
import RecentFeedbackTable from '@/components/dashboard/recent-feedback-table';
import TodaysMenuCard from '@/components/dashboard/todays-menu-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FOOD_OPTIONS, MEAL_TYPES, getMealDisplayName } from '@/data/food-options';
import { getUser } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';

const getFoodImageUrl = (foodName) => {
  const query = encodeURIComponent(`${foodName} indian food`);
  return `https://source.unsplash.com/360x240/?${query}`;
};

const getMealSlotByTime = () => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  if (minutes >= 7 * 60 && minutes <= 11 * 60) {
    return 'BREAKFAST';
  }
  if (minutes >= 11 * 60 + 30 && minutes <= 15 * 60) {
    return 'LUNCH';
  }
  if (minutes >= 16 * 60 && minutes <= 18 * 60) {
    return 'SNACKS';
  }
  if (minutes >= 19 * 60 && minutes <= 23 * 60) {
    return 'DINNER';
  }

  return null;
};

function CurrentMealSection({ mealLabel, items }) {
  const postedItems = Array.isArray(items) ? items : [];

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Today's {mealLabel}</h3>
          <p className="text-sm text-muted">Currently posted items</p>
        </div>
        <Badge variant="neutral">{postedItems.length} posted</Badge>
      </div>

      {postedItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-slate-800/20 p-4 text-sm text-muted">
          No {mealLabel.toLowerCase()} items posted yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {postedItems.map((item) => (
            <div key={item} className="rounded-xl border border-border bg-slate-900/25 p-4">
              <p className="text-base font-semibold text-foreground">{item}</p>
              <p className="mt-1 text-xs text-muted">Posted for today</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FoodSelectionGrid({ mealLabel, foods, selectedItems, onToggle, disabled }) {
  const allFoods = Array.isArray(foods) ? foods : [];

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Update {mealLabel}</h3>
          <p className="text-sm text-muted">Click food cards to toggle selection</p>
        </div>
        <Badge variant="neutral">{selectedItems.length} selected</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {allFoods.map((food) => {
          const isSelected = selectedItems.includes(food);

          return (
            <button
              key={food}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(food)}
              className={`overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 ${
                disabled
                  ? 'cursor-not-allowed border-border/60 bg-slate-900/10 opacity-60'
                  : isSelected
                  ? 'border-primary bg-primary/10 shadow-card'
                  : 'border-border bg-slate-900/20 hover:border-primary/50'
              }`}
            >
              <img
                src={getFoodImageUrl(food)}
                alt={food}
                loading="lazy"
                className="h-28 w-full object-cover"
              />
              <div className="p-3">
                <p className="text-sm font-semibold text-foreground">{food}</p>
                <p className="mt-1 text-xs text-muted">{isSelected ? 'Selected' : 'Tap to select'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SelectedItemsBar({ mealLabel, items, onRemove }) {
  const selected = Array.isArray(items) ? items : [];

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Selected Items</h4>
        <span className="text-xs text-muted">{selected.length} total</span>
      </div>

      {selected.length === 0 ? (
        <p className="text-sm text-muted">No {mealLabel.toLowerCase()} items selected yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onRemove(item)}
              className="rounded-full border border-border bg-slate-900/30 px-3 py-1.5 text-xs text-foreground hover:border-danger hover:text-red-300"
            >
              {item} x
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function UpdateMealButton({ mealLabel, loading, disabled, onClick }) {
  return (
    <div className="rounded-xl">
      <Button className="w-full" onClick={onClick} disabled={disabled || loading}>
        {loading ? 'Updating...' : `Update ${mealLabel}`}
      </Button>
    </div>
  );
}

function DashboardPage({ activeItem = 'dashboard', searchQuery = '' }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mealsByType, setMealsByType] = useState({});
  const [selectedMeal, setSelectedMeal] = useState('BREAKFAST');
  const [selectedItems, setSelectedItems] = useState([]);
  const [menuActionLoading, setMenuActionLoading] = useState(false);
  const [menuMessage, setMenuMessage] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [groupActionLoading, setGroupActionLoading] = useState(false);
  const [groupStatusByMeal, setGroupStatusByMeal] = useState({});
  const [complaintsByMeal, setComplaintsByMeal] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const activeMealSlot = getMealSlotByTime();

  const currentUser = getUser() || {};
  const currentUserId = currentUser.id || null;

  const [profileForm, setProfileForm] = useState({
    hostel: currentUser.hostel || '',
    roomNumber: currentUser.roomNumber || '',
    year: currentUser.year || '',
    branch: currentUser.branch || ''
  });

  useEffect(() => {
    setProfileForm({
      hostel: currentUser.hostel || '',
      roomNumber: currentUser.roomNumber || '',
      year: currentUser.year || '',
      branch: currentUser.branch || ''
    });
  }, [currentUser.hostel, currentUser.roomNumber, currentUser.year, currentUser.branch]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const allComplaints = useMemo(
    () => Object.values(complaintsByMeal).flat(),
    [complaintsByMeal]
  );

  const votingItems = useMemo(
    () =>
      allComplaints
        .map((complaint) => ({
          id: complaint.id,
          item: complaint.foodItem,
          mealType: complaint.mealType,
          upVotes: complaint.agreeVotes,
          downVotes: complaint.disagreeVotes
        }))
        .sort((a, b) => b.upVotes + b.downVotes - (a.upVotes + a.downVotes)),
    [allComplaints]
  );

  const feedbackRows = useMemo(() => {
    return allComplaints.flatMap((complaint) => {
      const comments = complaint.comments?.length
        ? complaint.comments
        : [complaint.reasons?.join(', ') || `${complaint.foodItem} feedback`];

      const rating = Math.min(
        5,
        Math.max(1, Math.round((Number(complaint.agreePercentage || 0) / 20) || 3))
      );

      return comments.map((comment, index) => ({
        id: `${complaint.id}-${index}`,
        user: 'Anonymous',
        comment,
        rating,
        date: complaint.date,
        mealType: complaint.mealType
      }));
    });
  }, [allComplaints]);

  const filteredFeedback = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return feedbackRows;
    }

    return feedbackRows.filter(
      (item) =>
        item.user.toLowerCase().includes(query) ||
        item.comment.toLowerCase().includes(query) ||
        item.date.toLowerCase().includes(query) ||
        item.mealType.toLowerCase().includes(query)
    );
  }, [feedbackRows, searchQuery]);

  const quickStats = useMemo(() => {
    const uniqueMembers = new Set();
    groups.forEach((group) => {
      (group.members || []).forEach((member) => uniqueMembers.add(member));
    });

    const totalVotes = allComplaints.reduce(
      (sum, complaint) => sum + (complaint.agreeVotes || 0) + (complaint.disagreeVotes || 0),
      0
    );

    return [
      { id: 'students', label: 'Active Students', value: uniqueMembers.size, delta: `${uniqueMembers.size} in groups` },
      { id: 'votes', label: "Today's Votes", value: totalVotes, delta: `${votingItems.length} active polls` },
      { id: 'feedback', label: 'Feedback Count', value: feedbackRows.length, delta: `${allComplaints.length} complaints` },
      { id: 'groups', label: 'Groups Active', value: groups.length, delta: `${groups.length} total groups` }
    ];
  }, [groups, allComplaints, votingItems.length, feedbackRows.length]);

  const dashboardMenu = useMemo(
    () => ({
      breakfast: mealsByType.BREAKFAST?.items || [],
      lunch: mealsByType.LUNCH?.items || [],
      snacks: mealsByType.SNACKS?.items || [],
      dinner: mealsByType.DINNER?.items || []
    }),
    [mealsByType]
  );

  const onlineUsers = useMemo(() => {
    const names = new Set(
      chatMessages
        .map((message) => message.senderName)
        .filter(Boolean)
        .slice(0, 8)
    );
    return Array.from(names);
  }, [chatMessages]);

  const communityPreviewMessages = useMemo(() => {
    return [...chatMessages]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map((message) => ({
        id: message.id,
        user: message.senderName || 'Unknown',
        message: message.message,
        time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
  }, [chatMessages]);

  const fetchCoreData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [mealMap, groupList, complaintsMap] = await Promise.all([
        messApi.getAllTodayMeals(MEAL_TYPES),
        messApi.getUserGroups(),
        messApi.getAllComplaintsByMeal(MEAL_TYPES)
      ]);

      setMealsByType(mealMap);
      setGroups(groupList || []);
      setComplaintsByMeal(complaintsMap);

      if (groupList?.length) {
        setSelectedGroupId((prev) => prev || groupList[0].id);
      } else {
        setSelectedGroupId('');
      }
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommunityMessages = async () => {
    try {
      setChatLoading(true);
      const messages = await messApi.getMessages('UNIVERSAL', 'GLOBAL');
      setChatMessages(messages || []);
    } catch (chatError) {
      if (chatError.response?.status === 401) {
        setError('Community chat requires a valid login token. Please sign in again.');
      } else {
        setError(chatError.message || 'Failed to fetch community messages.');
      }
    } finally {
      setChatLoading(false);
    }
  };

  const fetchGroupStatus = async (groupId) => {
    if (!groupId) {
      setGroupStatusByMeal({});
      return;
    }

    const resultEntries = await Promise.all(
      MEAL_TYPES.map(async (mealType) => {
        try {
          const status = await messApi.getGroupMealStatus(groupId, mealType);
          return [mealType, status];
        } catch (statusError) {
          return [mealType, { goingUsers: [], goingCount: 0, secondsUntilExpiry: 0 }];
        }
      })
    );

    setGroupStatusByMeal(Object.fromEntries(resultEntries));
  };

  useEffect(() => {
    fetchCoreData();
    fetchCommunityMessages();
  }, []);

  useEffect(() => {
    fetchGroupStatus(selectedGroupId);
  }, [selectedGroupId]);

  const handleToggleFood = (item) => {
    if (!activeMealSlot || selectedMeal !== activeMealSlot) {
      setMenuMessage('Meal update is closed now. Please use the active time slot only.');
      return;
    }

    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((entry) => entry !== item) : [...prev, item]
    );
  };

  const handlePostMenu = async () => {
    if (!activeMealSlot || selectedMeal !== activeMealSlot) {
      setMenuMessage('Meal update is closed now. Please use the active time slot only.');
      return;
    }

    if (!selectedItems.length) {
      setMenuMessage('Please select at least one food item.');
      return;
    }

    try {
      setMenuActionLoading(true);
      const today = new Date().toISOString().split('T')[0];
      await messApi.updateMeal(selectedMeal, today, selectedItems);
      setMenuMessage(`${getMealDisplayName(selectedMeal)} menu updated successfully.`);
      setSelectedItems([]);
      const updatedMeals = await messApi.getAllTodayMeals(MEAL_TYPES);
      setMealsByType(updatedMeals);
    } catch (menuError) {
      setMenuMessage(menuError.message || 'Unable to update menu right now.');
    } finally {
      setMenuActionLoading(false);
    }
  };

  useEffect(() => {
    if (activeItem === 'weekly-menu') {
      if (activeMealSlot) {
        setSelectedMeal(activeMealSlot);
        setSelectedItems(mealsByType[activeMealSlot]?.items || []);
      } else {
        setSelectedItems([]);
      }
    }
  }, [activeItem, activeMealSlot, mealsByType]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name cannot be empty.');
      return;
    }

    try {
      setGroupActionLoading(true);
      await messApi.createGroup(groupName.trim());
      setGroupName('');
      await fetchCoreData();
    } catch (groupError) {
      setError(groupError.message || 'Unable to create group.');
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      setError('Group code is required to join.');
      return;
    }

    try {
      setGroupActionLoading(true);
      await messApi.joinGroup(groupCode.trim().toUpperCase());
      setGroupCode('');
      await fetchCoreData();
    } catch (groupError) {
      setError(groupError.message || 'Unable to join group.');
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleToggleMealGoing = async (mealType) => {
    if (!selectedGroupId) {
      return;
    }

    if (!currentUserId) {
      setError('Please sign in again to update meal status.');
      return;
    }

    const currentStatus = groupStatusByMeal[mealType] || {};
    const alreadyGoing = (currentStatus.goingUsers || []).includes(currentUserId);

    try {
      if (alreadyGoing) {
        await messApi.cancelGroupMealGoing(selectedGroupId, mealType, currentUserId);
      } else {
        await messApi.markGroupMealGoing(selectedGroupId, mealType, currentUserId);
      }
      await fetchGroupStatus(selectedGroupId);
    } catch (statusError) {
      setError(statusError.message || 'Unable to update meal status.');
    }
  };

  const handleVote = async (complaintId, vote) => {
    if (!currentUserId) {
      setError('Please sign in again to vote.');
      return;
    }

    try {
      const updatedComplaint = await messApi.voteOnComplaint(complaintId, vote);
      setComplaintsByMeal((prev) => {
        const mealType = updatedComplaint.mealType;
        const existing = prev[mealType] || [];
        return {
          ...prev,
          [mealType]: existing.map((complaint) =>
            complaint.id === updatedComplaint.id ? updatedComplaint : complaint
          )
        };
      });
    } catch (voteError) {
      setError(voteError.message || 'Unable to register vote.');
    }
  };

  const handleCreatePoll = async ({ itemName, mealType }) => {
    try {
      const created = await messApi.raiseComplaint({
        mealType,
        foodItem: itemName,
        reasons: ['General feedback'],
        comment: 'Raised from dashboard poll'
      });

      setComplaintsByMeal((prev) => {
        const existing = prev[mealType] || [];
        const alreadyExists = existing.some((complaint) => complaint.id === created.id);
        return {
          ...prev,
          [mealType]: alreadyExists ? existing : [created, ...existing]
        };
      });
    } catch (pollError) {
      setError(pollError.message || 'Unable to create poll for this item.');
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) {
      return;
    }

    try {
      await messApi.sendMessage('UNIVERSAL', 'GLOBAL', chatInput.trim());
      setChatInput('');
      await fetchCommunityMessages();
    } catch (sendError) {
      setError(sendError.message || 'Unable to send message.');
    }
  };

  const handleRefreshFeedback = async () => {
    try {
      const refreshed = await messApi.getAllComplaintsByMeal(MEAL_TYPES);
      setComplaintsByMeal(refreshed);
    } catch (refreshError) {
      setError(refreshError.message || 'Unable to refresh feedback.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true);
      const updatedProfile = await messApi.updateMyProfile(profileForm);
      localStorage.setItem('userInfo', JSON.stringify(updatedProfile));
      setMenuMessage('Profile updated successfully.');
    } catch (profileError) {
      setError(profileError.message || 'Unable to update profile right now.');
    } finally {
      setProfileSaving(false);
    }
  };

  const renderDashboard = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((key) => (
              <Skeleton key={key} className="h-32 w-full" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <TodaysMenuCard menu={dashboardMenu} />
          <CommunityChatPreview messages={communityPreviewMessages} onlineUsers={onlineUsers} />
        </div>

        <QuickStatsGrid stats={quickStats} />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <GroupVotingSection
            items={votingItems}
            onVote={handleVote}
            onCreatePoll={handleCreatePoll}
            mealTypes={MEAL_TYPES}
          />

          <Card>
            <CardHeader>
              <CardTitle>Group Activity</CardTitle>
              <CardDescription>Live attendance status from selected group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedGroup ? (
                <EmptyState
                  title="No groups found"
                  description="Create or join a group to track meal participation."
                />
              ) : (
                MEAL_TYPES.map((mealType) => {
                  const status = groupStatusByMeal[mealType] || { goingUsers: [] };
                  const isGoing = (status.goingUsers || []).includes(currentUserId);
                  return (
                    <div key={mealType} className="rounded-xl border border-border bg-slate-800/20 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{getMealDisplayName(mealType)}</p>
                        <Badge variant="neutral">{status.goingCount || 0} going</Badge>
                      </div>
                      <Button
                        className="w-full"
                        variant={isGoing ? 'danger' : 'success'}
                        onClick={() => handleToggleMealGoing(mealType)}
                      >
                        {isGoing ? 'Cancel Going' : 'Mark Going'}
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <RecentFeedbackTable rows={filteredFeedback} onReset={handleRefreshFeedback} />
      </div>
    );
  };

  const renderWeeklyMenu = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <CurrentMealSection
          items={activeMealSlot ? mealsByType[activeMealSlot]?.items || [] : []}
          mealLabel={activeMealSlot ? getMealDisplayName(activeMealSlot) : 'Meal Updates Closed'}
        />

        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {MEAL_TYPES.map((mealType) => {
              const active = mealType === selectedMeal;
              const enabled = activeMealSlot && mealType === activeMealSlot;
              return (
                <button
                  key={mealType}
                  type="button"
                  disabled={!enabled}
                  onClick={() => {
                    if (!enabled) {
                      return;
                    }
                    setSelectedMeal(mealType);
                    setSelectedItems(mealsByType[mealType]?.items || []);
                  }}
                  className={`rounded-xl border px-3 py-2 text-left transition-all ${
                    !enabled
                      ? 'cursor-not-allowed border-border/60 bg-slate-900/10 text-muted/60'
                      : active
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  <p className="text-sm font-semibold">{getMealDisplayName(mealType)}</p>
                  <p className="text-xs">{(mealsByType[mealType]?.items || []).length} posted</p>
                </button>
              );
            })}
          </div>

          <FoodSelectionGrid
            foods={FOOD_OPTIONS[selectedMeal] || []}
            selectedItems={selectedItems}
            onToggle={handleToggleFood}
            mealLabel={getMealDisplayName(selectedMeal)}
            disabled={!activeMealSlot || selectedMeal !== activeMealSlot}
          />
        </section>

        <SelectedItemsBar
          items={selectedItems}
          onRemove={handleToggleFood}
          mealLabel={getMealDisplayName(selectedMeal)}
        />

        <UpdateMealButton
          loading={menuActionLoading}
          disabled={selectedItems.length === 0 || !activeMealSlot || selectedMeal !== activeMealSlot}
          onClick={handlePostMenu}
          mealLabel={getMealDisplayName(selectedMeal)}
        />

        {!activeMealSlot ? (
          <p className="rounded-xl border border-border bg-slate-800/30 p-3 text-sm text-muted">
            Meal update is closed now. Open slots: Breakfast 7:00-11:00, Lunch 11:30-15:00, Snacks 16:00-18:00, Dinner 19:00-23:00.
          </p>
        ) : null}

        {menuMessage ? (
          <p className="rounded-xl border border-border bg-slate-800/30 p-3 text-sm text-muted">{menuMessage}</p>
        ) : null}
      </div>
    </div>
  );

  const renderGroups = () => (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Manage Groups</CardTitle>
          <CardDescription>Create a new group or join with a code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-xl border border-border p-3">
            <p className="text-sm font-semibold text-foreground">Create Group</p>
            <Input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Enter group name"
            />
            <Button className="w-full" onClick={handleCreateGroup} disabled={groupActionLoading}>
              Create Group
            </Button>
          </div>

          <div className="space-y-2 rounded-xl border border-border p-3">
            <p className="text-sm font-semibold text-foreground">Join Group</p>
            <Input
              value={groupCode}
              onChange={(event) => setGroupCode(event.target.value.toUpperCase())}
              placeholder="Enter group code"
              maxLength={8}
            />
            <Button variant="secondary" className="w-full" onClick={handleJoinGroup} disabled={groupActionLoading}>
              Join Group
            </Button>
          </div>

          <Button variant="outline" className="w-full" onClick={fetchCoreData}>
            <RefreshCcw className="h-4 w-4" />
            Refresh Groups
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Groups</CardTitle>
          <CardDescription>Track members and mark meal attendance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.length === 0 ? (
            <EmptyState
              title="No groups joined"
              description="Create or join a group to coordinate meal attendance."
            />
          ) : (
            <>
              <div className="grid gap-2 md:grid-cols-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selectedGroupId === group.id
                        ? 'border-primary bg-primary/20 text-foreground'
                        : 'border-border hover:bg-slate-800/30'
                    }`}
                  >
                    <p className="font-semibold">{group.name}</p>
                    <p className="text-xs text-muted">{group.memberCount || group.members?.length || 0} members</p>
                  </button>
                ))}
              </div>

              {selectedGroup ? (
                <div className="space-y-3 rounded-xl border border-border bg-slate-800/20 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{selectedGroup.name}</p>
                    <Badge variant="neutral">Code: {selectedGroup.groupCode}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(selectedGroup.members || []).map((member) => (
                      <Badge key={member} variant="neutral">{member}</Badge>
                    ))}
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {MEAL_TYPES.map((mealType) => {
                      const status = groupStatusByMeal[mealType] || { goingUsers: [] };
                      const going = (status.goingUsers || []).includes(currentUserId);
                      return (
                        <div key={mealType} className="rounded-xl border border-border bg-card p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">{getMealDisplayName(mealType)}</p>
                            <Badge variant="neutral">{status.goingCount || 0}</Badge>
                          </div>
                          <Button
                            variant={going ? 'danger' : 'success'}
                            className="w-full"
                            onClick={() => handleToggleMealGoing(mealType)}
                          >
                            {going ? 'Cancel' : 'Going'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCommunityChat = () => (
    <Card>
      <CardHeader>
        <CardTitle>Community Chat</CardTitle>
        <CardDescription>Hostel-wide real-time discussion channel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-border bg-slate-900/30 p-4">
          {chatLoading ? <p className="text-sm text-muted">Loading messages...</p> : null}

          {!chatLoading && chatMessages.length === 0 ? (
            <EmptyState
              title="No chat messages"
              description="Start the conversation with your hostel community."
            />
          ) : null}

          {[...chatMessages]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((message) => (
              <div key={message.id} className="rounded-xl border border-border bg-card p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{message.senderName || 'Unknown'}</p>
                  <span className="text-xs text-muted">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted">{message.message}</p>
              </div>
            ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Type your message"
            maxLength={150}
          />
          <Button onClick={handleSendChat}>
            <Send className="h-4 w-4" />
            Send
          </Button>
          <Button variant="secondary" onClick={fetchCommunityMessages}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderProfile = () => (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>View account details and update hostel information</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-slate-800/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Email</p>
          <p className="mt-1 font-semibold text-foreground">{currentUser.email || 'N/A'}</p>
        </div>
        <div className="rounded-xl border border-border bg-slate-800/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Role</p>
          <p className="mt-1 font-semibold text-foreground">{currentUser.role || 'STUDENT'}</p>
        </div>

        <Input
          value={profileForm.hostel}
          onChange={(event) => setProfileForm((prev) => ({ ...prev, hostel: event.target.value }))}
          placeholder="Hostel"
        />
        <Input
          value={profileForm.roomNumber}
          onChange={(event) => setProfileForm((prev) => ({ ...prev, roomNumber: event.target.value }))}
          placeholder="Room Number"
        />
        <Input
          value={profileForm.year}
          onChange={(event) => setProfileForm((prev) => ({ ...prev, year: event.target.value }))}
          placeholder="Year"
        />
        <Input
          value={profileForm.branch}
          onChange={(event) => setProfileForm((prev) => ({ ...prev, branch: event.target.value }))}
          placeholder="Branch"
        />

        <div className="sm:col-span-2">
          <Button onClick={handleSaveProfile} disabled={profileSaving}>
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const moduleView = {
    dashboard: renderDashboard,
    'weekly-menu': renderWeeklyMenu,
    groups: renderGroups,
    voting: () => (
      <GroupVotingSection
        items={votingItems}
        onVote={handleVote}
        onCreatePoll={handleCreatePoll}
        mealTypes={MEAL_TYPES}
      />
    ),
    feedback: () => <RecentFeedbackTable rows={filteredFeedback} onReset={handleRefreshFeedback} />,
    'community-chat': renderCommunityChat,
    profile: renderProfile
  };

  const currentTitle = {
    dashboard: 'Dashboard',
    'weekly-menu': 'Daily Meal',
    groups: 'Groups',
    voting: 'Voting',
    feedback: 'Feedback',
    'community-chat': 'Community Chat',
    profile: 'Profile'
  }[activeItem];

  const currentDescription = {
    dashboard: 'Hostel mess operations at a glance',
    'weekly-menu': 'Post today\'s meals with current-time highlight and quick visibility',
    groups: 'Monitor and coordinate active mess groups',
    voting: 'Capture food preference with transparent voting',
    feedback: 'Review student feedback and response trends',
    'community-chat': 'Watch live community conversations',
    profile: 'Account and role preferences'
  }[activeItem];

  const HeaderIcon = {
    dashboard: FolderCog,
    'weekly-menu': CalendarCheck2,
    groups: Users,
    voting: Vote,
    feedback: FolderCog,
    'community-chat': FolderCog,
    profile: UserCircle2
  }[activeItem];

  const CurrentView = moduleView[activeItem] || moduleView.dashboard;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-card">
          <HeaderIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{currentTitle}</h1>
          <p className="mt-1 text-sm text-muted">{currentDescription}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-danger/40 bg-danger/20 p-3 text-sm text-red-200">{error}</div>
      ) : null}

      {!error && menuMessage ? (
        <div className="rounded-xl border border-success/40 bg-success/20 p-3 text-sm text-emerald-200">{menuMessage}</div>
      ) : null}

      <CurrentView />
    </div>
  );
}

export default DashboardPage;
