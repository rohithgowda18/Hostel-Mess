import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import { useTheme } from '@/context/theme-context';
import { Sun, Moon, Monitor } from 'lucide-react';

const ACCOUNT_SETTINGS = [
  { icon: 'lock', title: 'Privacy Settings', desc: 'Manage who can see your profile and activity.' },
  { icon: 'notifications_active', title: 'Notification Preferences', desc: 'Menu updates, check-in reminders, alerts.' },
  { icon: 'key', title: 'Change Password', desc: 'Update your security credentials.' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { themeMode, setThemeMode } = useTheme();
  const [userProfile, setUserProfile] = useState(getUser() || {});
  const [stats, setStats] = useState({
    points: 0,
    reportsSubmitted: 0,
    photosUploaded: 0,
    mealsCheckedIn: 0,
    attendanceRate: 95,
    badges: [],
    rank: 1,
    totalUsers: 1,
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile.email ? userProfile.email.split('@')[0] : 'Student',
    email: userProfile.email || '',
    phone: userProfile.phoneNumber || '',
  });

  const fetchData = async () => {
    try {
      const [profileData, statsData, lbData] = await Promise.all([
        messApi.getMyProfile().catch(() => null),
        messApi.getProfileStats().catch(() => null),
        messApi.getLeaderboard().catch(() => []),
      ]);

      if (profileData) {
        setUserProfile(profileData);
        setFormData({
          name: profileData.email ? profileData.email.split('@')[0] : 'Student',
          email: profileData.email || '',
          phone: profileData.phoneNumber || '',
        });
      }
      if (statsData) setStats(statsData);
      if (lbData) setLeaderboard(lbData);
    } catch (e) {
      console.error('Error fetching profile data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await messApi.updateMyProfile({ phoneNumber: formData.phone });
      setEditing(false);
      fetchData();
    } catch (e) {
      setEditing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex-1 overflow-y-auto font-[Inter,sans-serif] bg-[#f8f9fa] dark:bg-[#0F172A] text-[#191c1d] dark:text-[#F8FAFC] pb-24 md:pb-8 transition-colors duration-200">
      <main className="p-4 md:p-6 max-w-[1440px] mx-auto space-y-6">
        
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-extrabold text-[#003f87] dark:text-[#3B82F6]">Profile & Community Reputation</h2>
          <p className="text-xs text-[#424752] dark:text-[#94A3B8] mt-1">Track your dining contributions, attendance, and achievements.</p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1E293B] border border-[#c2c6d4] dark:border-[#334155] rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-[#424752] dark:text-[#94A3B8] font-semibold block">Contribution Score</span>
            <div className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-1">{stats.points} Pts</div>
            <span className="text-[10px] text-[#006e25] dark:text-[#22C55E] mt-1 block">Rank #{stats.rank} of {stats.totalUsers}</span>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-[#c2c6d4] dark:border-[#334155] rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-[#424752] dark:text-[#94A3B8] font-semibold block">Reports Submitted</span>
            <div className="text-2xl font-black text-[#003f87] dark:text-[#3B82F6] mt-1">{stats.reportsSubmitted}</div>
            <span className="text-[10px] text-[#424752] dark:text-[#94A3B8] mt-1 block">Verified menu submissions</span>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-[#c2c6d4] dark:border-[#334155] rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-[#424752] dark:text-[#94A3B8] font-semibold block">Photos Uploaded</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{stats.photosUploaded}</div>
            <span className="text-[10px] text-[#424752] dark:text-[#94A3B8] mt-1 block">Food gallery contributions</span>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-[#c2c6d4] dark:border-[#334155] rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-[#424752] dark:text-[#94A3B8] font-semibold block">Attendance Rate</span>
            <div className="text-2xl font-black text-[#006e25] dark:text-[#22C55E] mt-1">{stats.attendanceRate}%</div>
            <span className="text-[10px] text-[#424752] dark:text-[#94A3B8] mt-1 block">{stats.mealsCheckedIn} meals checked-in</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Profile Summary Card */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#c2c6d4] dark:border-[#334155] p-6 flex flex-col items-center text-center shadow-sm">
              <div className="w-24 h-24 rounded-full border-4 border-amber-500/40 bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-3xl font-black uppercase mb-3 shadow-lg">
                {(userProfile.email || 'ST').slice(0, 2)}
              </div>
              <h3 className="text-xl font-extrabold text-[#191c1d] dark:text-[#F8FAFC]">{formData.name}</h3>
              <p className="text-xs text-[#424752] dark:text-[#94A3B8] mb-4">{userProfile.email}</p>

              {/* Badges Grid */}
              <div className="w-full border-t border-b border-[#c2c6d4]/60 dark:border-[#334155] py-3 mb-4 space-y-2">
                <span className="text-xs font-bold text-[#191c1d] dark:text-[#CBD5E1] block text-left">Earned Badges:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Meal Reporter', 'Food Explorer', 'Community Helper'].map((badge) => {
                    const hasBadge = (stats.badges || []).includes(badge) || stats.points > 0;
                    return (
                      <span
                        key={badge}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          hasBadge
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                            : 'bg-gray-100 dark:bg-[#0F172A] text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700 opacity-60'
                        }`}
                      >
                        🏅 {badge}
                      </span>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="w-full py-2 bg-[#f3f4f5] dark:bg-[#0F172A] hover:bg-gray-200 dark:hover:bg-[#334155] text-xs font-bold text-[#191c1d] dark:text-[#F8FAFC] rounded-xl border border-[#c2c6d4] dark:border-[#334155] transition"
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {/* Appearance & Theme Selector */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#c2c6d4] dark:border-[#334155] p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-[#191c1d] dark:text-[#F8FAFC]">Appearance & Theme</h4>
              <p className="text-xs text-[#424752] dark:text-[#94A3B8]">Choose your visual mode preference.</p>
              
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition active:scale-95 ${
                    themeMode === 'light'
                      ? 'border-[#003f87] bg-[#003f87]/10 text-[#003f87] dark:border-[#3B82F6] dark:bg-[#3B82F6]/20 dark:text-[#3B82F6]'
                      : 'border-[#c2c6d4] dark:border-[#334155] bg-gray-50 dark:bg-[#0F172A] text-[#424752] dark:text-[#CBD5E1]'
                  }`}
                >
                  <Sun className="h-5 w-5 mb-1 text-amber-500" />
                  Light
                </button>

                <button
                  onClick={() => setThemeMode('dark')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition active:scale-95 ${
                    themeMode === 'dark'
                      ? 'border-[#003f87] bg-[#003f87]/10 text-[#003f87] dark:border-[#3B82F6] dark:bg-[#3B82F6]/20 dark:text-[#3B82F6]'
                      : 'border-[#c2c6d4] dark:border-[#334155] bg-gray-50 dark:bg-[#0F172A] text-[#424752] dark:text-[#CBD5E1]'
                  }`}
                >
                  <Moon className="h-5 w-5 mb-1 text-[#3B82F6]" />
                  Dark
                </button>

                <button
                  onClick={() => setThemeMode('system')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition active:scale-95 ${
                    themeMode === 'system'
                      ? 'border-[#003f87] bg-[#003f87]/10 text-[#003f87] dark:border-[#3B82F6] dark:bg-[#3B82F6]/20 dark:text-[#3B82F6]'
                      : 'border-[#c2c6d4] dark:border-[#334155] bg-gray-50 dark:bg-[#0F172A] text-[#424752] dark:text-[#CBD5E1]'
                  }`}
                >
                  <Monitor className="h-5 w-5 mb-1 text-gray-500" />
                  System
                </button>
              </div>
            </div>

            {/* Hostel Info */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#c2c6d4] dark:border-[#334155] p-5 shadow-sm">
              <h4 className="text-sm font-bold text-[#191c1d] dark:text-[#F8FAFC] mb-3">Hostel Details</h4>
              <ul className="space-y-3 text-xs">
                {[
                  { label: 'Hostel Block', value: userProfile.hostel || 'Block A' },
                  { label: 'Room Number', value: userProfile.roomNumber || 'A-204' },
                  { label: 'Branch', value: userProfile.branch || 'Computer Science' },
                  { label: 'Year', value: userProfile.year ? `${userProfile.year} Year` : '3rd Year' },
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center border-b border-[#c2c6d4]/40 dark:border-[#334155] pb-2">
                    <span className="text-[#424752] dark:text-[#94A3B8]">{item.label}</span>
                    <span className="font-semibold text-[#191c1d] dark:text-[#F8FAFC]">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Leaderboard & Account Settings */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Edit Form */}
            {editing && (
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#c2c6d4] dark:border-[#334155] p-6 shadow-sm space-y-4">
                <h4 className="text-base font-bold text-[#191c1d] dark:text-[#F8FAFC]">Edit Profile Details</h4>
                <div>
                  <label className="block text-xs font-semibold text-[#424752] dark:text-[#CBD5E1] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#f3f4f5] dark:bg-[#0F172A] border border-[#c2c6d4] dark:border-[#334155] text-[#191c1d] dark:text-[#F8FAFC] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#003f87] dark:focus:border-[#3B82F6]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 dark:bg-[#0F172A] text-xs font-semibold rounded-xl">Cancel</button>
                  <button onClick={handleSaveProfile} className="px-4 py-2 bg-[#003f87] dark:bg-[#3B82F6] text-white text-xs font-bold rounded-xl">Save</button>
                </div>
              </div>
            )}

            {/* Top Contributors Leaderboard */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#c2c6d4] dark:border-[#334155] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-[#191c1d] dark:text-[#F8FAFC] flex items-center gap-2">
                  <span className="text-lg">🏆</span> Top Community Contributors
                </h4>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Live Ranking</span>
              </div>

              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#424752] dark:text-[#94A3B8]">Loading top contributors...</div>
                ) : (
                  leaderboard.map((lb, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                        lb.email?.toLowerCase() === userProfile.email?.toLowerCase()
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                          : 'bg-[#f3f4f5] dark:bg-[#0F172A] border-[#c2c6d4]/60 dark:border-[#334155] text-[#191c1d] dark:text-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-[11px] ${
                          idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                        }`}>
                          {lb.rank}
                        </span>
                        <div>
                          <p className="font-bold text-[#191c1d] dark:text-[#F8FAFC]">{lb.email ? lb.email.split('@')[0] : 'Contributor'}</p>
                          <p className="text-[10px] text-[#424752] dark:text-[#94A3B8]">{lb.hostel || 'Hostel'}</p>
                        </div>
                      </div>

                      <span className="font-extrabold text-amber-600 dark:text-amber-400">{lb.points} Pts</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#c2c6d4] dark:border-[#334155] p-6 shadow-sm space-y-3">
              <h4 className="text-base font-bold text-[#191c1d] dark:text-[#F8FAFC] mb-2">Account Settings</h4>
              <div className="divide-y divide-[#c2c6d4]/40 dark:divide-[#334155]">
                {ACCOUNT_SETTINGS.map((setting) => (
                  <div key={setting.title} className="py-3 flex items-center justify-between hover:bg-[#f3f4f5] dark:hover:bg-[#334155]/50 px-2 rounded-xl transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#424752] dark:text-[#94A3B8] text-lg">{setting.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-[#191c1d] dark:text-[#F8FAFC]">{setting.title}</p>
                        <p className="text-[10px] text-[#424752] dark:text-[#94A3B8]">{setting.desc}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#424752] dark:text-[#94A3B8] text-sm">chevron_right</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/20 text-[#ba1a1a] dark:text-[#EF4444] border border-[#ba1a1a]/30 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Sign Out of Platform
            </button>

          </div>
        </div>

      </main>
    </div>
  );
}
