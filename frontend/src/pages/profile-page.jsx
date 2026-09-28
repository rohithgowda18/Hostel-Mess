import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import { useTheme } from '@/context/theme-context';
import {
  User,
  Mail,
  Phone,
  Building,
  DoorOpen,
  Trophy,
  Award,
  Sparkles,
  Camera,
  CheckCircle2,
  Calendar,
  LogOut,
  Edit2,
  Save,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { themeMode, setThemeMode } = useTheme();
  const [userProfile, setUserProfile] = useState(getUser() || {});
  const [stats, setStats] = useState({
    points: 0,
    reportsSubmitted: 0,
    photosUploaded: 0,
    mealsCheckedIn: 0,
    attendanceRate: 0,
    badges: [],
    rank: 0,
    totalUsers: 0,
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchData = async () => {
    try {
      const [profileData, statsData, lbData] = await Promise.all([
        messApi.getMyProfile().catch(() => null),
        messApi.getProfileStats().catch(() => null),
        messApi.getLeaderboard().catch(() => []),
      ]);

      if (profileData) {
        setUserProfile(profileData);
        setPhone(profileData.phoneNumber || '');
      }
      if (statsData) setStats(statsData);
      if (Array.isArray(lbData) && lbData.length > 0) setLeaderboard(lbData);
    } catch (e) {
      console.error('Error fetching profile data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await messApi.updateMyProfile({ phoneNumber: phone });
      setEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      fetchData();
    } catch (e) {
      setEditing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = userProfile.name || userProfile.email?.split('@')[0] || 'Resident Student';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <PageHeader
        badge={
          <Badge variant="primary" className="text-[10px] font-bold">
            Resident Account
          </Badge>
        }
        title="My Profile & Campus Reputation"
        description="Track your dining contribution score, attendance record, earned community badges, and campus rankings."
        actions={
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            className="text-xs font-bold gap-1.5"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        }
      />

      {/* Save Alert */}
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          title="Contribution Score"
          value={`${stats.points || 0} Pts`}
          subtitle={stats.rank > 0 ? `Campus Rank #${stats.rank} of ${stats.totalUsers || 1}` : 'Active Contributor'}
          badgeText="Reputation"
          accentColor="amber"
        />
        <StatCard
          icon={Sparkles}
          title="Verified Reports"
          value={stats.reportsSubmitted || 0}
          subtitle="Peer menu consensus updates"
          accentColor="blue"
        />
        <StatCard
          icon={Camera}
          title="Photos Shared"
          value={stats.photosUploaded || 0}
          subtitle="Community gallery evidence"
          accentColor="purple"
        />
        <StatCard
          icon={CheckCircle2}
          title="Attendance Rate"
          value={`${stats.attendanceRate || 0}%`}
          subtitle={`${stats.mealsCheckedIn || 0} meals checked-in`}
          badgeText="Verified"
          accentColor="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Profile Card & Details */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 shadow-card space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-md mb-3">
                {initials}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {displayName}
              </h3>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{userProfile.email}</p>
              <Badge variant="primary" className="mt-2 text-[10px]">
                {userProfile.role || 'STUDENT'} RESIDENT
              </Badge>
            </div>

            {/* Badges Earned */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Earned Campus Badges
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(stats.badges && stats.badges.length > 0
                  ? stats.badges
                  : ['Resident Contributor']
                ).map((badge) => {
                  const hasBadge = (stats.badges || []).includes(badge) || stats.badges?.length === 0;
                  return (
                    <span
                      key={badge}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-xl border ${
                        hasBadge
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                          : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 opacity-50'
                      }`}
                    >
                      🏆 {badge}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Personal & Hostel Details */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Residential Info
                </span>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit Phone
                  </button>
                ) : (
                  <button
                    onClick={handleSaveProfile}
                    className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Hostel Block</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{userProfile.hostel || 'Not Assigned'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Allocated Room</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {userProfile.roomNumber ? `Room ${userProfile.roomNumber}` : 'Not Allocated'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Contact Phone</span>
                  {editing ? (
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-8 text-xs max-w-xs"
                    />
                  ) : (
                    <span className="font-mono text-slate-800 dark:text-slate-200">{phone || 'Not added'}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (7 Cols): Leaderboard & Appearance Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Appearance & Theme Selector Card */}
          <Card className="p-6 shadow-card space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              Interface Theme & Appearance
            </h3>
            <p className="text-xs text-slate-500">
              Customize the portal display mode according to your lighting preference.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                  themeMode === 'light'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Sun className="h-5 w-5 text-amber-500" />
                Light Mode
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                  themeMode === 'dark'
                    ? 'bg-blue-950/60 border-blue-500 text-blue-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Moon className="h-5 w-5 text-blue-400" />
                Dark Mode
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('system')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                  themeMode === 'system'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Monitor className="h-5 w-5 text-slate-500" />
                Auto System
              </button>
            </div>
          </Card>

          {/* Campus Reputation Leaderboard */}
          <Card className="p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Campus Dining Reputation Leaderboard
                </h3>
                <p className="text-xs text-slate-500">Top contributing student reporters this semester</p>
              </div>
              <Badge variant="primary">Top 10</Badge>
            </div>

            {leaderboard.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No leaderboard rankings recorded yet this semester.
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((user, idx) => {
                  const isMe = user.email === userProfile.email;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-xs ${
                        isMe
                          ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60 font-bold'
                          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-black text-sm text-slate-400 w-5">
                          #{idx + 1}
                        </span>
                        <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                          {(user.name || user.email || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-slate-900 dark:text-slate-100 block">
                            {user.name || user.email?.split('@')[0]} {isMe && '(You)'}
                          </span>
                          <span className="text-[10px] text-slate-400">Hostel Resident</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 font-black text-amber-600 dark:text-amber-400">
                        <span>{user.points ?? 0}</span>
                        <span className="text-[10px] text-slate-400 font-normal">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
