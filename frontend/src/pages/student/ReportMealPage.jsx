import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import {
  Camera,
  Image as ImageIcon,
  Plus,
  X,
  CheckCircle2,
  ArrowLeft,
  Clock,
  AlertCircle,
  UtensilsCrossed,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function ReportMealPage() {
  const navigate = useNavigate();

  const [slotInfo, setSlotInfo] = useState(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [remainingSecs, setRemainingSecs] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const [loadingSlot, setLoadingSlot] = useState(true);

  const [suggestedItems, setSuggestedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customItemInput, setCustomItemInput] = useState('');

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const timerRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Fetch server slot info on mount
  const fetchActiveSlot = async () => {
    try {
      setLoadingSlot(true);
      const data = await messApi.getActiveSlotInfo();
      if (data) {
        setSlotInfo(data);
        const offset = (data.serverTimeMillis || Date.now()) - Date.now();
        setServerOffset(offset);

        if (data.isActive && data.endTimeMillis) {
          const currentServerTime = Date.now() + offset;
          const diff = Math.max(0, Math.floor((data.endTimeMillis - currentServerTime) / 1000));
          setRemainingSecs(diff);
          setIsClosed(diff <= 0);

          // Fetch suggested items for this meal from today's menu
          loadSuggestedFoods(data.activeSlot);
        } else {
          setRemainingSecs(0);
          setIsClosed(true);
        }
      }
    } catch (err) {
      console.error('Failed to load active slot:', err);
      setErrorMsg('Failed to synchronize with mess schedule. Please refresh.');
    } finally {
      setLoadingSlot(false);
    }
  };

  const loadSuggestedFoods = async (slotKey) => {
    try {
      const consensus = await messApi.getMealConsensus(slotKey, todayStr);
      const expected = consensus?.expectedItems || [];
      const reported = (consensus?.items || []).map((i) => i.name);
      const combined = Array.from(new Set([...expected, ...reported]));

      if (combined.length > 0) {
        setSuggestedItems(combined);
      } else {
        // Fallback default suggestions if empty
        const defaults = {
          BREAKFAST: ['Idli', 'Vada', 'Sambar', 'Coconut Chutney', 'Tea / Coffee'],
          LUNCH: ['Rice', 'Dal Tadka', 'Paneer Curry', 'Roti', 'Curd'],
          SNACKS: ['Veg Pakoda', 'Samosa', 'Chutney', 'Tea / Coffee'],
          DINNER: ['Jeera Rice', 'Aloo Gobi', 'Dal', 'Roti', 'Salad']
        };
        setSuggestedItems(defaults[slotKey] || ['Rice', 'Roti', 'Dal', 'Curry']);
      }
    } catch {
      setSuggestedItems(['Rice', 'Roti', 'Dal', 'Curry', 'Tea / Coffee']);
    }
  };

  useEffect(() => {
    fetchActiveSlot();
  }, []);

  // 2. Real countdown timer synchronized with server time
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (slotInfo?.isActive && slotInfo.endTimeMillis && !isClosed) {
      timerRef.current = setInterval(() => {
        const currentServerTime = Date.now() + serverOffset;
        const diff = Math.floor((slotInfo.endTimeMillis - currentServerTime) / 1000);

        if (diff <= 0) {
          setRemainingSecs(0);
          setIsClosed(true);
          clearInterval(timerRef.current);
          fetchActiveSlot(); // Synchronize final state
        } else {
          setRemainingSecs(diff);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slotInfo?.isActive, slotInfo?.endTimeMillis, serverOffset, isClosed]);

  // Format hh:mm:ss
  const formatCountdown = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Toggle food item selection
  const toggleItem = (item) => {
    if (isClosed) return;
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  // Add custom food
  const handleAddCustom = (e) => {
    e.preventDefault();
    if (isClosed) return;
    const clean = customItemInput.trim();
    if (clean && !selectedItems.includes(clean)) {
      setSelectedItems([...selectedItems, clean]);
      if (!suggestedItems.includes(clean)) {
        setSuggestedItems([...suggestedItems, clean]);
      }
      setCustomItemInput('');
    }
  };

  // Photo handlers
  const handleFileChange = (e) => {
    if (isClosed) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
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
    if (isClosed || submitting) return;
    setErrorMsg('');

    if (selectedItems.length === 0 && !photoFile) {
      setErrorMsg('Please select at least one food item or attach a meal photo.');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = '';

      // 1. Upload photo if present
      if (photoFile) {
        const formData = new FormData();
        formData.append('images', photoFile);
        formData.append('mealType', slotInfo.activeSlot);
        formData.append('description', selectedItems.length > 0 ? selectedItems.join(', ') : 'Student meal verification');

        const uploadRes = await messApi.uploadStudentPhoto(formData);
        if (uploadRes && uploadRes.id) {
          photoUrl = `/api/student-photos/${uploadRes.id}/image`;
        }
      }

      // 2. Submit student peer report
      const res = await messApi.submitMealConsensus(
        slotInfo.activeSlot,
        todayStr,
        selectedItems,
        photoUrl
      );

      setSuccessData(res);
      setTimeout(() => {
        navigate('/student/meals');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit report:', err);
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      setErrorMsg(serverMessage || 'Failed to submit report. Please verify connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSlot) {
    return (
      <div className="py-12 text-center space-y-2 max-w-xl mx-auto">
        <div className="h-6 w-6 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Checking active mess schedule...</p>
      </div>
    );
  }

  // State A: Meal reporting is CLOSED or Outside active window
  if (!slotInfo?.isActive || isClosed) {
    const mealLabel = slotInfo?.activeSlot ? (slotInfo.slotName || slotInfo.activeSlot) : '';

    return (
      <div className="max-w-xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => navigate('/student/meals')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Meals
        </button>

        <Card className="p-6 border-slate-200 dark:border-slate-800 text-center space-y-3">
          <UtensilsCrossed className="h-8 w-8 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            {mealLabel ? `${mealLabel} Reporting Closed` : 'Meal Reporting Closed'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Students can only report the meal that is currently being served. Reporting is locked outside kitchen dining windows.
          </p>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 font-mono text-left max-w-sm mx-auto space-y-1">
            <div className="font-bold text-slate-700 dark:text-slate-200 font-sans mb-1 text-[11px] uppercase tracking-wider">
              Serving Hours
            </div>
            <div>Breakfast: 07:30 – 09:30</div>
            <div>Lunch:     12:30 – 14:30</div>
            <div>Snacks:    16:30 – 17:30</div>
            <div>Dinner:    19:30 – 21:30</div>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => navigate('/student/meals')}
              className="text-xs font-semibold"
            >
              View Meals Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // State B: Meal is ACTIVE -> clean, fast, direct reporting form
  const activeMealName = slotInfo.slotName || slotInfo.activeSlot;

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-8">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/student/meals')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Meals
        </button>

        {/* Real Countdown Display */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
          <Clock className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
          <span>{activeMealName} ends in {formatCountdown(remainingSecs)}</span>
        </div>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Report {activeMealName}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {activeMealName} is currently being served ({slotInfo.time}). Select what you see on the counter or table.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successData && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold text-center space-y-1">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
          <p className="text-sm font-bold">Report Submitted Successfully!</p>
          <p className="text-emerald-700 dark:text-emerald-300 text-[11px]">
            {successData.message || 'Points added to your resident score. Returning to meals...'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Select what you see */}
        <Card className="p-4 space-y-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select What You See ({selectedItems.length})
            </span>
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="text-[11px] font-semibold text-slate-400 hover:text-red-600"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Quick Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {suggestedItems.map((item) => {
              const isChecked = selectedItems.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleItem(item)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-xs font-semibold transition-colors cursor-pointer ${
                    isChecked
                      ? 'bg-teal-50/80 border-teal-600 text-teal-900 dark:bg-teal-950/40 dark:border-teal-400 dark:text-teal-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-teal-700 border-teal-700 text-white dark:bg-teal-500 dark:border-teal-500 dark:text-slate-950'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}>
                    {isChecked && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <span className="truncate">{item}</span>
                </button>
              );
            })}
          </div>

          {/* Add custom food item */}
          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Add another food
            </span>
            <div className="flex gap-2">
              <Input
                value={customItemInput}
                onChange={(e) => setCustomItemInput(e.target.value)}
                placeholder="e.g. Kesari Bath, Curd Vada..."
                className="text-xs h-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom(e);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustom}
                className="text-xs font-semibold gap-1 h-9 px-3 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>
        </Card>

        {/* Step 2: Photo Evidence (Optional) */}
        <Card className="p-4 space-y-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Add Photo
            </span>
            <span className="text-[11px] text-slate-400">Optional</span>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {!photoPreview ? (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Primary action: Camera */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Camera className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <span>Take Photo</span>
              </button>

              {/* Secondary action: Choose photo from gallery */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ImageIcon className="h-4 w-4 text-slate-500" />
                <span>Choose Photo</span>
              </button>
            </div>
          ) : (
            /* Clean photo preview with replace / remove actions */
            <div className="space-y-2 pt-1">
              <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-56 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                <img
                  src={photoPreview}
                  alt="Meal preview"
                  className="object-contain max-h-56 w-full"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 text-[11px] truncate max-w-[200px]">
                  {photoFile?.name || 'Photo selected'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs font-semibold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer ml-2"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={submitting || (selectedItems.length === 0 && !photoFile)}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-11 shadow-xs"
          >
            {submitting ? 'Submitting Report...' : `Submit ${activeMealName} Report`}
          </Button>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Verified reports instantly update the hostel live meal consensus.
          </p>
        </div>
      </form>
    </div>
  );
}
