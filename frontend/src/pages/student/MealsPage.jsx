import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import {
  UtensilsCrossed,
  Calendar,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  User,
  Coffee,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const MEAL_SLOTS = [
  { key: 'BREAKFAST', name: 'Breakfast', icon: Coffee, time: '07:30 – 09:30', startMins: 7 * 60 + 30, endMins: 9 * 60 + 30 },
  { key: 'LUNCH', name: 'Lunch', icon: Sun, time: '12:30 – 14:30', startMins: 12 * 60 + 30, endMins: 14 * 60 + 30 },
  { key: 'SNACKS', name: 'Snacks', icon: Sunset, time: '16:30 – 17:30', startMins: 16 * 60 + 30, endMins: 17 * 60 + 30 },
  { key: 'DINNER', name: 'Dinner', icon: Moon, time: '19:30 – 21:30', startMins: 19 * 60 + 30, endMins: 21 * 60 + 30 },
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon', full: 'Monday' },
  { key: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { key: 'thursday', label: 'Thu', full: 'Thursday' },
  { key: 'friday', label: 'Fri', full: 'Friday' },
  { key: 'saturday', label: 'Sat', full: 'Saturday' },
  { key: 'sunday', label: 'Sun', full: 'Sunday' }
];

export default function MealsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'today';

  const [slotInfo, setSlotInfo] = useState(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [remainingSecs, setRemainingSecs] = useState(0);

  const [selectedSlot, setSelectedSlot] = useState('LUNCH');
  const [selectedDay, setSelectedDay] = useState(() => {
    const dayIndex = new Date().getDay();
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayMap[dayIndex];
  });

  const [todayConsensus, setTodayConsensus] = useState(null);
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoFilter, setPhotoFilter] = useState('ALL');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyingItem, setVerifyingItem] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const timerRef = useRef(null);

  // 1. Fetch server slot info & sync clock
  const fetchSlotInfo = async () => {
    try {
      const data = await messApi.getActiveSlotInfo();
      if (data) {
        setSlotInfo(data);
        const offset = (data.serverTimeMillis || Date.now()) - Date.now();
        setServerOffset(offset);

        if (data.isActive) {
          setSelectedSlot(data.activeSlot);
          if (data.endTimeMillis) {
            const currentServerTime = Date.now() + offset;
            const diff = Math.max(0, Math.floor((data.endTimeMillis - currentServerTime) / 1000));
            setRemainingSecs(diff);
          }
        } else if (data.nextSlot?.key) {
          setSelectedSlot(data.nextSlot.key);
          setRemainingSecs(0);
        }
      }
    } catch (err) {
      console.error('Failed to get slot info:', err);
    }
  };

  useEffect(() => {
    fetchSlotInfo();
    const interval = setInterval(fetchSlotInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. Countdown timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (slotInfo?.isActive && slotInfo.endTimeMillis) {
      timerRef.current = setInterval(() => {
        const currentServerTime = Date.now() + serverOffset;
        const diff = Math.floor((slotInfo.endTimeMillis - currentServerTime) / 1000);

        if (diff <= 0) {
          setRemainingSecs(0);
          clearInterval(timerRef.current);
          fetchSlotInfo();
        } else {
          setRemainingSecs(diff);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slotInfo?.isActive, slotInfo?.endTimeMillis, serverOffset]);

  // Format hh:mm:ss
  const formatCountdown = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [consensusData, menuData, photoList] = await Promise.all([
        messApi.getMealConsensus(selectedSlot, todayStr).catch(() => null),
        messApi.getWeeklyMenu().catch(() => null),
        messApi.getStudentPhotosToday().catch(() => [])
      ]);

      if (consensusData) setTodayConsensus(consensusData);
      if (menuData) setWeeklyMenu(menuData);
      if (Array.isArray(photoList)) setPhotos(photoList);
    } catch (err) {
      console.error('Failed to load meals data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSlot]);

  // YES / NO Community Verification Handler
  const handleVerify = async (foodItem, vote) => {
    setVerifyingItem(foodItem);
    try {
      const updated = await messApi.verifyMealItem(selectedSlot, todayStr, foodItem, vote);
      if (updated) {
        setTodayConsensus(updated);
      }
    } catch (err) {
      console.error('Failed to verify item:', err);
    } finally {
      setVerifyingItem(null);
    }
  };

  const currentDaySchedule = weeklyMenu ? weeklyMenu[selectedDay] : null;

  // Determine slot status relative to current time
  const getSlotState = (slot) => {
    if (slotInfo?.activeSlot === slot.key) {
      return { status: 'ACTIVE', label: 'Serving now' };
    }
    const currentMins = new Date(Date.now() + serverOffset).getHours() * 60 + new Date(Date.now() + serverOffset).getMinutes();
    if (currentMins >= slot.endMins) {
      return { status: 'CLOSED', label: 'Meal closed' };
    }
    return { status: 'UPCOMING', label: 'Scheduled' };
  };

  const isCurrentSlotActive = slotInfo?.activeSlot === selectedSlot;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Segmented Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Meals & Dining
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare official dining schedules against real-time peer meal reports and live photo proof.
          </p>
        </div>

        {/* Segmented Controls: Today, Weekly Menu, Live Photos */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 w-fit">
          <button
            onClick={() => handleTabChange('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'today'
                ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Today
          </button>
          <button
            onClick={() => handleTabChange('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'weekly'
                ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Weekly Menu
          </button>
          <button
            onClick={() => handleTabChange('photos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            Live Photos
          </button>
        </div>
      </div>

      {/* ──────────────── TAB 1: TODAY'S MEAL & VERIFICATION ──────────────── */}
      {activeTab === 'today' && (
        <div className="space-y-5">
          {/* Meal Slot Selector Cards with Live State */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {MEAL_SLOTS.map((slot) => {
              const Icon = slot.icon;
              const isSelected = selectedSlot === slot.key;
              const slotState = getSlotState(slot);

              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => setSelectedSlot(slot.key)}
                  className={`flex flex-col justify-between p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-600 dark:bg-teal-950/40 dark:border-teal-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full pb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`} />
                      {slot.name}
                    </span>
                    {slotState.status === 'ACTIVE' && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-0.5 pt-1">
                    <span className="block text-[11px] font-mono text-slate-500">
                      {slot.time}
                    </span>
                    <span className={`block text-[10px] font-semibold ${
                      slotState.status === 'ACTIVE'
                        ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                        : slotState.status === 'CLOSED'
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}>
                      {slotState.status === 'ACTIVE'
                        ? `Ends in ${formatCountdown(remainingSecs)}`
                        : slotState.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Status Hero Banner */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {selectedSlot}
              </span>
              <span className="text-slate-400 mx-1.5">•</span>
              {isCurrentSlotActive ? (
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Currently serving (Ends in {formatCountdown(remainingSecs)})
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">
                  {getSlotState(MEAL_SLOTS.find((s) => s.key === selectedSlot)).label}
                  {slotInfo?.nextSlot && ` — Next meal: ${slotInfo.nextSlot.name} (${slotInfo.nextSlot.time})`}
                </span>
              )}
            </div>

            {isCurrentSlotActive && (
              <Button
                size="sm"
                onClick={() => navigate('/student/report-meal')}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-8 px-3.5 gap-1 shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Report This Meal
              </Button>
            )}
          </div>

          {/* Official Menu vs Community Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* OFFICIAL MENU */}
            <Card className="p-4 space-y-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Official Menu
                  </h3>
                  <p className="text-[11px] text-slate-400">Published by mess administration</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Scheduled Plan
                </Badge>
              </div>

              {todayConsensus?.expectedItems && todayConsensus.expectedItems.length > 0 ? (
                <ul className="space-y-1.5">
                  {todayConsensus.expectedItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                    >
                      <span className="font-semibold">{item}</span>
                      <span className="text-[10px] text-slate-400">Standard Scheduled Item</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Official menu items scheduled for this slot are not available.
                </div>
              )}
            </Card>

            {/* COMMUNITY REPORT & VERIFICATION */}
            <Card className="p-4 space-y-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                    Community Report
                  </h3>
                  <p className="text-[11px] text-slate-400">Reported and verified by students</p>
                </div>
                {todayConsensus?.totalReporters > 0 && (
                  <Badge variant="verified" className="text-[10px]">
                    {todayConsensus.totalReporters} {todayConsensus.totalReporters === 1 ? 'Report' : 'Reports'}
                  </Badge>
                )}
              </div>

              {todayConsensus?.items && todayConsensus.items.length > 0 ? (
                <div className="space-y-2.5">
                  {todayConsensus.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Reported by {item.votes} {item.votes === 1 ? 'student' : 'students'}
                          </span>
                        </div>
                        <Badge
                          variant={
                            item.status === 'Verified' || item.verified
                              ? 'verified'
                              : item.status === 'Conflicting reports'
                              ? 'pending'
                              : 'secondary'
                          }
                          className="text-[10px] font-bold"
                        >
                          {item.status || (item.verified ? 'Verified' : 'Awaiting verification')}
                        </Badge>
                      </div>

                      {/* Community Verification Interaction */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Is this being served?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={verifyingItem === item.name}
                            onClick={() => handleVerify(item.name, 'YES')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border border-green-300 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800 hover:bg-green-100 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            YES ({item.yesVotes || 0})
                          </button>
                          <button
                            type="button"
                            disabled={verifyingItem === item.name}
                            onClick={() => handleVerify(item.name, 'NO')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            NO ({item.noVotes || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No student reports yet for {selectedSlot.toLowerCase()}.
                  </p>
                  {isCurrentSlotActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/student/report-meal')}
                      className="text-xs font-bold text-teal-700 dark:text-teal-400"
                    >
                      Submit First Report
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: WEEKLY MENU ──────────────── */}
      {activeTab === 'weekly' && (
        <div className="space-y-5">
          {/* Day Selector (Mon – Sun) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {DAYS_OF_WEEK.map((d) => {
              const isSelected = selectedDay === d.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDay(d.key)}
                  className={`flex-1 min-w-[65px] py-2 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 dark:bg-teal-500 dark:text-slate-950'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="block text-[10px] uppercase font-normal opacity-80">{d.label}</span>
                  <span className="block text-xs font-bold">{d.full.slice(0, 3)}</span>
                </button>
              );
            })}
          </div>

          {/* Meal Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MEAL_SLOTS.map((slot) => {
              const Icon = slot.icon;
              const slotItems = currentDaySchedule ? currentDaySchedule[slot.key] : null;

              return (
                <Card key={slot.key} className="p-4 space-y-3 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        {slot.name}
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{slot.time}</span>
                  </div>

                  {Array.isArray(slotItems) && slotItems.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {slotItems.map((food, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
                        >
                          {food}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-2">
                      Menu not published for this slot.
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: LIVE PHOTOS ──────────────── */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          {/* Meal Slot Filter for Photos */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['ALL', 'BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setPhotoFilter(slot)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    photoFilter === slot
                      ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-slate-950 font-bold'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            {slotInfo?.isActive && (
              <Button
                size="sm"
                onClick={() => navigate('/student/report-meal')}
                className="text-xs font-bold gap-1 shrink-0 h-8"
              >
                <Camera className="h-3.5 w-3.5" />
                Upload Photo
              </Button>
            )}
          </div>

          {/* Photo Gallery Grid */}
          {(() => {
            const filteredPhotos = photos.filter((p) => {
              if (photoFilter === 'ALL') return true;
              return p.mealType?.toUpperCase() === photoFilter;
            });

            if (filteredPhotos.length === 0) {
              return (
                <Card className="p-8 text-center space-y-2 border-dashed border-slate-300 dark:border-slate-700">
                  <Camera className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No photo evidence available for today.
                  </p>
                  <p className="text-xs text-slate-400">
                    Students can upload live plate photos inside Report Meal during active serving hours.
                  </p>
                </Card>
              );
            }

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredPhotos.map((photo, idx) => {
                  const imgUrl = photo.imageUrls?.[0] || `/api/student-photos/${photo.id}/image`;
                  return (
                    <div
                      key={photo.id || idx}
                      onClick={() => setLightboxPhoto(photo)}
                      className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-square cursor-pointer"
                    >
                      <img
                        src={imgUrl}
                        alt={photo.description || 'Meal photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-2 text-white">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-teal-300">
                          {photo.mealType}
                        </span>
                        <span className="text-[11px] font-medium truncate block">
                          {photo.uploadedBy || 'Resident'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  {lightboxPhoto.mealType}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  Uploaded by {lightboxPhoto.uploadedBy || 'Student'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-slate-100 dark:bg-slate-950 max-h-[70vh] flex items-center justify-center">
              <img
                src={lightboxPhoto.imageUrls?.[0] || `/api/student-photos/${lightboxPhoto.id}/image`}
                alt={lightboxPhoto.description || 'Meal photo'}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
            {lightboxPhoto.description && (
              <div className="p-3 text-xs text-slate-600 dark:text-slate-300">
                {lightboxPhoto.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
