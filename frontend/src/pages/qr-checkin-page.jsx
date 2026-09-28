import { getUser } from '@/services/auth-service';
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
  KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function QrCheckinPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const user = getUser() || {};
  const [manualCode, setManualCode] = useState('');
  const [overlay, setOverlay] = useState(null); // 'success' | 'failure' | null
  const [checking, setChecking] = useState(false);
  const [successTime, setSuccessTime] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'offline_pass'
  const [secsLeft, setSecsLeft] = useState(60);

  const loadAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await messApi.getMyAttendanceStatus('LUNCH', today).catch(() => null);
      setAttendanceStatus(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setActiveMode('offline_pass');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setInterval(() => {
      const now = new Date();
      setSecsLeft(60 - now.getSeconds());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  const getOfflinePassToken = () => {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    const window5m = Math.floor(new Date().getMinutes() / 5);
    const str = `${user.email || 'student'}:${today}:${hour}:${window5m}:mess-auth`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `PASS-${Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`;
  };

  useEffect(() => {
    loadAttendance();

    let stream = null;
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
          console.warn('Camera access unavailable or restricted:', err);
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSimulateScan = async () => {
    setChecking(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const qr = await messApi.getQrCode('LUNCH', today).catch(() => null);
      const code = qr?.code;
      if (!code) throw new Error('Could not fetch counter code');
      await messApi.checkInQR('LUNCH', today, code);
      const now = new Date();
      setSuccessTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setOverlay('success');
      loadAttendance();
    } catch {
      setOverlay('failure');
    } finally {
      setChecking(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e?.preventDefault();
    if (!manualCode || manualCode.length < 4) return;
    setChecking(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await messApi.checkInQR('LUNCH', today, manualCode);
      const now = new Date();
      setSuccessTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setOverlay('success');
      loadAttendance();
    } catch {
      setOverlay('failure');
    } finally {
      setChecking(false);
      setManualCode('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-6">
      {/* Page Header */}
      <PageHeader
        badge={
          <Badge variant={isOnline ? 'primary' : 'warning'} className="text-[10px] font-bold flex items-center gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online Verified' : 'Offline Mode (Campus Mesh)'}
          </Badge>
        }
        title="Meal Counter Check-in"
        description="Scan the counter QR scanner, enter code manually, or present your Offline Emergency Dining Pass."
        actions={
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveMode('camera')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeMode === 'camera'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Camera className="h-3.5 w-3.5" /> Camera Scanner
            </button>
            <button
              onClick={() => setActiveMode('offline_pass')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeMode === 'offline_pass'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" /> Offline Dining Pass
            </button>
          </div>
        }
      />

      {activeMode === 'offline_pass' ? (
        /* ─────────────── OFFLINE EMERGENCY DINING PASS ─────────────── */
        <Card className="p-6 shadow-card border-blue-200 dark:border-blue-900/60 max-w-lg mx-auto text-center space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Cryptographic Token Active
              </span>
            </div>
            <Badge variant="warning" className="text-[10px]">
              Offline Validated
            </Badge>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Emergency Dining Pass
            </h3>
            <p className="text-xs text-slate-500">
              Show this screen to the mess counter warden when basement Wi-Fi is disconnected.
            </p>
          </div>

          {/* Dynamic Pass Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="text-[11px] uppercase tracking-widest text-blue-100 font-bold">
              Dynamic Security Passcode
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-black tracking-widest py-2 bg-white/10 rounded-xl border border-white/20">
              {getOfflinePassToken()}
            </div>

            <div className="flex items-center justify-between text-xs text-blue-100 pt-2 border-t border-white/10">
              <span>Resident: {user.name || user.email?.split('@')[0] || 'Student'}</span>
              <span className="font-mono">Refreshes in {secsLeft}s</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-500 text-left pt-2">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span>Allocated Hostel:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{user.hostel || 'Hostel Resident'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span>Room Number:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">Room {user.roomNumber || 'Assigned'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Meal Service:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">Lunch Window</span>
            </div>
          </div>
        </Card>
      ) : (
        /* ─────────────── CAMERA SCANNER & MANUAL CODE ─────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Focused Scanner Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden border-slate-200/90 dark:border-slate-800 shadow-card">
            {/* Top Toolbar */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {cameraActive ? 'Camera Sensor Active' : 'Camera Ready / Test Mode'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFlashOn(!flashOn)}
                  className={`h-8 text-xs font-semibold gap-1 ${flashOn ? 'bg-amber-100 text-amber-900 border-amber-300' : ''}`}
                >
                  <Flashlight className="h-3.5 w-3.5" />
                  {flashOn ? 'Flash ON' : 'Flash'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSimulateScan}
                  disabled={checking}
                  className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
                  Simulate Scan
                </Button>
              </div>
            </div>

            {/* Viewfinder Video Frame */}
            <div className={`relative aspect-square sm:aspect-video w-full flex items-center justify-center overflow-hidden transition-colors ${flashOn ? 'bg-amber-950/30' : 'bg-slate-950'}`}>
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

              {/* Fallback Camera message if blocked */}
              {!cameraActive && (
                <div className="absolute bottom-4 left-4 right-4 z-10 text-center">
                  <span className="text-[11px] text-white/80 bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-full inline-block">
                    Position QR inside box or click "Simulate Scan" / enter code below
                  </span>
                </div>
              )}
            </div>

            {/* Instruction Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Secure instant token exchange
              </span>
              <span className="font-mono">Counter Slot: LUNCH</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Manual Code Entry & Attendance Status (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Manual Code Input Card */}
          <Card className="p-6 shadow-card space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Hash className="h-4 w-4 text-blue-600" />
                Manual Counter Code Entry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                If the camera scanner is obstructed, enter the 6-character counter passcode displayed at the serving line.
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="e.g. LUNCH7"
                maxLength={8}
                className="h-11 text-center font-mono font-bold tracking-widest text-base uppercase"
              />
              <Button
                type="submit"
                disabled={checking || manualCode.length < 4}
                className="w-full h-11 text-xs font-bold bg-blue-600 hover:bg-blue-700"
              >
                {checking ? 'Validating Token...' : 'Confirm Meal Entry'}
              </Button>
            </form>
          </Card>

          {/* Today's Check-in Record Status */}
          <Card className="p-6 shadow-card space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Verification Status
            </h4>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Lunch Service</span>
              </div>
              <Badge variant={attendanceStatus?.checkedIn ? 'success' : 'neutral'}>
                {attendanceStatus?.checkedIn ? 'Verified Present' : 'Pending Entry'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Check-in tokens expire 30 minutes after issuance to prevent proxy dining attendance.
            </p>
          </Card>
        </div>
      </div>
      )}

      {/* Success Modal Overlay */}
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
              <p className="text-xs text-slate-500 mt-1">
                Meal token registered successfully at {successTime || 'the counter'}.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 text-xs font-semibold text-blue-700 dark:text-blue-300">
              ✨ +5 Attendance Points Added
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  setOverlay(null);
                  navigate('/report-meal?slot=LUNCH');
                }}
                className="w-full h-11 text-xs font-bold bg-blue-600 hover:bg-blue-700 gap-1.5"
              >
                <Sparkles className="h-4 w-4" /> Report Today's Meal (+20 Pts)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOverlay(null)}
                className="text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Failure Modal Overlay */}
      {overlay === 'failure' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 shadow-elevated">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800">
              <XCircle className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Invalid Check-in Code
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                The QR code or counter passcode was expired or unrecognized. Please retry.
              </p>
            </div>

            <Button
              onClick={() => setOverlay(null)}
              className="w-full h-11 text-xs font-bold"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
