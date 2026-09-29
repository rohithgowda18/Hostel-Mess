import { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { messApi } from '@/services/mess-api';
import { MEAL_SLOTS, getCurrentMealSlot, getSlotTimeLabel, isSlotActive } from '@/config/meal-schedule';

export default function AdminMealsPage() {
  const [selectedSlotKey, setSelectedSlotKey] = useState(() => getCurrentMealSlot());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [officialMenu, setOfficialMenu] = useState([]);
  const [communityConsensus, setCommunityConsensus] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [photos, setPhotos] = useState([]);

  // Lightbox modal state
  const [activePhoto, setActivePhoto] = useState(null);

  const slotDef = MEAL_SLOTS[selectedSlotKey] || MEAL_SLOTS.LUNCH;
  const isLive = isSlotActive(slotDef);
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchMealOperations = async () => {
    try {
      const [mealData, consensusData, allPhotos] = await Promise.all([
        messApi.getTodayMeal(slotDef.type).catch(() => null),
        messApi.getMealConsensus(slotDef.type, todayStr).catch(() => null),
        messApi.getTodayPhotos().catch(() => [])
      ]);

      if (mealData?.items) {
        setOfficialMenu(mealData.items.map((it) => (typeof it === 'string' ? it : it.name || '')));
      } else {
        setOfficialMenu([]);
      }

      setCommunityConsensus(consensusData);

      // Filter photos for this specific meal slot
      const filteredPhotos = Array.isArray(allPhotos)
        ? allPhotos.filter((p) => (p.mealType || '').toUpperCase() === slotDef.type)
        : [];
      setPhotos(filteredPhotos);

      // Also construct submission records from consensus and photos
      if (consensusData?.rawSubmissions && Array.isArray(consensusData.rawSubmissions)) {
        setSubmissions(consensusData.rawSubmissions);
      } else {
        // Fallback: build list from available items & photo authors
        const items = consensusData?.items || [];
        setSubmissions(
          items.map((it, idx) => ({
            id: `sub-${idx}`,
            student: it.reportedBy || 'Student Reporter',
            foodItems: [it.name],
            time: 'During service',
            verified: it.verified || false
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load meal operations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMealOperations();
  }, [selectedSlotKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMealOperations();
  };

  const verifiedCount = communityConsensus?.verifiedItems?.length || 0;
  const totalSubmissions = communityConsensus?.totalSubmissions || submissions.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Meal operations desk
            </h1>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded ${
              isLive ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-400'}`} />
              {isLive ? 'Service in progress' : 'Slot inactive'}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time inspection of official menu adherence, student evidence reports, and dining plate photos.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Meal Slot Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
        {Object.entries(MEAL_SLOTS).map(([key, slot]) => {
          const isCurrentActive = isSlotActive(slot);
          const isSelected = selectedSlotKey === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedSlotKey(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-teal-800 text-white dark:bg-teal-700'
                  : 'bg-white dark:bg-slate-900 border border-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{slot.label}</span>
              <span className={`text-[11px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                {slot.start}–{slot.end}
              </span>
              {isCurrentActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Operations Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border border-border rounded-md bg-white dark:bg-slate-900 py-3">
        <div className="px-5 py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Service window</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block mt-0.5">
            {getSlotTimeLabel(slotDef)}
          </span>
          <span className="text-[11px] text-slate-400">
            {isLive ? 'Serving now' : 'Scheduled window'}
          </span>
        </div>

        <div className="px-5 py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Student reports</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{totalSubmissions}</span>
            <span className="text-xs text-slate-400">submissions</span>
          </div>
          <span className="text-[11px] text-slate-400">Crowdsourced entries</span>
        </div>

        <div className="px-5 py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Photo evidence</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{photos.length}</span>
            <span className="text-xs text-slate-400">uploaded plates</span>
          </div>
          <span className="text-[11px] text-slate-400">Captured in dining hall</span>
        </div>
      </div>

      {/* Official vs Community Menu Comparison */}
      <div className="rounded-md border border-border bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {slotDef.label}: Planned menu vs Student reports
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {verifiedCount} verified dishes
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Official planned */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Official menu
              </span>
              <span className="text-[11px] text-slate-400">Published schedule</span>
            </div>

            {officialMenu.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">No official menu published for this slot.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {officialMenu.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-border text-slate-800 dark:text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Community consensus */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Student reported consensus
              </span>
              <span className="text-[11px] text-slate-400">{totalSubmissions} reports</span>
            </div>

            {(!communityConsensus?.verifiedItems || communityConsensus.verifiedItems.length === 0) ? (
              <p className="text-xs text-slate-400 py-3 italic">No verified items reported yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {communityConsensus.verifiedItems.map((item, idx) => {
                  const name = typeof item === 'string' ? item : item.name;
                  const count = item.count || communityConsensus.itemCounts?.[name] || 0;
                  return (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5"
                    >
                      <span>{name}</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 font-mono">
                        {count} YES
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Evidence Gallery */}
      <div className="rounded-md border border-border bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Plate photos ({photos.length})
            </h3>
            <p className="text-xs text-slate-500">Student uploads from the dining hall</p>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            <Camera className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
            No resident photos uploaded for this {slotDef.label} service.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {photos.map((photo) => {
              const photoId = photo.id || photo._id;
              const imageUrl = `/api/student-photos/${photoId}/image`;

              return (
                <div
                  key={photoId}
                  onClick={() => setActivePhoto({ ...photo, url: imageUrl })}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-surface-elevated cursor-pointer hover:border-primary transition-all"
                >
                  <img
                    src={imageUrl}
                    alt="Meal Evidence"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <ExternalLink className="h-3.5 w-3.5" /> Inspect
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Submissions Table */}
      <div className="rounded-md border border-border bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Student submissions log
          </h3>
          <p className="text-xs text-slate-500">Audit log of meal report submissions during this window</p>
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No individual submissions recorded yet for {slotDef.label}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-medium text-[11px] border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">Student reporter</th>
                  <th className="px-4 py-2.5">Reported foods</th>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{sub.student || sub.userEmail || `Student #${idx + 1}`}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(sub.foodItems || [sub.name]).filter(Boolean).map((food, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                          >
                            {food}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {sub.time || 'Service window'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Consensus verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lightbox Modal (Section 25) */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-surface rounded-lg overflow-hidden border border-border shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-text">Dining Plate Photo Evidence</h4>
                <p className="text-xs text-text-secondary">
                  Uploaded for {slotDef.label} • {activePhoto.date || todayStr}
                </p>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="p-1.5 rounded-md hover:bg-surface-elevated text-text-muted hover:text-text cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-black/95 flex items-center justify-center max-h-[70vh] p-2">
              <img
                src={activePhoto.url}
                alt="Enlarged Meal Evidence"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="p-4 bg-surface border-t border-border flex items-center justify-between text-xs text-text-secondary">
              <span>Contributor: {activePhoto.uploaderName || activePhoto.uploaderEmail || 'Resident Student'}</span>
              <Button size="sm" variant="outline" onClick={() => setActivePhoto(null)} className="text-xs">
                Close Lightbox
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
