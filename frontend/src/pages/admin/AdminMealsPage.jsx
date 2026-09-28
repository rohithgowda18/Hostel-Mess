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
            <h1 className="text-xl md:text-2xl font-black text-text tracking-tight">
              Live Meal Operations Desk
            </h1>
            <Badge variant={isLive ? 'success' : 'default'} className="text-[11px] font-bold">
              {isLive ? '● Service In Progress' : 'Slot Inactive'}
            </Badge>
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
          Refresh Evidence
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
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-elevated'
              }`}
            >
              <span>{slot.label}</span>
              <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                ({slot.start}–{slot.end})
              </span>
              {isCurrentActive && (
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Service Window</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-text">{getSlotTimeLabel(slotDef)}</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            {isLive ? 'Serving now in Dining Hall' : 'Completed or upcoming dining window'}
          </p>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Student Reports</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-black text-primary">{totalSubmissions}</span>
            <span className="text-xs text-text-muted">submissions</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Crowdsourced dining entries</p>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Photo Evidence</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-black text-text">{photos.length}</span>
            <span className="text-xs text-text-muted">uploaded plates</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Plate photos captured by residents</p>
        </Card>
      </div>

      {/* Official vs Community Menu Comparison Card (Section 25) */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-4 bg-surface-elevated border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            {slotDef.label} Planned vs Reported Dishes
          </h2>
          <Badge variant={verifiedCount > 0 ? 'success' : 'default'} className="text-[10px]">
            {verifiedCount} Verified Dishes
          </Badge>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Official planned */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> Official Menu
              </span>
              <span className="text-[11px] text-text-muted">Published Schedule</span>
            </div>

            {officialMenu.length === 0 ? (
              <p className="text-xs text-text-muted py-4 italic">No official menu published for this slot.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {officialMenu.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevated border border-border text-text"
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
              <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" /> Student Reported Consensus
              </span>
              <span className="text-[11px] text-text-muted">{totalSubmissions} Total Reports</span>
            </div>

            {(!communityConsensus?.verifiedItems || communityConsensus.verifiedItems.length === 0) ? (
              <p className="text-xs text-text-muted py-4 italic">No verified items reported yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {communityConsensus.verifiedItems.map((item, idx) => {
                  const name = typeof item === 'string' ? item : item.name;
                  const count = item.count || communityConsensus.itemCounts?.[name] || 0;
                  return (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-success/10 border border-success/30 text-success flex items-center gap-1.5"
                    >
                      <span>{name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-success/20">
                        {count} YES
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Photo Evidence Gallery (Section 25) */}
      <Card className="bg-surface border-border p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Live Plate Photo Evidence ({photos.length})
            </h3>
            <p className="text-xs text-text-secondary">Resident uploads captured directly from the dining hall</p>
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
      </Card>

      {/* Student Submissions Table (Section 25) */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-4 bg-surface-elevated border-b border-border">
          <h3 className="text-sm font-bold text-text">
            Crowdsourced Student Submissions Log
          </h3>
          <p className="text-xs text-text-secondary">Audit log of meal report submissions during this window</p>
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            No individual submissions recorded yet for {slotDef.label}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-elevated text-text-secondary uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="px-4 py-3">Student Reporter</th>
                  <th className="px-4 py-3">Reported Foods</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Consensus State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-text-muted" />
                      <span>{sub.student || sub.userEmail || `Student #${idx + 1}`}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(sub.foodItems || [sub.name]).filter(Boolean).map((food, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-text font-medium text-[11px]"
                          >
                            {food}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {sub.time || 'Service window'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="success" className="text-[10px]">
                        Included in Consensus
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Lightbox Modal (Section 25) */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-surface rounded-2xl overflow-hidden border border-border shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-text">Dining Plate Photo Evidence</h4>
                <p className="text-xs text-text-secondary">
                  Uploaded for {slotDef.label} • {activePhoto.date || todayStr}
                </p>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text cursor-pointer"
              >
                <X className="h-5 w-5" />
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
