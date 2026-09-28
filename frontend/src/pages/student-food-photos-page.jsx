import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Sparkles,
  Calendar,
  UtensilsCrossed,
  User,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const MEAL_TYPE_FILTERS = [
  { label: 'All Meals', value: 'ALL' },
  { label: 'Breakfast', value: 'BREAKFAST' },
  { label: 'Lunch', value: 'LUNCH' },
  { label: 'Evening Snacks', value: 'SNACKS' },
  { label: 'Dinner', value: 'DINNER' },
];

export default function StudentFoodPhotosPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const loadPhotos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await messApi.getStudentPhotosToday();
      const list = Array.isArray(data) ? data : [];
      setPhotos(list);
    } catch (e) {
      console.error('Failed to load food gallery photos:', e);
      setError('Unable to load food photos right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === 'ALL') return photos;
    return photos.filter((p) => (p.mealType || '').toUpperCase() === activeFilter);
  }, [photos, activeFilter]);

  const currentPhoto = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <PageHeader
        badge={
          <Badge variant="primary" className="text-[10px] font-bold">
            Live Food Evidence
          </Badge>
        }
        title="Community Food Gallery"
        description="Real-time photos uploaded by fellow students at the mess counters today to verify food quality and preparation."
        actions={
          <Button
            size="sm"
            onClick={() => navigate('/report-meal')}
            className="font-bold text-xs bg-blue-600 hover:bg-blue-700 gap-1.5"
          >
            <Camera className="h-4 w-4" />
            Upload Photo with Report
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {MEAL_TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setActiveFilter(f.value);
              setLightboxIndex(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === f.value
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Gallery Content */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading student photos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No food photos uploaded yet"
          description="Be the first to photograph today's meal and earn contribution points!"
          actionLabel="Upload Food Photo"
          onAction={() => navigate('/report-meal')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item, idx) => (
            <Card
              key={item.id || idx}
              onClick={() => setLightboxIndex(idx)}
              className="group overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 cursor-pointer hover:shadow-card-hover transition-all duration-200"
            >
              <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={item.photoUrl || item.imageUrl}
                  alt={item.mealType || 'Meal photo'}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2.5 left-2.5">
                  <Badge variant="primary" className="text-[10px] font-bold bg-white/90 text-slate-900 backdrop-blur-xs">
                    {item.mealType || 'Meal'}
                  </Badge>
                </div>
              </div>

              <div className="p-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.userEmail ? item.userEmail.split('@')[0] : 'Student Resident'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {item.uploadedAt ? new Date(item.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                  </span>
                </div>
                {item.foodItems && item.foodItems.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.foodItems.join(', ')}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {currentPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <div>
                <h4 className="font-bold text-sm">{currentPhoto.mealType || 'Meal Photo'}</h4>
                <p className="text-xs text-slate-400">
                  Uploaded by {currentPhoto.userEmail ? currentPhoto.userEmail.split('@')[0] : 'Resident'}
                </p>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-video max-h-[60vh] w-full flex items-center justify-center bg-black">
              <img
                src={currentPhoto.photoUrl || currentPhoto.imageUrl}
                alt="Full size meal"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between p-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                disabled={lightboxIndex === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex - 1);
                }}
                className="text-xs font-semibold gap-1 text-white border-slate-700 hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-xs text-slate-400 font-mono">
                {lightboxIndex + 1} of {filtered.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={lightboxIndex === filtered.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex + 1);
                }}
                className="text-xs font-semibold gap-1 text-white border-slate-700 hover:bg-slate-800"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
