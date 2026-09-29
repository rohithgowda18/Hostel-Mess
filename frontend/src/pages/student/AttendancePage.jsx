import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import { usePageTitle } from '@/hooks/use-page-title';

const ALL_MEALS = [
  { key: 'BREAKFAST', name: 'Breakfast', time: '07:30 – 09:30' },
  { key: 'LUNCH', name: 'Lunch', time: '12:30 – 14:30' },
  { key: 'SNACKS', name: 'Snacks', time: '16:30 – 17:30' },
  { key: 'DINNER', name: 'Dinner', time: '19:30 – 21:30' }
];

export default function AttendancePage() {
  const navigate = useNavigate();
  usePageTitle(
    'Attendance',
    'Review your daily meal attendance declarations and check-in records.'
  );

  const currentUser = getUser() || {};
  const currentEmail = currentUser.email || '';
  const todayStr = new Date().toISOString().split('T')[0];
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const [todayStatusMap, setTodayStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentHistory, setRecentHistory] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadAttendanceOverview = async () => {
      setLoading(true);
      try {
        // Fetch status for all 4 slots today
        const statusMap = {};
        await Promise.all(
          ALL_MEALS.map(async (meal) => {
            try {
              const res = await messApi.getMyAttendanceStatus(meal.key, todayStr);
              statusMap[meal.key] = res;
            } catch {
              statusMap[meal.key] = null;
            }
          })
        );

        // Fetch recent check-ins or roster records
        const roster = await messApi.getAttendanceRoster('LUNCH', todayStr).catch(() => []);

        if (isMounted) {
          setTodayStatusMap(statusMap);

          if (Array.isArray(roster)) {
            const userRecords = roster.filter(
              (r) =>
                r.email === currentEmail ||
                r.studentId === currentUser.id ||
                r.studentName === currentUser.name
            );
            setRecentHistory(userRecords.length > 0 ? userRecords : roster.slice(0, 5));
          }
        }
      } catch (err) {
        console.error('Failed to load attendance summary:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAttendanceOverview();
    return () => {
      isMounted = false;
    };
  }, [todayStr, currentEmail, currentUser.id, currentUser.name]);

  return (
    <div className="w-full space-y-6 pb-16 max-w-4xl mx-auto">
      {/* ──────────────── 1. HEADER ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] uppercase tracking-wider font-semibold">
            <span>{formattedToday}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            Attendance
          </h1>
          <p className="text-xs text-on-surface-variant">
            Today's meal attendance status declared from your dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/student/dashboard')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <span>Go to Dashboard</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      {/* ──────────────── 2. INFORMATIONAL NOTICE ──────────────── */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-[18px] text-primary">info</span>
          <span>
            Meal attendance is declared on the <strong>Dashboard</strong> for the currently serving meal slot.
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/student/dashboard')}
          className="text-xs font-bold text-primary hover:underline cursor-pointer shrink-0"
        >
          Declare on Dashboard →
        </button>
      </div>

      {/* ──────────────── 3. TODAY'S MEALS ATTENDANCE STATUS ──────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
            Today's meals
          </h2>
          <span className="text-[11px] text-on-surface-variant font-mono">4 Daily Slots</span>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-on-surface-variant">Loading today's attendance status...</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {ALL_MEALS.map((meal) => {
              const statusData = todayStatusMap[meal.key];
              const isPresent = statusData?.present === true;
              const isExpected = statusData?.expected === true;
              const isSkipped = statusData?.expected === false;

              let statusLabel = 'Not recorded';
              let badgeClass = 'bg-surface-container text-outline';

              if (isPresent) {
                statusLabel = 'Checked In';
                badgeClass = 'bg-secondary-fixed text-on-secondary-fixed-variant font-bold';
              } else if (isExpected) {
                statusLabel = 'Will Eat';
                badgeClass = 'bg-primary-fixed text-on-primary-fixed font-bold';
              } else if (isSkipped) {
                statusLabel = 'Skipped';
                badgeClass = 'bg-error-container/30 text-error font-medium';
              }

              return (
                <div
                  key={meal.key}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-on-surface block">
                      {meal.name}
                    </span>
                    <span className="text-xs font-mono text-on-surface-variant">
                      {meal.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${badgeClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ──────────────── 4. RECENT ATTENDANCE HISTORY ──────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
            Recent Attendance Records
          </h2>
          <span className="text-[11px] text-on-surface-variant">Verified Records</span>
        </div>

        {loading ? (
          <p className="text-xs text-on-surface-variant italic py-4 text-center">
            Loading recent records...
          </p>
        ) : recentHistory.length === 0 ? (
          <p className="text-xs text-on-surface-variant italic py-6 text-center">
            No recent attendance records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/15 text-outline text-[11px] uppercase tracking-wider">
                  <th className="pb-2.5 font-semibold">Date</th>
                  <th className="pb-2.5 font-semibold">Meal</th>
                  <th className="pb-2.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {recentHistory.map((item, idx) => {
                  const dateStr = item.date
                    ? new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : formattedToday;
                  const mealName = item.mealType || 'Lunch';
                  const isCheckedIn = Boolean(item.present);

                  return (
                    <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 font-mono text-on-surface">{dateStr}</td>
                      <td className="py-3 font-semibold text-on-surface">{mealName}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCheckedIn
                              ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                              : item.expected === false
                              ? 'bg-error-container/30 text-error'
                              : 'bg-primary-fixed text-on-primary-fixed'
                          }`}
                        >
                          {isCheckedIn
                            ? 'Checked In'
                            : item.expected === false
                            ? 'Skipped'
                            : 'Will Eat'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
