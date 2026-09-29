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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
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
            className="font-bold text-xs gap-1.5"
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Live Meal Desk
          </Button>
        </div>
      </div>

      {/* Compact Operational Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-border text-xs">
        <div>
          <span className="text-[11px] text-slate-500 block">Expected diners</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.expectedToday}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 block">Checked in</span>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {stats.checkedIn} <span className="text-xs font-normal text-slate-500">({attendanceRate}%)</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 block">Meal reports</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.mealReportsToday}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 block">Verified items</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{verifiedCount}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 block">Open complaints</span>
          <span className={`text-lg font-bold ${stats.openComplaints > 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
            {stats.openComplaints}
          </span>
        </div>
      </div>

      {/* Current Meal Operational Status */}
      <div className="space-y-4 pt-2">
        <div className="flex items-baseline justify-between border-b border-border pb-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {slotDef.label} status
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {getSlotTimeLabel(slotDef)} · {isLive ? 'Serving now' : 'Scheduled'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/meals')}
            className="text-xs text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
          >
            Review live evidence →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Official planned menu */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 pb-1 border-b border-border">
              Official planned menu
            </h3>
            {officialMenu.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 italic">No official menu scheduled for this slot.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {officialMenu.map((dish, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
                  >
                    {dish}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Community reported dishes */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 pb-1 border-b border-border">
              Community reported dishes ({communityConsensus?.totalSubmissions || 0} reports)
            </h3>
            {(!communityConsensus?.verifiedItems || communityConsensus.verifiedItems.length === 0) ? (
              <p className="text-xs text-slate-400 py-2 italic">No verified community reports yet for this meal.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {communityConsensus.verifiedItems.map((item, idx) => {
                  const dishName = typeof item === 'string' ? item : item.name;
                  const count = item.count || communityConsensus.itemCounts?.[dishName] || 0;
                  return (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>{dishName}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                        ({count})
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Grid: Attendance Progress & Active Complaints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Attendance Summary */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Meal attendance progress
            </h3>
            <button
              type="button"
              onClick={() => navigate('/admin/attendance')}
              className="text-xs text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Full roster →
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Turnout rate</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{attendanceRate}% ({stats.checkedIn} / {stats.expectedToday})</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-700 dark:bg-teal-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, attendanceRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Grievances */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Active student grievances
            </h3>
            <button
              type="button"
              onClick={() => navigate('/admin/complaints')}
              className="text-xs text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Manage all →
            </button>
          </div>

          {recentComplaints.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              All student complaints have been addressed and resolved.
            </p>
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {recentComplaints.map((c) => (
                <div
                  key={c.id || c._id}
                  onClick={() => navigate('/admin/complaints')}
                  className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-1 -mx-1"
                >
                  <div className="space-y-0.5 truncate max-w-[75%]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {c.category || 'General'}: {c.description}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {c.mealType || 'Meal'} · {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold ${c.status === 'IN_PROGRESS' ? 'text-amber-700' : 'text-red-600'}`}>
                    {c.status || 'OPEN'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Notice Footer if present */}
      {importantNotice && (
        <>
          <hr className="border-border" />
          <div className="flex items-start justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Notice: {importantNotice.title}
              </span>
              <p className="text-slate-500 leading-relaxed">
                {importantNotice.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/notices')}
              className="text-xs text-teal-700 dark:text-teal-400 hover:underline shrink-0 cursor-pointer"
            >
              Manage notices →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
