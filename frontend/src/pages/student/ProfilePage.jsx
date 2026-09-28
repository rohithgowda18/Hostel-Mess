import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import { useTheme } from '@/context/theme-context';
import {
  User,
  Mail,
  Building,
  GraduationCap,
  Calendar,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Camera,
  CheckCircle2,
  FileText,
  Star,
  Trophy,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function ProfilePage() {
  const navigate = useNavigate();
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [profileData, statsData, lbData] = await Promise.all([
        messApi.getMyProfile().catch(() => null),
        messApi.getProfileStats().catch(() => null),
        messApi.getLeaderboard().catch(() => [])
      ]);

      if (profileData) {
        setUserProfile(profileData);
      }
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
      if (Array.isArray(lbData)) {
        setLeaderboard(lbData.slice(0, 5));
      }
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

  const displayName = userProfile.name || userProfile.email?.split('@')[0] || 'Resident Student';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-text tracking-tight">
              Resident Profile & Activity
            </h1>
            <Badge variant="primary" className="text-[11px] font-bold">
              {userProfile.role || 'STUDENT'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Student dining identity, residential room details, and crowdsourced contribution record.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleLogout}
          className="text-xs text-danger hover:text-danger hover:bg-danger/10 border-danger/30 gap-1.5 self-start sm:self-auto"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>

      {/* Main Profile Grid: Info (5 cols) & Contributions + Leaderboard (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Information (Section 19) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-surface border-border space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary text-white font-black text-xl flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">{displayName}</h3>
                <span className="text-xs font-mono text-text-secondary block mt-0.5">
                  {userProfile.email}
                </span>
                <span className="text-[11px] font-semibold text-text-muted mt-1 inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Verified Resident Diner
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                Residential & Academic Details
              </span>

              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-text-muted" /> Hostel Block
                </span>
                <span className="font-bold text-text">{userProfile.hostel || 'Main Block'}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-secondary">Room Allocation</span>
                <span className="font-bold text-text">
                  {userProfile.roomNumber ? `Room ${userProfile.roomNumber}` : 'Room Assigned'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-text-muted" /> Academic Branch
                </span>
                <span className="text-text">{userProfile.branch || 'Computer Science'}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" /> Academic Year
                </span>
                <span className="text-text">{userProfile.year || '3rd Year'}</span>
              </div>
            </div>
          </Card>

          {/* Theme Mode Selector */}
          <Card className="p-5 bg-surface border-border space-y-3">
            <span className="text-xs font-bold text-text uppercase tracking-wider block">
              Portal Theme & Appearance
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border text-text-secondary hover:text-text hover:bg-surface-elevated'
                }`}
              >
                <Sun className="h-4 w-4 text-amber-500" />
                Light
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border text-text-secondary hover:text-text hover:bg-surface-elevated'
                }`}
              >
                <Moon className="h-4 w-4 text-blue-400" />
                Dark
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('system')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  themeMode === 'system'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border text-text-secondary hover:text-text hover:bg-surface-elevated'
                }`}
              >
                <Monitor className="h-4 w-4 text-text-muted" />
                Auto
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Contributions & Compact Leaderboard (Section 19) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Contribution Statistics (Section 19: Reports, Verifications, Photos, Meals Rated) */}
          <Card className="p-5 bg-surface border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text">Your Dining Contributions</h3>
              <span className="text-xs text-text-secondary">Community Impact</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border text-center">
                <FileText className="h-4 w-4 text-primary mx-auto mb-1" />
                <span className="text-xl font-black text-text block">{stats.reportsSubmitted}</span>
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                  Meal Reports
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border text-center">
                <CheckCircle2 className="h-4 w-4 text-success mx-auto mb-1" />
                <span className="text-xl font-black text-text block">{stats.verificationsCount}</span>
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                  Verifications
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border text-center">
                <Camera className="h-4 w-4 text-primary mx-auto mb-1" />
                <span className="text-xl font-black text-text block">{stats.photosUploaded}</span>
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                  Photos
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border text-center">
                <Star className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <span className="text-xl font-black text-text block">{stats.mealsRated}</span>
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                  Meals Rated
                </span>
              </div>
            </div>
          </Card>

          {/* Compact Leaderboard (Section 19: Your Rank, Top Contributors) */}
          <Card className="p-5 bg-surface border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Top Community Contributors
                </h3>
                <p className="text-xs text-text-secondary">Students helping peers know what is being served</p>
              </div>
              <Badge variant="primary" className="text-[10px] font-bold">
                Your Rank: #{stats.rank || 1}
              </Badge>
            </div>

            {leaderboard.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                No contributor activity recorded yet this week.
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((item, idx) => {
                  const isMe = item.email === userProfile.email;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${
                        isMe
                          ? 'bg-primary/10 border-primary/40 font-bold'
                          : 'bg-surface-elevated border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-text-muted w-5">
                          #{idx + 1}
                        </span>
                        <div className="h-7 w-7 rounded-lg bg-surface border border-border text-text font-bold flex items-center justify-center text-[11px]">
                          {(item.name || item.email || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-text block font-semibold">
                            {item.name || item.email?.split('@')[0]} {isMe && '(You)'}
                          </span>
                          <span className="text-[10px] text-text-muted">Resident Diner</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-bold text-primary">
                        <span>{item.points || 0}</span>
                        <span className="text-[10px] text-text-muted font-normal">pts</span>
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
