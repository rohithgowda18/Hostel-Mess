import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

const SCHEDULES = [
  { type: 'BREAKFAST', name: 'Breakfast', icon: 'wb_twilight', startMins: 7 * 60 + 30, endMins: 9 * 60 + 30 },
  { type: 'LUNCH', name: 'Lunch', icon: 'light_mode', startMins: 12 * 60 + 30, endMins: 14 * 60 + 30 },
  { type: 'SNACKS', name: 'Evening Snacks', icon: 'coffee', startMins: 16 * 60 + 30, endMins: 17 * 60 + 30 },
  { type: 'DINNER', name: 'Dinner', icon: 'nightlight', startMins: 19 * 60 + 30, endMins: 21 * 60 + 30 },
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
        title: 'CURRENT MEAL',
        mealName: s.name,
        mealType: s.type,
        icon: s.icon,
        timerLabel: 'Ends in',
        targetTime,
        progressPercent,
        statusLabel: 'Service Active',
        badgeColor: 'bg-[#e8f5ea] dark:bg-[#22C55E]/20 text-[#006e25] dark:text-[#22C55E] border border-[#006e25]/30 dark:border-[#22C55E]/40',
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
    title: 'NEXT MEAL',
    mealName: nextSchedule.name,
    mealType: nextSchedule.type,
    icon: nextSchedule.icon,
    timerLabel: 'Starts in',
    targetTime,
    progressPercent: 0,
    statusLabel: 'Service Upcoming',
    badgeColor: 'bg-[#e1eefc] dark:bg-[#3B82F6]/20 text-[#003f87] dark:text-[#3B82F6] border border-[#003f87]/30 dark:border-[#3B82F6]/40',
  };
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [mealsByType, setMealsByType] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [attendance, setAttendance] = useState({ expected: null });
  const [occupancy, setOccupancy] = useState({ percentage: 58, statusLabel: 'Moderate Queue' });
  const [mealStatus, setMealStatus] = useState(() => computeMealState());
  const [countdownText, setCountdownText] = useState({ h: '00', m: '00', s: '00' });
  const [showBanner, setShowBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [consensusData, setConsensusData] = useState(null);
  const currentUser = getUser() || {};

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const state = computeMealState();
      setMealStatus(state);

      const [mealMap, annList, attStatus, occStats, consensus] = await Promise.all([
        messApi.getAllTodayMeals(MEAL_TYPES).catch(() => ({})),
        messApi.getAnnouncements().catch(() => []),
        messApi.getMyAttendanceStatus(state.mealType, today).catch(() => ({ expected: null })),
        messApi.getOccupancyStats().catch(() => null),
        messApi.getMealConsensus(state.mealType, today).catch(() => null)
      ]);
      setMealsByType(mealMap || {});
      setAnnouncements(annList || []);
      setAttendance(attStatus || { expected: null });
      setConsensusData(consensus);

      if (occStats && typeof occStats.occupancyPercentage === 'number' && occStats.occupancyPercentage > 0) {
        setOccupancy({
          percentage: occStats.occupancyPercentage,
          statusLabel: occStats.statusLabel || (occStats.occupancyPercentage > 80 ? 'Crowded (Peak Queue)' : occStats.occupancyPercentage > 40 ? 'Moderate Queue' : 'Quiet / No Queue')
        });
      } else {
        const mins = new Date().getHours() * 60 + new Date().getMinutes();
        const occPercent = state.active ? (mins % 30 > 15 ? 72 : 54) : 28;
        const statusLabel = occPercent > 70 ? 'Crowded (Peak Queue)' : occPercent > 40 ? 'Moderate Queue' : 'Quiet / Normal';
        setOccupancy({ percentage: occPercent, statusLabel });
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
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8f9fa] dark:bg-[#0F172A] text-[#191c1d] dark:text-[#F8FAFC] pb-24 md:pb-8 font-[Inter,sans-serif] transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto space-y-6">
        
        {/* Announcement Banner */}
        {showBanner && latestAnnouncement && (
          <div className="relative overflow-hidden rounded-xl bg-[#003f87] dark:bg-[#1E293B] border border-transparent dark:border-[#334155] p-4 text-white shadow-sm flex items-center justify-between">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-[#3B82F6]/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#3B82F6] dark:text-[#3B82F6]">celebration</span>
              </div>
              <div>
                <h2 className="text-[20px] font-semibold leading-6 text-white">{latestAnnouncement.title || 'Announcement'}</h2>
                <p className="text-xs text-white/90 dark:text-[#CBD5E1]">{latestAnnouncement.message || latestAnnouncement.content}</p>
              </div>
            </div>
            <button onClick={() => setShowBanner(false)} className="relative z-10 p-2 hover:bg-white/20 dark:hover:bg-[#334155] rounded-full transition">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Active/Next Meal Card & Buttons */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#c2c6d4] dark:border-[#334155] p-6 relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <span className={`inline-block px-3 py-1 text-[11px] font-bold rounded-full mb-2 uppercase tracking-wider ${mealStatus.badgeColor}`}>
                    {mealStatus.title}
                  </span>
                  <h3 className="text-3xl font-bold text-[#003f87] dark:text-[#3B82F6] leading-9">{mealStatus.mealName}</h3>
                  <p className="text-xs text-[#424752] dark:text-[#94A3B8] flex items-center gap-1.5 mt-1 font-medium">
                    <span className={`w-2 h-2 rounded-full ${mealStatus.active ? 'bg-[#006e25] dark:bg-[#22C55E] animate-ping' : 'bg-[#003f87] dark:bg-[#3B82F6]'}`} />
                    {mealStatus.statusLabel}
                  </p>
                </div>
                <div className="w-14 h-14 bg-[#f3f4f5] dark:bg-[#0F172A] text-[#003f87] dark:text-[#3B82F6] rounded-xl flex items-center justify-center border border-[#c2c6d4] dark:border-[#334155]">
                  <span className="material-symbols-outlined text-3xl">{mealStatus.icon}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {mealStatus.active && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-[#424752] dark:text-[#CBD5E1] mb-1">
                    <span>Service Window</span>
                    <span className="text-[#006e25] dark:text-[#22C55E] font-bold">{mealStatus.progressPercent}% Complete</span>
                  </div>
                  <div className="h-2 w-full bg-[#f3f4f5] dark:bg-[#0F172A] rounded-full overflow-hidden border border-[#c2c6d4] dark:border-[#334155]">
                    <div className="h-full bg-[#006e25] dark:bg-[#22C55E] rounded-full transition-all duration-500" style={{ width: `${mealStatus.progressPercent}%` }} />
                  </div>
                </div>
              )}

              {/* Timer */}
              <div className="bg-[#f3f4f5] dark:bg-[#0F172A] border border-[#c2c6d4] dark:border-[#334155] rounded-xl p-4 mt-2">
                <p className="text-center text-[10px] text-[#424752] dark:text-[#94A3B8] uppercase tracking-widest font-bold mb-1">
                  {mealStatus.timerLabel}
                </p>
                <div className="flex justify-center items-center gap-2 text-[#003f87] dark:text-[#3B82F6] font-bold text-4xl font-mono">
                  <span>{countdownText.h}</span>
                  <span className="text-2xl opacity-40">:</span>
                  <span>{countdownText.m}</span>
                  <span className="text-2xl opacity-40">:</span>
                  <span>{countdownText.s}</span>
                </div>
              </div>

              {/* Primary Meal Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={() => navigate('/qr-checkin')}
                  className="flex-1 min-h-[52px] px-4 bg-[#006e25] dark:bg-[#22C55E] text-white dark:text-slate-950 text-sm font-extrabold rounded-xl hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2 shadow-md"
                >
                  <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
                  Check In Now
                </button>
                <button
                  onClick={() => navigate('/report-meal?slot=' + mealStatus.mealType)}
                  className="flex-1 min-h-[52px] px-4 bg-[#003f87] dark:bg-[#3B82F6] text-white text-sm font-extrabold rounded-xl hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2 shadow-md"
                >
                  <span className="material-symbols-outlined text-xl">rate_review</span>
                  Report Served Meal
                </button>
              </div>
            </div>

            {/* Attendance Card */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#c2c6d4] dark:border-[#334155] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[#191c1d] dark:text-[#F8FAFC] mb-1">Attending {mealStatus.mealName}?</h3>
              <p className="text-xs text-[#424752] dark:text-[#94A3B8] mb-4">Declare early to reduce mess food waste.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAttendance(true)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    attendance.expected === true
                      ? 'bg-[#006e25] dark:bg-[#22C55E] text-white dark:text-slate-950 font-bold'
                      : 'bg-[#f3f4f5] dark:bg-[#0F172A] text-[#191c1d] dark:text-[#CBD5E1] hover:bg-[#e1e3e4] dark:hover:bg-[#334155] border border-[#c2c6d4] dark:border-[#334155]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Will Eat
                </button>
                <button
                  onClick={() => handleAttendance(false)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    attendance.expected === false
                      ? 'bg-[#ba1a1a] dark:bg-[#EF4444] text-white font-bold'
                      : 'bg-[#f3f4f5] dark:bg-[#0F172A] text-[#191c1d] dark:text-[#CBD5E1] hover:bg-[#e1e3e4] dark:hover:bg-[#334155] border border-[#c2c6d4] dark:border-[#334155]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  Skip
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column: Live Community Consensus vs Official Menu */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#c2c6d4] dark:border-[#334155] p-6 shadow-sm flex-1 flex flex-col justify-between">
              
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-[#c2c6d4] dark:border-[#334155]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#e8f5ea] dark:bg-[#22C55E]/20 text-[#006e25] dark:text-[#22C55E] font-bold border border-[#006e25]/30 dark:border-[#22C55E]/40">
                      LIVE CONSENSUS
                    </span>
                    {consensusData?.menuChanged && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#ffdad6] dark:bg-[#EF4444]/20 text-[#ba1a1a] dark:text-[#EF4444] font-bold border border-[#ba1a1a]/30 animate-pulse">
                        ⚠️ Menu Changed!
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[#003f87] dark:text-[#3B82F6] mt-1">
                    Today's {mealStatus.mealName}
                  </h3>
                  <p className="text-xs text-[#424752] dark:text-[#94A3B8] mt-0.5">
                    Verified by <strong className="text-[#191c1d] dark:text-[#F8FAFC]">{consensusData?.totalReporters || 0} Students</strong> • Confidence: <span className="text-[#006e25] dark:text-[#22C55E] font-bold">{consensusData?.confidenceRating || 'LOW'}</span>
                  </p>
                </div>

                <button
                  onClick={() => navigate('/report-meal?slot=' + mealStatus.mealType)}
                  className="px-3 py-1.5 bg-[#f3f4f5] dark:bg-[#0F172A] hover:bg-[#e1e3e4] dark:hover:bg-[#334155] text-[#003f87] dark:text-[#3B82F6] border border-[#c2c6d4] dark:border-[#334155] rounded-lg text-xs font-semibold transition flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  Report
                </button>
              </div>

              {/* Items Breakdown */}
              <div className="py-4 space-y-3 flex-1 overflow-y-auto">
                {consensusData?.items && consensusData.items.length > 0 ? (
                  consensusData.items.map((item, idx) => (
                    <div key={idx} className="bg-[#f3f4f5] dark:bg-[#0F172A] border border-[#c2c6d4] dark:border-[#334155] rounded-lg p-3 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#191c1d] dark:text-[#F8FAFC]">{item.name}</span>
                        <span className="font-bold text-[#006e25] dark:text-[#22C55E]">{item.confidence}% Verified</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#c2c6d4]/40 dark:bg-[#334155] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#006e25] dark:bg-[#22C55E] rounded-full transition-all duration-500"
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-[#424752] dark:text-[#94A3B8]">
                    Nobody has reported the live menu yet today. <br />
                    <button onClick={() => navigate('/report-meal?slot=' + mealStatus.mealType)} className="text-[#003f87] dark:text-[#3B82F6] font-bold hover:underline mt-2 inline-block">
                      Be the first reporter (+20 pts)!
                    </button>
                  </div>
                )}
              </div>

              {/* Expected vs Community Footer */}
              <div className="bg-[#f3f4f5] dark:bg-[#0F172A] border border-[#c2c6d4] dark:border-[#334155] p-3.5 rounded-lg text-xs space-y-1">
                <p className="text-[#424752] dark:text-[#94A3B8] font-semibold">Official Mess Expected Menu:</p>
                <p className="text-[#191c1d] dark:text-[#F8FAFC] font-medium">
                  {consensusData?.expectedItems?.join(', ') || 'Idli, Sambar, Chutney, Tea'}
                </p>
              </div>

            </div>
          </div>

          {/* Right Column: Occupancy */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Occupancy Card */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#c2c6d4] dark:border-[#334155] p-5 shadow-sm">
              <h3 className="text-xs font-bold text-[#424752] dark:text-[#94A3B8] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">monitoring</span>
                Mess Occupancy
              </h3>
              <div className="flex items-end gap-3 mb-2">
                <div className="text-5xl font-bold text-[#003f87] dark:text-[#3B82F6]">{occupancy.percentage}%</div>
                <div className="text-xs text-[#424752] dark:text-[#CBD5E1] font-semibold pb-1">{occupancy.statusLabel}</div>
              </div>
              <div className="h-2 w-full bg-[#f3f4f5] dark:bg-[#0F172A] rounded-full overflow-hidden border border-[#c2c6d4] dark:border-[#334155]">
                <div className="h-full bg-[#003f87] dark:bg-[#3B82F6] rounded-full transition-all" style={{ width: `${occupancy.percentage}%` }} />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
