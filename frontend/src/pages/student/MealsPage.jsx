import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import { usePageTitle } from '@/hooks/use-page-title';
import { useToast } from '@/context/toast-context';
import {
  getMealTimeStatus,
  formatCountdown,
  MEAL_WINDOWS
} from '@/utils/meal-time';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' }
];

export default function MealsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle(
    "Today's Meals",
    'See what is being served now in the hostel dining hall and view real student peer reports.'
  );

  // Time & Slot Status
  const [serverOffset, setServerOffset] = useState(0);
  const [timeStatus, setTimeStatus] = useState(() => getMealTimeStatus(0));
  const [remainingSecs, setRemainingSecs] = useState(0);

  // Data states
  const [consensus, setConsensus] = useState(null);
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [todayPhotos, setTodayPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingItem, setVerifyingItem] = useState(null);

  // Modals
  const [showWeeklyMenuModal, setShowWeeklyMenuModal] = useState(false);
  const [selectedModalDay, setSelectedModalDay] = useState(() => {
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayMap[new Date().getDay()] || 'monday';
  });
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const timerRef = useRef(null);

  // 1. Fetch server slot & sync server time offset
  const syncServerSlot = async () => {
    try {
      const data = await messApi.getActiveSlotInfo();
      if (data) {
        const offset = (data.serverTimeMillis || Date.now()) - Date.now();
        setServerOffset(offset);
        const status = getMealTimeStatus(offset);
        setTimeStatus(status);
        setRemainingSecs(status.remainingSeconds);
      }
    } catch (err) {
      console.error('Failed to sync slot info:', err);
    }
  };

  useEffect(() => {
    syncServerSlot();
    const interval = setInterval(syncServerSlot, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. Real-time 1-second countdown
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const status = getMealTimeStatus(serverOffset);
      setTimeStatus(status);
      setRemainingSecs(status.remainingSeconds);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [serverOffset]);

  // 3. Load consensus, menu, and photos
  const activeSlotKey = timeStatus.activeSlot?.key || timeStatus.nextSlot?.key || 'LUNCH';

  useEffect(() => {
    let isMounted = true;
    const loadMealsData = async () => {
      setLoading(true);
      try {
        const [consensusData, menuData, photoList] = await Promise.all([
          messApi.getMealConsensus(activeSlotKey, todayStr).catch(() => null),
          messApi.getWeeklyMenu().catch(() => null),
          messApi.getStudentPhotosToday().catch(() => [])
        ]);

        if (isMounted) {
          if (consensusData) setConsensus(consensusData);
          if (menuData) setWeeklyMenu(menuData);
          if (Array.isArray(photoList)) setTodayPhotos(photoList);
        }
      } catch (err) {
        console.error('Failed to load meals data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMealsData();
    return () => {
      isMounted = false;
    };
  }, [activeSlotKey, todayStr]);

  // 4. Handle item peer verification
  const handleVerify = async (foodItem, vote) => {
    setVerifyingItem(foodItem);
    try {
      const updated = await messApi.verifyMealItem(activeSlotKey, todayStr, foodItem, vote);
      if (updated) {
        setConsensus(updated);
        toast.success(
          'Vote Recorded',
          `Marked "${foodItem}" as ${vote === 'YES' ? 'currently being served' : 'not present'}.`
        );
      }
    } catch (err) {
      console.error('Failed to verify item:', err);
      toast.error('Verification Failed', err.message || 'Could not record vote.');
    } finally {
      setVerifyingItem(null);
    }
  };

  // Determine dishes for the active slot or next slot
  const currentSlotDishes = (() => {
    const reported = consensus?.items?.map((i) => i.name) || [];
    const expected = consensus?.expectedItems || [];
    const menuSlotDishes = weeklyMenu?.[dayName]?.[activeSlotKey] || [];
    if (reported.length > 0) return reported;
    if (expected.length > 0) return expected;
    return menuSlotDishes;
  })();

  const nextSlotDishes = (() => {
    if (!timeStatus.nextSlot) return [];
    return weeklyMenu?.[dayName]?.[timeStatus.nextSlot.key] || [];
  })();

  const reportedFoods = consensus?.items || [];
  const activeSlot = timeStatus.activeSlot;
  const nextSlot = timeStatus.nextSlot;
  const isServing = timeStatus.isActive && activeSlot;

  return (
    <div className="w-full space-y-6 pb-12 max-w-5xl mx-auto">
      {/* ──────────────── 1. HEADER ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            Today's Meals
          </h1>
          <p className="text-xs text-on-surface-variant">
            See what is being served now and what students are reporting.
          </p>
        </div>

        {/* Secondary Action: Weekly Menu */}
        <button
          type="button"
          onClick={() => setShowWeeklyMenuModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/20 transition-all self-start sm:self-auto cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
          <span>View Weekly Menu</span>
        </button>
      </div>

      {/* ──────────────── 2. CURRENT MEAL (PRIMARY CONTENT) ──────────────── */}
      {isServing ? (
        <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-7 shadow-sm border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-60 h-60 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            {/* Status Pill & Time Window */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  CURRENTLY SERVING
                </span>
                <span className="text-xs text-on-surface-variant font-medium">Mess Hall Open</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-md border border-outline-variant/10">
                <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                {activeSlot.time}
              </div>
            </div>

            {/* Meal Name & Live Countdown */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pt-1">
              <div>
                <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold block">
                  Current Meal
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mt-0.5">
                  {activeSlot.name.toUpperCase()}
                </h2>
              </div>

              <div className="inline-flex items-center gap-2 bg-surface-container px-4 py-2 rounded-xl border border-outline-variant/20">
                <span className="text-xs text-on-surface-variant font-medium">Ends in:</span>
                <span className="text-xl font-bold font-mono text-primary tracking-tight">
                  {formatCountdown(remainingSecs)}
                </span>
              </div>
            </div>

            {/* Food items */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-outline block">
                Dishes Being Served
              </span>
              {currentSlotDishes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentSlotDishes.map((dish, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface border border-outline-variant/20 shadow-2xs"
                    >
                      {dish}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic">
                  Menu items are being confirmed by resident peer reports.
                </p>
              )}
            </div>

            {/* Action Buttons: Report & Add Photo */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={() => navigate('/student/report-meal')}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                Report {activeSlot.name}
              </button>

              <button
                type="button"
                onClick={() => navigate('/student/report-meal?photo=1')}
                title={`Add ${activeSlot.name} meal photo`}
                className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-center gap-2 border border-outline-variant/20 transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">photo_camera</span>
                Add Photo
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Outside serving windows: NO MEAL CURRENTLY SERVING */
        <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-7 shadow-sm border border-outline-variant/20 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold">
                NO MEAL CURRENTLY SERVING
              </span>
              <span className="text-xs text-on-surface-variant">Mess Hall Closed</span>
            </div>

            <div className="text-xs font-mono text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-md border border-outline-variant/10">
              Current Time: {timeStatus.currentTimeStr}
            </div>
          </div>

          <div className="pt-1">
            <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
              Next Meal
            </span>
            <h2 className="text-2xl font-bold text-on-surface mt-0.5">
              {nextSlot ? nextSlot.name : 'Breakfast'}
              <span className="text-sm font-normal text-on-surface-variant font-mono ml-3">
                {nextSlot ? nextSlot.time : '07:30 – 09:30'}
              </span>
            </h2>
            {timeStatus.lastCompletedSlot && (
              <p className="text-xs text-on-surface-variant mt-1">
                {timeStatus.lastCompletedSlot.name} service has concluded. The kitchen is in preparation for the next meal.
              </p>
            )}
          </div>

          {/* Next meal preview dishes */}
          {nextSlotDishes.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-outline block">
                Scheduled for {nextSlot?.name || 'Upcoming Meal'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {nextSlotDishes.map((dish, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-surface-container-low text-xs text-on-surface border border-outline-variant/10"
                  >
                    {dish}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photo button behavior: Disabled outside meal window */}
          <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/10 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-outline">no_photography</span>
            <span>Photo reporting is available while a meal is being served.</span>
          </div>
        </div>
      )}

      {/* ──────────────── 3. AFTER CURRENT MEAL: SIMPLE TODAY TIMELINE ──────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-outline-variant/15">
          <h2 className="text-xs font-bold uppercase tracking-wider text-outline">
            Today's Timeline
          </h2>
          <span className="text-[11px] text-on-surface-variant">4 Daily Slots</span>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {timeStatus.timeline.map((slot) => {
            const isSlotServing = slot.status === 'serving';
            const isSlotCompleted = slot.status === 'completed';
            const slotDishes = weeklyMenu?.[dayName]?.[slot.key] || [];

            return (
              <div
                key={slot.key}
                className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                  isSlotServing ? 'bg-surface-container-low/70 -mx-3 px-3 rounded-lg' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Status indicator: ✓ completed, ● serving, ○ upcoming */}
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    {isSlotCompleted ? (
                      <span className="material-symbols-outlined text-[20px] text-secondary">
                        check_circle
                      </span>
                    ) : isSlotServing ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-outline-variant" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isSlotServing ? 'text-primary' : 'text-on-surface'
                        }`}
                      >
                        {slot.name}
                      </span>
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        {slot.time}
                      </span>
                    </div>
                    {slotDishes.length > 0 && (
                      <p className="text-[11px] text-on-surface-variant line-clamp-1">
                        {slotDishes.slice(0, 4).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto pl-9 sm:pl-0">
                  {isSlotServing ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed-variant">
                      Currently serving
                    </span>
                  ) : isSlotCompleted ? (
                    <span className="text-[11px] font-medium text-on-surface-variant/70">
                      Completed
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-outline">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──────────────── 4. COMMUNITY REPORTS ──────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline-variant/15">
          <div>
            <h2 className="text-base font-bold text-on-surface">Community Reports</h2>
            <p className="text-xs text-on-surface-variant">
              {consensus?.totalReporters
                ? `${consensus.totalReporters} ${
                    consensus.totalReporters === 1 ? 'student' : 'students'
                  } reported this meal`
                : 'Live verification and peer reports from hostel residents'}
            </p>
          </div>

          {isServing && (
            <button
              type="button"
              onClick={() => navigate('/student/report-meal')}
              className="text-xs font-semibold text-primary hover:underline self-start sm:self-auto cursor-pointer"
            >
              + Add peer report
            </button>
          )}
        </div>

        {/* Foods Seen */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-outline block">
            Foods Seen
          </span>

          {reportedFoods.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {reportedFoods.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-on-surface block truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-secondary font-medium">
                      {item.yesVotes || 1} peer {item.yesVotes === 1 ? 'confirmation' : 'confirmations'}
                    </span>
                  </div>

                  {/* Verification action */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={verifyingItem === item.name}
                      onClick={() => handleVerify(item.name, 'YES')}
                      className="px-2.5 py-1 rounded bg-secondary-container/40 text-secondary hover:bg-secondary-container text-xs font-semibold transition-colors cursor-pointer"
                      title="Confirm this item is being served"
                    >
                      Yes ({item.yesVotes || 0})
                    </button>
                    <button
                      type="button"
                      disabled={verifyingItem === item.name}
                      onClick={() => handleVerify(item.name, 'NO')}
                      className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer"
                      title="Item is not being served"
                    >
                      No ({item.noVotes || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface-variant italic border border-outline-variant/10">
              No peer reports filed yet for this meal. {isServing && 'Tap "Report Meal" to report what is being served.'}
            </div>
          )}
        </div>

        {/* Meal Evidence Photos */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-outline block">
              Recent Meal Photos
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {todayPhotos.length} {todayPhotos.length === 1 ? 'photo' : 'photos'} today
            </span>
          </div>

          {todayPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {todayPhotos.map((photo, idx) => {
                const imgUrl = photo.imageUrls?.[0] || `/api/student-photos/${photo.id}/image`;
                return (
                  <div
                    key={photo.id || idx}
                    onClick={() => setLightboxPhoto(photo)}
                    className="group rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container aspect-video relative cursor-pointer"
                  >
                    <img
                      src={imgUrl}
                      alt={photo.description || 'Meal verification evidence'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                      <span className="text-[10px] font-bold block text-secondary-fixed">
                        {photo.mealType}
                      </span>
                      <span className="text-[9px] text-white/80 truncate block">
                        {photo.uploadedBy || 'Resident'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface-variant italic border border-outline-variant/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>No evidence photos submitted today yet.</span>
              {isServing && (
                <button
                  type="button"
                  onClick={() => navigate('/student/report-meal?photo=1')}
                  className="text-xs font-semibold text-primary hover:underline self-start sm:self-auto cursor-pointer"
                >
                  + Add meal photo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ──────────────── 5. WEEKLY MENU MODAL (SECONDARY FEATURE) ──────────────── */}
      {showWeeklyMenuModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowWeeklyMenuModal(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/30 shadow-2xl space-y-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div>
                <h3 className="text-base font-bold text-on-surface">Weekly Dining Menu</h3>
                <p className="text-xs text-on-surface-variant">Scheduled hostel menu for the week</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWeeklyMenuModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Day Selector Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = selectedModalDay === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedModalDay(d.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            {/* 4 slots for selected day */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {MEAL_WINDOWS.map((slot) => {
                const dishes = weeklyMenu?.[selectedModalDay]?.[slot.key] || [];

                return (
                  <div
                    key={slot.key}
                    className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          {slot.icon}
                        </span>
                        <span className="text-xs font-bold text-on-surface">{slot.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        {slot.time}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {Array.isArray(dishes) && dishes.length > 0 ? (
                        dishes.map((dish, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-surface-container text-xs text-on-surface border border-outline-variant/10"
                          >
                            {dish}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">
                          Standard menu scheduled.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── 6. LIGHTBOX MODAL ──────────────── */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-lg w-full bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-outline-variant/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary">{lightboxPhoto.mealType}</span>
                <span className="text-xs text-on-surface-variant ml-2">
                  Uploaded by {lightboxPhoto.uploadedBy || 'Resident'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="bg-black/90 max-h-[65vh] flex items-center justify-center">
              <img
                src={lightboxPhoto.imageUrls?.[0] || `/api/student-photos/${lightboxPhoto.id}/image`}
                alt={lightboxPhoto.description || 'Meal verification photo'}
                className="max-h-[65vh] w-full object-contain"
              />
            </div>
            {lightboxPhoto.description && (
              <div className="p-3.5 text-xs text-on-surface border-t border-outline-variant/15">
                {lightboxPhoto.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
