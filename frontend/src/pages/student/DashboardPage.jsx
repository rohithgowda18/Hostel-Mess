import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUser } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import { usePageTitle } from '@/hooks/use-page-title';
import { useToast } from '@/context/toast-context';

const MEAL_SLOTS = [
  { key: 'BREAKFAST', name: 'Breakfast', time: '07:30 AM – 09:30 AM', icon: 'free_breakfast' },
  { key: 'LUNCH', name: 'Lunch', time: '12:30 PM – 02:30 PM', icon: 'lunch_dining' },
  { key: 'SNACKS', name: 'Snacks', time: '04:30 PM – 05:30 PM', icon: 'bakery_dining' },
  { key: 'DINNER', name: 'Dinner', time: '07:30 PM – 09:45 PM', icon: 'dinner_dining' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle('Dashboard', 'Live hostel mess schedule, meal attendance declaration, and consensus dish tracking.');
  const [currentUser, setCurrentUser] = useState(getUser() || {});
  const [slotInfo, setSlotInfo] = useState(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [remainingSecs, setRemainingSecs] = useState(0);
  // isMealExpiredLocally: true when the countdown has hit 0 and we're waiting for server confirmation
  const [isMealExpiredLocally, setIsMealExpiredLocally] = useState(false);
  const [consensus, setConsensus] = useState(null);
  const [attendance, setAttendance] = useState({ expected: null });
  const [announcements, setAnnouncements] = useState([]);
  const [sendingMealCall, setSendingMealCall] = useState(false);
  const [notifyFriendsCount, setNotifyFriendsCount] = useState(0);
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Community & Photo capture states
  const [currentPhotos, setCurrentPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [capturedFile, setCapturedFile] = useState(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const cameraInputRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const timerRef = useRef(null);

  // ─── SINGLE SOURCE OF TRUTH ───────────────────────────────────────────────
  // A meal is considered active only when the server says so AND the local
  // countdown has NOT expired. This eliminates the brief stale window between
  // countdown reaching 0 and the re-fetch completing.
  const isMealActive = Boolean(slotInfo?.isActive) && !isMealExpiredLocally;

  // 1. Fetch server slot info & synchronize clock
  const fetchSlotInfo = useCallback(async () => {
    try {
      const data = await messApi.getActiveSlotInfo();
      if (data) {
        setSlotInfo(data);
        // Once server confirms state, clear any local expiry flag
        setIsMealExpiredLocally(false);
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
  }, []);

  useEffect(() => {
    fetchSlotInfo();
    const interval = setInterval(fetchSlotInfo, 30000);
    return () => clearInterval(interval);
  }, [fetchSlotInfo]);

  // 2. Real-time 1-second countdown — isMealExpiredLocally immediately gates all
  //    controls when the timer hits 0, before the async re-fetch completes.
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (slotInfo?.isActive && slotInfo.endTimeMillis) {
      timerRef.current = setInterval(() => {
        const currentServerTime = Date.now() + serverOffset;
        const diff = Math.floor((slotInfo.endTimeMillis - currentServerTime) / 1000);

        if (diff <= 0) {
          setRemainingSecs(0);
          // Immediately disable all meal actions — do not wait for the HTTP re-fetch
          setIsMealExpiredLocally(true);
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
  }, [slotInfo?.isActive, slotInfo?.endTimeMillis, serverOffset, fetchSlotInfo]);

  // 3. Load meal consensus, menu, and resident data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const targetSlot = slotInfo?.activeSlot || slotInfo?.nextSlot?.key || 'LUNCH';
        const [consensusData, attendanceData, notices, me, menuData, friendsData] = await Promise.all([
          messApi.getMealConsensus(targetSlot, todayStr).catch(() => null),
          messApi.getMyAttendanceStatus(targetSlot, todayStr).catch(() => ({ expected: null })),
          messApi.getAnnouncements().catch(() => []),
          messApi.getMyProfile().catch(() => null),
          messApi.getWeeklyMenu().catch(() => null),
          messApi.getFriends().catch(() => null)
        ]);

        if (isMounted) {
          if (consensusData) setConsensus(consensusData);
          if (attendanceData) setAttendance(attendanceData);
          if (Array.isArray(notices)) setAnnouncements(notices);
          if (me) setCurrentUser(me);
          if (menuData) setWeeklyMenu(menuData);
          const count = friendsData?.notifyFriendIds?.length ?? (me?.notifyFriendIds?.length || 0);
          setNotifyFriendsCount(count);
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

  const handleComeToMeal = async () => {
    if (sendingMealCall) return;
    if (!isMealActive) {
      toast.warning('No Active Meal', 'Tell Friends is only available while a meal is being served.');
      return;
    }
    if (notifyFriendsCount === 0) {
      toast.warning('No Notify Friends', 'Add friends to Notify Friends in Profile to use this.');
      return;
    }
    setSendingMealCall(true);
    try {
      const res = await messApi.sendMealCall();
      toast.success('Meal Call Sent', res.message || `Notified ${res.notifiedCount || 'your'} friends.`);
    } catch (err) {
      toast.error('Meal Call Failed', err.response?.data?.error || err.message || 'Could not send meal notification.');
    } finally {
      setSendingMealCall(false);
    }
  };

  // 4. Fetch community photos for active meal
  const fetchCurrentPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const photos = await messApi.getCurrentMealPhotos();
      if (Array.isArray(photos)) {
        setCurrentPhotos(photos);
      }
    } catch (err) {
      console.error('Failed to load current meal photos:', err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    fetchCurrentPhotos();
  }, [slotInfo?.activeSlot]);

  // 5. Camera capture and photo upload handlers
  const handleCameraClick = () => {
    if (!isMealActive) {
      toast.warning(
        'Meal Service Inactive',
        'Photo reporting starts when the meal is being served.'
      );
      return;
    }
    cameraInputRef.current?.click();
  };

  const handlePhotoCaptured = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum image size allowed is 5MB.');
      return;
    }

    setCapturedFile(file);
    setCapturedPreviewUrl(URL.createObjectURL(file));
    setPhotoCaption('');
    setUploadError('');
    setShowCaptureModal(true);
    e.target.value = '';
  };

  const closeCaptureModal = () => {
    setShowCaptureModal(false);
    setCapturedFile(null);
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
      setCapturedPreviewUrl('');
    }
    setPhotoCaption('');
    setUploadError('');
  };

  const handleUploadPhoto = async () => {
    if (!capturedFile) return;

    if (!isMealActive) {
      const msg = 'This meal service has ended. Photos can no longer be uploaded.';
      setUploadError(msg);
      toast.error('Meal Ended', msg);
      return;
    }

    setUploadingPhoto(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('images', capturedFile);
      formData.append('mealType', slotInfo.activeSlot);
      if (photoCaption.trim()) {
        formData.append('caption', photoCaption.trim());
        formData.append('description', photoCaption.trim());
      }

      const res = await messApi.uploadStudentPhoto(formData);
      toast.success(
        'Photo Uploaded',
        `Your photo for ${slotInfo.slotName || slotInfo.activeSlot} was submitted successfully.`
      );

      // Immediately display newly uploaded photo on Dashboard without reloading
      if (res && (res.id || res.imageUrl)) {
        setCurrentPhotos((prev) => [
          {
            id: res.id,
            imageUrl: res.imageUrl || `/api/student-photos/${res.id}/image`,
            caption: photoCaption.trim() || res.caption,
            uploadedAt: res.uploadedAt || new Date().toISOString(),
            mealType: slotInfo.activeSlot,
            userEmail: currentUser?.email
          },
          ...prev.filter((p) => p.id !== res.id)
        ]);
      }

      closeCaptureModal();
      // Also refresh from server to ensure sync
      fetchCurrentPhotos();
    } catch (err) {
      console.error('Failed to upload meal photo:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Upload failed. The meal service may have closed or network failed.';
      setUploadError(errMsg);
      toast.error('Upload Failed', errMsg);
    } finally {
      setUploadingPhoto(false);
    }
  };

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

  const handleAttendanceChange = async (expected) => {
    // Only allow attendance declaration while an active meal is being served
    if (!isMealActive) {
      toast.warning(
        'No Active Meal',
        'Attendance declaration is only available while a meal is being served.'
      );
      return;
    }
    // Always use the confirmed active slot — never the next/upcoming slot
    const slotKey = slotInfo.activeSlot;
    setSubmittingAttendance(true);
    try {
      await messApi.setExpectedAttendance(slotKey, todayStr, expected);
      setAttendance({ expected });
      toast.success(
        'Attendance Updated',
        expected ? `You're marked as ATTENDING for ${slotKey}.` : `You're marked as SKIPPING ${slotKey}.`
      );
    } catch (err) {
      console.error('Failed to update attendance:', err);
      const errMsg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Could not record attendance declaration. Please try again.';
      toast.error('Update Failed', errMsg);
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

  // Real dishes from consensus or menu
  const reportedItems = consensus?.items?.map((i) => i.name) || [];
  const expectedItems = consensus?.expectedItems || [];
  const currentSlotKey = slotInfo?.activeSlot || slotInfo?.nextSlot?.key || 'LUNCH';
  const todayMenuForSlot = weeklyMenu?.[dayName]?.[currentSlotKey] || [];
  const liveDishes = reportedItems.length > 0 ? reportedItems : (expectedItems.length > 0 ? expectedItems : todayMenuForSlot);

  // Total reports
  const totalReporters = consensus?.totalReporters || 0;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Bar: Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            Welcome back, <span className="text-primary">{displayName}</span>
          </h1>
          <p className="text-xs text-on-surface-variant flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1 font-medium text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary">domain</span>
              {currentUser?.hostel || 'Hostel Campus'}
            </span>
            {currentUser?.roomNumber && (
              <>
                <span className="text-outline-variant">•</span>
                <span>Room {currentUser.roomNumber}</span>
              </>
            )}
            <span className="text-outline-variant">•</span>
            <span className="inline-flex items-center gap-1 text-secondary font-medium">
              <span className="material-symbols-outlined text-[16px]">verified</span> Account Active
            </span>
          </p>
        </div>

        {/* Live Broadcast Notice */}
        {latestNotice && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container-high/60 backdrop-blur-md shadow-xs border border-outline-variant/30 max-w-md">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px]">campaign</span>
            </div>
            <div className="flex flex-col pr-2 min-w-0">
              <span className="text-[11px] text-primary uppercase font-bold tracking-wider truncate">
                {latestNotice.title}
              </span>
              <span className="text-xs font-medium text-on-surface line-clamp-1">
                {latestNotice.message}
              </span>
            </div>
            <button
              onClick={() => navigate('/student/notices')}
              className="px-2.5 py-1 bg-surface-container-lowest hover:bg-surface-container text-primary text-xs rounded-lg shadow-xs font-semibold shrink-0 cursor-pointer"
              type="button"
            >
              View
            </button>
          </div>
        )}
      </div>

      {/* Hero Status Section: Current Meal & Attendance Declaration */}
      <div className="w-full bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary-fixed/40 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-4 relative z-10">
          {/* Top bar: status badge + time */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                {isMealActive ? 'ACTIVE SERVICE' : 'UPCOMING SERVICE'}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {isMealActive ? 'Mess Hall Open' : 'Kitchen In Preparation'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-md font-mono">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
              {slotInfo?.time || slotInfo?.nextSlot?.time || '12:30 PM – 2:30 PM'}
            </div>
          </div>

          {/* Two-column body: left=meal info, right=meal activity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* LEFT: Meal info */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                    {isMealActive ? 'Now Serving' : 'Next Meal'}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
                    {isMealActive
                      ? slotInfo.slotName || slotInfo.activeSlot
                      : slotInfo?.nextSlot?.name || 'Upcoming Meal'}
                  </h2>
                </div>
                {isMealActive && slotInfo?.endTimeMillis ? (
                  <div className="flex items-baseline gap-1.5 bg-surface-container px-3.5 py-1.5 rounded-xl border border-outline-variant/20">
                    <span className="text-xs text-on-surface-variant font-medium">Closing in:</span>
                    <div className="text-lg font-bold font-mono text-primary tracking-tight">
                      {formatCountdown(remainingSecs)}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Live menu items */}
              <div>
                {liveDishes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {liveDishes.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-on-surface border border-outline-variant/20"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant italic">
                    Menu items are being confirmed by resident peer reports.
                  </p>
                )}
              </div>

              {totalReporters > 0 && (
                <p className="text-[11px] text-secondary font-medium">
                  Verified with {totalReporters} student peer {totalReporters === 1 ? 'report' : 'reports'} today.
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {isMealActive ? (
                  <button
                    type="button"
                    onClick={() => navigate('/student/report-meal')}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_note</span>
                    Report {slotInfo.slotName || slotInfo.activeSlot || 'Meal'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/10">
                    <span className="material-symbols-outlined text-[16px] text-outline">edit_off</span>
                    <span>Reporting opens when the next meal is being served.</span>
                  </div>
                )}
              </div>

              {isMealActive && notifyFriendsCount === 0 && (
                <p className="text-[11px] text-on-surface-variant/80">
                  Add friends to Notify Friends in <Link to="/student/profile" className="text-primary font-semibold hover:underline">Profile</Link> to use this.
                </p>
              )}
            </div>

            {/* RIGHT: Compact Meal Activity */}
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-3 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Meal Activity</p>

              {/* Photo area */}
              {loadingPhotos ? (
                <div className="flex items-center justify-center py-4 gap-2 text-on-surface-variant text-xs">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading photos…</span>
                </div>
              ) : currentPhotos.length === 0 ? (
                // Empty state — no meal photo yet
                (
                  <div className="flex flex-col items-center justify-center py-3 gap-1 text-on-surface-variant text-[11px] text-center">
                    <span className="material-symbols-outlined text-[20px] text-outline">photo_camera</span>
                  </div>
                )
              ) : (
                // Compact thumbnail row — max 4 visible
                <div className="flex gap-1.5 items-center">
                  {currentPhotos.slice(0, 4).map((photo, i) => (
                    <button
                      key={photo.id || photo.imageUrl || i}
                      type="button"
                      onClick={() => setLightboxPhoto(photo)}
                      className="relative rounded-lg overflow-hidden border border-outline-variant/20 hover:border-primary/50 transition-all cursor-pointer shrink-0 w-16 h-16 bg-surface-container"
                      title={photo.caption || 'View photo'}
                    >
                      <img
                        src={photo.imageUrl || (photo.id ? `/api/student-photos/${photo.id}/image` : '')}
                        alt={photo.caption || 'Meal photo'}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {photo.uploadedAt && (
                        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono leading-none">
                          {formatPhotoTime(photo.uploadedAt)}
                        </span>
                      )}
                    </button>
                  ))}
                  {currentPhotos.length > 4 && (
                    <span className="text-[11px] font-bold text-on-surface-variant px-1">+{currentPhotos.length - 4}</span>
                  )}
                </div>
              )}

              {/* Caption of newest photo */}
              {currentPhotos.length > 0 && currentPhotos[0].caption && (
                <p className="text-[11px] text-on-surface-variant italic line-clamp-1">{currentPhotos[0].caption}</p>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Declaration Pill Toggle */}
        <div className="mt-6 pt-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs ${isMealActive ? 'bg-surface-container-lowest text-primary' : 'bg-surface-container text-on-surface-variant/50'
              }`}>
              <span className="material-symbols-outlined text-[20px]">dining</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Meal Attendance Status</p>
              <p className="text-[11px] text-on-surface-variant">
                {!isMealActive
                  ? 'Attendance declaration is available while a meal is being served.'
                  : attendance.expected === true
                    ? 'Declared: You are attending this meal'
                    : attendance.expected === false
                      ? 'Declared: You are skipping this meal'
                      : 'Please declare attendance to help cut food waste'}
              </p>
            </div>
          </div>

          <div className={`inline-flex p-1 rounded-full shadow-inner w-full sm:w-auto ${isMealActive ? 'bg-surface-container-high' : 'bg-surface-container/50'
            }`}>
            <button
              type="button"
              disabled={submittingAttendance || !isMealActive}
              onClick={() => handleAttendanceChange(true)}
              title={!isMealActive ? 'Available while a meal is being served' : 'Mark yourself as attending'}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${!isMealActive
                  ? 'text-on-surface-variant/40 cursor-not-allowed'
                  : attendance.expected === true
                    ? 'bg-secondary text-on-secondary shadow-xs cursor-pointer'
                    : 'text-on-surface-variant hover:text-on-surface cursor-pointer'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Will Eat
            </button>
            <button
              type="button"
              disabled={submittingAttendance || !isMealActive}
              onClick={() => handleAttendanceChange(false)}
              title={!isMealActive ? 'Available while a meal is being served' : 'Mark yourself as skipping'}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${!isMealActive
                  ? 'text-on-surface-variant/40 cursor-not-allowed'
                  : attendance.expected === false
                    ? 'bg-error text-on-error shadow-xs cursor-pointer'
                    : 'text-on-surface-variant hover:text-on-surface cursor-pointer'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              Skip Meal
            </button>
          </div>
        </div>
      </div>

      {/* Primary Layout Grid: Daily Menu Breakdown (8 cols) + Side Operations Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Complete Today's Menu Breakdown (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Today's Meal Schedule</h2>
              <p className="text-xs text-on-surface-variant">Scheduled meals and reported items for today</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/student/meals')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Full weekly menu →
            </button>
          </div>

          <div className="space-y-3">
            {MEAL_SLOTS.map((slot) => {
              const isCurrent = slotInfo?.activeSlot === slot.key;
              const slotItems = weeklyMenu?.[dayName]?.[slot.key] || [];

              return (
                <div
                  key={slot.key}
                  className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm border transition-all ${isCurrent
                      ? 'border-primary ring-1 ring-primary/20'
                      : 'border-outline-variant/20'
                    }`}
                >
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCurrent
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant'
                        }`}>
                        <span className="material-symbols-outlined text-[18px]">{slot.icon}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-on-surface">{slot.name}</span>
                        <span className="text-on-surface-variant text-[11px] ml-2">{slot.time}</span>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant">
                        NOW ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-on-surface-variant">
                        Scheduled
                      </span>
                    )}
                  </div>

                  <div className="pt-1">
                    {Array.isArray(slotItems) && slotItems.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {slotItems.map((dish, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-surface-container-low text-xs text-on-surface border border-outline-variant/10"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant italic">
                        Menu details scheduled for this session.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Shortcuts & Actions (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20 space-y-3">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider text-outline">
              Campus Dining Actions
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                disabled={!isMealActive}
                onClick={() => isMealActive && navigate('/student/report-meal')}
                title={isMealActive ? 'Report dishes being served right now' : 'Reporting opens when the next meal is being served'}
                className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all border ${isMealActive
                    ? 'bg-surface-container-low hover:bg-surface-container cursor-pointer border-outline-variant/10'
                    : 'bg-surface-container/40 cursor-not-allowed border-outline-variant/10 opacity-60'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMealActive ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-on-surface-variant/50'
                    }`}>
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Report Meal</span>
                    <span className="text-[11px] text-on-surface-variant">
                      {isMealActive ? 'Confirm dishes served live' : 'Opens when next meal starts'}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/student/groups')}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left transition-all cursor-pointer border border-outline-variant/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">groups</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Buddy Groups</span>
                    <span className="text-[11px] text-on-surface-variant">Coordinate with hostel friends</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/student/feedback')}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left transition-all cursor-pointer border border-outline-variant/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">star</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Rate Meal Quality</span>
                    <span className="text-[11px] text-on-surface-variant">Share taste & hygiene feedback</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/student/complaints')}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left transition-all cursor-pointer border border-outline-variant/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">report_problem</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Log Grievance Ticket</span>
                    <span className="text-[11px] text-on-surface-variant">Direct to warden & mess committee</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
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
                  {lightboxPhoto.mealType || slotInfo?.slotName || 'Meal Photo'}
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

      {/* Hidden File / Camera Capture Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoCaptured}
      />

      {/* Floating Action Buttons - Fixed to viewport bottom-right */}
      <div className="fixed right-4 md:right-6 z-40 flex flex-col-reverse gap-3 pointer-events-none md:bottom-6 bottom-[calc(80px+env(safe-area-inset-bottom))]">
        {/* Tell Friends Button */}
        <button
          type="button"
          onClick={handleComeToMeal}
          disabled={sendingMealCall || !isMealActive}
          title="Tell Friends"
          aria-label="Tell friends about current meal"
          className={`pointer-events-auto w-12 h-12 sm:w-13 sm:h-13 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/20 ${!isMealActive
              ? 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed opacity-60'
              : 'bg-secondary text-on-secondary hover:bg-secondary/90 active:bg-secondary/80 cursor-pointer'
            }`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {sendingMealCall ? 'hourglass_top' : 'group'}
          </span>
        </button>

        {/* Add Photo Button */}
        <button
          type="button"
          onClick={handleCameraClick}
          disabled={!isMealActive}
          title="Add Photo"
          aria-label="Add meal photo"
          className={`pointer-events-auto w-12 h-12 sm:w-13 sm:h-13 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/20 ${isMealActive
              ? 'bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/80 cursor-pointer'
              : 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed opacity-60'
            }`}
        >
          <span className="material-symbols-outlined text-[24px]">photo_camera</span>
        </button>
      </div>

      {/* Photo Capture Preview & Upload Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-5 sm:p-6 shadow-2xl border border-outline-variant/30 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">photo_camera</span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Submit Meal Photo</h3>
                  <span className="text-[11px] text-on-surface-variant">
                    {slotInfo?.slotName || slotInfo?.activeSlot || 'Active Meal'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCaptureModal}
                disabled={uploadingPhoto}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Photo preview container */}
            <div className="relative rounded-xl overflow-hidden bg-black/90 max-h-64 flex items-center justify-center border border-outline-variant/20">
              {capturedPreviewUrl && (
                <img
                  src={capturedPreviewUrl}
                  alt="Captured meal preview"
                  className="max-h-64 w-full object-contain"
                />
              )}
            </div>

            {/* Caption Input */}
            <div className="space-y-1">
              <label htmlFor="photo-caption-input" className="text-[11px] font-semibold text-on-surface-variant block">
                Caption (Optional)
              </label>
              <input
                id="photo-caption-input"
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="e.g. Hot sambar & fresh idli being served..."
                maxLength={140}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Error alerts */}
            {!isMealActive ? (
              <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>The meal service has ended. Photos can no longer be uploaded.</span>
              </div>
            ) : uploadError ? (
              <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{uploadError}</span>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={closeCaptureModal}
                disabled={uploadingPhoto}
                className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadPhoto}
                disabled={uploadingPhoto || !isMealActive}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingPhoto ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Upload Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
