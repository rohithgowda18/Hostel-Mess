import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import {
  UtensilsCrossed,
  QrCode,
  Users,
  Building2,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Megaphone,
  X,
  FileText,
  CalendarDays,
  ShieldCheck,
  DoorOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

const SCHEDULES = [
  { type: 'BREAKFAST', name: 'Breakfast', time: '07:30 AM – 09:30 AM', startMins: 7 * 60 + 30, endMins: 9 * 60 + 30 },
  { type: 'LUNCH', name: 'Lunch', time: '12:30 PM – 02:30 PM', startMins: 12 * 60 + 30, endMins: 14 * 60 + 30 },
  { type: 'SNACKS', name: 'Evening Snacks', time: '04:30 PM – 05:30 PM', startMins: 16 * 60 + 30, endMins: 17 * 60 + 30 },
  { type: 'DINNER', name: 'Dinner', time: '07:30 PM – 09:30 PM', startMins: 19 * 60 + 30, endMins: 21 * 60 + 30 },
];

const computeMealState = () => {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();

  for (const s of SCHEDULES) {
    if (mins >= s.startMins && mins <= s.endMins) {
      const targetTime = new Date();
      targetTime.setHours(Math.floor(s.endMins / 60), s.endMins % 60, 0, 0);
      const totalDurationMins = s.endMins - s.startMins;
      const elapsedMins = mins - s.startMins;
      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMins / totalDurationMins) * 100)));

      return {
        active: true,
        title: 'CURRENT SERVICE',
        mealName: s.name,
        mealType: s.type,
        timeRange: s.time,
        timerLabel: 'Service ends in',
        targetTime,
        progressPercent,
        statusLabel: 'Service In Progress',
      };
    }
  }

  let nextSchedule = null;
  let targetTime = new Date();

  if (mins < SCHEDULES[0].startMins) {
    nextSchedule = SCHEDULES[0];
    targetTime.setHours(7, 30, 0, 0);
  } else if (mins < SCHEDULES[1].startMins) {
    nextSchedule = SCHEDULES[1];
    targetTime.setHours(12, 30, 0, 0);
  } else if (mins < SCHEDULES[2].startMins) {
    nextSchedule = SCHEDULES[2];
    targetTime.setHours(16, 30, 0, 0);
  } else if (mins < SCHEDULES[3].startMins) {
    nextSchedule = SCHEDULES[3];
    targetTime.setHours(19, 30, 0, 0);
  } else {
    nextSchedule = SCHEDULES[0];
    targetTime.setDate(targetTime.getDate() + 1);
    targetTime.setHours(7, 30, 0, 0);
  }

  return {
    active: false,
    title: 'NEXT UPCOMING MEAL',
    mealName: nextSchedule.name,
    mealType: nextSchedule.type,
    timeRange: nextSchedule.time,
    timerLabel: 'Starts in',
    targetTime,
    progressPercent: 0,
    statusLabel: 'Service Upcoming',
  };
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [mealsByType, setMealsByType] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [attendance, setAttendance] = useState({ expected: null });
  const [occupancy, setOccupancy] = useState({ percentage: 0, statusLabel: 'Live queue tracker' });
  const [mealStatus, setMealStatus] = useState(() => computeMealState());
  const [countdownText, setCountdownText] = useState({ h: '00', m: '00', s: '00' });
  const [showBanner, setShowBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [consensusData, setConsensusData] = useState(null);
  const [userProfile, setUserProfile] = useState(getUser() || {});

  const firstName = userProfile?.name
    ? userProfile.name.split(' ')[0]
    : userProfile?.email
    ? userProfile.email.split('@')[0]
    : 'Resident';

  const greetingTime = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const state = computeMealState();
      setMealStatus(state);

      const [mealMap, annList, attStatus, occStats, consensus, meData] = await Promise.all([
        messApi.getAllTodayMeals(MEAL_TYPES).catch(() => ({})),
        messApi.getAnnouncements().catch(() => []),
        messApi.getMyAttendanceStatus(state.mealType, today).catch(() => ({ expected: null })),
        messApi.getOccupancyStats().catch(() => null),
        messApi.getMealConsensus(state.mealType, today).catch(() => null),
        messApi.getMyProfile().catch(() => null)
      ]);

      setMealsByType(mealMap || {});
      setAnnouncements(annList || []);
      setAttendance(attStatus || { expected: null });
      setConsensusData(consensus);
      if (meData) setUserProfile(meData);

      if (occStats && typeof occStats.occupancyPercentage === 'number') {
        setOccupancy({
          percentage: occStats.occupancyPercentage,
          statusLabel:
            occStats.statusLabel ||
            (occStats.occupancyPercentage > 75 ? 'Crowded (Peak Queue)' : occStats.occupancyPercentage > 40 ? 'Moderate Queue' : 'Quiet / Fast Entry')
        });
      } else {
        setOccupancy({
          percentage: 0,
          statusLabel: 'No scanner activity'
        });
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      const state = computeMealState();
      setMealStatus(state);

      const now = new Date();
      const diff = Math.max(0, state.targetTime - now);
      setCountdownText({
        h: String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
        m: String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0'),
        s: String(Math.floor((diff / 1000) % 60)).padStart(2, '0'),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAttendance = async (expected) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await messApi.setExpectedAttendance(mealStatus.mealType, today, expected);
      setAttendance({ expected });
    } catch (e) {
      console.error('Failed to update attendance:', e);
    }
  };

  const latestAnnouncement = announcements.length > 0 ? announcements[0] : null;

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Header Greeting & Date */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {todayDateFormatted}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Semester Living Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {greetingTime}, {firstName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's everything happening across your hostel and mess dining hall today.
          </p>
        </div>

        {/* Quick Check-in CTA Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => navigate('/qr-checkin')}
            className="h-11 px-5 shadow-sm font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
          >
            <QrCode className="h-4 w-4 mr-1.5" />
            Counter QR Check-in
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/report-meal?slot=' + mealStatus.mealType)}
            className="h-11 px-4 text-xs sm:text-sm font-semibold"
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" />
            Report Meal (+20 Pts)
          </Button>
        </div>
      </div>

      {/* 2. Important Announcement Alert Banner */}
      {showBanner && latestAnnouncement && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:border-blue-900/60 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="primary" className="text-[10px] uppercase font-bold py-0">Notice</Badge>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {latestAnnouncement.title || 'Hostel Announcement'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                {latestAnnouncement.message || latestAnnouncement.content}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            aria-label="Dismiss banner"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3. Real-time Status KPI Metric Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          title="Current Dining Service"
          value={mealStatus.mealName}
          subtitle={`${mealStatus.timerLabel} ${countdownText.h}:${countdownText.m}:${countdownText.s}`}
          badgeText={mealStatus.active ? 'Serving' : 'Upcoming'}
          accentColor="blue"
        />
        <StatCard
          icon={TrendingUp}
          title="Mess Hall Traffic"
          value={`${occupancy.percentage}%`}
          subtitle={occupancy.statusLabel}
          accentColor={occupancy.percentage > 75 ? 'rose' : occupancy.percentage > 40 ? 'amber' : 'emerald'}
        />
        <StatCard
          icon={CheckCircle2}
          title="My Attendance Intent"
          value={attendance.expected === true ? 'Will Eat' : attendance.expected === false ? 'Skipping' : 'Not Declared'}
          subtitle={attendance.expected !== null ? 'Registered with kitchen' : 'Tap to register attendance'}
          badgeText="Meal RSVP"
          accentColor={attendance.expected === true ? 'emerald' : attendance.expected === false ? 'rose' : 'indigo'}
        />
        <StatCard
          icon={DoorOpen}
          title="Housing Allocation"
          value={userProfile?.roomNumber ? `Room ${userProfile.roomNumber}` : 'Unassigned'}
          subtitle={userProfile?.hostel || 'Hostel Resident'}
          accentColor="purple"
        />
      </div>

      {/* 4. Main Command Center Grid (7 Cols Spotlight / 5 Cols Community & Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 Cols): Today's Active Meal Menu & Consensus Spotlight */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 relative overflow-hidden flex flex-col justify-between shadow-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={mealStatus.active ? 'success' : 'primary'}>
                      <span className={`h-2 w-2 rounded-full ${mealStatus.active ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                      {mealStatus.title}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">{mealStatus.timeRange}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
                    {mealStatus.mealName} Live Consensus
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate('/qr-checkin')}
                    className="text-xs font-bold bg-blue-600 hover:bg-blue-700 gap-1.5"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Open Pass
                  </Button>
                </div>
              </div>

              {/* Attendance RSVP Quick Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Are you dining at {mealStatus.mealName}?
                  </span>
                  <span className="text-[11px] text-slate-500">Helps kitchen forecaster avoid food waste</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAttendance(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      attendance.expected === true
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Will Eat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAttendance(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      attendance.expected === false
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Skip Meal
                  </button>
                </div>
              </div>

              {/* Items Breakdown list */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Peer Verified Dish Items</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {consensusData?.items?.length || 0} Dishes Confirmed
                  </span>
                </div>

                {consensusData?.items && consensusData.items.length > 0 ? (
                  consensusData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 p-3 space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.confidence}% Verified
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 space-y-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800">
                    <UtensilsCrossed className="h-7 w-7 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No peer verified items logged yet for this meal slot.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/report-meal?slot=' + mealStatus.mealType)}
                      className="text-xs font-bold text-blue-600"
                    >
                      Submit First Report (+20 Pts)
                    </Button>
                  </div>
                )}
              </div>

              {/* Official menu note */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Expected: </span>
                  {consensusData?.expectedItems?.join(', ') || mealsByType[mealStatus.mealType]?.items?.join(', ') || 'Published menu items unavailable'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/meals')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0"
                >
                  Full Menu <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 Cols): Buddy Groups & Quick Navigation Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Buddy Groups Live Widget */}
          <Card className="p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Buddy Dining Groups
                </h4>
              </div>
              <Badge variant="primary" className="text-[10px]">Social</Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Coordinate dining times with hostel friends and check who is heading down to the mess together right now.
            </p>

            <div className="pt-1 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/groups')}
                className="flex-1 font-semibold text-xs"
              >
                Open Buddy Groups <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/feedback')}
                className="font-semibold text-xs"
              >
                Rate Quality
              </Button>
            </div>
          </Card>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            <Card
              onClick={() => navigate('/meals')}
              className="p-4 shadow-card hover:border-blue-400 cursor-pointer transition-all space-y-1.5"
            >
              <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Dining Hub</h5>
              <p className="text-[11px] text-slate-400">Weekly plan & food gallery</p>
            </Card>

            <Card
              onClick={() => navigate('/directory')}
              className="p-4 shadow-card hover:border-blue-400 cursor-pointer transition-all space-y-1.5"
            >
              <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Hostel Rooms</h5>
              <p className="text-[11px] text-slate-400">Resident directory & beds</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
