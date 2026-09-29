import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import { usePageTitle } from '@/hooks/use-page-title';
import { useToast } from '@/context/toast-context';
import {
  getMealTimeStatus,
  formatCountdown,
  MEAL_WINDOWS
} from '@/utils/meal-time';

const DEFAULT_FOOD_OPTIONS = {
  BREAKFAST: [
    'Idli',
    'Medu Vada',
    'Sambar',
    'Coconut Chutney',
    'Tomato Chutney',
    'Poha',
    'Upma',
    'Kesari Bath',
    'Bread & Butter',
    'Boiled Egg',
    'Tea',
    'Coffee'
  ],
  LUNCH: [
    'Steamed Rice',
    'Dal Tadka',
    'Sambar',
    'Paneer Butter Masala',
    'Mixed Veg Sabzi',
    'Aloo Gobi',
    'Roti / Chapati',
    'Curd',
    'Papad',
    'Pickle',
    'Fresh Salad'
  ],
  SNACKS: [
    'Veg Pakoda',
    'Samosa',
    'Chivda',
    'Bun Maska',
    'Green Mint Chutney',
    'Sweet Chutney',
    'Biscuits',
    'Masala Tea',
    'Filter Coffee'
  ],
  DINNER: [
    'Jeera Rice',
    'Steamed Rice',
    'Dal Makhani',
    'Yellow Dal',
    'Paneer Curry',
    'Egg Curry',
    'Roti / Phulka',
    'Mix Veg Kurma',
    'Cucumber Raita',
    'Pickle & Salad',
    'Gulab Jamun'
  ]
};

