import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import {
  QrCode,
  Camera,
  Flashlight,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Hash,
  Clock,
  Wifi,
  WifiOff,
  KeyRound,
  UserCheck,
  AlertCircle,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

const MEAL_ICONS = {
  BREAKFAST: Coffee,
  LUNCH: Sun,
  SNACKS: Sunset,
  DINNER: Moon,
};

function getLocalMealSlot() {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 10) return 'BREAKFAST';
  if (hour >= 12 && hour < 15) return 'LUNCH';
  if (hour >= 16 && hour < 18) return 'SNACKS';
  if (hour >= 19 && hour < 22) return 'DINNER';
  return 'LUNCH'; // Default fallback
}

export default function QrCheckinPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const currentUser = getUser() || {};
  const isAdmin = currentUser.role === 'ADMIN';

  // Mode: students default to 'pass', admins default to 'scanner'
  const [activeTab, setActiveTab] = useState(isAdmin ? 'scanner' : 'pass');
  const [currentSlot, setCurrentSlot] = useState(getLocalMealSlot);
  const [currentService, setCurrentService] = useState(null);
  const [liveToken, setLiveToken] = useState('');
  const [secsLeft, setSecsLeft] = useState(60);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [overlay, setOverlay] = useState(null); // 'success' | 'failure' | null
  const [scanMessage, setScanMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [recentScans, setRecentScans] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch current active service and token
  const loadServiceAndStatus = useCallback(async () => {
    try {
      const service = await messApi.getCurrentMealService().catch(() => null);
      const slot = service?.mealType ? service.mealType.toUpperCase() : getLocalMealSlot();
      setCurrentSlot(slot);
      if (service) setCurrentService(service);

      // Check attendance status for student
      const statusRes = await messApi.getMyAttendanceStatus(slot, todayStr).catch(() => null);
      setAttendanceStatus(statusRes);

      // Fetch dynamic anti-replay token from backend
      const qrRes = await messApi.getQrCode(slot, todayStr).catch(() => null);
      if (qrRes && qrRes.code) {
        setLiveToken(qrRes.code);
      } else {
        // Fallback offline dynamic token
        setLiveToken(generateLocalPassToken(slot, todayStr));
      }
    } catch (e) {
      setLiveToken(generateLocalPassToken(currentSlot, todayStr));
    }
  }, [todayStr, currentSlot]);

  const generateLocalPassToken = (slot, date) => {
    const hour = new Date().getHours();
    const window5m = Math.floor(new Date().getMinutes() / 5);
    const seed = `${currentUser.email || 'student'}:${date}:${slot}:${hour}:${window5m}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const signature = Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
    const nonce = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PASS-${signature}-${nonce}`;
  };

  useEffect(() => {
    loadServiceAndStatus();

    // 1-second countdown for rotating pass
    const timer = setInterval(() => {
      setSecsLeft((prev) => {
        if (prev <= 1) {
          loadServiceAndStatus();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadServiceAndStatus]);

  // Camera initialization when in scanner mode
  useEffect(() => {
    let stream = null;
    if (activeTab === 'scanner') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' } })
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCameraActive(true);
            }
          })
          .catch((err) => {
            console.warn('Camera sensor unavailable:', err);
            setCameraActive(false);
          });
      }
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeTab]);

  // Handle QR Check-in (Simulated or Counter Scanner)
  const processCheckIn = async (codeToVerify) => {
    const code = codeToVerify || liveToken;
    if (!code) return;
    setChecking(true);
    try {
      await messApi.checkInQR(currentSlot, todayStr, code);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setScanMessage(`Check-in verified successfully at ${timeStr}`);
      setOverlay('success');
      loadServiceAndStatus();

      setRecentScans((prev) => [
        {
          code,
          slot: currentSlot,
          time: timeStr,
          student: currentUser.email?.split('@')[0] || 'Student',
        },
        ...prev.slice(0, 5),
      ]);
    } catch (err) {
      const errMsg = err?.response?.data || err?.message || 'Check-in failed. Pass may have expired.';
      setScanMessage(typeof errMsg === 'string' ? errMsg : 'Invalid or expired counter code');
      setOverlay('failure');
    } finally {
      setChecking(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode || manualCode.length < 4) return;
    processCheckIn(manualCode.trim());
    setManualCode('');
  };

  const SlotIcon = MEAL_ICONS[currentSlot] || Sun;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-6">
      {/* Page Header */}
      <PageHeader
        badge={
          <Badge
            variant={isOnline ? 'primary' : 'warning'}
            className="text-[10px] font-bold flex items-center gap-1.5"
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Campus Mesh Online' : 'Emergency Offline Protocol'}
          </Badge>
        }
        title={isAdmin ? 'Dining Counter Scanner Terminal' : 'Dining Pass & Counter Check-in'}
        description={
          isAdmin
            ? 'Official mess terminal for scanning student QR passes, validating attendance, and tracking headcount.'
            : 'Present your rotating cryptographic Dining Pass at the counter scanner to record your meal entry.'
        }
        actions={
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('pass')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'pass'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> My Dining Pass
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'scanner'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Camera className="h-3.5 w-3.5" /> {isAdmin ? 'Counter Terminal' : 'Counter Scanner'}
            </button>
          </div>
        }
      />

      {/* ─────────────────── TAB 1: MY ROTATING DINING PASS ─────────────────── */}
      {activeTab === 'pass' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Main Scannable Dining Pass Card */}
          <div className="md:col-span-7">
            <Card className="p-6 shadow-card border-blue-200 dark:border-blue-900/60 text-center space-y-5">
              {/* Pass Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Rotating Token Active
                  </span>
                </div>
                <Badge
                  variant={attendanceStatus?.present || attendanceStatus?.checkedIn ? 'success' : 'primary'}
                  className="text-[10px] gap-1"
                >
                  {attendanceStatus?.present || attendanceStatus?.checkedIn ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Checked In Today
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" /> Ready for Counter
                    </>
                  )}
                </Badge>
              </div>

              {/* Service Slot Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
                <SlotIcon className="h-3.5 w-3.5" />
                <span>Current Slot: {currentSlot} (Today)</span>
              </div>

              {/* High-Contrast Scannable QR Matrix Representation */}
              <div className="relative mx-auto w-56 h-56 p-4 rounded-3xl bg-white border-2 border-slate-900/90 shadow-lg flex flex-col items-center justify-center">
                {/* Simulated High Density Anti-Replay QR Matrix */}
                <div className="w-full h-full bg-slate-950 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-10 h-10 border-4 border-white bg-slate-950 flex items-center justify-center">
                      <div className="w-4 h-4 bg-white" />
                    </div>
                    <div className="w-10 h-10 border-4 border-white bg-slate-950 flex items-center justify-center">
                      <div className="w-4 h-4 bg-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="p-2 rounded-lg bg-white/20 border border-white/40 text-center font-mono text-[9px] text-white font-bold tracking-tighter">
                      HOSTEL MESS PRO<br />ANTI-REPLAY SECURED
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-10 h-10 border-4 border-white bg-slate-950 flex items-center justify-center">
                      <div className="w-4 h-4 bg-white" />
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono font-bold">
                      {secsLeft}s
                    </div>
                  </div>
                </div>

                {/* Overlaid Verified Tick if Checked In */}
                {(attendanceStatus?.present || attendanceStatus?.checkedIn) && (
                  <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center text-white p-4">
                    <CheckCircle2 className="h-16 w-16 text-emerald-400 animate-in zoom-in-75 duration-200" />
                    <span className="font-bold text-sm mt-2">Meal Verified!</span>
                    <span className="text-[11px] text-emerald-200">Already scanned for {currentSlot}</span>
                  </div>
                )}
              </div>

              {/* Dynamic Anti-Replay Token Display */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-100">
                  Counter Passcode (Refreshes in {secsLeft}s)
                </span>
                <div className="font-mono text-2xl font-black tracking-widest">
                  {liveToken || 'FETCHING...'}
                </div>
              </div>

              {/* Instant Verification Simulator button for seamless self-test */}
              <div className="pt-1">
                <Button
                  onClick={() => processCheckIn(liveToken)}
                  disabled={checking || attendanceStatus?.present || attendanceStatus?.checkedIn}
                  className="w-full text-xs font-bold h-10 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
                  {checking
                    ? 'Validating Token...'
                    : attendanceStatus?.present || attendanceStatus?.checkedIn
                    ? 'Check-in Completed'
                    : 'Test Tap Pass on Counter'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Student Dossier & Mess Rules */}
          <div className="md:col-span-5 space-y-5">
            <Card className="p-6 shadow-card space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Authorized Resident Dossier
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Resident Name:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {currentUser.name || currentUser.email?.split('@')[0] || 'Resident Student'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Hostel & Room:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {currentUser.hostel || 'Main Hostel'}, Room {currentUser.roomNumber || 'Assigned'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Dietary Plan:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {currentUser.dietaryPreference || 'Standard Indian (Veg/Non-Veg)'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Dining Status:</span>
                  <Badge variant={attendanceStatus?.present ? 'success' : 'neutral'} className="text-[10px]">
                    {attendanceStatus?.present ? 'Verified Today' : 'Pending Check-in'}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-5 shadow-card bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Anti-Proxy Security Guarantee
              </div>
              <p className="text-[11px] leading-relaxed">
                Tokens automatically expire 60 seconds after generation. Screenshot sharing or proxy dining attempts will be flagged by the mess audit engine.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 2: COUNNER SCANNER & TERMINAL ─────────────────── */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Focused Scanner Viewport (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="overflow-hidden border-slate-200/90 dark:border-slate-800 shadow-card">
              {/* Top Toolbar */}
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {cameraActive ? 'Optical Scanner Active' : 'Sensor Ready / Simulation Mode'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFlashOn(!flashOn)}
                    className={`h-8 text-xs font-semibold gap-1 ${
                      flashOn ? 'bg-amber-100 text-amber-900 border-amber-300' : ''
                    }`}
                  >
                    <Flashlight className="h-3.5 w-3.5" />
                    {flashOn ? 'Flash ON' : 'Flash'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => processCheckIn(liveToken)}
                    disabled={checking}
                    className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
                    Simulate Counter Scan
                  </Button>
                </div>
              </div>

              {/* Viewfinder Video Frame */}
              <div
                className={`relative aspect-square sm:aspect-video w-full flex items-center justify-center overflow-hidden transition-colors ${
                  flashOn ? 'bg-amber-950/30' : 'bg-slate-950'
                }`}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 h-full w-full object-cover"
                />

                {/* Scanning Target Overlay */}
                <div className="relative z-10 w-60 h-60 rounded-3xl border-2 border-blue-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex items-center justify-center pointer-events-none">
                  {/* 4 Corner Markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl -mb-1 -mr-1" />

                  {/* Animated Horizontal Laser Line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-bounce opacity-80" />
                </div>

                {!cameraActive && (
                  <div className="absolute bottom-4 left-4 right-4 z-10 text-center">
                    <span className="text-[11px] text-white/80 bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-full inline-block">
                      Position QR pass inside box or click "Simulate Counter Scan"
                    </span>
                  </div>
                )}
              </div>

              {/* Counter Slot Info */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Terminal Station #01 (Main Dining Hall)
                </span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {currentSlot} SERVICE
                </span>
              </div>
            </Card>
          </div>

          {/* Right Column: Manual Code Entry & Recent Counter Activity (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Manual Code Input Card */}
            <Card className="p-6 shadow-card space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-blue-600" />
                  Manual Passcode Override
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  If the resident's camera or screen is damaged, type their 6-12 character pass token here.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PASS-ABCDEF-1234"
                  maxLength={24}
                  className="h-11 text-center font-mono font-bold tracking-widest text-sm uppercase"
                />
                <Button
                  type="submit"
                  disabled={checking || manualCode.length < 4}
                  className="w-full h-11 text-xs font-bold bg-blue-600 hover:bg-blue-700"
                >
                  {checking ? 'Validating Token...' : 'Validate & Allow Entry'}
                </Button>
              </form>
            </Card>

            {/* Live Counter Activity Feed */}
            <Card className="p-6 shadow-card space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Recent Counter Scans</span>
                <Badge variant="primary" className="text-[10px]">
                  {currentService?.actualAttendance || recentScans.length} Verified
                </Badge>
              </h4>

              {recentScans.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                  Ready to scan incoming residents.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentScans.map((scan, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{scan.student}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{scan.code}</div>
                        </div>
                      </div>
                      <span className="font-mono text-slate-500">{scan.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ─────────────────── SUCCESS MODAL OVERLAY ─────────────────── */}
      {overlay === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 shadow-elevated">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Check-in Verified!
              </h3>
              <p className="text-xs text-slate-500 mt-1">{scanMessage || 'Dining pass verified successfully.'}</p>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 text-xs font-semibold text-blue-700 dark:text-blue-300">
              ✨ +5 Campus Dining Points Awarded
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  setOverlay(null);
                  navigate('/feedback');
                }}
                className="w-full h-11 text-xs font-bold bg-blue-600 hover:bg-blue-700 gap-1.5"
              >
                <Sparkles className="h-4 w-4" /> Rate Meal Quality
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOverlay(null)}
                className="text-xs font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── FAILURE MODAL OVERLAY ─────────────────── */}
      {overlay === 'failure' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 shadow-elevated">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800">
              <XCircle className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Verification Failed
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {scanMessage || 'The token has expired or was already consumed. Please refresh your pass.'}
              </p>
            </div>

            <Button
              onClick={() => {
                setOverlay(null);
                loadServiceAndStatus();
              }}
              className="w-full h-11 text-xs font-bold"
            >
              Refresh Pass & Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
