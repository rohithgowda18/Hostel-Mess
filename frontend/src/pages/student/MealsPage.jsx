import { useEffect, useState } from 'react';
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
  { key: 'BREAKFAST', name: 'Breakfast', icon: Coffee, time: '07:30 – 09:30' },
  { key: 'LUNCH', name: 'Lunch', icon: Sun, time: '12:30 – 14:30' },
  { key: 'SNACKS', name: 'Snacks', icon: Sunset, time: '16:30 – 17:30' },
  { key: 'DINNER', name: 'Dinner', icon: Moon, time: '19:30 – 21:30' },
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

  return (
    <div className="space-y-6">
      {/* Header with Segmented Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Meals & Dining
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare official dining schedules against real-time peer meal reports and live photo proof.
          </p>
        </div>

        {/* Segmented Controls: Today, Weekly Menu, Live Photos */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 w-fit">
          <button
            onClick={() => handleTabChange('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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
        <div className="space-y-6">
          {/* Meal Slot Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MEAL_SLOTS.map((slot) => {
              const Icon = slot.icon;
              const isSelected = selectedSlot === slot.key;
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => setSelectedSlot(slot.key)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 text-teal-900 border-teal-300 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-700 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400'}`} />
                  <div>
                    <span className="block text-xs font-bold">{slot.name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{slot.time}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Official Menu vs Community Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OFFICIAL MENU */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
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
                <ul className="space-y-2">
                  {todayConsensus.expectedItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
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
            <Card className="p-5 space-y-4 border-teal-100 dark:border-teal-900/40">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                    Community Report
                  </h3>
                  <p className="text-[11px] text-slate-400">Reported and verified by students</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/student/report-meal?slot=${selectedSlot}`)}
                  className="text-xs font-bold gap-1 h-8"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Report What You See
                </Button>
              </div>

              {todayConsensus?.items && todayConsensus.items.length > 0 ? (
                <div className="space-y-3">
                  {todayConsensus.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
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
                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border border-green-300 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800 hover:bg-green-100 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            YES ({item.yesVotes || 0})
                          </button>
                          <button
                            type="button"
                            disabled={verifyingItem === item.name}
                            onClick={() => handleVerify(item.name, 'NO')}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 hover:bg-red-100 transition-colors cursor-pointer"
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
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No student reports yet for {selectedSlot.toLowerCase()}.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/student/report-meal?slot=${selectedSlot}`)}
                    className="text-xs font-bold text-teal-700 dark:text-teal-400"
                  >
                    Submit First Report
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: WEEKLY MENU ──────────────── */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          {/* Clean Day Selector (Mon – Sun) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {DAYS_OF_WEEK.map((d) => {
              const isSelected = selectedDay === d.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDay(d.key)}
                  className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
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

          {/* Meal Sections Stacked Vertically */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MEAL_SLOTS.map((slot) => {
              const Icon = slot.icon;
              const slotItems = currentDaySchedule ? currentDaySchedule[slot.key] : null;

              return (
                <Card key={slot.key} className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
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
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
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
        <div className="space-y-5">
          {/* Meal Slot Filter for Photos */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['ALL', 'BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setPhotoFilter(slot)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    photoFilter === slot
                      ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-slate-950 font-bold'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {slot === 'ALL' ? 'All Photos' : slot}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => navigate('/student/report-meal')}
              className="text-xs font-bold gap-1 shrink-0"
            >
              <Camera className="h-3.5 w-3.5" />
              Upload in Report
            </Button>
          </div>

          {/* Photo Grid */}
          {(() => {
            const filteredPhotos = photoFilter === 'ALL'
              ? photos
              : photos.filter((p) => (p.mealType || '').toUpperCase() === photoFilter);

            if (filteredPhotos.length === 0) {
              return (
                <div className="text-center py-16 space-y-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
                  <Camera className="h-8 w-8 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No photos have been submitted for this meal.
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Photos are captured during meal reporting as peer evidence of food served at mess counters.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/student/report-meal')}
                    className="text-xs font-bold text-teal-700 dark:text-teal-400"
                  >
                    Report & Upload Photo
                  </Button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map((photo, idx) => {
                  const imgUrl = photo.id
                    ? `/api/student-photos/${photo.id}/image`
                    : photo.imageUrls?.[0] || photo.photoUrl;

                  return (
                    <Card
                      key={photo.id || idx}
                      onClick={() => setLightboxPhoto(photo)}
                      className="overflow-hidden cursor-pointer hover:border-teal-400 transition-colors group p-0"
                    >
                      <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt="Meal Evidence"
                            className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
                            No preview
                          </div>
                        )}
                        <span className="absolute top-2 left-2 rounded-md bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 uppercase backdrop-blur-xs">
                          {photo.mealType || 'Meal'}
                        </span>
                      </div>
                      <div className="p-3 text-xs space-y-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {photo.description || 'Live Plate Photo'}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="truncate">{photo.uploadedBy || 'Student'}</span>
                          <span>{photo.date || 'Today'}</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })()}

          {/* Lightbox Modal */}
          {lightboxPhoto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in-0 duration-150">
              <div className="relative max-w-xl w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl space-y-3 p-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{lightboxPhoto.mealType || 'Meal'}</Badge>
                    <span className="text-xs text-slate-400 font-medium">{lightboxPhoto.date || 'Today'}</span>
                  </div>
                  <button
                    onClick={() => setLightboxPhoto(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[420px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={lightboxPhoto.id ? `/api/student-photos/${lightboxPhoto.id}/image` : (lightboxPhoto.imageUrls?.[0] || lightboxPhoto.photoUrl)}
                    alt="Expanded plate photo"
                    className="w-full h-full max-h-[420px] object-contain"
                  />
                </div>

                <div className="space-y-1 text-xs pt-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {lightboxPhoto.description || 'Plate evidence photo'}
                  </p>
                  <p className="text-slate-500">
                    Uploaded by: <span className="font-semibold text-slate-800 dark:text-slate-200">{lightboxPhoto.uploadedBy || 'Resident'}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
