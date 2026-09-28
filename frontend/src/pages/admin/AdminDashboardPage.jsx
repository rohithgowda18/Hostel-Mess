import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardCheck,
  MessageSquareWarning,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { messApi } from '@/services/mess-api';
import { MEAL_SLOTS, getCurrentMealSlot, getSlotTimeLabel, isSlotActive } from '@/config/meal-schedule';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    expectedToday: 0,
    checkedIn: 0,
    openComplaints: 0,
    mealReportsToday: 0
  });

  const [currentSlotKey, setCurrentSlotKey] = useState(() => getCurrentMealSlot());
  const [officialMenu, setOfficialMenu] = useState([]);
  const [communityConsensus, setCommunityConsensus] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [importantNotice, setImportantNotice] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const activeKey = getCurrentMealSlot();
      setCurrentSlotKey(activeKey);
      const slotDef = MEAL_SLOTS[activeKey];
      const todayStr = new Date().toISOString().split('T')[0];

      const [adminStats, mealData, consensusData, complaintsList, announcements] = await Promise.all([
        messApi.getAdminDashboardStats().catch(() => null),
        messApi.getTodayMeal(slotDef.type).catch(() => null),
        messApi.getMealConsensus(slotDef.type, todayStr).catch(() => null),
        messApi.getComplaints().catch(() => []),
        messApi.getAnnouncements().catch(() => [])
      ]);

      if (adminStats) {
        setStats({
          totalStudents: adminStats.totalStudents || 0,
          expectedToday: adminStats.expectedToday || 0,
          checkedIn: adminStats.checkedIn || 0,
          openComplaints: adminStats.openComplaints || 0,
          mealReportsToday: adminStats.mealReportsToday || 0
        });
      }

      if (mealData?.items) {
        setOfficialMenu(mealData.items.map((it) => (typeof it === 'string' ? it : it.name || '')));
      } else {
        setOfficialMenu([]);
      }

      setCommunityConsensus(consensusData);

      const openComps = Array.isArray(complaintsList)
        ? complaintsList.filter((c) => c.status !== 'RESOLVED').slice(0, 4)
        : [];
      setRecentComplaints(openComps);

      const pinned = Array.isArray(announcements)
        ? announcements.find((a) => a.priority === 'IMPORTANT') || announcements[0]
        : null;
      setImportantNotice(pinned);
    } catch (err) {
      console.error('Failed to load operational metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const slotDef = MEAL_SLOTS[currentSlotKey] || MEAL_SLOTS.LUNCH;
  const isLive = isSlotActive(slotDef);
  const verifiedCount = communityConsensus?.verifiedItems?.length || 0;
  const attendanceRate = stats.expectedToday > 0 ? Math.round((stats.checkedIn / stats.expectedToday) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar: Operations Overview & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-text tracking-tight">
              Hostel Mess Operations
            </h1>
            <Badge variant={isLive ? 'success' : 'default'} className="text-[11px] font-bold">
              {isLive ? '● Live Service Active' : 'Off-Service Window'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Dining Administration Console • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/admin/meals')}
            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs gap-1.5"
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Live Meal Desk
          </Button>
        </div>
      </div>

      {/* KPI Row (Section 24) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Students Expected</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl md:text-3xl font-black text-text">{stats.expectedToday}</span>
            <span className="text-xs text-text-muted">RSVPs</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Today's total expected diners</p>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Checked In</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl md:text-3xl font-black text-success">{stats.checkedIn}</span>
            <span className="text-xs font-semibold text-text-muted">({attendanceRate}%)</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Scanned dining passes</p>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Meal Reports</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl md:text-3xl font-black text-primary">{stats.mealReportsToday}</span>
            <span className="text-xs text-text-muted">today</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Student dining submissions</p>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Verified Items</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl md:text-3xl font-black text-text">{verifiedCount}</span>
            <span className="text-xs text-text-muted">current meal</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Community peer confirmed</p>
        </Card>

        <Card className="p-4 bg-surface border-border col-span-2 md:col-span-1">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Open Complaints</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className={`text-2xl md:text-3xl font-black ${stats.openComplaints > 0 ? 'text-danger' : 'text-success'}`}>
              {stats.openComplaints}
            </span>
            <span className="text-xs text-text-muted">active</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Requires staff attention</p>
        </Card>
      </div>

      {/* CURRENT MEAL: Official menu vs Community Reported Menu (Section 24) */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-4 md:p-5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-surface-elevated">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text">
                  {slotDef.label} Operational Status
                </h2>
                <Badge variant={isLive ? 'success' : 'default'} className="text-[10px]">
                  {isLive ? 'LIVE NOW' : 'NEXT / UPCOMING'}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary">
                Scheduled Slot: {getSlotTimeLabel(slotDef)} • Verified items appear based on student consensus
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/admin/meals')}
            className="text-xs font-semibold gap-1"
          >
            Review Evidence <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Official Menu Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Official Planned Menu
              </span>
              <span className="text-[11px] text-text-muted">Published by Administration</span>
            </div>

            {officialMenu.length === 0 ? (
              <p className="text-xs text-text-muted py-4 italic">No official menu scheduled for this slot.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {officialMenu.map((dish, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated border border-border text-text"
                  >
                    {dish}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Community Reported Menu Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Community Reported Dishes
              </span>
              <span className="text-[11px] text-text-muted">
                {communityConsensus?.totalSubmissions || 0} student reports
              </span>
            </div>

            {(!communityConsensus?.verifiedItems || communityConsensus.verifiedItems.length === 0) ? (
              <p className="text-xs text-text-muted py-4 italic">
                No verified community reports logged yet for this meal.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {communityConsensus.verifiedItems.map((item, idx) => {
                  const dishName = typeof item === 'string' ? item : item.name;
                  const count = item.count || communityConsensus.itemCounts?.[dishName] || 0;
                  return (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-success/10 border border-success/30 text-success flex items-center gap-2"
                    >
                      <span>{dishName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-success/20">
                        {count} reports
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Grid: Attendance Summary & Open Complaints (Section 24) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Summary (6 cols) */}
        <Card className="lg:col-span-6 bg-surface border-border p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Meal Attendance Progress
              </h3>
              <p className="text-xs text-text-secondary">Expected attendance vs scanned check-ins</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/admin/attendance')}
              className="text-xs font-bold text-primary p-0 h-auto"
            >
              Full Roster →
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-text-secondary">Turnout Rate</span>
              <span className="text-text font-bold">{attendanceRate}% Recorded</span>
            </div>
            <div className="w-full bg-surface-elevated border border-border h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, attendanceRate)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-2.5 rounded-xl bg-surface-elevated border border-border">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Expected</span>
                <span className="text-lg font-black text-text">{stats.expectedToday}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-elevated border border-border">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Checked In</span>
                <span className="text-lg font-black text-success">{stats.checkedIn}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-elevated border border-border">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Pending</span>
                <span className="text-lg font-black text-text-secondary">
                  {Math.max(0, stats.expectedToday - stats.checkedIn)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Open Complaints (6 cols) */}
        <Card className="lg:col-span-6 bg-surface border-border p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <MessageSquareWarning className="h-4 w-4 text-warning" />
                Active Student Grievances
              </h3>
              <p className="text-xs text-text-secondary">Unresolved dining and hygiene feedback</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/admin/complaints')}
              className="text-xs font-bold text-primary p-0 h-auto"
            >
              Manage All →
            </Button>
          </div>

          {recentComplaints.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1 opacity-70" />
              All student complaints have been addressed and resolved.
            </div>
          ) : (
            <div className="space-y-2">
              {recentComplaints.map((c) => (
                <div
                  key={c.id || c._id}
                  onClick={() => navigate('/admin/complaints')}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-elevated hover:border-primary/40 cursor-pointer transition-all text-xs"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <span className="font-bold text-text block truncate">
                      {c.category || 'General'}: {c.description}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {c.mealType || 'Meal'} • {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                  </div>
                  <Badge variant={c.status === 'IN_PROGRESS' ? 'warning' : 'danger'} className="text-[10px]">
                    {c.status || 'OPEN'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Pinned / Important Admin Notice (Section 24) */}
      {importantNotice && (
        <Card className="p-4 bg-surface border-l-4 border-l-primary border-border flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Broadcasted Notice: {importantNotice.title}
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                {importantNotice.message}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/admin/notices')}
            className="text-xs shrink-0"
          >
            Manage Notices
          </Button>
        </Card>
      )}
    </div>
  );
}