export default function ReportMealPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  usePageTitle(
    'Report Meal',
    'Report what is currently being served in the dining hall with food items and photo evidence.'
  );

  const currentUser = getUser() || {};
  const currentEmail = currentUser.email || '';
  const todayStr = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // 1. Time status & active slot calculations
  const [serverOffset, setServerOffset] = useState(0);
  const [timeStatus, setTimeStatus] = useState(() => getMealTimeStatus(0));
  const [remainingSecs, setRemainingSecs] = useState(0);
  const [opensInSecs, setOpensInSecs] = useState(0);

  // 2. Data states
  const [loading, setLoading] = useState(true);
  const [consensus, setConsensus] = useState(null);
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [availableFoods, setAvailableFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [customFoodInput, setCustomFoodInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // 3. Photo states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // 4. Community Photos states
  const [communityPhotos, setCommunityPhotos] = useState([]);
  const [loadingCommunityPhotos, setLoadingCommunityPhotos] = useState(false);
  const [communityPhotosError, setCommunityPhotosError] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // 5. Form states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const timerRef = useRef(null);

  // Synchronize server slot info
  const fetchSlotInfo = async () => {
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
      console.error('Failed to sync active slot:', err);
    }
  };

  useEffect(() => {
    fetchSlotInfo();
  }, []);

  // Real-time 1-second timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const status = getMealTimeStatus(serverOffset);
      setTimeStatus(status);
      setRemainingSecs(status.remainingSeconds);

      // Calculate time until next meal opens if closed
      if (!status.isActive && status.nextSlot) {
        const now = new Date(Date.now() + serverOffset);
        const currentSecondsInDay =
          now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const nextStartSeconds = status.nextSlot.startMinutes * 60;
        let diff = nextStartSeconds - currentSecondsInDay;
        if (diff < 0) diff += 86400; // Next day
        setOpensInSecs(diff);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [serverOffset]);

  // Load food suggestions and check for duplicate submission
  const activeSlot = timeStatus.activeSlot;
  const isServing = Boolean(timeStatus.isActive && activeSlot);

  useEffect(() => {
    let isMounted = true;
    if (!activeSlot) {
      setLoading(false);
      return;
    }

    const loadSlotData = async () => {
      setLoading(true);
      const slotKey = activeSlot.key;

      // Check localStorage for duplicate report in this session
      const reportCacheKey = `meal_reported_${todayStr}_${slotKey}_${currentEmail}`;
      if (localStorage.getItem(reportCacheKey)) {
        setAlreadyReported(true);
      }

      try {
        const [consensusData, menuData] = await Promise.all([
          messApi.getMealConsensus(slotKey, todayStr).catch(() => null),
          messApi.getWeeklyMenu().catch(() => null)
        ]);

        if (isMounted) {
          if (consensusData) {
            setConsensus(consensusData);
            if (consensusData.hasReported) {
              setAlreadyReported(true);
            }
          }
          if (menuData) setWeeklyMenu(menuData);

          // Build food options list
          const expected = consensusData?.expectedItems || [];
          const reported = (consensusData?.items || []).map((i) => i.name);
          const menuItems = menuData?.[dayName]?.[slotKey] || [];
          const defaults = DEFAULT_FOOD_OPTIONS[slotKey] || [];

          const combined = Array.from(
            new Set([...expected, ...menuItems, ...reported, ...defaults])
          );
          setAvailableFoods(combined);
        }
      } catch (err) {
        console.error('Failed to load foods:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSlotData();
    return () => {
      isMounted = false;
    };
  }, [activeSlot?.key, todayStr, currentEmail, dayName]);

  // Fetch community photos for currently active meal
  const fetchCommunityPhotos = async () => {
    try {
      setLoadingCommunityPhotos(true);
      setCommunityPhotosError('');
      const photos = await messApi.getCurrentMealPhotos();
      if (Array.isArray(photos)) {
        setCommunityPhotos(photos);
      }
    } catch (err) {
      console.error('Failed to load current meal community photos:', err);
      setCommunityPhotosError('Could not load community photos. Please try again.');
    } finally {
      setLoadingCommunityPhotos(false);
    }
  };

  useEffect(() => {
    fetchCommunityPhotos();
  }, [activeSlot?.key, isServing]);

  const formatPhotoTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Auto trigger camera/gallery if URL has ?photo=1
  useEffect(() => {
    if (searchParams.get('photo') === '1' && isServing && !loading) {
      const timer = setTimeout(() => {
        cameraInputRef.current?.click() || galleryInputRef.current?.click();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams, isServing, loading]);

  // Food selection handlers
  const toggleFood = (item) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
    if (submitError) setSubmitError('');
  };

  const handleAddCustomFood = (e) => {
    e?.preventDefault();
    const clean = customFoodInput.trim();
    if (!clean) return;

    if (!selectedItems.includes(clean)) {
      setSelectedItems((prev) => [...prev, clean]);
    }
    if (!availableFoods.includes(clean)) {
      setAvailableFoods((prev) => [clean, ...prev]);
    }
    setCustomFoodInput('');
    setShowCustomInput(false);
    toast.success('Food Added', `Added "${clean}" to your selection.`);
  };

  // Photo handlers
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please select a valid image file.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
    if (submitError) setSubmitError('');
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Submit report
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isServing || submitting) return;

    if (selectedItems.length === 0 && !photoFile) {
      setSubmitError('Please select at least one food item or attach a meal photo before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      let photoUrl = '';

      // 1. Upload photo if present
      if (photoFile) {
        const formData = new FormData();
        formData.append('images', photoFile);
        formData.append('mealType', activeSlot.key);
        formData.append(
          'description',
          selectedItems.length > 0
            ? selectedItems.join(', ')
            : `Student report for ${activeSlot.name}`
        );

        const uploadRes = await messApi.uploadStudentPhoto(formData);
        if (uploadRes?.id) {
          photoUrl = `/api/student-photos/${uploadRes.id}/image`;
        }
      }

      // 2. Submit student meal consensus report
      await messApi.submitMealConsensus(
        activeSlot.key,
        todayStr,
        selectedItems,
        photoUrl
      );

      // Cache report to avoid duplicate prompt
      const reportCacheKey = `meal_reported_${todayStr}_${activeSlot.key}_${currentEmail}`;
      localStorage.setItem(reportCacheKey, 'true');

      setSubmitSuccess(true);
      toast.success(
        'Report Submitted',
        `Thank you! Reported ${selectedItems.length} items for ${activeSlot.name}.`
      );
      fetchCommunityPhotos();
    } catch (err) {
      console.error('Failed to submit report:', err);
      const errMsg = err?.response?.data?.message || err.message || '';
      if (errMsg.toLowerCase().includes('already reported')) {
        setAlreadyReported(true);
      } else {
        setSubmitError(
          'Could not submit your report. Please check your network connection and try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered food items based on search input
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return availableFoods;
    const query = searchQuery.trim().toLowerCase();
    return availableFoods.filter((f) => f.toLowerCase().includes(query));
  }, [availableFoods, searchQuery]);

  return (
    <div className="w-full space-y-6 pb-16 max-w-2xl mx-auto">
      {/* ──────────────── TOP NAVIGATION ──────────────── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/student/meals')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Today's Meals</span>
        </button>

        <span className="text-[11px] font-mono text-on-surface-variant">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>

      {/* ──────────────── CASE 1: LOADING STATE ──────────────── */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-on-surface-variant font-medium">
            Checking current meal status...
          </p>
        </div>
      ) : !isServing ? (
        /* ──────────────── CASE 2: CLOSED STATE ──────────────── */
        <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-outline-variant/20 space-y-5">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
              Service Inactive
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-2">
              Meal reporting is closed
            </h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Reports and meal photos can only be submitted while a meal is currently being served.
            </p>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                Next Meal
              </span>
              <span className="text-base font-bold text-on-surface">
                {timeStatus.nextSlot ? timeStatus.nextSlot.name : 'Breakfast'}
              </span>
              <span className="text-xs font-mono text-on-surface-variant ml-2">
                {timeStatus.nextSlot ? timeStatus.nextSlot.time : '07:30 – 09:30'}
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                Reporting opens in
              </span>
              <span className="text-base font-bold font-mono text-primary">
                {formatCountdown(opensInSecs)}
              </span>
            </div>
          </div>

          {/* Daily Schedule Reference */}
          <div className="space-y-2 pt-1 border-t border-outline-variant/10 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline block">
              Hostel Dining Timetable
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/10">
                <span className="block font-bold text-on-surface">Breakfast</span>
                <span className="text-[11px] text-on-surface-variant">07:30 – 09:30</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/10">
                <span className="block font-bold text-on-surface">Lunch</span>
                <span className="text-[11px] text-on-surface-variant">12:30 – 14:30</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/10">
                <span className="block font-bold text-on-surface">Snacks</span>
                <span className="text-[11px] text-on-surface-variant">16:30 – 17:30</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/10">
                <span className="block font-bold text-on-surface">Dinner</span>
                <span className="text-[11px] text-on-surface-variant">19:30 – 21:30</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/student/meals')}
              className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/20 shadow-xs cursor-pointer transition-all"
            >
              View Today's Meals
            </button>
          </div>
        </div>
      ) : alreadyReported ? (
        /* ──────────────── CASE 3: ALREADY REPORTED STATE ──────────────── */
        <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-outline-variant/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center mx-auto shadow-xs">
            <span className="material-symbols-outlined text-[28px] text-secondary">
              check_circle
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-on-surface">You already reported this meal</h2>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Your contribution for {activeSlot.name} has already been recorded. You can view the live community consensus report.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/student/meals')}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              View Today's Meal
            </button>
          </div>
        </div>
      ) : submitSuccess ? (
        /* ──────────────── CASE 4: SUBMIT SUCCESS STATE ──────────────── */
        <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-outline-variant/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center mx-auto shadow-xs">
            <span className="material-symbols-outlined text-[28px] text-secondary">task_alt</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-on-surface">✓ Meal report submitted</h2>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Your report has been added to today's community meal information and helps fellow hostel residents.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/student/meals')}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              View Today's Meal
            </button>
          </div>
        </div>
      ) : (
        /* ──────────────── CASE 5: ACTIVE MEAL REPORTING FORM ──────────────── */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Card: Active Meal & Live Countdown */}
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                  Report Meal
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-0.5">
                  {activeSlot.name}
                </h1>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Currently being served · <span className="font-mono">{activeSlot.time}</span>
                </p>
              </div>

              <div className="inline-flex items-center gap-2 bg-surface-container px-3.5 py-1.5 rounded-xl border border-outline-variant/20 self-start sm:self-auto">
                <span className="text-xs text-on-surface-variant font-medium">Ends in:</span>
                <span className="text-lg font-bold font-mono text-primary tracking-tight">
                  {formatCountdown(remainingSecs)}
                </span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-error-container/30 border border-error/20 flex items-center justify-between gap-3 text-xs text-error">
              <span>{submitError}</span>
              <button
                type="button"
                onClick={() => setSubmitError('')}
                className="text-error font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ──────────────── SECTION: WHAT ARE YOU SEEING? ──────────────── */}
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline-variant/15">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                  WHAT ARE YOU SEEING?
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Select everything currently being served on the counter.
                </p>
              </div>

              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="text-xs text-outline hover:text-on-surface cursor-pointer self-start sm:self-auto"
                >
                  Clear selection ({selectedItems.length})
                </button>
              )}
            </div>

            {/* Fast Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food items..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Food Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {filteredFoods.map((item) => {
                const isSelected = selectedItems.includes(item);

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleFood(item)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary-fixed/30 text-on-surface font-bold ring-1 ring-primary/30 shadow-2xs'
                        : 'border-outline-variant/20 bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <span className="truncate pr-2">{item}</span>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary text-on-primary'
                          : 'border border-outline-variant text-transparent'
                      }`}
                    >
                      {isSelected ? '✓' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Add Custom Food Option */}
            <div className="pt-2 border-t border-outline-variant/10">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ Add food not listed</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={customFoodInput}
                    onChange={(e) => setCustomFoodInput(e.target.value)}
                    placeholder="Enter dish name (e.g. Masala Dosa)"
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomFood();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomFood}
                    className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomFoodInput('');
                    }}
                    className="px-2.5 py-2 rounded-xl text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ──────────────── SECTION: PHOTO EVIDENCE (OPTIONAL) ──────────────── */}
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                  PHOTO EVIDENCE
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Add a photo of today's meal to help verify the report.
                </p>
              </div>
              <span className="text-[11px] font-medium text-outline">Optional</span>
            </div>

            {/* Hidden native inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />

            {!photoPreview ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  <span>Take Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/20 shadow-xs cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">
                    photo_library
                  </span>
                  <span>Choose from Gallery</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-outline-variant/20 bg-black/90 max-h-56 flex items-center justify-center">
                  <img
                    src={photoPreview}
                    alt="Meal preview"
                    className="max-h-56 w-full object-contain"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-mono text-[11px] truncate max-w-[220px]">
                    {photoFile?.name || 'Photo attached'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs font-bold text-error hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ──────────────── SECTION: SUBMISSION SUMMARY ──────────────── */}
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline block">
              YOUR REPORT SUMMARY
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
                <span className="text-on-surface-variant">Meal</span>
                <span className="font-bold text-on-surface">{activeSlot.name}</span>
              </div>

              <div className="flex items-baseline justify-between py-1 border-b border-outline-variant/10">
                <span className="text-on-surface-variant">Foods</span>
                <span className="font-bold text-on-surface text-right max-w-xs truncate">
                  {selectedItems.length > 0 ? selectedItems.join(' · ') : 'None selected'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-on-surface-variant">Photo Evidence</span>
                <span className="font-bold text-on-surface">
                  {photoFile ? 'Added ✓' : 'None'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || (selectedItems.length === 0 && !photoFile)}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Submitting report...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>

              {selectedItems.length === 0 && !photoFile && (
                <p className="text-[11px] text-center text-outline mt-2">
                  Select at least one food item or attach a photo to submit.
                </p>
              )}
            </div>
          </div>
        </form>
      )}

      {/* ──────────────── SECTION: COMMUNITY PHOTOS ──────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">photo_camera</span>
            <h2 className="text-base font-bold text-on-surface">Community Photos</h2>
            {activeSlot && (
              <span className="px-2 py-0.5 rounded-md bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-semibold">
                {activeSlot.name}
              </span>
            )}
          </div>
          {communityPhotos.length > 0 && (
            <span className="text-xs text-on-surface-variant font-mono">
              {communityPhotos.length} {communityPhotos.length === 1 ? 'photo' : 'photos'}
            </span>
          )}
        </div>

        {loadingCommunityPhotos ? (
          <div className="flex items-center justify-center py-8 text-on-surface-variant text-xs gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading photos...</span>
          </div>
        ) : communityPhotosError ? (
          <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center justify-between">
            <span>{communityPhotosError}</span>
            <button
              type="button"
              onClick={fetchCommunityPhotos}
              className="text-xs font-bold underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : communityPhotos.length === 0 ? (
          <div className="py-8 text-center bg-surface-container-low rounded-xl border border-outline-variant/10 text-on-surface-variant text-xs space-y-1">
            <span className="material-symbols-outlined text-[28px] text-outline">photo_camera</span>
            <p className="font-medium text-on-surface">No photos yet for this meal.</p>
            <p className="text-[11px] text-on-surface-variant">
              Be the first to upload a plate photo with your report above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {communityPhotos.map((photo) => (
              <button
                key={photo.id || photo.imageUrl}
                type="button"
                onClick={() => setLightboxPhoto(photo)}
                className="group text-left rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 transition-all flex flex-col cursor-pointer"
              >
                <div className="aspect-square w-full bg-surface-container relative overflow-hidden">
                  <img
                    src={photo.imageUrl || (photo.id ? `/api/student-photos/${photo.id}/image` : '')}
                    alt={photo.caption || 'Meal photo'}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {photo.uploadedAt && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs">
                      {formatPhotoTime(photo.uploadedAt)}
                    </span>
                  )}
                </div>
                {photo.caption && (
                  <div className="p-2 min-w-0">
                    <p className="text-[11px] text-on-surface font-medium truncate" title={photo.caption}>
                      {photo.caption}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Preview Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-surface-container-lowest max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface">
                  {lightboxPhoto.mealType || activeSlot?.name || 'Meal Photo'}
                </span>
                {lightboxPhoto.uploadedAt && (
                  <span className="text-[11px] font-mono text-on-surface-variant">
                    • {formatPhotoTime(lightboxPhoto.uploadedAt)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={lightboxPhoto.imageUrl || (lightboxPhoto.id ? `/api/student-photos/${lightboxPhoto.id}/image` : '')}
                alt={lightboxPhoto.caption || 'Meal photo preview'}
                className="w-full h-full max-h-[70vh] object-contain"
              />
            </div>

            {lightboxPhoto.caption && (
              <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant/20">
                <p className="text-xs text-on-surface font-medium">{lightboxPhoto.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
