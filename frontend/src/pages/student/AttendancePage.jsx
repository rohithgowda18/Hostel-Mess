import { useState, useEffect, useCallback } from 'react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  History,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

function getCurrentMealSlot() {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 10) return 'BREAKFAST';
  if (hour >= 12 && hour < 15) return 'LUNCH';
  if (hour >= 16 && hour < 18) return 'SNACKS';
  if (hour >= 19 && hour < 22) return 'DINNER';
  return 'LUNCH';
}

export default function AttendancePage() {
  const currentUser = getUser() || {};
  const [selectedSlot, setSelectedSlot] = useState(() => getCurrentMealSlot());
  const [expectedStatus, setExpectedStatus] = useState(null);
  const [checkedInStatus, setCheckedInStatus] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [secsLeft, setSecsLeft] = useState(60);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rosterHistory, setRosterHistory] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchPassAndStatus = useCallback(async () => {
    try {
      const [statusRes, qrRes, roster] = await Promise.all([
        messApi.getMyAttendanceStatus(selectedSlot, todayStr).catch(() => null),
        messApi.getQrCode(selectedSlot, todayStr).catch(() => null),
        messApi.getAttendanceRoster(selectedSlot, todayStr).catch(() => [])
      ]);

      if (statusRes) {
        setExpectedStatus(statusRes.expected);
        setCheckedInStatus(Boolean(statusRes.present));
      } else {
        setExpectedStatus(null);
        setCheckedInStatus(false);
      }

      if (qrRes?.code) {
        setQrCodeData(qrRes.code);
        setSecsLeft(qrRes.expiresInSeconds || 60);
      } else {
        setQrCodeData(`PASS-${selectedSlot}-${todayStr}`);
        setSecsLeft(60);
      }

      if (Array.isArray(roster)) {
        setRosterHistory(roster.slice(0, 10));
      }
    } catch (err) {
      console.error('Failed to load pass:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSlot, todayStr]);

  useEffect(() => {
    fetchPassAndStatus();
  }, [fetchPassAndStatus]);

  // Pass timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecsLeft((prev) => {
        if (prev <= 1) {
          fetchPassAndStatus();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchPassAndStatus]);

  const handleWillEatChange = async (expected) => {
    setUpdating(true);
    try {
      await messApi.setExpectedAttendance(selectedSlot, todayStr, expected);
      setExpectedStatus(expected);
    } catch (err) {
      console.error('Failed to set attendance intent:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Attendance & Dining Pass
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Mark expected meal attendance and scan dynamic counter QR for dining hall entry.
        </p>
      </div>

      {/* Meal Slot Selection */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
        {MEAL_SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer capitalize ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {slot.toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* TODAY: Expected Attendance Intent */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today's Intent: {selectedSlot}
            </h2>
            <p className="text-[11px] text-slate-400">
              Status: {expectedStatus === true ? 'Expected attendance recorded' : expectedStatus === false ? 'Marked as skipping' : 'Not recorded yet'}
            </p>
          </div>
          <Badge variant={expectedStatus === true ? 'verified' : expectedStatus === false ? 'danger' : 'secondary'} className="text-[10px]">
            {expectedStatus === true ? 'Will Eat' : expectedStatus === false ? 'Skipping' : 'Undeclared'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={expectedStatus === true ? 'verified' : 'outline'}
            disabled={updating}
            onClick={() => handleWillEatChange(true)}
            className="flex-1 text-xs font-bold gap-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Will Eat
          </Button>
          <Button
            size="sm"
            variant={expectedStatus === false ? 'danger' : 'outline'}
            disabled={updating}
            onClick={() => handleWillEatChange(false)}
            className="flex-1 text-xs font-semibold gap-1"
          >
            <XCircle className="h-3.5 w-3.5" />
            Skip Meal
          </Button>
        </div>
      </Card>

      {/* DINING PASS: Large QR Central Display */}
      <Card className="p-6 text-center space-y-4 shadow-sm border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 tracking-wider">
              Dining Pass
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {currentUser?.name || currentUser?.email?.split('@')[0] || 'Resident Pass'}
            </h3>
          </div>
          <Badge variant={checkedInStatus ? 'verified' : 'secondary'} className="text-[10px]">
            {checkedInStatus ? 'Checked In' : 'Not Checked In'}
          </Badge>
        </div>

        {/* Dynamic QR Display */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 shadow-sm inline-block">
            {/* Real SVG QR code preview representation */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
          </div>
          <p className="mt-3 font-mono text-xs font-bold tracking-widest text-slate-700 dark:text-slate-300">
            {qrCodeData}
          </p>
        </div>

        {/* Refreshing Timer */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <Clock className="h-4 w-4 text-teal-700 dark:text-teal-400" />
          <span>Refreshing pass token in:</span>
          <span className="font-mono font-bold text-teal-800 dark:text-teal-300">{secsLeft}s</span>
          <button
            type="button"
            onClick={fetchPassAndStatus}
            className="p-1 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            title="Refresh code now"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </Card>
    </div>
  );
}
