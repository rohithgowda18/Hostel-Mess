import { useEffect, useState, useRef } from 'react';
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
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getUser() || {});
  const [slotInfo, setSlotInfo] = useState(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [remainingSecs, setRemainingSecs] = useState(0);
  const [consensus, setConsensus] = useState(null);
  const [attendance, setAttendance] = useState({ expected: null });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const timerRef = useRef(null);

  // 1. Fetch server slot info & synchronize clock
  const fetchSlotInfo = async () => {
    try {
      const data = await messApi.getActiveSlotInfo();
      if (data) {
        setSlotInfo(data);
        const offset = (data.serverTimeMillis || Date.now()) - Date.now();
        setServerOffset(offset);
        if (data.isActive && data.endTimeMillis) {
          const currentServerTime = Date.now() + offset;
          const diff = Math.max(0, Math.floor((data.endTimeMillis - currentServerTime) / 1000));
          setRemainingSecs(diff);
        } else {
          setRemainingSecs(0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch slot info:', err);
    }
  };

  useEffect(() => {
    fetchSlotInfo();
    const interval = setInterval(fetchSlotInfo, 30000); // sync with backend every 30s
    return () => clearInterval(interval);
  }, []);

  // 2. Real-time 1-second countdown calculation
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (slotInfo?.isActive && slotInfo.endTimeMillis) {
      timerRef.current = setInterval(() => {
        const currentServerTime = Date.now() + serverOffset;
        const diff = Math.floor((slotInfo.endTimeMillis - currentServerTime) / 1000);

        if (diff <= 0) {
          setRemainingSecs(0);
          clearInterval(timerRef.current);
          fetchSlotInfo(); // Transition immediately at 00:00:00
        } else {
          setRemainingSecs(diff);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slotInfo?.isActive, slotInfo?.endTimeMillis, serverOffset]);

  // 3. Load meal consensus and resident data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const targetSlot = slotInfo?.activeSlot || slotInfo?.nextSlot?.key || 'LUNCH';
        const [consensusData, attendanceData, notices, me] = await Promise.all([
          messApi.getMealConsensus(targetSlot, todayStr).catch(() => null),
          messApi.getMyAttendanceStatus(targetSlot, todayStr).catch(() => ({ expected: null })),
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
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [slotInfo?.activeSlot, slotInfo?.nextSlot?.key, todayStr]);

  const handleAttendanceChange = async (expected) => {
    const slotKey = slotInfo?.activeSlot || slotInfo?.nextSlot?.key;
    if (!slotKey) return;

    setSubmittingAttendance(true);
    try {
      await messApi.setExpectedAttendance(slotKey, todayStr, expected);
      setAttendance({ expected });
    } catch (err) {
      console.error('Failed to update attendance:', err);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Format countdown hh:mm:ss
  const formatCountdown = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Resident';
  const latestNotice = announcements.length > 0 ? announcements[0] : null;

  // Food items string calculation
  const reportedItemNames = consensus?.items?.map((i) => i.name) || [];
  const officialItemNames = consensus?.expectedItems || [];
  const displayItems = reportedItemNames.length > 0 ? reportedItemNames : officialItemNames;
  const foodSummaryText = displayItems.length > 0 ? displayItems.join(' · ') : 'Menu details being prepared';

  // Confidence calculation
  const totalReporters = consensus?.totalReporters || 0;
  const confidenceLevel = totalReporters >= 5 ? 'High' : totalReporters >= 2 ? 'Moderate' : totalReporters === 1 ? 'Developing' : 'Awaiting Reports';

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* 1. Header: Greeting & Campus Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
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

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/student/attendance')}
            className="text-xs font-semibold gap-1.5 h-8.5"
          >
            <QrCode className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            Dining Pass
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/student/meals')}
            className="text-xs font-semibold gap-1.5 h-8.5"
          >
            <Calendar className="h-3.5 w-3.5" />
            Weekly Menu
          </Button>
        </div>
      </div>

      {/* 2. Hero Section: Answers "What is being served right now?" */}
      {slotInfo?.isActive ? (
        /* ACTIVE MEAL HERO */
        <Card className="p-5 sm:p-6 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Currently Serving
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {slotInfo.slotName || slotInfo.activeSlot}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Serving window: {slotInfo.time}
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Serving Ends In
              </span>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                <span>{formatCountdown(remainingSecs)}</span>
              </div>
            </div>
          </div>

          {/* Food items & Community Confidence */}
          <div className="py-4 space-y-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu On Plate
              </span>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-1 leading-relaxed">
                {foodSummaryText}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <div className="text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Reports:</span> {totalReporters}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Community Confidence:</span>{' '}
                <span className={confidenceLevel === 'High' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}>
                  {confidenceLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              onClick={() => navigate('/student/report-meal')}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-10 px-5 gap-1.5 shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              Report Meal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/meals')}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 justify-start sm:justify-end"
            >
              View detailed peer breakdown <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      ) : (
        /* NO MEAL SERVING STATE */
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <UtensilsCrossed className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Kitchen Status
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              No Meal Currently Serving
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hostel meal reporting and kitchen service are closed during non-meal intervals.
            </p>
          </div>

          {/* Secondary Next Scheduled Meal Info */}
          {slotInfo?.nextSlot && (
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Next Scheduled Meal
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {slotInfo.nextSlot.name}
                </span>
                <span className="text-xs text-slate-500 font-mono ml-2">
                  ({slotInfo.nextSlot.time})
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/student/meals')}
                className="text-xs font-semibold h-8 w-fit"
              >
                View Expected Menu
              </Button>
            </div>
          )}

          <div className="text-[11px] text-slate-400">
            Standard hours: Breakfast (07:30–09:30) • Lunch (12:30–14:30) • Snacks (16:30–17:30) • Dinner (19:30–21:30)
          </div>
        </Card>
      )}

      {/* 3. Secondary Practical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance Intent RSVP */}
        <Card className="p-4 space-y-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Attendance Intent
              </h3>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-500">
              {slotInfo?.activeSlot ? slotInfo.slotName : slotInfo?.nextSlot?.name || 'Next Meal'}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Will you be dining in the hostel mess for this meal?
          </p>

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant={attendance.expected === true ? 'verified' : 'outline'}
              disabled={submittingAttendance}
              onClick={() => handleAttendanceChange(true)}
              className="text-xs font-bold gap-1 flex-1 h-8.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Will Eat
            </Button>
            <Button
              size="sm"
              variant={attendance.expected === false ? 'danger' : 'outline'}
              disabled={submittingAttendance}
              onClick={() => handleAttendanceChange(false)}
              className="text-xs font-semibold gap-1 flex-1 h-8.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              Skip Meal
            </Button>
          </div>
        </Card>

        {/* Notices or Ratings Prompt */}
        {latestNotice ? (
          <Card className="p-4 space-y-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Hostel Notice
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
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline text-left flex items-center gap-1 pt-1"
            >
              View notice board <ArrowRight className="h-3 w-3" />
            </button>
          </Card>
        ) : (
          <Card className="p-4 space-y-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Rate Food Quality
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help the hostel mess committee monitor hygiene and meal quality standards.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/student/feedback')}
              className="text-xs font-semibold w-fit h-8"
            >
              Submit Meal Rating
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
