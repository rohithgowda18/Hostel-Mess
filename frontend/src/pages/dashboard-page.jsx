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

      {/* 3. Main Dashboard Grid (Hero Service + Live Consensus + Occupancy/Attendance) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Active / Upcoming Meal Card */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="p-6 relative overflow-hidden flex flex-col justify-between shadow-card">
            {/* Live Indicator Background Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant={mealStatus.active ? 'success' : 'primary'}>
                  <span className={`h-2 w-2 rounded-full ${mealStatus.active ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                  {mealStatus.title}
                </Badge>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {mealStatus.timeRange}
                </span>
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
                {mealStatus.mealName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {mealStatus.statusLabel}
              </p>
            </div>

            {/* Countdown Clock Display */}
            <div className="my-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 p-4 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {mealStatus.timerLabel}
              </span>
              <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5">
                <span>{countdownText.h}</span>
                <span className="text-slate-300 dark:text-slate-700 text-2xl">:</span>
                <span>{countdownText.m}</span>
                <span className="text-slate-300 dark:text-slate-700 text-2xl">:</span>
                <span>{countdownText.s}</span>
              </div>
            </div>

            {/* Attendance Declaration Toggle */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Attending {mealStatus.mealName}?
                </span>
                <span className="text-[11px] text-slate-400">Reduces food waste</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAttendance(true)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    attendance.expected === true
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Will Eat
                </button>
                <button
                  type="button"
                  onClick={() => handleAttendance(false)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    attendance.expected === false
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  Skip Meal
                </button>
              </div>
            </div>
          </Card>

          {/* Quick Hostel Room Summary Card */}
          <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                  <DoorOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    My Room Allocation
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {userProfile?.hostel || 'Hostel Unassigned'} · {userProfile?.roomNumber ? `Room ${userProfile.roomNumber}` : 'Room Not Assigned'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/directory')}
                className="text-xs font-semibold"
              >
                Directory
              </Button>
            </div>
          </Card>
        </div>

        {/* Center Column (4 Cols): Live Community Verified Menu Breakdown */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 flex-1 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-[10px] font-bold">
                      VERIFIED CONSENSUS
                    </Badge>
                    {consensusData?.menuChanged && (
                      <Badge variant="danger" className="text-[10px] font-bold animate-pulse">
                        Menu Changed!
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    Today's {mealStatus.mealName} Menu
                  </h3>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/report-meal?slot=' + mealStatus.mealType)}
                  className="text-blue-600 hover:text-blue-700 text-xs font-bold"
                >
                  Report
                </Button>
              </div>

              {/* Items Breakdown list */}
              <div className="py-4 space-y-2.5 max-h-[300px] overflow-y-auto">
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
                  <div className="text-center py-10 space-y-2">
                    <UtensilsCrossed className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No peer reports submitted yet for this meal.
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
            </div>

            {/* Official menu note */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Expected: </span>
              {consensusData?.expectedItems?.join(', ') || mealsByType[mealStatus.mealType]?.items?.join(', ') || 'Published menu items unavailable'}
            </div>
          </Card>
        </div>

        {/* Right Column (3 Cols): Mess Hall Occupancy & Buddy Group Quick Action */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Real-time Occupancy Card */}
          <Card className="p-5 shadow-card">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Live Hall Occupancy
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                {occupancy.percentage}%
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {occupancy.statusLabel}
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancy.percentage > 75
                    ? 'bg-rose-500'
                    : occupancy.percentage > 45
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancy.percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Based on active counter scanner entries over the last 30 minutes.
            </p>
          </Card>

          {/* Buddy Groups Card */}
          <Card className="p-5 shadow-card flex flex-col justify-between flex-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Buddy Groups
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Coordinate meals with hostel mates and know who is heading down to the mess together.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/groups')}
              className="w-full mt-4 font-semibold text-xs"
            >
              Open Buddy Groups <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Card>
        </div>
      </div>

      {/* 4. Today's Full Schedule Preview Timeline */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Today's Complete Dining Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Four scheduled services prepared daily by the central campus kitchen.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/meals')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Weekly Menu <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SCHEDULES.map((slot) => {
            const isCurrent = mealStatus.mealType === slot.type;
            const items = mealsByType[slot.type]?.items || [];

            return (
              <Card
                key={slot.type}
                className={`p-4 transition-all duration-200 ${
                  isCurrent
                    ? 'ring-2 ring-blue-600/70 dark:ring-blue-500/70 shadow-card bg-blue-50/20 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {slot.name}
                  </span>
                  {isCurrent && (
                    <Badge variant="primary" className="text-[9px] px-1.5 py-0">Active</Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono mb-2">{slot.time}</p>
                <div className="text-xs text-slate-600 dark:text-slate-300 min-h-[38px] line-clamp-2">
                  {items.length > 0 ? items.join(', ') : 'Standard schedule menu'}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
