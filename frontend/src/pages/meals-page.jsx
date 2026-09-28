import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import {
  UtensilsCrossed,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
  Edit3,
  Save,
  Plus,
  Trash2,
  ArrowRight,
  TrendingUp,
  Star,
  ChevronRight,
  ChevronLeft,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Camera,
  X,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';

const TABS = [
  { id: 'today', label: "Today's Live Menu", icon: UtensilsCrossed },
  { id: 'photos', label: 'Live Food Gallery', icon: Camera },
  { id: 'weekly', label: 'Weekly Schedule', icon: Calendar },
  { id: 'history', label: 'Menu History & Compare', icon: History },
];

const MEAL_SLOTS = [
  { key: 'BREAKFAST', name: 'Breakfast', icon: Coffee, time: '07:30 AM – 09:30 AM', color: 'amber' },
  { key: 'LUNCH', name: 'Lunch', icon: Sun, time: '12:30 PM – 02:30 PM', color: 'blue' },
  { key: 'SNACKS', name: 'Evening Snacks', icon: Sunset, time: '04:30 PM – 05:30 PM', color: 'indigo' },
  { key: 'DINNER', name: 'Dinner', icon: Moon, time: '07:30 PM – 09:30 PM', color: 'purple' },
];

const SLOT_NUTRITION = {
  BREAKFAST: { calories: '420 kcal', protein: '14g', carbs: '68g', fats: '11g', tags: ['Pure Vegetarian', 'Contains Dairy'] },
  LUNCH: { calories: '680 kcal', protein: '24g', carbs: '96g', fats: '18g', tags: ['Balanced Thali', 'High Fiber', 'Jain Option'] },
  SNACKS: { calories: '290 kcal', protein: '7g', carbs: '42g', fats: '10g', tags: ['Freshly Prepared', 'Hot Beverage'] },
  DINNER: { calories: '590 kcal', protein: '21g', carbs: '82g', fats: '15g', tags: ['Pure Vegetarian', 'High Protein', 'Gluten-Free Option'] },
};

const DEFAULT_WEEKLY_SCHEDULE = [
  { day: 'Monday', breakfast: 'Idli, Sambar, Coconut Chutney, Tea/Coffee', lunch: 'Rice, Sambar, Rasam, Beans Palya, Curd', snacks: 'Onion Pakoda, Tea', dinner: 'Chapati, Dal Tadka, Rice, Rasam' },
  { day: 'Tuesday', breakfast: 'Masala Dosa, Potato Palya, Chutney, Coffee', lunch: 'Rice, Majjige Huli, Cabbage Palya, Rasam, Curd', snacks: 'Mangalore Bonda, Tea', dinner: 'Chapati, Veg Kurma, Rice, Rasam' },
  { day: 'Wednesday', breakfast: 'Khara Bath, Kesari Bath (Chow Chow Bath)', lunch: 'Veg Pulao, Raitha, Sambar, Rice, Rasam', snacks: 'Samosa, Coffee', dinner: 'Chapati, Paneer Butter Masala, Rice, Rasam' },
  { day: 'Thursday', breakfast: 'Puri, Vegetable Sagu, Tea/Coffee', lunch: 'Bisibele Bath, Boondi Raitha, Rice, Rasam, Papad', snacks: 'Chilli Bajji, Tea', dinner: 'Chapati, Aloo Gobi Curry, Rice, Rasam' },
  { day: 'Friday', breakfast: 'Rava Idli, Sagu, Coconut Chutney, Coffee', lunch: 'Lemon Rice, Sambar, Beetroot Palya, Rasam, Curd', snacks: 'Veg Puff, Tea', dinner: 'Chapati, Dal Fry, Rice, Rasam, Gulab Jamun' },
  { day: 'Saturday', breakfast: 'Avalakki (Poha), Chutney, Tea', lunch: 'Tomato Bath, Majjige Huli, Potato Fry, Rasam', snacks: 'Cutlet, Coffee', dinner: 'Chapati, Mixed Veg Curry, Rice, Rasam' },
  { day: 'Sunday', breakfast: 'Set Dosa, Vegetable Kurma, Coffee', lunch: 'Jeera Rice, Dal Tadka, Paneer Curry, Mysore Pak', snacks: 'Sweet Corn, Tea', dinner: 'Chapati, Paneer Curry, Rice, Rasam, Ice Cream' },
];

export default function MealsPage() {
  const navigate = useNavigate();
  const currentUser = getUser() || {};
  const isAdmin = currentUser.role === 'ADMIN';

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'today';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [todayMeals, setTodayMeals] = useState([]);
  const [weeklyMenu, setWeeklyMenu] = useState(DEFAULT_WEEKLY_SCHEDULE);
  const [photos, setPhotos] = useState([]);
  const [photoFilter, setPhotoFilter] = useState('ALL');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consensusData, setConsensusData] = useState({});
  const [showAdminWeeklyEditor, setShowAdminWeeklyEditor] = useState(false);
  const [editedWeekly, setEditedWeekly] = useState(DEFAULT_WEEKLY_SCHEDULE);
  const [saveStatus, setSaveStatus] = useState('');

  // History compare states
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [compareDate, setCompareDate] = useState('');
  const [historyMenuData, setHistoryMenuData] = useState(null);
  const [compareMenuData, setCompareMenuData] = useState(null);

  const getMondayDateStr = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const fetchMealsData = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const slots = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
      const [mealMap, photoList, ...consensusResults] = await Promise.all([
        messApi.getAllTodayMeals(slots).catch(() => ({})),
        messApi.getStudentPhotosToday().catch(() => []),
        ...slots.map((s) => messApi.getMealConsensus(s, todayStr).catch(() => null)),
      ]);

      setPhotos(Array.isArray(photoList) ? photoList : []);

      const consensusMap = {};
      slots.forEach((s, idx) => {
        consensusMap[s] = consensusResults[idx];
      });
      setConsensusData(consensusMap);

      const parsedToday = slots.map((slot) => {
        const mealObj = mealMap[slot];
        const cData = consensusMap[slot];
        const config = MEAL_SLOTS.find((m) => m.key === slot) || MEAL_SLOTS[0];

        return {
          rawSlot: slot,
          name: config.name,
          icon: config.icon,
          time: config.time,
          color: config.color,
          verified: (cData?.totalReporters || 0) >= 3 || mealObj?.status === 'VERIFIED',
          items: mealObj?.items || [],
          consensus: cData,
        };
      });
      setTodayMeals(parsedToday);

      const mondayStr = getMondayDateStr();
      const weeklyRes = await messApi.getWeeklyMenu(mondayStr).catch(() => null);
      if (weeklyRes && (weeklyRes.monday || weeklyRes.tuesday)) {
        const daysMap = [
          { day: 'Monday', data: weeklyRes.monday },
          { day: 'Tuesday', data: weeklyRes.tuesday },
          { day: 'Wednesday', data: weeklyRes.wednesday },
          { day: 'Thursday', data: weeklyRes.thursday },
          { day: 'Friday', data: weeklyRes.friday },
          { day: 'Saturday', data: weeklyRes.saturday },
          { day: 'Sunday', data: weeklyRes.sunday },
        ];
        const parsedWeekly = daysMap.map(({ day, data }) => ({
          day,
          breakfast: data?.BREAKFAST ? data.BREAKFAST.join(', ') : '-',
          lunch: data?.LUNCH ? data.LUNCH.join(', ') : '-',
          snacks: data?.SNACKS ? data.SNACKS.join(', ') : '-',
          dinner: data?.DINNER ? data.DINNER.join(', ') : '-',
        }));
        setWeeklyMenu(parsedWeekly);
        setEditedWeekly(parsedWeekly);
      } else {
        setWeeklyMenu(DEFAULT_WEEKLY_SCHEDULE);
        setEditedWeekly(DEFAULT_WEEKLY_SCHEDULE);
      }
    } catch (e) {
      console.error('Error loading meals data:', e);
      setWeeklyMenu(DEFAULT_WEEKLY_SCHEDULE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMealsData();
  }, []);

  useEffect(() => {
    if (!historyDate) return;
    const fetchHistory = async () => {
      try {
        const slots = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
        const results = await Promise.all(
          slots.map((s) => messApi.getMealConsensus(s, historyDate).catch(() => null))
        );
        const map = {};
        slots.forEach((s, idx) => {
          map[s] = results[idx];
        });
        setHistoryMenuData(map);
      } catch (err) {
        setHistoryMenuData(null);
      }
    };
    fetchHistory();
  }, [historyDate]);

  const handleSaveWeeklySchedule = async () => {
    try {
      const mondayStr = getMondayDateStr();
      const payload = {
        weekStartDate: mondayStr,
      };
      editedWeekly.forEach((row) => {
        payload[row.day.toLowerCase()] = {
          BREAKFAST: row.breakfast.split(',').map((s) => s.trim()).filter(Boolean),
          LUNCH: row.lunch.split(',').map((s) => s.trim()).filter(Boolean),
          SNACKS: row.snacks.split(',').map((s) => s.trim()).filter(Boolean),
          DINNER: row.dinner.split(',').map((s) => s.trim()).filter(Boolean),
        };
      });
      await messApi.saveWeeklyMenu(payload);
      setWeeklyMenu(editedWeekly);
      setShowAdminWeeklyEditor(false);
      setSaveStatus('Weekly mess schedule published successfully!');
      setTimeout(() => setSaveStatus(''), 4000);
    } catch (err) {
      alert('Failed to save weekly schedule');
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <PageHeader
        badge={
          <Badge variant="primary" className="text-[10px] font-bold">
            Central Mess Dining
          </Badge>
        }
        title="Mess Menus & Live Consensus"
        description="Official university mess schedules compared against real-time peer reports, verification confidence, and student ratings."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student-photos')}
              className="font-semibold text-xs gap-1.5"
            >
              Food Gallery
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/report-meal')}
              className="font-bold text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="h-4 w-4" />
              Report Live Meal (+20 Pts)
            </Button>
          </>
        }
      />

      {/* Success Notification Alert */}
      {saveStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/80 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading daily menus and peer verification data...</p>
        </div>
      ) : activeTab === 'today' ? (
        /* ─────────────── TAB 1: TODAY'S MEALS ─────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {todayMeals.map((meal) => {
            const Icon = meal.icon;
            const cData = meal.consensus;
            const isMenuChanged = cData?.menuChanged;

            return (
              <Card key={meal.rawSlot} className="p-6 flex flex-col justify-between shadow-card hover:border-slate-300">
                <div>
                  {/* Slot Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {meal.name}
                          </h3>
                          {meal.verified ? (
                            <Badge variant="success" className="text-[10px] gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Consensus Verified
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px] gap-1">
                              <AlertTriangle className="h-3 w-3" /> Unverified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{meal.time}</p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/report-meal?slot=${meal.rawSlot}`)}
                      className="text-blue-600 dark:text-blue-400 text-xs font-bold"
                    >
                      Report
                    </Button>
                  </div>

                  {/* Menu Changed Warning Banner */}
                  {isMenuChanged && (
                    <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Notice: Students reported changes compared to the published menu!</span>
                    </div>
                  )}

                  {/* Verified Items Breakdown */}
                  <div className="py-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Live Peer Breakdown ({cData?.totalReporters || 0} Reports)
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Confidence: {cData?.confidenceRating || 'NORMAL'}
                      </span>
                    </div>

                    {cData?.items && cData.items.length > 0 ? (
                      <div className="space-y-2">
                        {cData.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1.5 border border-slate-100 dark:border-slate-800"
                          >
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {item.confidence}% match
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${item.confidence}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                        {meal.items.length > 0
                          ? `Expected Items: ${meal.items.join(', ')}`
                          : 'Standard menu items scheduled for this slot.'}
                      </div>
                    )}
                  </div>

                  {/* Dietary & Macro Nutrition Estimator */}
                  {SLOT_NUTRITION[meal.rawSlot] && (
                    <div className="pt-2 pb-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {SLOT_NUTRITION[meal.rawSlot].tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            🌱 {tag}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 font-mono">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Cal</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{SLOT_NUTRITION[meal.rawSlot].calories}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Protein</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{SLOT_NUTRITION[meal.rawSlot].protein}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Carbs</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{SLOT_NUTRITION[meal.rawSlot].carbs}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Fats</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{SLOT_NUTRITION[meal.rawSlot].fats}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Have you eaten this meal?</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/feedback')}
                    className="text-xs font-semibold gap-1"
                  >
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    Rate Quality
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : activeTab === 'photos' ? (
        /* ─────────────── TAB 2: LIVE FOOD EVIDENCE GALLERY ─────────────── */
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Camera className="h-4 w-4 text-blue-600" />
                Student Photo Evidence Gallery
              </h3>
              <p className="text-xs text-slate-500">
                Verified photos captured at hostel dining counters today.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/report-meal')}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 gap-1.5"
            >
              <Camera className="h-4 w-4" /> Upload Meal Photo
            </Button>
          </div>

          {/* Meal Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {['ALL', 'BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map((slot) => (
              <button
                key={slot}
                onClick={() => setPhotoFilter(slot)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  photoFilter === slot
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {slot === 'ALL' ? 'All Meals' : slot}
              </button>
            ))}
          </div>

          {/* Grid of photos */}
          {(() => {
            const filteredPhotos = photoFilter === 'ALL' ? photos : photos.filter(p => (p.mealType || '').toUpperCase() === photoFilter);
            if (filteredPhotos.length === 0) {
              return (
                <EmptyState
                  icon={Camera}
                  title="No food photos shared yet today"
                  description="Be the first resident to photograph today's meal and upload it with your consensus report."
                  actionLabel="Upload First Photo (+20 Pts)"
                  onAction={() => navigate('/report-meal')}
                />
              );
            }
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map((photo, idx) => (
                  <Card
                    key={photo.id || idx}
                    onClick={() => setLightboxIndex(idx)}
                    className="overflow-hidden cursor-pointer group shadow-card hover:border-blue-400 transition-all"
                  >
                    <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={photo.photoUrl}
                        alt="Meal Evidence"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <Badge variant="primary" className="absolute top-2 left-2 text-[9px] font-bold uppercase backdrop-blur-md">
                        {photo.mealType || 'Meal'}
                      </Badge>
                    </div>
                    <div className="p-3 text-xs space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {photo.description || photo.foodItems?.join(', ') || 'Live Serving Photo'}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>{photo.uploadedBy || 'Resident'}</span>
                        <span>{photo.uploadTime || 'Today'}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            );
          })()}

          {/* Lightbox Modal */}
          {lightboxIndex !== null && photos[lightboxIndex] && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in-0 duration-150">
              <div className="relative max-w-xl w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-elevated">
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
                <img
                  src={photos[lightboxIndex].photoUrl}
                  alt="Expanded"
                  className="w-full max-h-[420px] object-cover"
                />
                <div className="p-4 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <Badge variant="primary">{photos[lightboxIndex].mealType}</Badge>
                    <span className="text-slate-400">{photos[lightboxIndex].uploadTime || 'Today'}</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 pt-1">
                    {photos[lightboxIndex].description || 'Counter Verification Evidence'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'weekly' ? (
        /* ─────────────── TAB 3: WEEKLY SCHEDULE ─────────────── */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Weekly Hostels Catering Plan
              </h3>
              <p className="text-xs text-slate-500">
                Standard schedule for the current academic week.
              </p>
            </div>
            {isAdmin && (
              <Button
                variant={showAdminWeeklyEditor ? 'outline' : 'default'}
                size="sm"
                onClick={() => setShowAdminWeeklyEditor(!showAdminWeeklyEditor)}
                className="text-xs font-bold gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                {showAdminWeeklyEditor ? 'Cancel Editing' : 'Edit Weekly Menu'}
              </Button>
            )}
          </div>

          {showAdminWeeklyEditor ? (
            /* Admin Weekly Menu Editor Form */
            <Card className="p-6 shadow-card space-y-5 border-blue-200 dark:border-blue-900/60">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Warden Menu Editor
                  </h4>
                  <p className="text-xs text-slate-400">Comma-separated food item lists for each day</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveWeeklySchedule}
                  className="font-bold text-xs bg-blue-600 hover:bg-blue-700 gap-1.5"
                >
                  <Save className="h-4 w-4" /> Save & Publish
                </Button>
              </div>

              <div className="space-y-4">
                {editedWeekly.map((row, idx) => (
                  <div key={row.day} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-3">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 block">
                      {row.day}
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Breakfast</label>
                        <Input
                          value={row.breakfast}
                          onChange={(e) => {
                            const updated = [...editedWeekly];
                            updated[idx].breakfast = e.target.value;
                            setEditedWeekly(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Lunch</label>
                        <Input
                          value={row.lunch}
                          onChange={(e) => {
                            const updated = [...editedWeekly];
                            updated[idx].lunch = e.target.value;
                            setEditedWeekly(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Snacks</label>
                        <Input
                          value={row.snacks}
                          onChange={(e) => {
                            const updated = [...editedWeekly];
                            updated[idx].snacks = e.target.value;
                            setEditedWeekly(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Dinner</label>
                        <Input
                          value={row.dinner}
                          onChange={(e) => {
                            const updated = [...editedWeekly];
                            updated[idx].dinner = e.target.value;
                            setEditedWeekly(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            /* Weekly Table Grid */
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-28">Day</th>
                    <th className="py-3 px-4">Breakfast</th>
                    <th className="py-3 px-4">Lunch</th>
                    <th className="py-3 px-4">Evening Snacks</th>
                    <th className="py-3 px-4">Dinner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {weeklyMenu.map((row) => (
                    <tr key={row.day} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {row.day}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {row.breakfast}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {row.lunch}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {row.snacks}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {row.dinner}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ─────────────── TAB 3: MENU HISTORY & COMPARE ─────────────── */
        <div className="space-y-6">
          <Card className="p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Lookup Historical Meal Menus
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Select Historical Date
                </label>
                <Input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {MEAL_SLOTS.map((s) => (
                <div key={s.key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    {s.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono block">{s.time}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-2">
                    {historyMenuData?.[s.key]?.items && historyMenuData[s.key].items.length > 0
                      ? historyMenuData[s.key].items.map((i) => i.name).join(', ')
                      : historyMenuData?.[s.key]?.expectedItems && historyMenuData[s.key].expectedItems.length > 0
                      ? historyMenuData[s.key].expectedItems.join(', ')
                      : `No meal log recorded for ${historyDate}.`}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
