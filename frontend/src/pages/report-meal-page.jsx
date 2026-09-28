import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import { FOOD_CATALOG_BY_CATEGORY, searchFoodCatalog } from '@/data/food-options';
import {
  UtensilsCrossed,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Search,
  Plus,
  X,
  Upload,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Drinks'];
const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

export default function ReportMealPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialSlot = queryParams.get('slot')?.toUpperCase() || 'LUNCH';

  const [mealType, setMealType] = useState(initialSlot);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [consensusPreview, setConsensusPreview] = useState(null);

  const filteredFoods = searchFoodCatalog(activeCategory, searchQuery);

  useEffect(() => {
    fetchConsensus();
  }, [mealType]);

  const fetchConsensus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await messApi.getMealConsensus(mealType, today).catch(() => null);
      setConsensusPreview(data);
    } catch (e) {
      console.error('Failed to fetch consensus:', e);
    }
  };

  const toggleItem = (foodName) => {
    if (selectedItems.includes(foodName)) {
      setSelectedItems(selectedItems.filter((i) => i !== foodName));
    } else {
      setSelectedItems([...selectedItems, foodName]);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setPhotoUrl(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0 && !photoUrl) {
      alert('Please select at least 1 food item OR upload a photo of the meal!');
      return;
    }

    setSubmitting(true);
    setSuccessData(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await messApi.submitMealConsensus(mealType, today, selectedItems, photoUrl);
      setSuccessData(res);
      setTimeout(() => {
        navigate('/meals');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit meal report:', err);
      alert('Error submitting report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-6">
      {/* Breadcrumb Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/meals')}
          className="gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Menus
        </Button>
        <Badge variant="warning" className="text-[11px] font-bold">
          ⭐ Earn up to +20 Contribution Points
        </Badge>
      </div>

      <PageHeader
        title="Report Served Meal"
        description="Help fellow residents by verifying what is actually being served at the mess counters right now."
      />

      {/* Success Banner */}
      {successData && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-center space-y-2 animate-in fade-in-0 zoom-in-95 duration-200">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold">Report Submitted Successfully!</h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-300">
            {successData.message || 'Points added to your resident reputation score. Redirecting...'}
          </p>
        </div>
      )}

      {/* Main Reporting Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 shadow-card space-y-6">
          {/* Step 1: Select Meal Slot */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Select Service Slot
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MEAL_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setMealType(slot)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    mealType === slot
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {slot.charAt(0) + slot.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Selected Items Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Selected Dishes ({selectedItems.length})
              </label>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="text-[11px] font-semibold text-rose-500 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No items selected yet. Tap items from the catalog below to add them.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => toggleItem(item)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Food Catalog & Search */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Add Items from Dish Catalog
              </label>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter dishes..."
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dish Selection Badges */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {filteredFoods.map((food) => {
                const isSelected = selectedItems.includes(food);
                return (
                  <button
                    key={food}
                    type="button"
                    onClick={() => toggleItem(food)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {isSelected ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {food}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Photo Evidence (Optional) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              4. Food Photo Evidence (Optional, +5 Bonus Pts)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-xs">
                <Camera className="h-4 w-4 text-blue-600" />
                Upload Photo from Device
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoUrl && (
                <div className="flex items-center gap-3">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="h-14 w-14 rounded-xl object-cover border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-xs text-rose-500 hover:underline font-semibold"
                  >
                    Remove Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 shadow-sm"
        >
          {submitting ? 'Submitting to Central Mess...' : 'Publish Live Meal Report'}
        </Button>
      </form>
    </div>
  );
}
