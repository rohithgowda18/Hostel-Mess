import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import {
  UtensilsCrossed,
  QrCode,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Bell,
  Star,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const MEAL_SLOTS = [
  { key: 'BREAKFAST', name: 'Breakfast', time: '07:30 – 09:30', startMins: 7 * 60 + 30, endMins: 9 * 60 + 30 },
  { key: 'LUNCH', name: 'Lunch', time: '12:30 – 14:30', startMins: 12 * 60 + 30, endMins: 14 * 60 + 30 },
  { key: 'SNACKS', name: 'Snacks', time: '16:30 – 17:30', startMins: 16 * 60 + 30, endMins: 17 * 60 + 30 },
  { key: 'DINNER', name: 'Dinner', time: '19:30 – 21:30', startMins: 19 * 60 + 30, endMins: 21 * 60 + 30 }
];

function getActiveMealSlot() {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  for (const slot of MEAL_SLOTS) {
    if (currentMins >= slot.startMins && currentMins <= slot.endMins) {
      return slot;
    }
  }
  return null;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getUser() || {});
  const [activeSlot, setActiveSlot] = useState(() => getActiveMealSlot());
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [consensus, setConsensus] = useState(null);
  const [attendance, setAttendance] = useState({ expected: null });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Refresh active slot and countdown timer
  useEffect(() => {
    const updateTime = () => {
      const current = getActiveMealSlot();
      setActiveSlot(current);

      if (current) {
        const now = new Date();
        const endHour = Math.floor(current.endMins / 60);
        const endMin = current.endMins % 60;
        const endTime = new Date();
        endTime.setHours(endHour, endMin, 0, 0);

        const diffMs = Math.max(0, endTime - now);
        const totalSecs = Math.floor(diffMs / 1000);
        setCountdown({
          hours: Math.floor(totalSecs / 3600),
          minutes: Math.floor((totalSecs % 3600) / 60),
          seconds: totalSecs % 60
        });
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real data for current meal, attendance, and announcements
  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const slotKey = activeSlot ? activeSlot.key : 'LUNCH';
        const [consensusData, attendanceData, notices, me] = await Promise.all([
          messApi.getMealConsensus(slotKey, todayStr).catch(() => null),
          messApi.getMyAttendanceStatus(slotKey, todayStr).catch(() => ({ expected: null })),
          messApi.getAnnouncements().catch(() => []),
          messApi.getMyProfile().catch(() => null)
        ]);

        if (isMounted) {
          if (consensusData) setConsensus(consensusData);
          if (attendanceData) setAttendance(attendanceData);
          if (Array.isArray(notices)) setAnnouncements(notices);
          if (me) setCurrentUser(me);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => { isMounted = false; };
  }, [activeSlot?.key, todayStr]);

  const handleAttendanceChange = async (expected) => {
    if (!activeSlot) return;
    setSubmittingAttendance(true);
    try {
      await messApi.setExpectedAttendance(activeSlot.key, todayStr, expected);
      setAttendance((prev) => ({ ...prev, expected }));
    } catch (err) {
      console.error('Failed to update attendance intent:', err);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Student';
  const latestNotice = announcements.length > 0 ? announcements[0] : null;

  return (
    <div className="space-y-6">
      {/* 1. Header: Greeting & Profile Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {displayName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            {currentUser?.hostel ? ` • ${currentUser.hostel}` : ''}
            {currentUser?.roomNumber ? ` (Room ${currentUser.roomNumber})` : ''}
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate(activeSlot ? `/student/report-meal?slot=${activeSlot.key}` : '/student/report-meal')}
            className="text-xs font-bold gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            Report Meal
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/student/attendance')}
            className="text-xs font-semibold gap-1.5"
          >
            <QrCode className="h-4 w-4" />
            Dining Pass
          </Button>
        </div>
      </div>

      {/* 2. Main Current Meal Area (Hero) */}
      {activeSlot ? (
        <Card className="p-5 md:p-6 shadow-sm border-slate-200 dark:border-slate-800">
          {/* Active Meal Header & Countdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {activeSlot.name}
                  </h2>
                  <Badge variant="verified" className="text-[10px] font-bold">
                    LIVE NOW
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {activeSlot.time}
                </p>
              </div>
            </div>

            {/* Live Countdown Timer */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 w-fit">
              <Clock className="h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" />
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                <span>{String(countdown.hours).padStart(2, '0')}:</span>
                <span>{String(countdown.minutes).padStart(2, '0')}:</span>
                <span>{String(countdown.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal ml-1.5">remaining</span>
              </div>
            </div>
          </div>

          {/* Menus Grid: Official vs Community Reported */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
            {/* Official Menu */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Official Menu
                  </h3>
                  <p className="text-[11px] text-slate-400">Published by mess administration</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Scheduled
                </Badge>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 min-h-[140px]">
                {consensus?.expectedItems && consensus.expectedItems.length > 0 ? (
                  <ul className="space-y-1.5 text-xs">
                    {consensus.expectedItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Official menu schedule unavailable.
                  </p>
                )}
              </div>
            </div>

            {/* Community Reported Menu */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                    Community Reports
                  </h3>
                  <p className="text-[11px] text-slate-400">Reported and verified by students</p>
                </div>
                {consensus?.totalReporters > 0 && (
                  <Badge variant="verified" className="text-[10px]">
                    {consensus.totalReporters} {consensus.totalReporters === 1 ? 'Report' : 'Reports'}
                  </Badge>
                )}
              </div>

              <div className="rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-950/20 p-3.5 min-h-[140px] space-y-2">
                {consensus?.items && consensus.items.length > 0 ? (
                  <div className="space-y-2">
                    {consensus.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
                      >
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {item.votes} {item.votes === 1 ? 'report' : 'reports'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.verified
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          }`}>
                            {item.status || (item.verified ? 'Verified' : 'Pending')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No student reports yet for this meal.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/student/report-meal?slot=${activeSlot.key}`)}
                      className="text-xs font-bold text-teal-700 dark:text-teal-400"
                    >
                      Report What You See
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Footer Links */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-5 text-xs">
            <span className="text-slate-500">
              See photos and weekly menu in the Meals tab.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/meals')}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 w-fit p-0 h-auto"
            >
              Open Meals Page <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      ) : (
        /* Empty Hero State when no meal is active */
        <Card className="p-8 text-center space-y-3 border-dashed border-slate-300 dark:border-slate-700">
          <UtensilsCrossed className="h-8 w-8 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No meal is currently being served.
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Breakfast (07:30–09:30) • Lunch (12:30–14:30) • Snacks (16:30–17:30) • Dinner (19:30–21:30)
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/meals')}
              className="text-xs font-semibold"
            >
              View Weekly Catering Schedule
            </Button>
          </div>
        </Card>
      )}

      {/* 3. Secondary Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance Intent RSVP */}
        <Card className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Attendance Intent
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {activeSlot ? activeSlot.name : 'Next Meal'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Are you planning to dine in the mess for this meal?
          </p>

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant={attendance.expected === true ? 'verified' : 'outline'}
              disabled={submittingAttendance}
              onClick={() => handleAttendanceChange(true)}
              className="text-xs font-bold gap-1 flex-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Will Eat
            </Button>
            <Button
              size="sm"
              variant={attendance.expected === false ? 'danger' : 'outline'}
              disabled={submittingAttendance}
              onClick={() => handleAttendanceChange(false)}
              className="text-xs font-semibold gap-1 flex-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              Skip Meal
            </Button>
          </div>
        </Card>

        {/* Notice or Rating Prompt */}
        {latestNotice ? (
          <Card className="p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Mess Notice
                  </span>
                </div>
                <Badge variant={latestNotice.priority === 'HIGH' || latestNotice.priority === 'IMPORTANT' ? 'pending' : 'secondary'} className="text-[10px]">
                  {latestNotice.priority || 'Notice'}
                </Badge>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {latestNotice.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {latestNotice.message}
              </p>
            </div>
            <button
              onClick={() => navigate('/student/notices')}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline text-left mt-2 flex items-center gap-1"
            >
              View notice board <ArrowRight className="h-3 w-3" />
            </button>
          </Card>
        ) : (
          <Card className="p-4 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Rate Food Quality
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help improve dining standards by sharing honest feedback for meals you have eaten.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/student/feedback')}
              className="text-xs font-semibold w-fit"
            >
              Submit Meal Rating
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
