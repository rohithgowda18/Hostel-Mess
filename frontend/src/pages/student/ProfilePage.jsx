import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import { useTheme } from '@/context/theme-context';
import { usePageTitle } from '@/hooks/use-page-title';
import { useToast } from '@/context/toast-context';

export default function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle('Profile & Preferences', 'Manage notifications, theme options, and dining hall allocations.');
  const { themeMode, setThemeMode } = useTheme();
  const [userProfile, setUserProfile] = useState(getUser() || {});
  const [stats, setStats] = useState({
    reportsSubmitted: 0,
    verificationsCount: 0,
    photosUploaded: 0,
    mealsRated: 0,
    points: 0,
    rank: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mess_notifications')) || {
        mealCountdown: true,
        menuUpdates: true,
        groupInvites: true
      };
    } catch {
      return { mealCountdown: true, menuUpdates: true, groupInvites: true };
    }
  });

  const toggleNotification = (key) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('mess_notifications', JSON.stringify(next));
      return next;
    });
  };

  const handleSave = () => {
    setSaveSuccess(true);
    toast.success('Settings Saved', 'Your notification settings have been updated.');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Friends System State
  const [friendsData, setFriendsData] = useState({
    friends: [],
    incomingRequests: [],
    sentRequests: [],
    notifyFriendIds: []
  });
  const [selectedNotifyIds, setSelectedNotifyIds] = useState([]);
  const [activeFriendTab, setActiveFriendTab] = useState('friends'); // 'friends' | 'notify' | 'incoming' | 'sent'
  const [savingNotifyPrefs, setSavingNotifyPrefs] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [studentSearchError, setStudentSearchError] = useState('');
  const [studentSearchActionId, setStudentSearchActionId] = useState(null);

  const loadFriends = async () => {
    try {
      const res = await messApi.getFriends().catch(() => null);
      if (res) {
        setFriendsData(res);
        setSelectedNotifyIds(res.notifyFriendIds || []);
      }
    } catch (e) {
      console.error('Failed to load friends:', e);
    }
  };

  useEffect(() => {
    const query = studentSearchQuery.trim();
    let cancelled = false;

    if (query.length < 2) {
      setStudentSearchResults([]);
      setStudentSearchLoading(false);
      setStudentSearchError('');
      return undefined;
    }

    setStudentSearchLoading(true);
    setStudentSearchError('');
    const timer = setTimeout(async () => {
      try {
        const results = await messApi.searchFriendStudents(query);
        if (!cancelled) setStudentSearchResults(Array.isArray(results) ? results : []);
      } catch (err) {
        if (!cancelled) {
          setStudentSearchResults([]);
          setStudentSearchError('Unable to search students. Try again.');
        }
      } finally {
        if (!cancelled) setStudentSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [studentSearchQuery]);

  const handleStudentSearchAction = async (student) => {
    if (!student?.id || studentSearchActionId) return;
    setStudentSearchActionId(student.id);
    try {
      if (student.relationshipStatus === 'INCOMING') {
        await messApi.acceptFriendRequest(student.friendshipId);
        setStudentSearchResults((prev) => prev.map((result) => (
          result.id === student.id ? { ...result, relationshipStatus: 'FRIENDS' } : result
        )));
        toast.success('Friend Accepted', `${student.displayName} is now your friend.`);
      } else {
        await messApi.sendFriendRequest(student.id);
        setStudentSearchResults((prev) => prev.map((result) => (
          result.id === student.id ? { ...result, relationshipStatus: 'PENDING' } : result
        )));
        toast.success('Request Sent', `Friend request sent to ${student.displayName}.`);
      }
      loadFriends();
    } catch (err) {
      toast.error('Friend Request Failed', err.response?.data?.error || err.message || 'Could not update friendship.');
    } finally {
      setStudentSearchActionId(null);
    }
  };

  const handleAcceptFriend = async (requestId, requesterEmail) => {
    try {
      await messApi.acceptFriendRequest(requestId);
      toast.success('Friend Accepted', `You and ${requesterEmail} are now friends!`);
      loadFriends();
    } catch (err) {
      toast.error('Action Failed', err.message);
    }
  };

  const handleRejectFriend = async (requestId) => {
    try {
      await messApi.rejectFriendRequest(requestId);
      toast.info('Request Declined', 'Friend request declined.');
      loadFriends();
    } catch (err) {
      toast.error('Action Failed', err.message);
    }
  };

  const handleRemoveFriend = async (friendId, friendEmail) => {
    if (!window.confirm(`Are you sure you want to remove ${friendEmail} from your friends?`)) return;
    try {
      await messApi.removeFriend(friendId);
      toast.info('Friend Removed', `Removed ${friendEmail} from your friends.`);
      loadFriends();
    } catch (err) {
      toast.error('Remove Failed', err.message);
    }
  };

  const handleToggleNotify = (friendId) => {
    setSelectedNotifyIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleQuickNotifyToggle = async (friendId) => {
    if (savingNotifyPrefs) return;

    const nextIds = selectedNotifyIds.includes(friendId)
      ? selectedNotifyIds.filter((id) => id !== friendId)
      : [...selectedNotifyIds, friendId];

    setSelectedNotifyIds(nextIds);
    setSavingNotifyPrefs(true);
    try {
      const res = await messApi.updateNotifyFriends(nextIds);
      if (res?.notifyFriendIds) setSelectedNotifyIds(res.notifyFriendIds);
      toast.success(
        nextIds.includes(friendId) ? 'Notify Friend Added' : 'Notify Friend Removed',
        nextIds.includes(friendId)
          ? 'This friend will receive your meal calls.'
          : 'This friend will no longer receive your meal calls.'
      );
    } catch (err) {
      setSelectedNotifyIds(selectedNotifyIds);
      toast.error('Preferences Failed', err.message || 'Could not update Notify Friends.');
    } finally {
      setSavingNotifyPrefs(false);
    }
  };

  const handleSaveNotify = async () => {
    setSavingNotifyPrefs(true);
    try {
      const res = await messApi.updateNotifyFriends(selectedNotifyIds);
      if (res?.notifyFriendIds) {
        setSelectedNotifyIds(res.notifyFriendIds);
      }
      toast.success('Preferences Saved', 'Notify Friends list updated for meal calls.');
    } catch (err) {
      toast.error('Save Failed', err.message);
    } finally {
      setSavingNotifyPrefs(false);
    }
  };

  const fetchData = async () => {
    try {
      const [profileData, statsData] = await Promise.all([
        messApi.getMyProfile().catch(() => null),
        messApi.getProfileStats().catch(() => null)
      ]);

      if (profileData) setUserProfile(profileData);
      if (statsData) {
        setStats({
          reportsSubmitted: statsData.reportsSubmitted || 0,
          verificationsCount: statsData.verificationsCount || statsData.verifications || 0,
          photosUploaded: statsData.photosUploaded || 0,
          mealsRated: statsData.mealsCheckedIn || 0,
          points: statsData.points || 0,
          rank: statsData.rank || 1,
          totalUsers: statsData.totalUsers || 1
        });
      }
      loadFriends();
    } catch (e) {
      console.error('Error fetching profile data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = userProfile.name || userProfile.email?.split('@')[0] || 'Resident';

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Action / Context Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] uppercase tracking-wider font-semibold">
              {userProfile.role || 'Active Resident'}
            </span>
            <span className="text-on-surface-variant text-xs">Hostel Dining System</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            Resident Profile & Account Preferences
          </h1>
          <p className="text-xs text-on-surface-variant">
            Manage your dining credentials, residence information, and account preferences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2 rounded-lg shadow-xs text-xs font-semibold transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{saveSuccess ? 'Saved!' : 'Save Changes'}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-error px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Live Status Banner */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface leading-tight">Digital Access Verification Active</p>
            <p className="text-[11px] text-on-surface-variant">Encrypted QR pass active for turnstile gate verification.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="flex items-center gap-1.5 bg-secondary-container/40 px-3 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-semibold text-secondary">Dining Pass Valid</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN (5 cols) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Student ID Card Widget */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl p-6 shadow-md">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute right-16 -top-12 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px] text-primary-fixed">school</span>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary-fixed-dim leading-none">Hostel Mess Portal</p>
                    <p className="text-[11px] text-on-primary-container leading-tight mt-0.5">Dining Card ID-PASS</p>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded bg-white/15 text-primary-fixed text-[10px] tracking-widest font-mono">
                  {userProfile.role || 'STUDENT'}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg text-white shadow-xs">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full ring-2 ring-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-white">check</span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-white tracking-tight truncate">{displayName}</h2>
                  <a
                    href={`mailto:${userProfile.email}`}
                    title="Send email to user"
                    className="text-xs text-primary-fixed-dim hover:text-white font-mono tracking-wider truncate block hover:underline"
                  >
                    {userProfile.email}
                  </a>
                  <p className="text-[11px] text-on-primary-container truncate mt-0.5">
                    {userProfile.branch || userProfile.department || 'Registered Diner'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 bg-white/10 rounded-lg p-2.5 text-center">
                <div>
                  <span className="text-[10px] text-primary-fixed-dim block">Role</span>
                  <span className="text-xs font-bold text-white">{userProfile.role || 'STUDENT'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-primary-fixed-dim block">Status</span>
                  <span className="text-xs font-bold text-secondary-fixed">Active Diner</span>
                </div>
                <div>
                  <span className="text-[10px] text-primary-fixed-dim block">Access</span>
                  <span className="text-xs font-bold text-white">All Meals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Residence & Dining Hall Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">apartment</span>
                <h3 className="text-sm font-bold text-on-surface">Residence & Mess Allocation</h3>
              </div>
              <span className="text-[11px] bg-surface-container px-2 py-0.5 rounded text-on-surface-variant font-medium">
                Allocated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-surface-container-low p-3 rounded-lg space-y-0.5 border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">domain</span> Host Residence
                </span>
                <p className="text-xs font-bold text-on-surface">{userProfile.hostel || 'Campus Hostel'}</p>
                <p className="text-[11px] text-on-surface-variant">
                  {userProfile.roomNumber || userProfile.room ? `Room ${userProfile.roomNumber || userProfile.room}` : 'Resident Room'}
                </p>
              </div>

              <div className="bg-surface-container-low p-3 rounded-lg space-y-0.5 border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">soup_kitchen</span> Primary Mess
                </span>
                <p className="text-xs font-bold text-on-surface">Hostel Dining Hall</p>
                <p className="text-[11px] text-on-surface-variant">Central Dining Block</p>
              </div>
            </div>

            {/* Clickable Phone & Email Contacts for Dining Helpdesk */}
            <div className="bg-surface-container p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">room_service</span>
                <div>
                  <p className="text-xs font-bold text-on-surface">Dining Warden Desk</p>
                  <p className="text-[11px] text-on-surface-variant">Mess Hall Administration</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <a
                  href="tel:+918023456789"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container-high text-primary font-semibold transition-colors cursor-pointer border border-outline-variant/20"
                  title="Call Mess Warden Helpdesk"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  <span>+91 80 2345 6789</span>
                </a>
                <a
                  href="mailto:warden.mess@campus.edu"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container-high text-primary font-semibold transition-colors cursor-pointer border border-outline-variant/20"
                  title="Email Mess Warden Desk"
                >
                  <span className="material-symbols-outlined text-[14px]">mail</span>
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>

          {/* Active Dining Plan Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">Active Dining Tier</span>
                <h3 className="text-base font-bold text-on-surface mt-0.5">Regular Full Board</h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-secondary-container/40 text-on-secondary-container text-[11px] font-semibold">
                4 Sessions/Day
              </span>
            </div>

            <div className="bg-surface-container-low rounded-lg p-3.5 space-y-2 border border-outline-variant/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-on-surface">Meal Privilege Status</span>
                <span className="text-xs font-bold text-secondary">Active & Verified</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant text-[11px] pt-0.5">
                <span>Breakfast • Lunch • Snacks • Dinner</span>
                <span>All Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (7 cols) ================= */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Hostel Friends & Meal Notifications Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-primary">diversity_3</span>
                  <h3 className="text-base font-bold text-on-surface">Hostel Friends & Meal Notifications</h3>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Manage mutual campus friends and select who receives your meal calls.
                </p>
              </div>

              {/* Segmented Tab Controls */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-surface-container-low border border-outline-variant/20 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveFriendTab('friends')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeFriendTab === 'friends'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                >
                  My Friends ({friendsData.friends?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFriendTab('notify')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeFriendTab === 'notify'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                >
                  Notify Friends ({selectedNotifyIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFriendTab('incoming')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${activeFriendTab === 'incoming'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                >
                  <span>Incoming</span>
                  {(friendsData.incomingRequests?.length || 0) > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-error-container text-on-error-container text-[10px] font-bold">
                      {friendsData.incomingRequests.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFriendTab('sent')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeFriendTab === 'sent'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                >
                  Sent ({friendsData.sentRequests?.length || 0})
                </button>
              </div>
            </div>

            {/* TAB 1: MY FRIENDS */}
            {activeFriendTab === 'friends' && (
              <div className="space-y-4">
                {/* Student directory search */}
                <div className="space-y-2">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                      search
                    </span>
                    <input
                      type="search"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Search students by name"
                      aria-label="Search students by name"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {studentSearchQuery.trim().length > 0 && studentSearchQuery.trim().length < 2 && (
                    <p className="px-1 text-[11px] text-on-surface-variant">Enter at least 2 characters to search.</p>
                  )}

                  {studentSearchLoading && (
                    <div className="flex items-center gap-2 px-1 text-[11px] text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                      <span>Searching students...</span>
                    </div>
                  )}

                  {studentSearchError && (
                    <p className="px-1 text-[11px] text-error">{studentSearchError}</p>
                  )}

                  {!studentSearchLoading && !studentSearchError && studentSearchQuery.trim().length >= 2 && studentSearchResults.length === 0 && (
                    <p className="px-1 text-[11px] text-on-surface-variant">No students found.</p>
                  )}

                  {studentSearchResults.length > 0 && (
                    <div className="space-y-1.5">
                      {studentSearchResults.map((student) => {
                        const isActionInProgress = studentSearchActionId === student.id;
                        const isDisabled = isActionInProgress || ['FRIENDS', 'PENDING'].includes(student.relationshipStatus);
                        const actionLabel = student.relationshipStatus === 'FRIENDS'
                          ? 'Friends'
                          : student.relationshipStatus === 'PENDING'
                            ? 'Pending'
                            : student.relationshipStatus === 'INCOMING'
                              ? 'Accept'
                              : isActionInProgress
                                ? 'Sending...'
                                : 'Send Request';

                        return (
                          <div
                            key={student.id}
                            className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary shrink-0 uppercase">
                                {student.displayName?.slice(0, 2) || 'ST'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-on-surface truncate">{student.displayName}</p>
                                <p className="text-[11px] text-on-surface-variant truncate">
                                  {student.hostel
                                    ? `${student.hostel}${student.roomNumber ? ` • Room ${student.roomNumber}` : ''}`
                                    : 'Campus Resident'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isDisabled}
                              onClick={() => handleStudentSearchAction(student)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${isDisabled
                                ? 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-80'
                                : 'bg-primary hover:bg-primary-container text-on-primary cursor-pointer shadow-xs'
                                }`}
                            >
                              {actionLabel}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Friends List */}
                <div className="space-y-2">
                  {friendsData.friends && friendsData.friends.length > 0 ? (
                    friendsData.friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary shrink-0 uppercase">
                            {friend.email?.slice(0, 2) || 'FR'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface truncate">{friend.email}</p>
                            <p className="text-[11px] text-on-surface-variant truncate">
                              {friend.hostel ? `${friend.hostel} • Room ${friend.roomNumber || '—'}` : 'Campus Resident'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {selectedNotifyIds.includes(friend.id) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold">
                              <span className="material-symbols-outlined text-[12px]">notifications_active</span>
                              <span>Notify ON</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleQuickNotifyToggle(friend.id)}
                            disabled={savingNotifyPrefs}
                            title={selectedNotifyIds.includes(friend.id) ? 'Remove from Notify Friends' : 'Add to Notify Friends'}
                            aria-label={selectedNotifyIds.includes(friend.id) ? `Remove ${friend.email} from Notify Friends` : `Add ${friend.email} to Notify Friends`}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${selectedNotifyIds.includes(friend.id)
                                ? 'text-secondary hover:bg-secondary-container/30'
                                : 'text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30'
                              }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {selectedNotifyIds.includes(friend.id) ? 'notifications_active' : 'notification_add'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFriend(friend.id, friend.email)}
                            title="Remove friend"
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">person_remove</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-on-surface-variant italic space-y-1">
                      <span className="material-symbols-outlined text-[28px] text-outline">group_off</span>
                      <p>You have not added any mutual friends yet.</p>
                      <p className="text-[11px] text-outline">Search for a student above to send a friend request.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: NOTIFY FRIENDS SUBSET */}
            {activeFriendTab === 'notify' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-primary">notifications</span>
                    <span>Meal Call Notification Subset</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Choose which friends can receive your meal notifications. When you click <strong className="text-on-surface font-semibold">"Come to Dinner"</strong> on your Dashboard, only selected friends receive an alert.
                  </p>
                </div>

                {friendsData.friends && friendsData.friends.length > 0 ? (
                  <div className="space-y-2">
                    <div className="divide-y divide-outline-variant/10 rounded-xl bg-surface-container-low border border-outline-variant/15 overflow-hidden">
                      {friendsData.friends.map((friend) => {
                        const isChecked = selectedNotifyIds.includes(friend.id);
                        return (
                          <label
                            key={friend.id}
                            className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-surface-container transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                              <div className="min-w-0">
                                <span className="font-semibold text-on-surface block truncate">{friend.email}</span>
                                <span className="text-[10px] text-on-surface-variant block">
                                  {friend.hostel || 'Hostel Resident'}
                                </span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleNotify(friend.id)}
                              className="h-4 w-4 rounded text-primary accent-primary cursor-pointer shrink-0"
                            />
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-on-surface-variant font-medium">
                        {selectedNotifyIds.length} of {friendsData.friends.length} friends selected
                      </span>
                      <button
                        type="button"
                        disabled={savingNotifyPrefs}
                        onClick={handleSaveNotify}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>{savingNotifyPrefs ? 'Saving...' : 'Save Preferences'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-on-surface-variant italic space-y-1">
                    <span className="material-symbols-outlined text-[28px] text-outline">group_add</span>
                    <p>No friends available to select.</p>
                    <p className="text-[11px] text-outline">Add friends in the "My Friends" tab first to configure meal notifications.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: INCOMING REQUESTS */}
            {activeFriendTab === 'incoming' && (
              <div className="space-y-3">
                {friendsData.incomingRequests && friendsData.incomingRequests.length > 0 ? (
                  friendsData.incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-secondary">mark_email_unread</span>
                          <span className="font-bold text-on-surface">{req.requesterEmail}</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          Sent on {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'recently'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAcceptFriend(req.id, req.requesterEmail)}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectFriend(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-semibold border border-outline-variant/20 transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-on-surface-variant italic space-y-1">
                    <span className="material-symbols-outlined text-[28px] text-outline">inbox</span>
                    <p>No incoming friend requests.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SENT REQUESTS */}
            {activeFriendTab === 'sent' && (
              <div className="space-y-3">
                {friendsData.sentRequests && friendsData.sentRequests.length > 0 ? (
                  friendsData.sentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-outline">outgoing_mail</span>
                          <span className="font-semibold text-on-surface">{req.receiverEmail}</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          Sent on {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'recently'}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-bold">
                        Pending Approval
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-on-surface-variant italic space-y-1">
                    <span className="material-symbols-outlined text-[28px] text-outline">send</span>
                    <p>No outgoing pending requests.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Protocols */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-on-surface">Notification Protocols</h3>
                <p className="text-[11px] text-on-surface-variant">Push notifications to your campus device</p>
              </div>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">notifications_active</span>
            </div>

            <div className="space-y-2 divide-y divide-outline-variant/10 text-xs">
              <label className="pt-2 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-on-surface block">Meal Opening Countdown</span>
                  <span className="text-[11px] text-on-surface-variant">Alert 15 mins prior to hall door opening</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.mealCountdown}
                  onChange={() => toggleNotification('mealCountdown')}
                  className="h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                />
              </label>

              <label className="pt-2 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-on-surface block">Live Menu Substitutions</span>
                  <span className="text-[11px] text-on-surface-variant">When consensus overrides official menu items</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.menuUpdates}
                  onChange={() => toggleNotification('menuUpdates')}
                  className="h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                />
              </label>

              <label className="pt-2 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-on-surface block">Buddy Group Meetups</span>
                  <span className="text-[11px] text-on-surface-variant">When table companions signal they are walking down</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.groupInvites}
                  onChange={() => toggleNotification('groupInvites')}
                  className="h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Appearance & Dark Mode Preference */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-on-surface">Appearance & Theme</h3>
                <p className="text-[11px] text-on-surface-variant">Switch between Light and True Obsidian Dark modes</p>
              </div>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">palette</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'light', label: 'Light', icon: 'light_mode', desc: 'Standard Ivory' },
                { id: 'dark', label: 'Dark', icon: 'dark_mode', desc: 'Obsidian Dark' },
                { id: 'system', label: 'System', icon: 'devices', desc: 'System Match' },
              ].map((t) => {
                const isSelected = themeMode === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeMode(t.id)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${isSelected
                      ? 'bg-primary-fixed/40 border-primary text-on-surface shadow-xs ring-1 ring-primary'
                      : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">{t.icon}</span>
                        {t.label}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-[10px] text-on-surface-variant block">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Digital Turnstile QR Pass */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="material-symbols-outlined text-[20px] text-primary">qr_code_2</span>
                <h3 className="text-sm font-bold text-on-surface">Digital Turnstile QR Pass</h3>
              </div>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Generated with encrypted timestamp tokens. Rotates automatically every 60 seconds to prevent unauthorized gate pass sharing.
              </p>
              <div className="flex gap-2 pt-1 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => navigate('/student/attendance')}
                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  View Attendance Log
                </button>
              </div>
            </div>

            {/* Rendered Minimal SVG QR */}
            <div className="p-3 bg-surface rounded-xl border border-outline-variant/20 shrink-0 shadow-inner flex flex-col items-center">
              <svg className="w-32 h-32 text-on-surface" fill="currentColor" viewBox="0 0 100 100">
                <rect fill="none" height="24" rx="3" stroke="currentColor" strokeWidth="4" width="24" x="10" y="10" />
                <rect fill="currentColor" height="12" width="12" x="16" y="16" />
                <rect fill="none" height="24" rx="3" stroke="currentColor" strokeWidth="4" width="24" x="66" y="10" />
                <rect fill="currentColor" height="12" width="12" x="72" y="16" />
                <rect fill="none" height="24" rx="3" stroke="currentColor" strokeWidth="4" width="24" x="10" y="66" />
                <rect fill="currentColor" height="12" width="12" x="16" y="72" />
                <rect height="6" width="6" x="42" y="12" />
                <rect height="6" width="6" x="52" y="12" />
                <rect height="10" width="6" x="42" y="24" />
                <rect height="6" width="6" x="52" y="28" />
                <rect height="6" width="6" x="42" y="40" />
                <rect height="8" width="6" x="52" y="40" />
                <rect height="6" width="6" x="66" y="42" />
                <rect height="6" width="6" x="78" y="42" />
                <rect height="10" width="6" x="84" y="52" />
                <rect height="6" width="6" x="72" y="60" />
                <rect height="10" width="6" x="42" y="58" />
                <rect height="6" width="6" x="52" y="66" />
                <rect height="6" width="6" x="42" y="78" />
                <rect height="6" width="6" x="52" y="78" />
                <rect height="6" width="6" x="66" y="78" />
                <rect height="6" width="6" x="78" y="78" />
              </svg>
              <span className="text-[10px] font-mono text-outline mt-1 font-semibold">PASS-ID-{userProfile.email?.slice(0, 4)?.toUpperCase() || 'STU1'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
