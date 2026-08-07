import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messApi } from '@/services/mess-api';

export default function QrCheckinPage() {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [overlay, setOverlay] = useState(null); // 'success' | 'failure' | null
  const [checking, setChecking] = useState(false);
  const [successTime, setSuccessTime] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState(null);

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
    loadAttendance();
  }, []);

  const handleManualSubmit = async () => {
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

  const handleSuccessCloseAndReport = () => {
    setOverlay(null);
    navigate('/report-meal?slot=LUNCH');
  };

  const [flashOn, setFlashOn] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto font-[Inter,sans-serif] pb-24 md:pb-8">
      <main className="p-3 md:p-6">
        <div className="max-w-[1440px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end pt-2 md:pt-0">
            <div>
              <h2 className="text-[32px] md:text-[45px] font-semibold text-[#003f87] leading-9 md:leading-[52px]">Meal Check-in</h2>
              <p className="text-xs text-[#424752] mt-1">Scan your QR code at the mess counter or enter code manually.</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Scanner + Manual Entry */}
            <div className="lg:col-span-2 space-y-6">
              {/* Scanner Card */}
              <div className="bg-white rounded-xl border border-[#c2c6d4] overflow-hidden shadow-sm flex flex-col relative">
                <div className="p-3.5 border-b border-[#c2c6d4] flex justify-between items-center bg-[#f3f4f5]">
                  <h3 className="text-base font-semibold text-[#003f87] flex items-center gap-2">
                    <span className="material-symbols-outlined">camera_alt</span> Counter Scanner View
                  </h3>
                  <button
                    onClick={() => setFlashOn(!flashOn)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition ${
                      flashOn ? 'bg-amber-400 text-slate-950' : 'bg-[#e1e3e4] text-[#191c1d]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">flash_on</span>
                    {flashOn ? 'Flash ON' : 'Flashlight'}
                  </button>
                </div>
                {/* Simulated Camera Viewport */}
                <div className={`relative w-full aspect-square sm:aspect-video flex items-center justify-center overflow-hidden transition-colors ${flashOn ? 'bg-amber-950/40' : 'bg-black'}`}>
                  <div className="relative w-56 h-56 sm:w-72 sm:h-72 border-2 border-dashed border-white/50 rounded-xl">
                    {/* Corner Markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#006e25] rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#006e25] rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#006e25] rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#006e25] rounded-br-xl" />
                    {/* Scanning Line Animation */}
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-[#006e25] shadow-[0_0_8px_rgba(0,110,37,0.8)]"
                      style={{ animation: 'scan 2s linear infinite' }}
                    />
                    <p className="absolute bottom-[-30px] w-full text-center text-white text-xs drop-shadow-md font-semibold">
                      Align Mess QR Code within frame
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Entry Card */}
              <div className="bg-white rounded-xl border border-[#c2c6d4] p-5 shadow-sm">
                <h3 className="text-base font-semibold text-[#003f87] mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">keyboard</span> Manual Code Entry
                </h3>
                <p className="text-xs text-[#424752] mb-4">If scanner is unavailable, enter the code provided at the counter.</p>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[11px] font-bold text-[#424752] mb-1" htmlFor="manual-code">Check-in Code</label>
                    <input
                      id="manual-code"
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="e.g. CHECKIN-2026-LUNCH"
                      className="w-full min-h-[48px] bg-[#f3f4f5] border border-[#c2c6d4] focus:border-[#003f87] rounded-xl px-4 py-2 text-xs outline-none font-mono text-[#191c1d]"
                    />
                  </div>
                  <button
                    onClick={handleManualSubmit}
                    disabled={checking || !manualCode}
                    className="w-full sm:w-auto min-h-[48px] px-6 bg-[#003f87] text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    {checking ? 'Verifying...' : 'Submit Code'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Status Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#c2c6d4] p-5 shadow-sm space-y-4">
                <h3 className="text-base font-semibold text-[#191c1d] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006e25]">fact_check</span> Today's Status
                </h3>
                {attendanceStatus?.present ? (
                  <div className="p-4 bg-[#e8f5ea] border border-[#006e25]/30 rounded-xl text-[#006e25] font-semibold text-xs flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Checked in for {attendanceStatus.mealType || 'LUNCH'}!
                    </div>
                    <button
                      onClick={() => navigate('/report-meal?slot=' + (attendanceStatus.mealType || 'LUNCH'))}
                      className="w-full min-h-[44px] bg-[#006e25] text-white text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-sm mt-1"
                    >
                      <span className="material-symbols-outlined text-base">rate_review</span>
                      Report Served Meal (+20 Pts)
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-[#f3f4f5] border border-[#c2c6d4] rounded-xl text-[#424752] text-xs">
                    No check-in recorded for this meal yet. Scan QR or enter code above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Overlay with Connected Redirect */}
      {overlay === 'success' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOverlay(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#006e25] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#006e25]/30">
              <span className="material-symbols-outlined text-white text-[36px]">check</span>
            </div>
            <h2 className="text-xl font-bold text-[#191c1d] mb-1">Check-in Confirmed</h2>
            <p className="text-xs text-[#424752] mb-5">Confirmed at {successTime}</p>
            
            {/* Seamless One-Tap Action */}
            <button
              onClick={handleSuccessCloseAndReport}
              className="w-full min-h-[52px] bg-[#006e25] text-white text-sm font-extrabold rounded-xl hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2 shadow-md mb-2"
            >
              <span className="material-symbols-outlined text-xl">rate_review</span>
              Report Served Meal (+20 Pts)
            </button>

            <button onClick={() => setOverlay(null)} className="w-full min-h-[44px] bg-[#f3f4f5] text-[#424752] text-xs font-semibold rounded-xl hover:bg-[#e1e3e4]">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Failure Overlay */}
      {overlay === 'failure' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOverlay(null)} />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
            <div className="w-20 h-20 bg-[#ba1a1a] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#ba1a1a]/30">
              <span className="material-symbols-outlined text-white text-[40px]">error</span>
            </div>
            <h2 className="text-[32px] font-semibold text-[#191c1d] mb-2">Scan Failed</h2>
            <p className="text-base text-[#424752] mb-6">Invalid code or booking not found.</p>
            <button onClick={() => setOverlay(null)} className="w-full bg-[#ba1a1a] text-white text-sm font-medium py-3 rounded-lg">
              Try Again
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: calc(100% - 2px); }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
