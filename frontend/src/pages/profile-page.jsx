import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';

const ACCOUNT_SETTINGS = [
  { icon: 'lock', title: 'Privacy Settings', desc: 'Manage who can see your profile and activity.' },
  { icon: 'notifications_active', title: 'Notification Preferences', desc: 'Menu updates, check-in reminders, alerts.' },
  { icon: 'key', title: 'Change Password', desc: 'Update your security credentials.' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
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
    <div className="flex-1 overflow-y-auto font-[Inter,sans-serif] bg-slate-950 text-slate-100 pb-24 md:pb-8">
      <main className="p-4 md:p-6 max-w-[1440px] mx-auto space-y-6">
        
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-extrabold text-white">Profile & Community Reputation</h2>
          <p className="text-xs text-slate-400 mt-1">Track your dining contributions, attendance, and achievements.</p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">Contribution Score</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.points} Pts</div>
            <span className="text-[10px] text-emerald-400 mt-1 block">Rank #{stats.rank} of {stats.totalUsers}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">Reports Submitted</span>
            <div className="text-2xl font-black text-blue-400 mt-1">{stats.reportsSubmitted}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Verified menu submissions</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">Photos Uploaded</span>
            <div className="text-2xl font-black text-purple-400 mt-1">{stats.photosUploaded}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Food gallery contributions</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">Attendance Rate</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.attendanceRate}%</div>
            <span className="text-[10px] text-slate-500 mt-1 block">{stats.mealsCheckedIn} meals checked-in</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Profile Summary Card */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col items-center text-center shadow-xl">
              <div className="w-24 h-24 rounded-full border-4 border-amber-500/40 bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 text-3xl font-black uppercase mb-3 shadow-lg shadow-amber-500/20">
                {(userProfile.email || 'ST').slice(0, 2)}
              </div>
              <h3 className="text-xl font-extrabold text-white">{formData.name}</h3>
              <p className="text-xs text-slate-400 mb-4">{userProfile.email}</p>

              {/* Badges Grid */}
              <div className="w-full border-t border-b border-slate-800 py-3 mb-4 space-y-2">
                <span className="text-xs font-bold text-slate-300 block text-left">Earned Badges:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Meal Reporter', 'Food Explorer', 'Community Helper'].map((badge) => {
                    const hasBadge = (stats.badges || []).includes(badge) || stats.points > 0;
                    return (
                      <span
                        key={badge}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          hasBadge
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-500 border-slate-700 opacity-60'
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
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition"
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {/* Hostel Info */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
              <h4 className="text-sm font-bold text-white mb-3">Hostel Details</h4>
              <ul className="space-y-3 text-xs">
                {[
                  { label: 'Hostel Block', value: userProfile.hostel || 'Block A' },
                  { label: 'Room Number', value: userProfile.roomNumber || 'A-204' },
                  { label: 'Branch', value: userProfile.branch || 'Computer Science' },
                  { label: 'Year', value: userProfile.year ? `${userProfile.year} Year` : '3rd Year' },
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-semibold text-slate-200">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Leaderboard & Account Settings */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Edit Form */}
            {editing && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                <h4 className="text-base font-bold text-white">Edit Profile Details</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(false)} className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl">Cancel</button>
                  <button onClick={handleSaveProfile} className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl">Save</button>
                </div>
              </div>
            )}

            {/* Top Contributors Leaderboard */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-lg">🏆</span> Top Community Contributors
                </h4>
                <span className="text-xs text-amber-400 font-semibold">Live Ranking</span>
              </div>

              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">Loading top contributors...</div>
                ) : (
                  leaderboard.map((lb, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                        lb.email?.toLowerCase() === userProfile.email?.toLowerCase()
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                          : 'bg-slate-950 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-[11px] ${
                          idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {lb.rank}
                        </span>
                        <div>
                          <p className="font-bold text-slate-100">{lb.email ? lb.email.split('@')[0] : 'Contributor'}</p>
                          <p className="text-[10px] text-slate-400">{lb.hostel || 'Hostel'}</p>
                        </div>
                      </div>

                      <span className="font-extrabold text-amber-400">{lb.points} Pts</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-3">
              <h4 className="text-base font-bold text-white mb-2">Account Settings</h4>
              <div className="divide-y divide-slate-800">
                {ACCOUNT_SETTINGS.map((setting) => (
                  <div key={setting.title} className="py-3 flex items-center justify-between hover:bg-slate-800/50 px-2 rounded-xl transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-lg">{setting.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{setting.title}</p>
                        <p className="text-[10px] text-slate-400">{setting.desc}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 text-sm">chevron_right</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
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

